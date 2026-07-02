import { Suspense } from "react";
import InvestmentSimulator from "@/components/InvestmentSimulator";

export default function SimulatorPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Simulador de inversión</h1>
      <p className="text-sm text-muted">
        Calcula el resultado neto después de comisiones antes de decidir. Nunca es una garantía de ganancia.
      </p>
      <Suspense>
        <InvestmentSimulator />
      </Suspense>
    </div>
  );
}
