// Caché en memoria con TTL + rate limiting simple por host.
// En Vercel cada instancia serverless tiene su propia memoria; para
// persistencia real usar price_snapshots en la base de datos.

interface Entry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, Entry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    store.delete(key);
    return null;
  }
  return hit.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

// Rate limiter: mínimo `intervalMs` entre llamadas por clave.
const lastCall = new Map<string, number>();

export function rateLimitOk(key: string, intervalMs: number): boolean {
  const now = Date.now();
  const last = lastCall.get(key) ?? 0;
  if (now - last < intervalMs) return false;
  lastCall.set(key, now);
  return true;
}
