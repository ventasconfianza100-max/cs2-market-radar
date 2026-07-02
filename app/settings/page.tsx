"use client";

import { useEffect, useState } from "react";
import { useSettings } from "@/lib/store";

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent";

export default function SettingsPage() {
  const { settings, setSettings } = useSettings();
  const [status, setStatus] = useState<{ csfloat: boolean; demo: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/items")
      .then((r) => r.json())
      .then((d) => setStatus({ csfloat: !d.demo, demo: d.demo }))
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Configuración</h1>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-medium">Fuentes de datos</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">CSFloat API</dt>
            <dd>
              {status === null ? "Verificando…" : status.csfloat ? (
                <span className="text-accent2">Conectada ✓</span>
              ) : (
                <span className="text-warn">Sin conexión — modo demo</span>
              )}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Steam Market</dt>
            <dd className="text-muted">Read-only, caché 15 min</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-muted">
          La API de CSFloat funciona sin clave (con límites más estrictos). Si tienes una API key
          (requiere haber hecho una compra o venta en CSFloat), configúrala como
          <code className="rounded bg-surface px-1">CSFLOAT_API_KEY</code> en el servidor para mejores límites —
          nunca se guarda en el navegador.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-medium">Moneda</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-xs text-muted">
            Moneda preferida
            <select
              className={inputCls}
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value as "USD" | "CLP" })}
            >
              <option value="USD">USD</option>
              <option value="CLP">CLP</option>
            </select>
          </label>
          <label className="text-xs text-muted">
            Tipo de cambio USD/CLP
            <input
              type="number"
              className={inputCls}
              value={settings.usdClp}
              onChange={(e) => setSettings({ ...settings, usdClp: Number(e.target.value) || 0 })}
            />
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted">
        <h2 className="font-medium text-white">Qué NO hace esta app</h2>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>No compra ni vende automáticamente.</li>
          <li>No inicia sesión en Steam ni ejecuta acciones en tu cuenta.</li>
          <li>No garantiza ganancias: entrega señales basadas en datos, con su riesgo.</li>
        </ul>
      </div>
    </div>
  );
}
