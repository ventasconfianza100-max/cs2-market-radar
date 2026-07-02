import { cacheGet, cacheSet } from "./cache";
import type { ItemCategory } from "./types";
import type { RawItem } from "./mock";

// Cliente read-only de la API oficial de CSFloat.
// Docs: https://docs.csfloat.com/  — endpoint GET /api/v1/listings
// Solo lectura de listings: nunca compra, nunca vende.

const BASE = "https://csfloat.com/api/v1";
const CACHE_TTL = 5 * 60 * 1000; // 5 min

// Deduplicación: si hay una llamada en curso, las demás la comparten
// en vez de golpear la API de nuevo (rate limiting efectivo).
let inFlight: Promise<RawItem[] | null> | null = null;

interface CSFloatListing {
  id: string;
  price: number; // centavos USD
  created_at: string;
  item: {
    market_hash_name: string;
    float_value?: number;
    paint_seed?: number;
    rarity_name?: string;
    type_name?: string;
    stickers?: { name: string }[];
  };
  seller?: { statistics?: { total_trades?: number } };
}

function categorize(typeName: string | undefined, name: string): ItemCategory {
  const n = name.toLowerCase();
  if (n.startsWith("sticker")) return "sticker";
  if (n.includes("case") && !n.includes("hardened")) return "case";
  if (n.startsWith("★")) {
    if (n.includes("gloves") || n.includes("wraps")) return "gloves";
    return "knife";
  }
  if (typeName?.toLowerCase().includes("container")) return "case";
  return "skin";
}

export function hasCSFloatKey(): boolean {
  return Boolean(process.env.CSFLOAT_API_KEY);
}

export async function fetchCSFloatListings(limit = 50): Promise<RawItem[] | null> {
  const key = process.env.CSFLOAT_API_KEY;
  if (!key) return null;

  const cacheKey = `csfloat:listings:${limit}`;
  const cached = cacheGet<RawItem[]>(cacheKey);
  if (cached) return cached;

  if (inFlight) return inFlight;
  inFlight = doFetch(key, limit, cacheKey).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function doFetch(key: string, limit: number, cacheKey: string): Promise<RawItem[] | null> {
  try {
    const res = await fetch(`${BASE}/listings?limit=${limit}&sort_by=most_recent`, {
      headers: { Authorization: key },
      next: { revalidate: 300 }
    });
    if (!res.ok) return null;
    const json = await res.json();
    const listings: CSFloatListing[] = Array.isArray(json) ? json : json.data ?? [];

    // Agrupa por market_hash_name y toma el precio más bajo (mejor oferta).
    const byName = new Map<string, CSFloatListing[]>();
    for (const l of listings) {
      const arr = byName.get(l.item.market_hash_name) ?? [];
      arr.push(l);
      byName.set(l.item.market_hash_name, arr);
    }

    const items: RawItem[] = [...byName.entries()].map(([name, group]) => {
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
        steamPrice: null, // se completa con el módulo Steam
        volume24h: null,
        listingsCount: group.length,
        trendPct7d: null,
        history: [],
        dataSource: "live" as const
      };
    });

    cacheSet(cacheKey, items, CACHE_TTL);
    return items;
  } catch {
    return null;
  }
}
