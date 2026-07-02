"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/market", label: "Mercado" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/simulator", label: "Simulador" },
  { href: "/alerts", label: "Alertas" },
  { href: "/settings", label: "Ajustes" }
];

export default function Nav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          <span className="text-accent">CS2</span> Market Radar
        </Link>
        <nav className="flex gap-1 overflow-x-auto text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-1.5 whitespace-nowrap ${
                path === l.href ? "bg-surface text-white" : "text-muted hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
