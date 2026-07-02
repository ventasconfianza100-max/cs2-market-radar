"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useSettings } from "@/lib/store";

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent tabular-nums";

export default function InvestmentSimulator() {
  const params = useSearchParams();
  const { settings } = useSettings();

  const [buy, setBuy] = useState(params.get("price") ?? "");
  const [sell, setSell] = useState(params.get("sell") ?? "");
  const [qty, setQty] = useState("1");
  const [steamFee, setSteamFee] = useState("15"); // % (Steam ~15%)
  const [platformFee, setPlatformFee] = useState("2"); // % CSFloat u otra
  const [useClp, setUseClp] = useState(false);
  const [usdClp, setUsdClp] = useState(String(settings.usdClp));

  const b = Number(buy) || 0;
  const s = Number(sell) || 0;
  const n = Math.max(1, Number(qty) || 1);
  const feeSell = (Number(steamFee) || 0) / 100;
  const feeBuy = (Number(platformFee) || 0) / 100;

  const costTotal = b * (1 + feeBuy) * n;
  const revenueTotal = s * (1 - feeSell) * n;
  const grossProfit = (s - b) * n;
  const netProfit = revenueTotal - costTotal;
  const roi = costTotal > 0 ? (netProfit / costTotal) * 100 : 0;
  const breakeven = b > 0 ? (b * (1 + feeBuy)) / (1 - feeSell) : 0;
  const rate = Number(usdClp) || 0;

  const money = (v: number) =>
    useClp && rate > 0
      ? `$${Math.round(v * rate).toLocaleString("es-CL")} CLP`
      : v.toLocaleString("en-US", { style: "currency", currency: "USD" });

  const lowProfit = netProfit > 0 && roi < 5;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="font-medium">Datos de la operación</h2>
        <label className="block text-xs text-muted">
          Precio de compra (USD)
          <input type="number" step="0.01" className={inputCls} value={buy} onChange={(e) => setBuy(e.target.value)} />
        </label>
        <label className="block text-xs text-muted">
          Precio estimado de venta (USD)
          <input type="number" step="0.01" className={inputCls} value={sell} onChange={(e) => setSell(e.target.value)} />
        </label>
        <div className="grid grid-cols-3 gap-3">
          <label className="block text-xs text-muted">
            Cantidad
            <input type="number" min="1" className={inputCls} value={qty} onChange={(e) => setQty(e.target.value)} />
          </label>
          <label className="block text-xs text-muted">
            Comisión venta % (Steam)
            <input type="number" step="0.1" className={inputCls} value={steamFee} onChange={(e) => setSteamFee(e.target.value)} />
          </label>
          <label className="block text-xs text-muted">
            Comisión compra % (CSFloat u otra)
            <input type="number" step="0.1" className={inputCls} value={platformFee} onChange={(e) => setPlatformFee(e.target.value)} />
          </label>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={useClp} onChange={(e) => setUseClp(e.target.checked)} />
            Mostrar en CLP
          </label>
          {useClp && (
            <label className="flex items-center gap-2 text-xs text-muted">
              USD/CLP
              <input type="number" className={`${inputCls} w-24`} value={usdClp} onChange={(e) => setUsdClp(e.target.value)} />
            </label>
          )}
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="font-medium">Resultado</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Costo total (con comisión)</dt><dd className="tabular-nums">{money(costTotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Ingreso neto por venta</dt><dd className="tabular-nums">{money(revenueTotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Ganancia bruta</dt><dd className="tabular-nums">{money(grossProfit)}</dd></div>
          <div className="flex justify-between border-t border-border pt-2">
            <dt className="font-medium">Ganancia neta</dt>
            <dd className={`font-medium tabular-nums ${netProfit >= 0 ? "text-accent2" : "text-danger"}`}>{money(netProfit)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Retorno</dt>
            <dd className={`tabular-nums ${roi >= 0 ? "text-accent2" : "text-danger"}`}>{roi.toFixed(1)}%</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Precio mínimo de venta para no perder</dt>
            <dd className="tabular-nums">{money(breakeven)}</dd>
          </div>
        </dl>

        {netProfit < 0 && b > 0 && s > 0 && (
          <p className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
            Con estos valores la operación pierde dinero después de comisiones.
          </p>
        )}
        {lowProfit && (
          <p className="rounded-lg border border-warn/30 bg-warn/10 p-3 text-xs text-warn">
            Potencial ganancia baja después de comisiones: el retorno ({roi.toFixed(1)}%) puede no compensar el riesgo.
          </p>
        )}
        <p className="text-xs text-muted">Esto no es una garantía de ganancia, es una señal basada en datos.</p>
      </div>
    </div>
  );
}
