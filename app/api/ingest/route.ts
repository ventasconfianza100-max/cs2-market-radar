import { NextResponse } from "next/server";
import { put, list } from "@vercel/blob";
import { analyzeItem } from "@/lib/analysis";
import { notifyConfigured, sendAlert } from "@/lib/notify";
import { usd, pct } from "@/lib/format";
import type { RawItem } from "@/lib/mock";
import type { PricePoint } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Recibe snapshots del recolector (scripts/collector.mjs corriendo en un
// PC con acceso a CSFloat) y los guarda en Vercel Blob para que el sitio
// los sirva aunque CSFloat bloquee las IPs de Vercel.
//
// Además del snapshot en bruto, aquí se acumula el histórico de precios
// por ítem (para calcular tendencia y spread), se arrastra el último
// precio Steam conocido, y se disparan alertas por webhook.

const HISTORY_DAYS = 30;
const ALERT_MIN_SCORE = Number(process.env.ALERT_MIN_SCORE ?? 60);
const ALERT_MIN_DISCOUNT = Number(process.env.ALERT_MIN_DISCOUNT ?? 8);
const ALERT_COOLDOWN_MS = 12 * 60 * 60 * 1000; // no repetir la misma skin en 12 h

interface StoredSnapshot {
  items: RawItem[];
  updatedAt: string;
  alerts?: Record<string, string>; // marketHashName → ISO del último aviso
}

async function readSnapshot(): Promise<StoredSnapshot | null> {
  try {
    const { blobs } = await list({ prefix: "radar/snapshot.json", limit: 1 });
    if (blobs.length === 0) return null;
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    if (!res.ok) return null;
    const snap = (await res.json()) as StoredSnapshot;
    if (!Array.isArray(snap.items)) return null;
    return snap;
  } catch {
    return null;
  }
}

// Calcula el % de cambio de csfloatPrice frente al punto más cercano a 7 días atrás.
function trendFromHistory(history: PricePoint[]): number | null {
  if (history.length < 2) return null;
  const now = Date.now();
  const target = now - 7 * 86400000;
  let ref: PricePoint | null = null;
  let bestDiff = Infinity;
  for (const p of history) {
    if (p.csfloatPrice === null) continue;
    const diff = Math.abs(new Date(p.date).getTime() - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      ref = p;
    }
  }
  const last = [...history].reverse().find((p) => p.csfloatPrice !== null);
  if (!ref || !last || ref.csfloatPrice === null || last.csfloatPrice === null || ref.csfloatPrice <= 0) return null;
  return Number((((last.csfloatPrice - ref.csfloatPrice) / ref.csfloatPrice) * 100).toFixed(1));
}

export async function POST(req: Request) {
  const secret = process.env.INGEST_SECRET;
  if (!secret || req.headers.get("x-ingest-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "blob_not_configured" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const incoming = (body as { items?: RawItem[] })?.items;
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return NextResponse.json({ error: "items_required" }, { status: 400 });
  }

  const prev = await readSnapshot();
  const prevByName = new Map((prev?.items ?? []).map((i) => [i.marketHashName, i]));
  const today = new Date().toISOString().slice(0, 10);

  const merged: RawItem[] = incoming.map((item) => {
    const before = prevByName.get(item.marketHashName);

    // Arrastrar el último precio Steam conocido si esta pasada no lo trae.
    const steamPrice = item.steamPrice ?? before?.steamPrice ?? null;
    const volume24h = item.volume24h ?? before?.volume24h ?? null;

    // Acumular histórico: un punto por día, actualizando el de hoy.
    const priorHistory = (before?.history ?? []).filter((p) => p.date !== today);
    const point: PricePoint = {
      date: today,
      csfloatPrice: item.csfloatPrice,
      steamPrice,
      volume: volume24h
    };
    const history = [...priorHistory, point].slice(-HISTORY_DAYS);

    return {
      ...item,
      steamPrice,
      volume24h,
      history,
      trendPct7d: trendFromHistory(history)
    };
  });

  const alerts: Record<string, string> = { ...(prev?.alerts ?? {}) };
  const snapshot: StoredSnapshot = { items: merged, updatedAt: new Date().toISOString(), alerts };

  let blobUrl = "";
  try {
    const blob = await put("radar/snapshot.json", JSON.stringify(snapshot), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json"
    });
    blobUrl = blob.url;
  } catch (e) {
    return NextResponse.json(
      { error: "blob_write_failed", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }

  // Alertas: skins que cruzan el umbral, con cooldown por ítem.
  let alerted = 0;
  if (notifyConfigured()) {
    const now = Date.now();
    const candidates = merged
      .map(analyzeItem)
      .filter(
        (a) =>
          a.opportunityScore >= ALERT_MIN_SCORE &&
          a.discountPct !== null &&
          a.discountPct >= ALERT_MIN_DISCOUNT &&
          a.recommendation !== "evitar" &&
          a.recommendation !== "riesgoso"
      )
      .filter((a) => {
        const last = alerts[a.marketHashName];
        return !last || now - new Date(last).getTime() > ALERT_COOLDOWN_MS;
      })
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 5);

    for (const a of candidates) {
      const msg =
        `🎯 *OPORTUNIDAD DETECTADA*\n\n` +
        `*${a.marketHashName}*\n` +
        `CSFloat: ${usd(a.csfloatPrice)}  ·  Steam: ${usd(a.steamPrice)}\n` +
        `Descuento: ${pct(a.discountPct)}  ·  Score: ${a.opportunityScore}/100\n` +
        `${a.explanation.join(" · ")}\n` +
        (a.listingUrl ? `\n${a.listingUrl}` : "");
      await sendAlert(msg);
      alerts[a.marketHashName] = new Date().toISOString();
      alerted++;
    }

    // Persistir los cooldowns actualizados sin reescribir todo el histórico.
    if (alerted > 0) {
      try {
        await put("radar/snapshot.json", JSON.stringify({ ...snapshot, alerts }), {
          access: "public",
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: "application/json"
        });
      } catch {}
    }
  }

  return NextResponse.json({ ok: true, url: blobUrl, count: merged.length, alerted });
}
