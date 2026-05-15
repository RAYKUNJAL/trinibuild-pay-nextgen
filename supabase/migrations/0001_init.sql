-- ============================================================
-- WeFetePass — Initial Schema Migration
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "unaccent";

-- ============================================================
-- Custom Types / Enums
-- ============================================================

create type user_role as enum ('attendee', 'organizer', 'admin');
create type event_status as enum ('draft', 'published', 'soldout', 'cancelled');
create type order_status as enum ('pending', 'paid', 'refunded', 'cancelled');
create type payment_provider as enum ('stripe', 'paypal', 'bank_receipt', 'mock');
create type pass_status as enum ('valid', 'used', 'voided');
create type scan_result as enum ('valid', 'duplicate', 'invalid', 'wrong_event');
create type receipt_fraud_level as enum ('low', 'medium', 'high', 'auto_reject');

-- ============================================================
-- Helper: updated_at trigger function
-- ============================================================

create or replace function update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- Table: profiles
-- Extends auth.users (same PK)
-- ============================================================

create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  phone         text unique,
  full_name     text,
  avatar_url    text,
  role          user_role not null default 'attendee',
  bio           text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_profiles_phone on profiles (phone);
create index idx_profiles_role  on profiles (role);

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- ============================================================
-- Table: promoter_profiles
-- Extended info for organizer accounts
-- ============================================================

