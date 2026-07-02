"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ItemSearch() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(params.toString());
    if (q) next.set("q", q);
    else next.delete("q");
    router.replace(`/market?${next.toString()}`);
  };

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar skin, caja, cuchillo o sticker…"
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <button className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/80">
        Buscar
      </button>
    </form>
  );
}
