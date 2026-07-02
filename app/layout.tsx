import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { DISCLAIMER } from "@/lib/format";

export const metadata: Metadata = {
  title: "CS2 Market Radar",
  description:
    "Análisis de mercado de ítems de CS2: CSFloat vs Steam, oportunidades, riesgo, watchlist y simulador. Sin bots, sin automatización de compras."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-8 text-xs text-muted">
          <p>{DISCLAIMER} CS2 Market Radar no automatiza compras ni ventas y no está afiliado a Valve, Steam ni CSFloat.</p>
        </footer>
      </body>
    </html>
  );
}
