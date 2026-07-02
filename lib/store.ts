"use client";

import { useEffect, useState } from "react";

// Persistencia local (localStorage) para watchlist, notas y alertas.
// Las tablas equivalentes existen en supabase/schema.sql para cuando
// se quiera sincronizar con una base de datos multi-dispositivo.

export interface WatchlistEntry {
  marketHashName: string;
  addedAt: string;
  note?: string;
  buyBelow?: number;
  sellAbove?: number;
}

export interface AlertRule {
  id: string;
  marketHashName: string;
  kind: "drop_pct" | "below_avg" | "spread_improves" | "volume_up";
  threshold: number;
  createdAt: string;
  triggered?: boolean;
  triggeredMessage?: string;
}

function useLocalState<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = (v: T) => {
    setValue(v);
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch {}
  };
  return [value, set];
}

export function useWatchlist() {
  const [list, setList] = useLocalState<WatchlistEntry[]>("cs2radar:watchlist", []);
  const has = (name: string) => list.some((e) => e.marketHashName === name);
  const toggle = (name: string) => {
    if (has(name)) setList(list.filter((e) => e.marketHashName !== name));
    else setList([...list, { marketHashName: name, addedAt: new Date().toISOString() }]);
  };
  const update = (name: string, patch: Partial<WatchlistEntry>) =>
    setList(list.map((e) => (e.marketHashName === name ? { ...e, ...patch } : e)));
  return { list, has, toggle, update, setList };
}

export function useAlerts() {
  const [alerts, setAlerts] = useLocalState<AlertRule[]>("cs2radar:alerts", []);
  const add = (rule: Omit<AlertRule, "id" | "createdAt">) =>
    setAlerts([...alerts, { ...rule, id: crypto.randomUUID(), createdAt: new Date().toISOString() }]);
  const remove = (id: string) => setAlerts(alerts.filter((a) => a.id !== id));
  return { alerts, add, remove, setAlerts };
}

export interface Settings {
  usdClp: number;
  currency: "USD" | "CLP";
}

export function useSettings() {
  const defaultRate = Number(process.env.NEXT_PUBLIC_DEFAULT_USD_CLP ?? 940);
  const [settings, setSettings] = useLocalState<Settings>("cs2radar:settings", {
    usdClp: defaultRate,
    currency: "USD"
  });
  return { settings, setSettings };
}
