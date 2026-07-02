"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-accent";

export default function MarketFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.replace(`/market?${next.toString()}`);
    },
    [params, router]
  );

  return (
    <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-4 lg:grid-cols-7">
      <label className="text-xs text-muted">
        Tipo
        <select className={inputCls} value={params.get("category") ?? "all"} onChange={(e) => setParam("category", e.target.value === "all" ? "" : e.target.value)}>
          <option value="all">Todos</option>
          <option value="case">Cajas</option>
          <option value="skin">Skins</option>
          <option value="knife">Cuchillos</option>
          <option value="gloves">Guantes</option>
          <option value="sticker">Stickers</option>
        </select>
      </label>
      <label className="text-xs text-muted">
        Precio mín (USD)
        <input type="number" className={inputCls} defaultValue={params.get("minPrice") ?? ""} onBlur={(e) => setParam("minPrice", e.target.value)} />
      </label>
      <label className="text-xs text-muted">
        Precio máx (USD)
        <input type="number" className={inputCls} defaultValue={params.get("maxPrice") ?? ""} onBlur={(e) => setParam("maxPrice", e.target.value)} />
      </label>
      <label className="text-xs text-muted">
        Riesgo
        <select className={inputCls} value={params.get("risk") ?? "all"} onChange={(e) => setParam("risk", e.target.value === "all" ? "" : e.target.value)}>
          <option value="all">Todos</option>
          <option value="low">Bajo</option>
          <option value="medium">Medio</option>
          <option value="high">Alto</option>
        </select>
      </label>
      <label className="text-xs text-muted">
        Descuento mín %
        <input type="number" className={inputCls} defaultValue={params.get("minDiscount") ?? ""} onBlur={(e) => setParam("minDiscount", e.target.value)} />
      </label>
      <label className="text-xs text-muted">
        Volumen mín
        <input type="number" className={inputCls} defaultValue={params.get("minVolume") ?? ""} onBlur={(e) => setParam("minVolume", e.target.value)} />
      </label>
      <label className="text-xs text-muted">
        Score mín
        <input type="number" className={inputCls} defaultValue={params.get("minScore") ?? ""} onBlur={(e) => setParam("minScore", e.target.value)} />
      </label>
    </div>
  );
}
