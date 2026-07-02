-- CS2 Market Radar — esquema para Supabase/PostgreSQL
-- Ejecutar en el SQL Editor de Supabase o con psql.

create table if not exists market_sources (
  id serial primary key,
  name text unique not null,            -- 'csfloat' | 'steam'
  base_url text,
  notes text
);

insert into market_sources (name, base_url, notes) values
  ('csfloat', 'https://csfloat.com/api/v1', 'API oficial, requiere API key'),
  ('steam', 'https://steamcommunity.com/market', 'read-only priceoverview público')
on conflict (name) do nothing;

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  market_hash_name text unique not null,
  category text not null check (category in ('skin','knife','gloves','case','sticker')),
  rarity text,
  type text,
  created_at timestamptz not null default now()
);

create table if not exists price_snapshots (
  id bigserial primary key,
  item_id uuid not null references items(id) on delete cascade,
  market_hash_name text not null,
  steam_price numeric(12,2),
  csfloat_price numeric(12,2),
  float_value numeric(8,6),
  paint_seed integer,
  volume integer,
  listings_count integer,
  opportunity_score integer,
  risk_score integer,
  listing_id text,
  listing_url text,
  seller_trades integer,
  stickers jsonb default '[]'::jsonb,
  snapshot_at timestamptz not null default now()
);

create index if not exists idx_snapshots_item_date on price_snapshots (item_id, snapshot_at desc);
create index if not exists idx_snapshots_name_date on price_snapshots (market_hash_name, snapshot_at desc);

create table if not exists watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,                          -- para auth de Supabase; null en single-user
  item_id uuid not null references items(id) on delete cascade,
  buy_below numeric(12,2),
  sell_above numeric(12,2),
  added_at timestamptz not null default now(),
  unique (user_id, item_id)
);

create table if not exists user_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  item_id uuid not null references items(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  item_id uuid not null references items(id) on delete cascade,
  kind text not null check (kind in ('drop_pct','below_avg','spread_improves','volume_up')),
  threshold numeric(12,2) not null,
  active boolean not null default true,
  triggered_at timestamptz,
  created_at timestamptz not null default now()
);
