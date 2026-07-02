"use client";

import { useEffect, useState } from "react";
import AlertForm from "@/components/AlertForm";
import { useAlerts, type AlertRule } from "@/lib/store";
import type { AnalyzedItem } from "@/lib/types";
import { usd } from "@/lib/format";

const KIND_TEXT: Record<AlertRule["kind"], (t: number) => string> = {
  drop_pct: (t) => `si baja ${t}%`,
  below_avg: () => "si aparece bajo el promedio",
  spread_improves: (t) => `si el spread mejora a ${t}%`,
  volume_up: (t) => `si el volumen supera ${t}`
};

function evaluate(alert: AlertRule, item: AnalyzedItem | undefined): string | null {
  if (!item) return null;
  switch (alert.kind) {
    case "drop_pct": {
      const first = item.history[0]?.csfloatPrice;
      if (!first) return null;
      const change = ((item.csfloatPrice - first) / first) * 100;
      return change <= -alert.threshold
        ? `Bajó ${Math.abs(change).toFixed(1)}% desde el inicio del historial (ahora ${usd(item.csfloatPrice)}).`
        : null;
    }
    case "below_avg": {
      const prices = item.history.map((p) => p.csfloatPrice).filter((v): v is number => v !== null);
      if (prices.length < 5) return null;
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      return item.csfloatPrice < avg
        ? `Precio actual ${usd(item.csfloatPrice)} bajo el promedio de 30 días (${usd(avg)}).`
        : null;
    }
    case "spread_improves":
      return item.spreadPct !== null && item.spreadPct <= alert.threshold
        ? `Spread actual ${item.spreadPct}% dentro de tu umbral (${alert.threshold}%).`
        : null;
    case "volume_up":
      return item.volume24h !== null && item.volume24h >= alert.threshold
        ? `Volumen actual ${item.volume24h} sobre tu umbral (${alert.threshold}).`
        : null;
  }
}

export default function AlertsPage() {
  const { alerts, remove } = useAlerts();
  const [items, setItems] = useState<AnalyzedItem[]>([]);

  useEffect(() => {
    fetch("/api/items")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Alertas</h1>
      <AlertForm />

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Alertas activas</h2>
        {alerts.length === 0 && (
          <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted">Sin alertas todavía.</p>
        )}
        {alerts.map((a) => {
          const item = items.find((i) => i.marketHashName === a.marketHashName);
          const fired = evaluate(a, item);
          return (
            <div key={a.id} className={`rounded-xl border p-4 ${fired ? "border-accent2/40 bg-accent2/5" : "border-border bg-card"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{a.marketHashName}</p>
                  <p className="text-xs text-muted">Avisar {KIND_TEXT[a.kind](a.threshold)}</p>
                  {fired && <p className="mt-2 text-sm text-accent2">🔔 {fired}</p>}
                  {!fired && item && <p className="mt-2 text-xs text-muted">Condición aún no se cumple.</p>}
                  {!item && <p className="mt-2 text-xs text-muted">Ítem sin datos en el lote actual.</p>}
                </div>
                <button onClick={() => remove(a.id)} className="text-sm text-danger hover:underline">Eliminar</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
