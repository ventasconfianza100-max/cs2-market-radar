# CS2 Market Radar

Análisis de mercado para ítems de CS2 conectado a **CSFloat** y al mercado de **Steam** (read-only). Detecta oportunidades con datos de precio, volumen, liquidez, spread y riesgo — **la decisión de comprar o vender siempre es tuya**.

> Esto no es una garantía de ganancia, es una señal basada en datos.

## Qué hace

- **Dashboard** con mejores oportunidades, mayores descuentos, mayor volumen e ítems riesgosos.
- **Ranking** con `Opportunity Score` (0–100): descuento vs Steam 35%, liquidez 25%, spread 15%, tendencia 15%, penalización por riesgo −10% a −40%.
- **Sistema de riesgo** con etiquetas: baja liquidez, posible manipulación, precio inflado, sin historial, spread peligroso, etc.
- **Buscador y filtros**: tipo, precio, riesgo, descuento, volumen, score.
- **Watchlist** con notas ("comprar si baja de X"), objetivos de compra/venta y gráfico de evolución.
- **Simulador de inversión** con comisiones Steam/CSFloat, cantidad y conversión USD/CLP.
- **Alertas internas** (baja X%, bajo el promedio, spread mejora, volumen sube).
- **Modo demo** con datos mock realistas si no hay API key o Steam limita.

## Qué NO hace

- ❌ No compra ni vende automáticamente (sin bots).
- ❌ No inicia sesión en Steam ni ejecuta acciones en tu cuenta.
- ❌ No hace scraping agresivo: caché (5–15 min) y rate limiting integrados.
- ❌ No promete ganancias: toda recomendación muestra su riesgo.

## Correr en local

```bash
cd cs2-market-radar
npm install
cp .env.example .env      # en Windows: copy .env.example .env
npm run dev
```

Abre http://localhost:3000. **Sin configurar nada ya funciona en modo demo.**

## Configurar `.env`

| Variable | Qué es |
|---|---|
| `CSFLOAT_API_KEY` | API key de CSFloat (csfloat.com → perfil → pestaña *Developer*). Sin ella, modo demo. |
| `DATABASE_URL` / `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Opcional, para guardar historial en Postgres/Supabase. |
| `NEXT_PUBLIC_DEFAULT_USD_CLP` | Tipo de cambio por defecto del simulador. |

### Base de datos (opcional)

El esquema está en [`supabase/schema.sql`](supabase/schema.sql) (tablas `items`, `price_snapshots`, `watchlist`, `alerts`, `user_notes`, `market_sources`). Ejecútalo en el SQL Editor de Supabase. La v1 guarda watchlist/alertas en `localStorage` del navegador; el esquema queda listo para sincronizar cuando quieras multi-dispositivo o snapshots programados (por ejemplo con un cron de Vercel llamando a `/api/items`).

## Desplegar en Vercel

1. Sube el repo a GitHub.
2. En [vercel.com](https://vercel.com) → *New Project* → importa el repo (root: `cs2-market-radar` si está en subcarpeta).
3. En *Environment Variables* agrega `CSFLOAT_API_KEY` (y las de Supabase si las usas).
4. Deploy. Cada push a `main` redespliega.

## Arquitectura

```
lib/
  csfloat.ts    cliente API CSFloat (read-only, caché 5 min, 1 req/10 s)
  steam.ts      priceoverview público de Steam (caché 15 min, 1 req/3 s)
  data.ts       orquestador con fallback a demo
  analysis.ts   Opportunity Score + Risk Score
  mock.ts       datos demo realistas
  cache.ts      caché TTL en memoria + rate limiter
  store.ts      watchlist/alertas/ajustes en localStorage
app/
  /             dashboard        /market      ranking + filtros
  /item/[name]  detalle          /watchlist   seguimiento
  /simulator    calculadora      /alerts      alertas
  /settings     configuración    /api/items   JSON analizado
```

Si Steam responde 429 o falla, la app usa la caché o el modo demo — nunca reintenta agresivamente.
