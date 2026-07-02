"use client";

import { useState } from "react";
import { useAlerts, type AlertRule } from "@/lib/store";

const KIND_LABEL: Record<AlertRule["kind"], string> = {
  drop_pct: "Avisar si baja X%",
  below_avg: "Avisar si aparece bajo el promedio",
  spread_improves: "Avisar si el spread mejora a X%",
  volume_up: "Avisar si el volumen sube sobre X"
};

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent";

export default function AlertForm({ defaultName = "" }: { defaultName?: string }) {
  const { add } = useAlerts();
  const [name, setName] = useState(defaultName);
  const [kind, setKind] = useState<AlertRule["kind"]>("drop_pct");
  const [threshold, setThreshold] = useState("10");
  const [saved, setSaved] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    add({ marketHashName: name.trim(), kind, threshold: Number(threshold) || 0 });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-card p-5">
      <h2 className="font-medium">Nueva alerta</h2>
      <label className="block text-xs text-muted">
        Ítem (market hash name)
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="AK-47 | Redline (Field-Tested)" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs text-muted">
          Tipo de alerta
          <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value as AlertRule["kind"])}>
            {Object.entries(KIND_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-muted">
          Umbral
          <input type="number" className={inputCls} value={threshold} onChange={(e) => setThreshold(e.target.value)} />
        </label>
      </div>
      <button className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/80">
        Crear alerta
      </button>
      {saved && <span className="ml-3 text-sm text-accent2">Alerta guardada ✓</span>}
      <p className="text-xs text-muted">
        Las alertas se evalúan dentro de la app al cargar datos nuevos. El envío por email se puede agregar después.
      </p>
    </form>
  );
}
