create type broadcast_status as enum ('draft', 'scheduled', 'sending', 'sent', 'failed');
create type broadcast_channel as enum ('whatsapp', 'sms', 'both');
create type comp_reason as enum ('artist', 'sponsor', 'press', 'staff', 'promoter_guest', 'other');

create table broadcasts (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references profiles(id),
  event_id uuid references events(id),
  tier_ids jsonb default '[]',  -- empty = all tiers
  subject text,
  body text not null,
  channel broadcast_channel not null default 'whatsapp',
  status broadcast_status not null default 'draft',
  recipient_count integer,
  sent_count integer default 0,
  failed_count integer default 0,
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table broadcast_recipients (
  id uuid primary key default gen_random_uuid(),
  broadcast_id uuid not null references broadcasts(id) on delete cascade,
  buyer_id uuid references profiles(id),
  phone text not null,
  buyer_name text,
  delivered boolean default false,
  delivered_at timestamptz,
  error text
);

-- Comp (complimentary) tickets
create table comp_tickets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  organizer_id uuid not null references profiles(id),
  pass_id uuid references passes(id),
  holder_name text not null,
  holder_phone text,
  holder_email text,
  tier_id uuid not null references ticket_tiers(id),
  reason comp_reason not null,
  notes text,
  issued_at timestamptz not null default now(),
  created_by uuid not null references profiles(id)
);

-- Door sales (cash at door)
create table door_sales (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id),
  organizer_id uuid not null references profiles(id),
  tier_id uuid not null references ticket_tiers(id),
  quantity integer not null default 1,
  amount_collected_cents integer not null,
  payment_method text not null default 'cash',
  buyer_name text,
  buyer_phone text,
  pass_ids jsonb default '[]',  -- generated pass IDs
  worker_id uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- Guest list entries
create table guest_list_entries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id),
  name text not null,
  phone text,
  tier_id uuid references ticket_tiers(id),
  notes text,
  checked_in boolean not null default false,
  checked_in_at timestamptz,
  checked_in_by uuid references profiles(id),
  added_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

-- Wristband/physical token count
create table wristband_batches (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id),
  tier_id uuid references ticket_tiers(id),
  quantity integer not null,
  color text,
  notes text,
  distributed_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_broadcasts_organizer_id on broadcasts(organizer_id);
create index idx_broadcasts_event_id on broadcasts(event_id);
create index idx_broadcast_recipients_broadcast_id on broadcast_recipients(broadcast_id);
create index idx_comp_tickets_event_id on comp_tickets(event_id);
create index idx_door_sales_event_id on door_sales(event_id);
create index idx_guest_list_entries_event_id on guest_list_entries(event_id);

-- Triggers
create trigger broadcasts_updated_at before update on broadcasts
  for each row execute function update_updated_at();

-- RLS
alter table broadcasts enable row level security;
alter table broadcast_recipients enable row level security;
alter table comp_tickets enable row level security;
alter table door_sales enable row level security;
alter table guest_list_entries enable row level security;
alter table wristband_batches enable row level security;

create policy "Organizer manages own broadcasts" on broadcasts
  for all using (organizer_id = auth.uid());
create policy "Organizer reads own broadcast recipients" on broadcast_recipients
  for select using (
    broadcast_id in (select id from broadcasts where organizer_id = auth.uid())
  );
create policy "Organizer manages comps for own events" on comp_tickets
  for all using (organizer_id = auth.uid());
create policy "Organizer manages door sales for own events" on door_sales
  for all using (organizer_id = auth.uid());
create policy "Organizer manages guest lists for own events" on guest_list_entries
  for all using (
    event_id in (select id from events where organizer_id = auth.uid())
  );
create policy "Organizer manages wristband batches" on wristband_batches
  for all using (
    event_id in (select id from events where organizer_id = auth.uid())
  );
