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

export function relativeAge(iso: string | null): string {
  if (!iso) return "sin datos";
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "recién";
  const min = Math.floor(ms / 60000);
  if (min < 1) return "hace segundos";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} día${d === 1 ? "" : "s"}`;
}
