import type { AnalyzedItem, ItemCategory, PricePoint } from "./types";

// Datos demo realistas para probar la UI sin API keys.
// Precios en USD, aproximados a valores de mercado plausibles.

interface MockSeed {
  name: string;
  category: ItemCategory;
  rarity: string | null;
  csfloat: number;
  steam: number | null;
  volume: number | null;
  listings: number;
  trend: number; // % 7 días
  float?: number;
  seed?: number;
  stickers?: string[];
}

const SEEDS: MockSeed[] = [
  { name: "AK-47 | Redline (Field-Tested)", category: "skin", rarity: "Classified", csfloat: 38.2, steam: 44.6, volume: 320, listings: 210, trend: 2.1, float: 0.23 },
  { name: "AWP | Asiimov (Field-Tested)", category: "skin", rarity: "Covert", csfloat: 118.5, steam: 132.0, volume: 180, listings: 95, trend: 1.4, float: 0.27 },
  { name: "M4A4 | Neo-Noir (Minimal Wear)", category: "skin", rarity: "Covert", csfloat: 27.9, steam: 30.1, volume: 140, listings: 130, trend: -0.8, float: 0.11 },
  { name: "Desert Eagle | Printstream (Field-Tested)", category: "skin", rarity: "Covert", csfloat: 48.7, steam: 57.9, volume: 260, listings: 160, trend: 3.2, float: 0.19 },
  { name: "USP-S | Kill Confirmed (Minimal Wear)", category: "skin", rarity: "Covert", csfloat: 92.4, steam: 101.5, volume: 120, listings: 70, trend: 0.5, float: 0.12 },
  { name: "Glock-18 | Fade (Factory New)", category: "skin", rarity: "Restricted", csfloat: 1180.0, steam: 1249.0, volume: 6, listings: 12, trend: 4.8, float: 0.01 },
  { name: "★ Karambit | Doppler (Factory New)", category: "knife", rarity: "Covert", csfloat: 1425.0, steam: 1610.0, volume: 9, listings: 18, trend: 1.9, float: 0.02, seed: 387 },
  { name: "★ Butterfly Knife | Case Hardened (Field-Tested)", category: "knife", rarity: "Covert", csfloat: 1090.0, steam: 1155.0, volume: 4, listings: 7, trend: -2.3, float: 0.28, seed: 151 },
  { name: "★ M9 Bayonet | Marble Fade (Factory New)", category: "knife", rarity: "Covert", csfloat: 1338.0, steam: 1490.0, volume: 7, listings: 11, trend: 0.9, float: 0.01 },
  { name: "★ Flip Knife | Ultraviolet (Field-Tested)", category: "knife", rarity: "Covert", csfloat: 232.0, steam: 258.0, volume: 22, listings: 30, trend: 1.1, float: 0.24 },
  { name: "★ Sport Gloves | Pandora's Box (Field-Tested)", category: "gloves", rarity: "Extraordinary", csfloat: 2850.0, steam: 3020.0, volume: 2, listings: 4, trend: 6.5, float: 0.31 },
  { name: "★ Driver Gloves | King Snake (Minimal Wear)", category: "gloves", rarity: "Extraordinary", csfloat: 645.0, steam: 731.0, volume: 8, listings: 14, trend: 2.7, float: 0.13 },
  { name: "Kilowatt Case", category: "case", rarity: "Base Grade", csfloat: 0.68, steam: 0.79, volume: 42000, listings: 5200, trend: -1.5 },
  { name: "Revolution Case", category: "case", rarity: "Base Grade", csfloat: 0.41, steam: 0.47, volume: 38000, listings: 4800, trend: 0.6 },
  { name: "Dreams & Nightmares Case", category: "case", rarity: "Base Grade", csfloat: 0.88, steam: 1.02, volume: 29000, listings: 3900, trend: 3.4 },
  { name: "Fracture Case", category: "case", rarity: "Base Grade", csfloat: 0.52, steam: 0.55, volume: 31000, listings: 4100, trend: 1.2 },
  { name: "Sticker | Katowice 2014 iBUYPOWER (Holo)", category: "sticker", rarity: "Exotic", csfloat: 58900.0, steam: null, volume: 0, listings: 1, trend: 0, stickers: [] },
  { name: "Sticker | Crown (Foil)", category: "sticker", rarity: "Exotic", csfloat: 1240.0, steam: 1490.0, volume: 3, listings: 6, trend: 5.2 },
  { name: "Sticker | Titan (Holo) | Katowice 2015", category: "sticker", rarity: "Exotic", csfloat: 4980.0, steam: null, volume: 1, listings: 2, trend: -4.1 },
  { name: "AK-47 | Slate (Factory New)", category: "skin", rarity: "Restricted", csfloat: 4.1, steam: 4.9, volume: 900, listings: 620, trend: -0.4, float: 0.03 },
  { name: "M4A1-S | Hyper Beast (Field-Tested)", category: "skin", rarity: "Covert", csfloat: 31.5, steam: 33.0, volume: 150, listings: 140, trend: 0.2, float: 0.22 },
  { name: "AWP | Chromatic Aberration (Factory New)", category: "skin", rarity: "Classified", csfloat: 22.4, steam: 30.8, volume: 45, listings: 25, trend: 8.9, float: 0.05 },
  { name: "P250 | See Ya Later (Factory New)", category: "skin", rarity: "Covert", csfloat: 9.8, steam: 10.4, volume: 210, listings: 240, trend: -1.1, float: 0.06 },
  { name: "Nova | Baroque Orange (Factory New)", category: "skin", rarity: "Mil-Spec", csfloat: 84.0, steam: 41.0, volume: 2, listings: 3, trend: 45.0, float: 0.04 }
];

