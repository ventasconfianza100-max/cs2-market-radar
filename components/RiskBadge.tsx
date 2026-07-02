import type { RiskLevel } from "@/lib/types";
import { RISK_LABEL } from "@/lib/format";

const styles: Record<RiskLevel, string> = {
  low: "bg-accent2/15 text-accent2 border-accent2/30",
  medium: "bg-warn/15 text-warn border-warn/30",
  high: "bg-danger/15 text-danger border-danger/30"
};

export default function RiskBadge({ level, label }: { level: RiskLevel; label?: string }) {
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${styles[level]}`}>
      {label ?? RISK_LABEL[level]}
    </span>
  );
}
