export type ItemCategory = "skin" | "knife" | "gloves" | "case" | "sticker";

export type RiskLevel = "low" | "medium" | "high";

export type Recommendation = "observar" | "interesante" | "riesgoso" | "evitar";

export interface RiskFlag {
  code:
    | "baja_liquidez"
    | "posible_manipulacion"
    | "precio_inflado"
    | "sin_historial"
    | "spread_peligroso"
    | "pocas_unidades"
    | "diferencia_exagerada"
    | "caro_pocas_ventas";
  label: string;
}

export interface PricePoint {
  date: string; // ISO
  steamPrice: number | null;
  csfloatPrice: number | null;
  volume: number | null;
}

export interface AnalyzedItem {
  id: string;
  marketHashName: string;
  category: ItemCategory;
  rarity: string | null;
  floatValue: number | null;
  paintSeed: number | null;
  stickers: string[];
  listingUrl: string | null;

  csfloatPrice: number; // USD
  steamPrice: number | null; // USD
  discountPct: number | null; // + = más barato en CSFloat que en Steam
  spreadPct: number | null;
  volume24h: number | null;
  listingsCount: number | null;
  trendPct7d: number | null;

  opportunityScore: number; // 0..100
  riskLevel: RiskLevel;
  riskFlags: RiskFlag[];
  recommendation: Recommendation;
  explanation: string[];

  history: PricePoint[];
  dataSource: "live" | "cache" | "demo";
  fetchedAt: string;
}

export interface ItemFilters {
  q?: string;
  category?: ItemCategory | "all";
  minPrice?: number;
  maxPrice?: number;
  risk?: RiskLevel | "all";
  minDiscount?: number;
  minVolume?: number;
  minScore?: number;
}
