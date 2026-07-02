import { cacheGet, cacheSet } from "./cache";

// Consulta read-only del Steam Community Market (priceoverview público).
// Sin login, sin acciones de compra/venta, sin scraping agresivo:
// - caché de 15 min por ítem
// - las requests se encolan y se espacian entre sí (nunca en paralelo)
// Si Steam limita (429) o falla, devolvemos null y el caller usa
// datos guardados o modo demo.

const CACHE_TTL = 15 * 60 * 1000;
const SPACING_MS = 600; // separación mínima entre requests a Steam

// Cola secuencial: cada request espera a la anterior + SPACING_MS.
let queueTail: Promise<void> = Promise.resolve();

function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const run = queueTail.then(job);
  queueTail = run.then(
    () => new Promise((r) => setTimeout(r, SPACING_MS)),
    () => new Promise((r) => setTimeout(r, SPACING_MS))
  );
  return run;
}

export interface SteamQuote {
  price: number | null; // USD
  volume: number | null;
  fetchedAt: string;
}

function parseUsd(s: string | undefined): number | null {
  if (!s) return null;
  const n = Number(s.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export async function fetchSteamQuote(marketHashName: string): Promise<SteamQuote | null> {
  const cacheKey = `steam:${marketHashName}`;
  const cached = cacheGet<SteamQuote>(cacheKey);
  if (cached) return cached;

  return enqueue(async () => {
    // Puede que otra request de la cola ya lo haya resuelto.
    const again = cacheGet<SteamQuote>(cacheKey);
    if (again) return again;
    try {
      const url =
        "https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name=" +
        encodeURIComponent(marketHashName);
      const res = await fetch(url, { next: { revalidate: 900 } });
      if (!res.ok) return null;
      const json = await res.json();
      if (!json?.success) return null;

      const quote: SteamQuote = {
        price: parseUsd(json.lowest_price) ?? parseUsd(json.median_price),
        volume: json.volume ? Number(String(json.volume).replace(/,/g, "")) : null,
        fetchedAt: new Date().toISOString()
      };
      cacheSet(cacheKey, quote, CACHE_TTL);
      return quote;
    } catch {
      return null;
    }
  });
}
