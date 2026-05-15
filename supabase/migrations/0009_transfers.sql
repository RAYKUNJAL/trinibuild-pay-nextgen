-- ============================================================
-- 0009_transfers.sql
-- Ticket transfers, name corrections, and event transfer policies
-- ============================================================

create type transfer_status as enum (
  'pending', 'accepted', 'declined', 'expired', 'cancelled'
);

create table ticket_transfers (
  id uuid primary key default gen_random_uuid(),
  pass_id uuid not null references passes(id) on delete cascade,
  from_buyer_id uuid not null references profiles(id),
  to_phone text not null,  -- recipient's phone (may not have account yet)
  to_buyer_id uuid references profiles(id),  -- set when accepted
  to_name text,  -- recipient's name (set by sender or recipient)
  event_id uuid not null references events(id),
  transfer_token text not null unique,  -- short token for the accept URL
  status transfer_status not null default 'pending',
  message text,  -- optional message from sender
  expires_at timestamptz not null,  -- 48h from creation OR gate_open_at - 2h, whichever earlier
  accepted_at timestamptz,
  declined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Name correction history
create table pass_name_corrections (
  id uuid primary key default gen_random_uuid(),
  pass_id uuid not null references passes(id) on delete cascade,
  corrected_by uuid not null references profiles(id),
  old_name text,
  new_name text not null,
  reason text,
  created_at timestamptz not null default now()
);

-- Anti-scalper: resale controls per event (set by organizer)
create table event_transfer_policies (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references events(id) on delete cascade,
  transfers_allowed boolean not null default true,
  max_transfers_per_pass integer not null default 2,
  transfers_close_hours_before integer not null default 2,  -- how many hours before gate open transfers close
  name_corrections_allowed boolean not null default true,
  organizer_approval_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Transfer count per pass (for anti-scalper enforcement)
create view pass_transfer_counts as
  select pass_id, count(*) as transfer_count
  from ticket_transfers
  where status in ('accepted', 'pending')
  group by pass_id;

-- Indexes
create index idx_ticket_transfers_pass_id on ticket_transfers(pass_id);
create index idx_ticket_transfers_from_buyer on ticket_transfers(from_buyer_id);
create index idx_ticket_transfers_token on ticket_transfers(transfer_token);
create index idx_ticket_transfers_to_phone on ticket_transfers(to_phone);
create index idx_pass_name_corrections_pass_id on pass_name_corrections(pass_id);

-- Triggers
create trigger ticket_transfers_updated_at before update on ticket_transfers
  for each row execute function update_updated_at();
create trigger event_transfer_policies_updated_at before update on event_transfer_policies
  for each row execute function update_updated_at();

-- RLS
alter table ticket_transfers enable row level security;
alter table pass_name_corrections enable row level security;
alter table event_transfer_policies enable row level security;

create policy "Buyer manages own outgoing transfers" on ticket_transfers
  for all using (from_buyer_id = auth.uid());
create policy "Recipient views incoming transfers" on ticket_transfers
  for select using (to_buyer_id = auth.uid());
create policy "Buyer reads own name corrections" on pass_name_corrections
  for select using (corrected_by = auth.uid());
create policy "Public reads transfer policies" on event_transfer_policies
  for select using (true);
create policy "Organizer manages own event transfer policies" on event_transfer_policies
  for all using (
    event_id in (select id from events where organizer_id = auth.uid())
  );
create policy "Service role full access transfers" on ticket_transfers
  for all using (auth.role() = 'service_role');
