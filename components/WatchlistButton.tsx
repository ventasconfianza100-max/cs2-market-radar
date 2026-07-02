"use client";

import { useWatchlist } from "@/lib/store";

export default function WatchlistButton({ name, compact = false }: { name: string; compact?: boolean }) {
  const { has, toggle } = useWatchlist();
  const active = has(name);
  return (
    <button
      onClick={() => toggle(name)}
      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
        active
          ? "border-accent2/40 bg-accent2/15 text-accent2"
          : "border-border bg-surface text-muted hover:text-white"
      }`}
      title={active ? "Quitar de watchlist" : "Agregar a watchlist"}
    >
      {active ? "★" : "☆"}{compact ? "" : active ? " En watchlist" : " Agregar a watchlist"}
    </button>
  );
}