create table promoter_profiles (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null references profiles(id) on delete cascade,
  brand_name      text,
  logo_url        text,
  social_links    jsonb not null default '{}',
  avg_trust_score numeric(4,2) not null default 0 check (avg_trust_score >= 0 and avg_trust_score <= 100),
  verified        boolean not null default false,
  payout_info     jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index idx_promoter_profiles_profile_id on promoter_profiles (profile_id);

create trigger trg_promoter_profiles_updated_at
  before update on promoter_profiles
  for each row execute function update_updated_at();

-- ============================================================
-- Table: events
-- ============================================================

create table events (
  id               uuid primary key default gen_random_uuid(),
  organizer_id     uuid not null references profiles(id) on delete restrict,
  slug             text not null unique,
  title            text not null,
  tagline          text,
  description      text,
  venue            text not null,
  city             text not null,
  starts_at        timestamptz not null,
  ends_at          timestamptz,
  cover_image_url  text,
  status           event_status not null default 'draft',
  gate_open_at     timestamptz,
  event_type       text,
  capacity         int check (capacity is null or capacity > 0),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_events_organizer_id       on events (organizer_id);
create index idx_events_status             on events (status);
create index idx_events_city               on events (city);
create index idx_events_starts_at          on events (starts_at);
create index idx_events_organizer_created  on events (organizer_id, created_at);

create trigger trg_events_updated_at
  before update on events
  for each row execute function update_updated_at();

-- ============================================================
-- Table: ticket_tiers
-- ============================================================

create table ticket_tiers (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references events(id) on delete cascade,
  name            text not null,
  description     text,
  price_cents     int not null check (price_cents >= 0),
  quantity        int not null check (quantity > 0),
  quantity_sold   int not null default 0 check (quantity_sold >= 0),
  sales_start_at  timestamptz,
  sales_end_at    timestamptz,
  position        int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_ticket_tiers_event_id on ticket_tiers (event_id);

create trigger trg_ticket_tiers_updated_at
  before update on ticket_tiers
  for each row execute function update_updated_at();

-- ============================================================
-- Table: orders
-- ============================================================

create table orders (
  id               uuid primary key default gen_random_uuid(),
  buyer_id         uuid not null references profiles(id) on delete restrict,
  event_id         uuid not null references events(id) on delete restrict,
  subtotal_cents   int not null check (subtotal_cents >= 0),
  fee_cents        int not null check (fee_cents >= 0),
  total_cents      int not null check (total_cents >= 0),
  currency         text not null default 'TTD',
  status           order_status not null default 'pending',
  payment_provider payment_provider not null default 'mock',
  payment_ref      text,
  buyer_email      text,
  buyer_phone      text,
  buyer_name       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_orders_buyer_id          on orders (buyer_id);
create index idx_orders_event_id          on orders (event_id);
create index idx_orders_event_created     on orders (event_id, created_at);
create index idx_orders_status            on orders (status);

create trigger trg_orders_updated_at
  before update on orders
  for each row execute function update_updated_at();

-- ============================================================
-- Table: order_items
-- One row per tier per order
-- ============================================================

create table order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references orders(id) on delete cascade,
  tier_id         uuid not null references ticket_tiers(id) on delete restrict,
  quantity        int not null check (quantity > 0),
  unit_price_cents int not null check (unit_price_cents >= 0),
  created_at      timestamptz not null default now()
);

create index idx_order_items_order_id on order_items (order_id);
create index idx_order_items_tier_id  on order_items (tier_id);

-- ============================================================
-- Table: passes
-- One row per individual ticket/QR code
-- ============================================================

create table passes (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders(id) on delete cascade,
  event_id     uuid not null references events(id) on delete restrict,
  tier_id      uuid not null references ticket_tiers(id) on delete restrict,
  holder_name  text,
  code         text not null unique,
  status       pass_status not null default 'valid',
  used_at      timestamptz,
  used_by      uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_passes_order_id          on passes (order_id);
create index idx_passes_event_id          on passes (event_id);
create index idx_passes_tier_id           on passes (tier_id);
create index idx_passes_event_status      on passes (event_id, status);
create index idx_passes_code              on passes (code);

create trigger trg_passes_updated_at
  before update on passes
  for each row execute function update_updated_at();

-- ============================================================
-- Table: scan_events
-- ============================================================

create table scan_events (
  id          uuid primary key default gen_random_uuid(),
  pass_id     uuid references passes(id) on delete set null,
  scanner_id  uuid not null references profiles(id) on delete restrict,
  event_id    uuid not null references events(id) on delete restrict,
  result      scan_result not null,
  scanned_at  timestamptz not null default now()
);

create index idx_scan_events_event_id      on scan_events (event_id);
create index idx_scan_events_pass_id       on scan_events (pass_id);
create index idx_scan_events_scanner_id    on scan_events (scanner_id);
create index idx_scan_events_event_scanned on scan_events (event_id, scanned_at);

-- ============================================================
-- Table: bank_receipts
-- Manual bank-transfer proof uploads
-- ============================================================

create table bank_receipts (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  buyer_id      uuid not null references profiles(id) on delete restrict,
  image_url     text not null,
  bank_ref      text,
  amount_cents  int not null check (amount_cents >= 0),
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  fraud_level   receipt_fraud_level not null default 'low',
  reviewed_by   uuid references profiles(id) on delete set null,
  reviewed_at   timestamptz,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_bank_receipts_order_id   on bank_receipts (order_id);
create index idx_bank_receipts_buyer_id   on bank_receipts (buyer_id);
create index idx_bank_receipts_status     on bank_receipts (status);

create trigger trg_bank_receipts_updated_at
  before update on bank_receipts
  for each row execute function update_updated_at();

-- ============================================================
-- Table: waitlist_entries
-- ============================================================

create table waitlist_entries (
  id            uuid primary key default gen_random_uuid(),
  phone         text not null,
  name          text,
  event_id      uuid references events(id) on delete cascade,
  city          text,
  notified_at   timestamptz,
  created_at    timestamptz not null default now()
);

create index idx_waitlist_entries_event_id on waitlist_entries (event_id);
create index idx_waitlist_entries_phone    on waitlist_entries (phone);
create unique index idx_waitlist_unique_phone_event
  on waitlist_entries (phone, event_id)
  where event_id is not null;

-- ============================================================
-- Table: group_orders
-- Links a group purchase to a single order
-- ============================================================

create table group_orders (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references orders(id) on delete cascade,
  organizer_buyer_id uuid not null references profiles(id) on delete restrict,
  share_token        text not null unique default encode(gen_random_bytes(12), 'hex'),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index idx_group_orders_order_id           on group_orders (order_id);
create index idx_group_orders_organizer_buyer_id on group_orders (organizer_buyer_id);

create trigger trg_group_orders_updated_at
  before update on group_orders
  for each row execute function update_updated_at();

-- ============================================================
-- Table: group_members
-- Individual members within a group order
-- ============================================================

create table group_members (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references group_orders(id) on delete cascade,
  buyer_phone  text not null,
  buyer_name   text,
  pass_id      uuid references passes(id) on delete set null,
  paid         boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_group_members_group_id on group_members (group_id);
create index idx_group_members_pass_id  on group_members (pass_id);

create trigger trg_group_members_updated_at
  before update on group_members
  for each row execute function update_updated_at();

-- ============================================================
-- Table: event_readiness_checks
-- ============================================================

create table event_readiness_checks (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  check_key   text not null,
  done        boolean not null default false,
  updated_at  timestamptz not null default now(),
  constraint event_readiness_checks_unique_key unique (event_id, check_key)
);

create index idx_event_readiness_checks_event_id on event_readiness_checks (event_id);

create trigger trg_event_readiness_checks_updated_at
  before update on event_readiness_checks
  for each row execute function update_updated_at();

-- ============================================================
-- Table: whatsapp_delivery_log
-- ============================================================

create table whatsapp_delivery_log (
  id        uuid primary key default gen_random_uuid(),
  pass_id   uuid not null references passes(id) on delete cascade,
  phone     text not null,
  status    text not null default 'queued' check (status in ('queued','sent','failed','delivered')),
  sent_at   timestamptz,
  error     text,
  created_at timestamptz not null default now()
);

create index idx_whatsapp_delivery_log_pass_id on whatsapp_delivery_log (pass_id);
create index idx_whatsapp_delivery_log_phone   on whatsapp_delivery_log (phone);

-- ============================================================
-- Helper Function: increment_tier_quantity_sold
-- Atomic counter increment; raises exception if over capacity
-- ============================================================

create or replace function increment_tier_quantity_sold(tier_id uuid, qty int)
returns void
language plpgsql
as $$
declare
  v_quantity      int;
  v_quantity_sold int;
begin
  select quantity, quantity_sold
  into   v_quantity, v_quantity_sold
  from   ticket_tiers
  where  id = tier_id
  for update;

  if not found then
    raise exception 'Tier % not found', tier_id;
  end if;

  if v_quantity_sold + qty > v_quantity then
    raise exception 'Tier % is sold out (capacity % sold %)', tier_id, v_quantity, v_quantity_sold;
  end if;

  update ticket_tiers
  set    quantity_sold = quantity_sold + qty
  where  id = tier_id;
end;
$$;

-- ============================================================
-- Helper Function: calculate_readiness_score
-- Returns 0-100 score based on completed checks
-- ============================================================

create or replace function calculate_readiness_score(p_event_id uuid)
returns int
language plpgsql
stable
as $$
declare
  v_total int;
  v_done  int;
begin
  select count(*), count(*) filter (where done = true)
  into   v_total, v_done
  from   event_readiness_checks
  where  event_id = p_event_id;

  if v_total = 0 then
    return 0;
  end if;

  return floor((v_done::numeric / v_total::numeric) * 100)::int;
end;
$$;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles                enable row level security;
alter table promoter_profiles       enable row level security;
alter table events                  enable row level security;
alter table ticket_tiers            enable row level security;
alter table orders                  enable row level security;
alter table order_items             enable row level security;
alter table passes                  enable row level security;
alter table scan_events             enable row level security;
alter table bank_receipts           enable row level security;
alter table waitlist_entries        enable row level security;
alter table group_orders            enable row level security;
alter table group_members           enable row level security;
alter table event_readiness_checks  enable row level security;
alter table whatsapp_delivery_log   enable row level security;

-- --------------------------------------------------------
-- profiles
-- --------------------------------------------------------

-- Users can read & update their own profile
create policy "profiles: self read"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles: self update"
  on profiles for update
  using (auth.uid() = id);

-- Organizer profiles are publicly readable
create policy "profiles: organizer public read"
  on profiles for select
  using (role = 'organizer');

-- Admins have full access
create policy "profiles: admin all"
  on profiles for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- --------------------------------------------------------
-- promoter_profiles
-- --------------------------------------------------------

create policy "promoter_profiles: public read"
  on promoter_profiles for select
  using (true);

create policy "promoter_profiles: organizer update own"
  on promoter_profiles for update
  using (profile_id = auth.uid());

create policy "promoter_profiles: organizer insert own"
  on promoter_profiles for insert
  with check (profile_id = auth.uid());

create policy "promoter_profiles: admin all"
  on promoter_profiles for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- --------------------------------------------------------
-- events
-- --------------------------------------------------------

create policy "events: public read published"
  on events for select
  using (status = 'published');

create policy "events: organizer read own"
  on events for select
  using (organizer_id = auth.uid());

create policy "events: organizer insert"
  on events for insert
  with check (
    organizer_id = auth.uid()
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('organizer','admin')
    )
  );

create policy "events: organizer update own"
  on events for update
  using (
    organizer_id = auth.uid()
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('organizer','admin')
    )
  );

create policy "events: organizer delete own"
  on events for delete
  using (
    organizer_id = auth.uid()
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('organizer','admin')
    )
  );

create policy "events: admin all"
  on events for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- --------------------------------------------------------
-- ticket_tiers
-- --------------------------------------------------------

create policy "ticket_tiers: public read published"
  on ticket_tiers for select
  using (
    exists (
      select 1 from events e
      where e.id = event_id and e.status = 'published'
    )
  );

create policy "ticket_tiers: organizer read own"
  on ticket_tiers for select
  using (
    exists (
      select 1 from events e
      where e.id = event_id and e.organizer_id = auth.uid()
    )
  );

create policy "ticket_tiers: organizer insert"
  on ticket_tiers for insert
  with check (
    exists (
      select 1 from events e
      where e.id = event_id and e.organizer_id = auth.uid()
    )
  );

create policy "ticket_tiers: organizer update"
  on ticket_tiers for update
  using (
    exists (
      select 1 from events e
      where e.id = event_id and e.organizer_id = auth.uid()
    )
  );

create policy "ticket_tiers: organizer delete"
  on ticket_tiers for delete
  using (
    exists (
      select 1 from events e
      where e.id = event_id and e.organizer_id = auth.uid()
    )
  );

-- --------------------------------------------------------
-- orders
-- --------------------------------------------------------

create policy "orders: buyer read own"
  on orders for select
  using (buyer_id = auth.uid());

create policy "orders: buyer insert"
  on orders for insert
  with check (buyer_id = auth.uid());

create policy "orders: organizer read for own events"
  on orders for select
  using (
    exists (
      select 1 from events e
      where e.id = event_id and e.organizer_id = auth.uid()
    )
  );

create policy "orders: admin all"
  on orders for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- --------------------------------------------------------
-- order_items
-- --------------------------------------------------------

create policy "order_items: buyer read own"
  on order_items for select
  using (
    exists (
      select 1 from orders o
      where o.id = order_id and o.buyer_id = auth.uid()
    )
  );

create policy "order_items: buyer insert"
  on order_items for insert
  with check (
    exists (
      select 1 from orders o
      where o.id = order_id and o.buyer_id = auth.uid()
    )
  );

create policy "order_items: organizer read for own events"
  on order_items for select
  using (
    exists (
      select 1 from orders o
      join events e on e.id = o.event_id
      where o.id = order_id and e.organizer_id = auth.uid()
    )
  );

-- --------------------------------------------------------
-- passes
-- --------------------------------------------------------

create policy "passes: buyer read own"
  on passes for select
  using (
    exists (
      select 1 from orders o
      where o.id = order_id and o.buyer_id = auth.uid()
    )
  );

create policy "passes: organizer read for own events"
  on passes for select
  using (
    exists (
      select 1 from events e
      where e.id = event_id and e.organizer_id = auth.uid()
    )
  );

create policy "passes: organizer update for own events"
  on passes for update
  using (
    exists (
      select 1 from events e
      where e.id = event_id and e.organizer_id = auth.uid()
    )
  );

create policy "passes: admin all"
  on passes for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- --------------------------------------------------------
-- scan_events
-- --------------------------------------------------------

create policy "scan_events: scanner insert"
  on scan_events for insert
  with check (
    scanner_id = auth.uid()
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('organizer','admin')
    )
  );

create policy "scan_events: organizer read own events"
  on scan_events for select
  using (
    exists (
      select 1 from events e
      where e.id = event_id and e.organizer_id = auth.uid()
    )
  );

create policy "scan_events: admin all"
  on scan_events for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- --------------------------------------------------------
-- bank_receipts
-- --------------------------------------------------------

create policy "bank_receipts: buyer insert"
  on bank_receipts for insert
  with check (buyer_id = auth.uid());

create policy "bank_receipts: buyer read own"
  on bank_receipts for select
  using (buyer_id = auth.uid());

create policy "bank_receipts: organizer read for own events"
  on bank_receipts for select
  using (
    exists (
      select 1 from orders o
      join events e on e.id = o.event_id
      where o.id = order_id and e.organizer_id = auth.uid()
    )
  );

create policy "bank_receipts: organizer update for own events"
  on bank_receipts for update
  using (
    exists (
      select 1 from orders o
      join events e on e.id = o.event_id
      where o.id = order_id and e.organizer_id = auth.uid()
    )
  );

-- --------------------------------------------------------
-- waitlist_entries
-- --------------------------------------------------------

create policy "waitlist_entries: anyone insert"
  on waitlist_entries for insert
  with check (true);

create policy "waitlist_entries: organizer read for own events"
  on waitlist_entries for select
  using (
    event_id is null
    or exists (
      select 1 from events e
      where e.id = event_id and e.organizer_id = auth.uid()
    )
  );

-- --------------------------------------------------------
-- group_orders
-- --------------------------------------------------------

create policy "group_orders: buyer read own"
  on group_orders for select
  using (organizer_buyer_id = auth.uid());

create policy "group_orders: buyer insert"
  on group_orders for insert
  with check (
    organizer_buyer_id = auth.uid()
    and exists (
      select 1 from orders o
      where o.id = order_id and o.buyer_id = auth.uid()
    )
  );

create policy "group_orders: organizer read for own events"
  on group_orders for select
  using (
    exists (
      select 1 from orders o
      join events e on e.id = o.event_id
      where o.id = order_id and e.organizer_id = auth.uid()
    )
  );

-- --------------------------------------------------------
-- group_members
-- --------------------------------------------------------

create policy "group_members: buyer read own group"
  on group_members for select
  using (
    exists (
      select 1 from group_orders go
      where go.id = group_id and go.organizer_buyer_id = auth.uid()
    )
  );

create policy "group_members: buyer insert"
  on group_members for insert
  with check (
    exists (
      select 1 from group_orders go
      where go.id = group_id and go.organizer_buyer_id = auth.uid()
    )
  );

create policy "group_members: organizer read for own events"
  on group_members for select
  using (
    exists (
      select 1 from group_orders go
      join orders o   on o.id  = go.order_id
      join events e   on e.id  = o.event_id
      where go.id = group_id and e.organizer_id = auth.uid()
    )
  );

-- --------------------------------------------------------
-- event_readiness_checks
-- --------------------------------------------------------

create policy "event_readiness_checks: all read"
  on event_readiness_checks for select
  using (true);

create policy "event_readiness_checks: organizer insert own"
  on event_readiness_checks for insert
  with check (
    exists (
      select 1 from events e
      where e.id = event_id and e.organizer_id = auth.uid()
    )
  );

create policy "event_readiness_checks: organizer update own"
  on event_readiness_checks for update
  using (
    exists (
      select 1 from events e
      where e.id = event_id and e.organizer_id = auth.uid()
    )
  );

create policy "event_readiness_checks: organizer delete own"
  on event_readiness_checks for delete
  using (
    exists (
      select 1 from events e
      where e.id = event_id and e.organizer_id = auth.uid()
    )
  );

-- --------------------------------------------------------
-- whatsapp_delivery_log: service role only
-- (no auth.uid() policies — all access via service role key)
-- --------------------------------------------------------

-- No policies needed; service role bypasses RLS.
-- Authenticated users cannot read or write this table directly.
