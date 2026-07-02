import type { PricePoint } from "@/lib/types";

// Gráfico SVG simple: línea CSFloat (accent) y Steam (muted).
export default function PriceChart({ history, height = 120 }: { history: PricePoint[]; height?: number }) {
  const cs = history.map((p) => p.csfloatPrice).filter((v): v is number => v !== null);
  const st = history.map((p) => p.steamPrice).filter((v): v is number => v !== null);
  const all = [...cs, ...st];
  if (all.length < 2) {
    return <div className="text-sm text-muted">Sin historial suficiente para graficar.</div>;
  }
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min || 1;
  const w = 600;

  const toPath = (values: (number | null)[]) => {
    const pts = values
      .map((v, i) =>
        v === null ? null : `${((i / (values.length - 1)) * w).toFixed(1)},${(height - ((v - min) / range) * (height - 10) - 5).toFixed(1)}`
      )
      .filter(Boolean);
    return pts.length > 1 ? `M ${pts.join(" L ")}` : "";
  };

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${height}`} className="w-full" role="img" aria-label="Evolución de precio">
        <path d={toPath(history.map((p) => p.steamPrice))} fill="none" stroke="#8b94a8" strokeWidth="1.5" strokeDasharray="4 3" />
        <path d={toPath(history.map((p) => p.csfloatPrice))} fill="none" stroke="#4f8cff" strokeWidth="2" />
      </svg>
      <div className="mt-1 flex gap-4 text-xs text-muted">
        <span><span className="inline-block h-0.5 w-4 bg-accent align-middle" /> CSFloat</span>
        <span><span className="inline-block h-0.5 w-4 border-t border-dashed border-muted align-middle" /> Steam</span>
        <span className="ml-auto">{history[0]?.date} → {history[history.length - 1]?.date}</span>
      </div>
    </div>
  );
}
