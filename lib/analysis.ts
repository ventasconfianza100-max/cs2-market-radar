import type { AnalyzedItem, Recommendation, RiskFlag, RiskLevel } from "./types";
import type { RawItem } from "./mock";

// Opportunity Score (0–100):
//   descuento vs Steam 35% · liquidez/volumen 25% · spread bajo 15%
//   tendencia positiva 15% · penalización por riesgo -10% a -40%
// Es una señal basada en datos, NO una garantía de ganancia.

const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n));

function discountPct(item: RawItem): number | null {
  if (item.steamPrice === null || item.steamPrice <= 0) return null;
  return ((item.steamPrice - item.csfloatPrice) / item.steamPrice) * 100;
}

function spreadPct(item: RawItem): number | null {
  // Aproximación del spread con la dispersión reciente del historial CSFloat.
  const prices = item.history.slice(-7).map((p) => p.csfloatPrice).filter((p): p is number => p !== null);
  if (prices.length < 3) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min <= 0) return null;
  return ((max - min) / min) * 100;
}

function computeRisk(item: RawItem, discount: number | null, spread: number | null) {
  const flags: RiskFlag[] = [];
  let riskScore = 0; // 0..100

  const vol = item.volume24h;
  if (vol !== null && vol < 10) {
    flags.push({ code: "baja_liquidez", label: "Baja liquidez" });
    riskScore += 25;
  }
  if (item.listingsCount !== null && item.listingsCount < 5) {
    flags.push({ code: "pocas_unidades", label: "Pocas unidades listadas" });
    riskScore += 15;
  }
  if (discount !== null && discount > 30) {
    flags.push({ code: "diferencia_exagerada", label: "Diferencia exagerada entre mercados" });
    riskScore += 20;
  }
  if (discount !== null && discount < -10) {
    flags.push({ code: "precio_inflado", label: "Precio inflado" });
    riskScore += 25;
  }
  if (item.trendPct7d !== null && item.trendPct7d > 15 && (vol === null || vol < 20)) {
    flags.push({ code: "posible_manipulacion", label: "Posible manipulación" });
    riskScore += 30;
  }
  if (item.csfloatPrice > 500 && vol !== null && vol < 15) {
    flags.push({ code: "caro_pocas_ventas", label: "Ítem caro con pocas ventas" });
    riskScore += 15;
  }
  if (item.history.length < 7 || item.steamPrice === null || vol === null) {
    flags.push({ code: "sin_historial", label: "Sin suficiente historial" });
    riskScore += 15;
  }
  if (spread !== null && spread > 12) {
    flags.push({ code: "spread_peligroso", label: "Spread peligroso" });
    riskScore += 15;
  }

  riskScore = clamp(riskScore);
  const level: RiskLevel = riskScore >= 55 ? "high" : riskScore >= 25 ? "medium" : "low";
  return { flags, riskScore, level };
}

export function analyzeItem(item: RawItem): AnalyzedItem {
  const discount = discountPct(item);
  const spread = spreadPct(item);
  const { flags, riskScore, level } = computeRisk(item, discount, spread);

  // Componentes del score
  const discountComp = discount === null ? 8 : clamp((discount / 20) * 35, 0, 35); // 20% desc = máximo
  const vol = item.volume24h;
  const liquidityComp = vol === null ? 5 : clamp((Math.log10(vol + 1) / Math.log10(1000)) * 25, 0, 25);
  const spreadComp = spread === null ? 5 : clamp((1 - spread / 15) * 15, 0, 15);
  const trend = item.trendPct7d;
  const trendComp = trend === null ? 5 : clamp(((trend + 5) / 15) * 15, 0, 15);

  // Penalización por riesgo: -10% a -40% del subtotal
  const subtotal = discountComp + liquidityComp + spreadComp + trendComp;
  const penaltyPct = 0.1 + (riskScore / 100) * 0.3;
  const score = Math.round(clamp(subtotal * (1 - penaltyPct) * (100 / 90)));

  // Recomendación
  let recommendation: Recommendation;
  if (flags.some((f) => f.code === "posible_manipulacion" || f.code === "precio_inflado")) {
    recommendation = "evitar";
  } else if (level === "high") {
    recommendation = "riesgoso";
  } else if (score >= 55 && level !== "medium") {
    recommendation = "interesante";
  } else if (score >= 55) {
    recommendation = "interesante";
  } else {
    recommendation = "observar";
  }

  // Explicación legible
  const explanation: string[] = [];
  if (discount !== null) {
    if (discount > 0) explanation.push(`Está ${discount.toFixed(1)}% bajo Steam`);
    else explanation.push(`Está ${Math.abs(discount).toFixed(1)}% sobre Steam`);
  } else {
    explanation.push("Sin precio Steam de referencia");
  }
  if (vol !== null) {
    explanation.push(vol >= 100 ? "Buen volumen" : vol >= 20 ? "Volumen moderado" : "Riesgo por baja cantidad de ventas");
  }
  if (spread !== null) explanation.push(spread <= 8 ? "Spread aceptable" : "Spread amplio");
  if (trend !== null && trend > 2) explanation.push(`Tendencia +${trend.toFixed(1)}% en 7 días`);
  if (trend !== null && trend < -2) explanation.push(`Tendencia ${trend.toFixed(1)}% en 7 días`);
  if (level === "medium") explanation.push("Riesgo medio");
  if (level === "high") explanation.push("Riesgo alto: revisar antes de decidir");

  return {
    ...item,
    discountPct: discount !== null ? Number(discount.toFixed(1)) : null,
    spreadPct: spread !== null ? Number(spread.toFixed(1)) : null,
    opportunityScore: score,
    riskLevel: level,
    riskFlags: flags,
    recommendation,
    explanation,
    fetchedAt: new Date().toISOString()
  };
}
