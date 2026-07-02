// Recolector de CS2 Market Radar.
// Corre en un PC con conexión residencial (CSFloat bloquea IPs de la nube),
// obtiene listings de CSFloat + precios Steam y los sube al sitio en Vercel.
//
// Uso:
//   node scripts/collector.mjs           → una pasada y termina
//   node scripts/collector.mjs --loop    → corre cada 10 minutos
//
// Necesita en .env (junto a package.json):
//   CSFLOAT_API_KEY=...      tu key de CSFloat
//   INGEST_SECRET=...        el mismo secreto configurado en Vercel
//   SITE_URL=https://cs2-market-radar-sandy.vercel.app

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// --- carga .env sin dependencias ---
try {
  const env = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
} catch {}

const KEY = process.env.CSFLOAT_API_KEY;
const SECRET = process.env.INGEST_SECRET;
const SITE = (process.env.SITE_URL || "").replace(/\/$/, "");
const STEAM_LIMIT = 12; // ítems a enriquecer con Steam por pasada
const LOOP_MINUTES = 10;

if (!SECRET || !SITE) {
  console.error("Falta INGEST_SECRET o SITE_URL en .env");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function categorize(typeName, name) {
  const n = name.toLowerCase();
  if (n.startsWith("sticker")) return "sticker";
  if (n.includes("case") && !n.includes("hardened")) return "case";
  if (n.startsWith("★")) return n.includes("gloves") || n.includes("wraps") ? "gloves" : "knife";
  if (typeName && typeName.toLowerCase().includes("container")) return "case";
  return "skin";
}

async function fetchCSFloat() {
  const res = await fetch("https://csfloat.com/api/v1/listings?limit=50&sort_by=most_recent", {
    headers: KEY ? { Authorization: KEY } : undefined
  });
  if (!res.ok) throw new Error(`CSFloat respondió ${res.status}`);
  const json = await res.json();
  const listings = Array.isArray(json) ? json : json.data ?? [];

  const byName = new Map();
  for (const l of listings) {
    const arr = byName.get(l.item.market_hash_name) ?? [];
    arr.push(l);
    byName.set(l.item.market_hash_name, arr);
  }

  return [...byName.entries()].map(([name, group]) => {
    const best = group.reduce((a, b) => (a.price <= b.price ? a : b));
    return {
      id: best.id,
      marketHashName: name,
      category: categorize(best.item.type_name, name),
      rarity: best.item.rarity_name ?? null,
      floatValue: best.item.float_value ?? null,
      paintSeed: best.item.paint_seed ?? null,
      stickers: (best.item.stickers ?? []).map((s) => s.name),
      listingUrl: `https://csfloat.com/item/${best.id}`,
      csfloatPrice: best.price / 100,
      steamPrice: null,
      volume24h: null,
      listingsCount: group.length,
      trendPct7d: null,
      history: [],
      dataSource: "live"
    };
  });
}

function parseUsd(s) {
  if (!s) return null;
  const n = Number(String(s).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

async function enrichSteam(items) {
  for (const item of items.slice(0, STEAM_LIMIT)) {
    try {
      const url =
        "https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name=" +
        encodeURIComponent(item.marketHashName);
      const res = await fetch(url);
      if (res.ok) {
        const j = await res.json();
        if (j && j.success) {
          item.steamPrice = parseUsd(j.lowest_price) ?? parseUsd(j.median_price);
          item.volume24h = j.volume ? Number(String(j.volume).replace(/,/g, "")) : null;
        }
      } else if (res.status === 429) {
        console.warn("Steam limitó (429); se detiene el enriquecimiento por esta pasada");
        break;
      }
    } catch {}
    await sleep(3500); // respetar límites de Steam
  }
}

async function runOnce() {
  console.log(new Date().toISOString(), "— obteniendo CSFloat…");
  const items = await fetchCSFloat();
  console.log(`  ${items.length} ítems. Consultando Steam (${Math.min(STEAM_LIMIT, items.length)})…`);
  await enrichSteam(items);

  const res = await fetch(`${SITE}/api/ingest`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-ingest-secret": SECRET },
    body: JSON.stringify({ items })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`ingest ${res.status}: ${JSON.stringify(body)}`);
  console.log(`  Subido: ${body.count} ítems → ${SITE}`);
}

const loop = process.argv.includes("--loop");
do {
  try {
    await runOnce();
  } catch (e) {
    console.error("Error:", e.message);
  }
  if (loop) {
    console.log(`Próxima pasada en ${LOOP_MINUTES} min…`);
    await sleep(LOOP_MINUTES * 60 * 1000);
  }
} while (loop);
