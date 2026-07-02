import Link from "next/link";
import { notFound } from "next/navigation";
import { getItemByName } from "@/lib/data";
import { compactNum, pct, usd, RECOMMENDATION_LABEL, DISCLAIMER } from "@/lib/format";
import RiskBadge from "@/components/RiskBadge";
import PriceChart from "@/components/PriceChart";
import WatchlistButton from "@/components/WatchlistButton";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export default async function ItemPage({ params }: { params: { name: string } }) {
  const name = decodeURIComponent(params.name);
  const item = await getItemByName(name);
  if (!item) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{item.marketHashName}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className="uppercase">{item.category}</span>
            {item.rarity && <span>· {item.rarity}</span>}
            {item.floatValue !== null && <span>· float {item.floatValue.toFixed(4)}</span>}
            {item.paintSeed !== null && <span>· seed {item.paintSeed}</span>}
            <span>· fuente: {item.dataSource === "demo" ? "demo" : item.dataSource === "live" ? "CSFloat (live)" : "caché"}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <WatchlistButton name={item.marketHashName} />
          <Link
            href={`/simulator?price=${item.csfloatPrice}&sell=${item.steamPrice ?? ""}`}
            className="rounded-lg border border-accent/40 bg-accent/15 px-3 py-1.5 text-sm text-accent hover:bg-accent/25"
          >
            Simular compra
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Precio CSFloat", usd(item.csfloatPrice)],
          ["Precio Steam", usd(item.steamPrice)],
          ["Diferencia", pct(item.discountPct)],
          ["Volumen 24h", compactNum(item.volume24h)],
          ["Spread estimado", pct(item.spreadPct, false)]
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted">{label}</div>
            <div className="mt-1 text-lg font-medium tabular-nums">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <h2 className="mb-3 font-medium">Evolución de precio (30 días)</h2>
          <PriceChart history={item.history} height={180} />
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="font-medium">Opportunity Score</h2>
              <span className="text-3xl font-semibold tabular-nums">{item.opportunityScore}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
              <div className="h-full rounded-full bg-accent" style={{ width: `${item.opportunityScore}%` }} />
            </div>
            <ul className="mt-3 space-y-1 text-sm text-muted">
              {item.explanation.map((e) => (
                <li key={e}>• {e}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-2 font-medium">Riesgo</h2>
            <div className="flex flex-wrap gap-2">
              <RiskBadge level={item.riskLevel} />
              {item.riskFlags.map((f) => (
                <RiskBadge key={f.code} level={item.riskLevel === "low" ? "medium" : item.riskLevel} label={f.label} />
              ))}
              {item.riskFlags.length === 0 && <span className="text-sm text-muted">Sin banderas de riesgo detectadas.</span>}
            </div>
            <p className="mt-3 text-sm">
              Señal: <span className="font-medium">{RECOMMENDATION_LABEL[item.recommendation]}</span>
            </p>
          </div>
        </div>
      </div>

      {item.stickers.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-2 font-medium">Stickers</h2>
          <div className="flex flex-wrap gap-2 text-sm text-muted">
            {item.stickers.map((s) => (
              <span key={s} className="rounded-full border border-border bg-surface px-2 py-0.5">{s}</span>
            ))}
          </div>
        </div>
      )}

      {item.listingUrl && (
        <a href={item.listingUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-sm text-accent hover:underline">
          Ver listing en CSFloat ↗
        </a>
      )}

      <p className="text-xs text-muted">{DISCLAIMER}</p>
    </div>
  );
}
