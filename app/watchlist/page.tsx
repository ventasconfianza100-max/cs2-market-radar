"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWatchlist } from "@/lib/store";
import type { AnalyzedItem } from "@/lib/types";
import { pct, usd } from "@/lib/format";
import RiskBadge from "@/components/RiskBadge";
import PriceChart from "@/components/PriceChart";

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-accent";

export default function WatchlistPage() {
  const { list, toggle, update } = useWatchlist();
  const [items, setItems] = useState<AnalyzedItem[]>([]);

  useEffect(() => {
    fetch("/api/items")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => {});
  }, []);

  const find = (name: string) => items.find((i) => i.marketHashName === name);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Watchlist</h1>
      {list.length === 0 && (
        <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted">
          Aún no sigues ningún ítem. Ve al <Link href="/market" className="text-accent hover:underline">mercado</Link> y usa ☆ para agregar.
        </p>
      )}
      <div className="space-y-4">
        {list.map((entry) => {
          const item = find(entry.marketHashName);
          return (
            <div key={entry.marketHashName} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/item/${encodeURIComponent(entry.marketHashName)}`} className="font-medium hover:text-accent">
                    {entry.marketHashName}
                  </Link>
                  {item && (
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted">
                      <span>CSFloat {usd(item.csfloatPrice)}</span>
                      <span>Steam {usd(item.steamPrice)}</span>
                      <span>{pct(item.discountPct)}</span>
                      <span>Score {item.opportunityScore}</span>
                      <RiskBadge level={item.riskLevel} />
                    </div>
                  )}
                  {!item && <p className="mt-1 text-sm text-muted">Sin datos en el lote actual (puede aparecer al refrescar).</p>}
                </div>
                <button onClick={() => toggle(entry.marketHashName)} className="text-sm text-danger hover:underline">
                  Quitar
                </button>
              </div>

              {item && item.history.length > 1 && (
                <div className="mt-4">
                  <PriceChart history={item.history} height={90} />
                </div>
              )}

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <label className="text-xs text-muted">
                  Comprar si baja de (USD)
                  <input
                    type="number"
                    className={inputCls}
                    defaultValue={entry.buyBelow ?? ""}
                    onBlur={(e) => update(entry.marketHashName, { buyBelow: Number(e.target.value) || undefined })}
                  />
                </label>
                <label className="text-xs text-muted">
                  Vender si sube a (USD)
                  <input
                    type="number"
                    className={inputCls}
                    defaultValue={entry.sellAbove ?? ""}
                    onBlur={(e) => update(entry.marketHashName, { sellAbove: Number(e.target.value) || undefined })}
                  />
                </label>
                <label className="text-xs text-muted">
                  Nota personal
                  <input
                    className={inputCls}
                    defaultValue={entry.note ?? ""}
                    placeholder="Observar 7 días…"
                    onBlur={(e) => update(entry.marketHashName, { note: e.target.value || undefined })}
                  />
                </label>
              </div>

              {item && entry.buyBelow !== undefined && item.csfloatPrice <= entry.buyBelow && (
                <p className="mt-3 rounded-lg border border-accent2/30 bg-accent2/10 p-2 text-xs text-accent2">
                  El precio actual ({usd(item.csfloatPrice)}) está bajo tu objetivo de compra ({usd(entry.buyBelow)}). Revisa el análisis antes de decidir.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
