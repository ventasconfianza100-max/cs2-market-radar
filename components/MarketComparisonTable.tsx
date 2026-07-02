import Link from "next/link";
import type { AnalyzedItem } from "@/lib/types";
import { compactNum, pct, usd, RECOMMENDATION_LABEL } from "@/lib/format";
import RiskBadge from "./RiskBadge";

export default function MarketComparisonTable({ items }: { items: AnalyzedItem[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="bg-surface text-left text-xs uppercase text-muted">
          <tr>
            <th className="px-3 py-2">Ítem</th>
            <th className="px-3 py-2 text-right">CSFloat</th>
            <th className="px-3 py-2 text-right">Steam</th>
            <th className="px-3 py-2 text-right">Dif.</th>
            <th className="px-3 py-2 text-right">Volumen</th>
            <th className="px-3 py-2 text-right">Score</th>
            <th className="px-3 py-2">Riesgo</th>
            <th className="px-3 py-2">Señal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-border hover:bg-surface/60">
              <td className="max-w-[280px] truncate px-3 py-2">
                <Link href={`/item/${encodeURIComponent(item.marketHashName)}`} className="hover:text-accent">
                  {item.marketHashName}
                </Link>
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{usd(item.csfloatPrice)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{usd(item.steamPrice)}</td>
              <td className={`px-3 py-2 text-right tabular-nums ${item.discountPct !== null && item.discountPct > 0 ? "text-accent2" : "text-muted"}`}>
                {pct(item.discountPct)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{compactNum(item.volume24h)}</td>
              <td className="px-3 py-2 text-right font-medium tabular-nums">{item.opportunityScore}</td>
              <td className="px-3 py-2"><RiskBadge level={item.riskLevel} /></td>
              <td className="px-3 py-2 text-muted">{RECOMMENDATION_LABEL[item.recommendation]}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={8} className="px-3 py-6 text-center text-muted">Sin resultados con esos filtros.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
