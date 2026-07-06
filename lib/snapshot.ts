import { list } from "@vercel/blob";
import { cacheGet, cacheSet } from "./cache";
import type { RawItem } from "./mock";

// Lee el último snapshot subido por el recolector a Vercel Blob.
// Se usa cuando CSFloat bloquea las IPs del servidor (Vercel).

const CACHE_TTL = 2 * 60 * 1000;
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // snapshots de más de 24 h se descartan

interface Snapshot {
  items: RawItem[];
  updatedAt: string;
}

// Diagnóstico: metadatos del snapshot sin filtrar por antigüedad.
export async function snapshotMeta(): Promise<{ updatedAt: string; count: number; ageMs: number } | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const { blobs } = await list({ prefix: "radar/snapshot.json", limit: 1 });
    if (blobs.length === 0) return null;
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    if (!res.ok) return null;
    const snap = (await res.json()) as Snapshot;
    if (!Array.isArray(snap.items)) return null;
    return {
      updatedAt: snap.updatedAt,
      count: snap.items.length,
      ageMs: Date.now() - new Date(snap.updatedAt).getTime()
    };
  } catch {
    return null;
  }
}

export async function loadSnapshot(): Promise<Snapshot | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;

  const cached = cacheGet<Snapshot>("blob:snapshot");
  if (cached) return cached;

  try {
    const { blobs } = await list({ prefix: "radar/snapshot.json", limit: 1 });
    if (blobs.length === 0) return null;
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    if (!res.ok) return null;
    const snap = (await res.json()) as Snapshot;
    if (!Array.isArray(snap.items) || snap.items.length === 0) return null;
    if (Date.now() - new Date(snap.updatedAt).getTime() > MAX_AGE_MS) return null;

    const withSource: Snapshot = {
      updatedAt: snap.updatedAt,
      items: snap.items.map((i) => ({ ...i, dataSource: "cache" as const }))
    };
    cacheSet("blob:snapshot", withSource, CACHE_TTL);
    return withSource;
  } catch {
    return null;
  }
}
