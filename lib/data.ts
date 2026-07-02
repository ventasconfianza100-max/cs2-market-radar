import { fetchCSFloatListings } from "./csfloat";
import { fetchSteamQuote } from "./steam";
import { loadSnapshot } from "./snapshot";
import { getMockItems, type RawItem } from "./mock";
import { analyzeItem } from "./analysis";
import { cacheGet, cacheSet } from "./cache";
import type { AnalyzedItem, ItemFilters } from "./types";

// Orquestador: CSFloat (live) + Steam (read-only) con fallback a demo.

const ITEMS_TTL = 5 * 60 * 1000;
const STEAM_ENRICH_LIMIT = 8; // ítems por request para no golpear a Steam

async function loadRawItems(): Promise<{ items: RawItem[]; demo: boolean }> {
  // Se intenta siempre: el endpoint de CSFloat funciona sin API key
  // (con límites más estrictos). La key, si existe, mejora los límites.
  const live = await fetchCSFloatListings(50);
  if (live && live.length > 0) {
    // Enriquecer los primeros N con precio Steam (respetando rate limit)
    const slice = live.slice(0, STEAM_ENRICH_LIMIT);
    await Promise.all(
      slice.map(async (item) => {
        const q = await fetchSteamQuote(item.marketHashName);
        if (q) {
          item.steamPrice = q.price;
          item.volume24h = q.volume;
        }
      })
    );
    return { items: live, demo: false };
  }

  // CSFloat bloquea IPs de datacenters (Vercel): usar el último snapshot
  // subido por el recolector (scripts/collector.mjs) a Vercel Blob.
  const snap = await loadSnapshot();
  if (snap) return { items: snap.items, demo: false };

  return { items: getMockItems(), demo: true };
}

export async function getAnalyzedItems(): Promise<{ items: AnalyzedItem[]; demo: boolean }> {
  const cached = cacheGet<{ items: AnalyzedItem[]; demo: boolean }>("analyzed");
  if (cached) return cached;

  const { items: raw, demo } = await loadRawItems();
  const items = raw.map(analyzeItem).sort((a, b) => b.opportunityScore - a.opportunityScore);
  const result = { items, demo };
  cacheSet("analyzed", result, ITEMS_TTL);
  return result;
}

export async function getItemByName(name: string): Promise<AnalyzedItem | null> {
  const { items } = await getAnalyzedItems();
  return items.find((i) => i.marketHashName === name) ?? null;
}

export function applyFilters(items: AnalyzedItem[], f: ItemFilters): AnalyzedItem[] {
  return items.filter((i) => {
    if (f.q && !i.marketHashName.toLowerCase().includes(f.q.toLowerCase())) return false;
    if (f.category && f.category !== "all" && i.category !== f.category) return false;
    if (f.minPrice !== undefined && i.csfloatPrice < f.minPrice) return false;
    if (f.maxPrice !== undefined && i.csfloatPrice > f.maxPrice) return false;
    if (f.risk && f.risk !== "all" && i.riskLevel !== f.risk) return false;
    if (f.minDiscount !== undefined && (i.discountPct === null || i.discountPct < f.minDiscount)) return false;
    if (f.minVolume !== undefined && (i.volume24h === null || i.volume24h < f.minVolume)) return false;
    if (f.minScore !== undefined && i.opportunityScore < f.minScore) return false;
    return true;
  });
}
