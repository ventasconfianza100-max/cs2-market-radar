import Link from "next/link";
import type { AnalyzedItem } from "@/lib/types";
import { pct, usd, RECOMMENDATION_LABEL } from "@/lib/format";
import RiskBadge from "./RiskBadge";
import WatchlistButton from "./WatchlistButton";

export default function OpportunityCard({ item }: { item: AnalyzedItem }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link href={`/item/${encodeURIComponent(item.marketHashName)}`} className="font-medium hover:text-accent">
            {item.marketHashName}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="uppercase">{item.category}</span>
            {item.rarity && <span>· {item.rarity}</span>}
            {item.floatValue !== null && <span>· float {item.floatValue.toFixed(3)}</span>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold tabular-nums">{item.opportunityScore}</div>
          <div className="text-xs text-muted">score</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <div className="text-xs text-muted">CSFloat</div>
          <div className="tabular-nums">{usd(item.csfloatPrice)}</div>
        </div>
        <div>
          <div className="text-xs text-muted">Steam</div>
          <div className="tabular-nums">{usd(item.steamPrice)}</div>
        </div>
        <div>
          <div className="text-xs text-muted">Descuento</div>
          <div className={`tabular-nums ${item.discountPct !== null && item.discountPct > 0 ? "text-accent2" : "text-muted"}`}>
            {pct(item.discountPct)}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <RiskBadge level={item.riskLevel} />
        <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-xs text-muted">
          {RECOMMENDATION_LABEL[item.recommendation]}
        </span>
        {item.riskFlags.slice(0, 2).map((f) => (
          <RiskBadge key={f.code} level="medium" label={f.label} />
        ))}
      </div>

      <p className="text-xs text-muted">{item.explanation.slice(0, 3).join(" · ")}</p>

      <div className="mt-auto flex gap-2">
        <Link
          href={`/item/${encodeURIComponent(item.marketHashName)}`}
          className="rounded-lg border border-accent/40 bg-accent/15 px-3 py-1.5 text-sm text-accent hover:bg-accent/25"
        >
          Ver análisis
        </Link>
        <Link
          href={`/simulator?price=${item.csfloatPrice}&sell=${item.steamPrice ?? ""}`}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-muted hover:text-white"
        >
          Simular compra
        </Link>
        <WatchlistButton name={item.marketHashName} compact />
      </div>
    </div>
  );
}
