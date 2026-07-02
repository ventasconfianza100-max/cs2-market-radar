export function usd(n: number | null): string {
  if (n === null) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

export function pct(n: number | null, signed = true): string {
  if (n === null) return "—";
  const sign = signed && n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

export function compactNum(n: number | null): string {
  if (n === null) return "—";
  return n.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 1 });
}

export const RECOMMENDATION_LABEL: Record<string, string> = {
  observar: "Observar",
  interesante: "Interesante",
  riesgoso: "Riesgoso",
  evitar: "Evitar"
};

export const RISK_LABEL: Record<string, string> = {
  low: "Bajo riesgo",
  medium: "Riesgo medio",
  high: "Alto riesgo"
};

export const DISCLAIMER = "Esto no es una garantía de ganancia, es una señal basada en datos.";
