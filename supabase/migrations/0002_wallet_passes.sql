-- wallet pass delivery tracking
create table if not exists wallet_pass_deliveries (
  id uuid primary key default gen_random_uuid(),
  pass_id uuid not null references passes(id) on delete cascade,
  pass_type text not null check (pass_type in ('apple', 'google')),
  serial_number text not null,
  created_at timestamptz not null default now()
);
create index idx_wallet_pass_deliveries_pass_id on wallet_pass_deliveries(pass_id);

-- offline scan cache audit (for reconciliation after sync)
create table if not exists offline_scan_cache (
  id uuid primary key default gen_random_uuid(),
  scanner_id uuid not null,
  event_id uuid not null references events(id),
  pass_code text not null,
  scanned_at timestamptz not null,
  synced_at timestamptz,
  sync_result text  -- 'valid' | 'duplicate' | 'invalid' | 'already_synced'
);
create index idx_offline_scan_cache_event_id on offline_scan_cache(event_id);
create index idx_offline_scan_cache_synced on offline_scan_cache(synced_at) where synced_at is null;

-- RLS
alter table wallet_pass_deliveries enable row level security;
alter table offline_scan_cache enable row level security;

create policy "Pass owner reads own wallet deliveries"
  on wallet_pass_deliveries for select
  using (
    pass_id in (
      select p.id from passes p
      join orders o on o.id = p.order_id
      where o.buyer_id = auth.uid()
    )
  );

create policy "Service role full access to wallet_pass_deliveries"
  on wallet_pass_deliveries for all
  using (auth.role() = 'service_role');

create policy "Scanner inserts offline cache"
  on offline_scan_cache for insert
  with check (scanner_id = auth.uid());

create policy "Scanner reads own cache"
  on offline_scan_cache for select
  using (scanner_id = auth.uid());

create policy "Service role full access to offline_scan_cache"
  on offline_scan_cache for all
  using (auth.role() = 'service_role');