function seededRandom(seedStr: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function makeHistory(seed: MockSeed, days = 30): PricePoint[] {
  const rnd = seededRandom(seed.name);
  const points: PricePoint[] = [];
  const now = Date.now();
  let cs = seed.csfloat * (1 - (seed.trend / 100) * (days / 7));
  let st = seed.steam !== null ? seed.steam * (1 - (seed.trend / 100) * (days / 7)) : null;
  for (let i = days; i >= 0; i--) {
    const noise = (rnd() - 0.5) * 0.04;
    cs = Math.max(0.03, cs * (1 + (seed.trend / 100) / days + noise));
    if (st !== null) st = Math.max(0.03, st * (1 + (seed.trend / 100) / days + (rnd() - 0.5) * 0.03));
    points.push({
      date: new Date(now - i * 86400000).toISOString().slice(0, 10),
      csfloatPrice: Number(cs.toFixed(2)),
      steamPrice: st !== null ? Number(st.toFixed(2)) : null,
      volume: seed.volume !== null ? Math.max(0, Math.round(seed.volume * (0.7 + rnd() * 0.6))) : null
    });
  }
  return points;
}

export interface RawItem {
  id: string;
  marketHashName: string;
  category: ItemCategory;
  rarity: string | null;
  floatValue: number | null;
  paintSeed: number | null;
  stickers: string[];
  listingUrl: string | null;
  csfloatPrice: number;
  steamPrice: number | null;
  volume24h: number | null;
  listingsCount: number | null;
  trendPct7d: number | null;
  history: PricePoint[];
  dataSource: AnalyzedItem["dataSource"];
}

export function getMockItems(): RawItem[] {
  return SEEDS.map((s, i) => ({
    id: `demo-${i}`,
    marketHashName: s.name,
    category: s.category,
    rarity: s.rarity,
    floatValue: s.float ?? null,
    paintSeed: s.seed ?? null,
    stickers: s.stickers ?? [],
    listingUrl: null,
    csfloatPrice: s.csfloat,
    steamPrice: s.steam,
    volume24h: s.volume,
    listingsCount: s.listings,
    trendPct7d: s.trend,
    history: makeHistory(s),
    dataSource: "demo" as const
  }));
}
