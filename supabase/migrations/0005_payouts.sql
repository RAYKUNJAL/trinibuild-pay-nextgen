create type payout_status as enum (
  'scheduled', 'processing', 'completed', 'failed', 'on_hold', 'cancelled'
);

create type payout_hold_reason as enum (
  'chargeback_reserve', 'dispute_pending', 'verification_required',
  'compliance_review', 'insufficient_balance', 'bank_validation_failed'
);

create table payout_batches (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references profiles(id),
  event_id uuid references events(id),
  gross_amount_cents integer not null,
  platform_fee_cents integer not null,
  chargeback_reserve_cents integer not null default 0,
  net_amount_cents integer not null,
  currency text not null default 'TTD',
  status payout_status not null default 'scheduled',
  hold_reason payout_hold_reason,
  hold_until timestamptz,
  bank_reference text,
  bank_account_last4 text,
  bank_name text,
  scheduled_for timestamptz not null,
  initiated_at timestamptz,
  completed_at timestamptz,
  failed_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table payout_line_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references payout_batches(id) on delete cascade,
  order_id uuid not null references orders(id),
  gross_cents integer not null,
  fee_cents integer not null,
  net_cents integer not null,
  description text,
  created_at timestamptz not null default now()
);

create table payout_reserve_adjustments (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references profiles(id),
  adjustment_cents integer not null,  -- positive = held, negative = released
  reason text not null,
  related_order_id uuid references orders(id),
  created_at timestamptz not null default now()
);

create table bank_accounts (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references profiles(id),
  bank_name text not null,
  account_holder_name text not null,
  account_number_encrypted text not null,  -- last 4 digits for display
  account_last4 text not null,
  routing_number text,
  validated boolean not null default false,
  validated_at timestamptz,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_payout_batches_organizer_id on payout_batches(organizer_id);
create index idx_payout_batches_event_id on payout_batches(event_id);
create index idx_payout_batches_status on payout_batches(status);
create index idx_payout_line_items_batch_id on payout_line_items(batch_id);
create index idx_bank_accounts_organizer_id on bank_accounts(organizer_id);

-- Triggers
create trigger payout_batches_updated_at before update on payout_batches
  for each row execute function update_updated_at();
create trigger bank_accounts_updated_at before update on bank_accounts
  for each row execute function update_updated_at();

-- RLS
alter table payout_batches enable row level security;
alter table payout_line_items enable row level security;
alter table payout_reserve_adjustments enable row level security;
alter table bank_accounts enable row level security;

create policy "Organizer reads own payout batches" on payout_batches
  for select using (organizer_id = auth.uid());
create policy "Organizer reads own payout line items" on payout_line_items
  for select using (
    batch_id in (select id from payout_batches where organizer_id = auth.uid())
  );
create policy "Organizer reads own reserve adjustments" on payout_reserve_adjustments
  for select using (organizer_id = auth.uid());
create policy "Organizer manages own bank accounts" on bank_accounts
  for all using (organizer_id = auth.uid());
create policy "Service role full access payout_batches" on payout_batches
  for all using (auth.role() = 'service_role');
create policy "Service role full access payout_line_items" on payout_line_items
  for all using (auth.role() = 'service_role');
create policy "Service role full access bank_accounts" on bank_accounts
  for all using (auth.role() = 'service_role');
