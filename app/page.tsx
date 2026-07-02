import Link from "next/link";
import { getAnalyzedItems } from "@/lib/data";
import OpportunityCard from "@/components/OpportunityCard";
import MarketComparisonTable from "@/components/MarketComparisonTable";
import { DISCLAIMER } from "@/lib/format";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export default async function DashboardPage() {
  const { items, demo } = await getAnalyzedItems();

  const best = items.slice(0, 3);
  const discounted = [...items]
    .filter((i) => i.discountPct !== null)
    .sort((a, b) => (b.discountPct ?? 0) - (a.discountPct ?? 0))
    .slice(0, 5);
  const highVolume = [...items]
    .filter((i) => i.volume24h !== null)
    .sort((a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0))
    .slice(0, 5);
  const risky = items.filter((i) => i.riskLevel === "high").slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">{DISCLAIMER}</p>
        </div>
        {demo && (
          <span className="rounded-full border border-warn/40 bg-warn/10 px-3 py-1 text-xs text-warn">
            Modo demo: configura CSFLOAT_API_KEY para datos reales
          </span>
        )}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium">Mejores oportunidades del día</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {best.map((item) => (
            <OpportunityCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">Mayor descuento vs Steam</h2>
          <Link href="/market" className="text-sm text-accent hover:underline">Ver ranking completo →</Link>
        </div>
        <MarketComparisonTable items={discounted} />
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-medium">Mayor volumen</h2>
          <MarketComparisonTable items={highVolume} />
        </section>
        <section>
          <h2 className="mb-3 text-lg font-medium">Ítems riesgosos</h2>
          {risky.length > 0 ? (
            <MarketComparisonTable items={risky} />
          ) : (
            <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted">Sin ítems de alto riesgo en este lote.</p>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-medium">Tu watchlist</h2>
        <p className="mt-1 text-sm text-muted">
          Guarda ítems con ☆ para seguir su evolución. <Link href="/watchlist" className="text-accent hover:underline">Ir a la watchlist →</Link>
        </p>
      </section>
    </div>
  );
}
