import { Suspense } from "react";
import { applyFilters, getAnalyzedItems } from "@/lib/data";
import MarketComparisonTable from "@/components/MarketComparisonTable";
import MarketFilters from "@/components/MarketFilters";
import ItemSearch from "@/components/ItemSearch";
import type { ItemFilters } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function num(v: string | undefined): number | undefined {
  if (v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default async function MarketPage({
  searchParams
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const { items, demo } = await getAnalyzedItems();
  const filters: ItemFilters = {
    q: searchParams.q,
    category: (searchParams.category as ItemFilters["category"]) ?? "all",
    minPrice: num(searchParams.minPrice),
    maxPrice: num(searchParams.maxPrice),
    risk: (searchParams.risk as ItemFilters["risk"]) ?? "all",
    minDiscount: num(searchParams.minDiscount),
    minVolume: num(searchParams.minVolume),
    minScore: num(searchParams.minScore)
  };
  const filtered = applyFilters(items, filters);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Ranking de oportunidades</h1>
        {demo && <span className="rounded-full border border-warn/40 bg-warn/10 px-3 py-1 text-xs text-warn">Modo demo</span>}
      </div>
      <Suspense>
        <ItemSearch />
        <MarketFilters />
      </Suspense>
      <p className="text-sm text-muted">
        {filtered.length} ítems ordenados por Opportunity Score. Esto no es una garantía de ganancia, es una señal basada en datos.
      </p>
      <MarketComparisonTable items={filtered} />
    </div>
  );
}
