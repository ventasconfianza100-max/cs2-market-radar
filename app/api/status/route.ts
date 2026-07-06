import { NextResponse } from "next/server";
import { snapshotMeta } from "@/lib/snapshot";

export const dynamic = "force-dynamic";

// Diagnóstico: verifica la conexión a CSFloat desde el servidor
// sin exponer la API key.

export async function GET() {
  const key = process.env.CSFLOAT_API_KEY;

  async function probe(headers: Record<string, string>): Promise<number | string> {
    try {
      const res = await fetch("https://csfloat.com/api/v1/listings?limit=1", {
        headers,
        cache: "no-store"
      });
      return res.status;
    } catch (e) {
      return e instanceof Error ? e.message : "error";
    }
  }

  const base: Record<string, string> = key ? { Authorization: key } : {};
  const browserHeaders: Record<string, string> = {
    ...base,
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    Accept: "application/json",
    "Accept-Language": "es-CL,es;q=0.9,en;q=0.8",
    Referer: "https://csfloat.com/search"
  };

  const [plain, withUa, snap] = await Promise.all([probe(base), probe(browserHeaders), snapshotMeta()]);

  return NextResponse.json({
    hasKey: Boolean(key),
    keyLength: key?.length ?? 0,
    csfloatStatus: plain,
    csfloatStatusBrowserHeaders: withUa,
    snapshot: snap
      ? {
          updatedAt: snap.updatedAt,
          ageMinutes: Math.round(snap.ageMs / 60000),
          items: snap.count,
          stale: snap.ageMs > 24 * 60 * 60 * 1000
        }
      : null,
    blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    checkedAt: new Date().toISOString()
  });
}
