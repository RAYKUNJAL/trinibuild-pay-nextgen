create type refund_reason as enum (
  'event_cancelled', 'event_postponed', 'unable_to_attend',
  'duplicate_purchase', 'technical_error', 'other'
);

create type refund_status as enum (
  'pending_review', 'approved', 'processing', 'completed', 'denied', 'cancelled'
);

create type dispute_status as enum (
  'open', 'organizer_responded', 'under_review', 'resolved_buyer', 'resolved_organizer', 'closed'
);

create table refund_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  buyer_id uuid not null references profiles(id),
  event_id uuid not null references events(id),
  reason refund_reason not null,
  reason_detail text,
  amount_cents integer not null,  -- requested refund amount
  approved_amount_cents integer,  -- what was actually approved
  status refund_status not null default 'pending_review',
  organizer_response text,
  admin_note text,
  resolved_at timestamptz,
  resolved_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table refund_events (
  id uuid primary key default gen_random_uuid(),
  refund_id uuid not null references refund_requests(id) on delete cascade,
  actor_id uuid references profiles(id),
  actor_role text not null,  -- 'buyer' | 'organizer' | 'admin' | 'system'
  event_type text not null,  -- 'created' | 'organizer_responded' | 'approved' | 'denied' | 'payment_initiated' | 'completed' | 'escalated'
  note text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table disputes (
  id uuid primary key default gen_random_uuid(),
  refund_id uuid references refund_requests(id),
  order_id uuid not null references orders(id),
  buyer_id uuid not null references profiles(id),
  event_id uuid not null references events(id),
  summary text not null,
  evidence_urls jsonb default '[]',
  status dispute_status not null default 'open',
  resolution_note text,
  resolved_at timestamptz,
  resolved_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table dispute_messages (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid not null references disputes(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  sender_role text not null,
  body text not null,
  attachments jsonb default '[]',
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_refund_requests_buyer_id on refund_requests(buyer_id);
create index idx_refund_requests_order_id on refund_requests(order_id);
create index idx_refund_requests_event_id on refund_requests(event_id);
create index idx_refund_requests_status on refund_requests(status);
create index idx_refund_events_refund_id on refund_events(refund_id);
create index idx_disputes_buyer_id on disputes(buyer_id);
create index idx_disputes_event_id on disputes(event_id);
create index idx_dispute_messages_dispute_id on dispute_messages(dispute_id);

-- updated_at triggers
create trigger refund_requests_updated_at before update on refund_requests
  for each row execute function update_updated_at();
create trigger disputes_updated_at before update on disputes
  for each row execute function update_updated_at();

-- RLS
alter table refund_requests enable row level security;
alter table refund_events enable row level security;
alter table disputes enable row level security;
alter table dispute_messages enable row level security;

-- Buyer reads/creates own refund requests
create policy "Buyer manages own refunds" on refund_requests
  for all using (buyer_id = auth.uid());

-- Organizer reads refunds for their events
create policy "Organizer reads event refunds" on refund_requests
  for select using (
    event_id in (select id from events where organizer_id = auth.uid())
  );

-- Organizer can respond (update) to refunds on their events
create policy "Organizer responds to refunds" on refund_requests
  for update using (
    event_id in (select id from events where organizer_id = auth.uid())
  );

-- Refund events: participants can read
create policy "Participants read refund events" on refund_events
  for select using (
    refund_id in (
      select id from refund_requests
      where buyer_id = auth.uid()
         or event_id in (select id from events where organizer_id = auth.uid())
    )
  );

create policy "System inserts refund events" on refund_events
  for insert with check (true);  -- controlled by API, not client

-- Dispute policies
create policy "Buyer manages own disputes" on disputes
  for all using (buyer_id = auth.uid());

create policy "Organizer reads disputes for their events" on disputes
  for select using (
    event_id in (select id from events where organizer_id = auth.uid())
  );

create policy "Dispute participants read messages" on dispute_messages
  for select using (
    dispute_id in (
      select id from disputes
      where buyer_id = auth.uid()
         or event_id in (select id from events where organizer_id = auth.uid())
    )
  );

create policy "Dispute participants send messages" on dispute_messages
  for insert with check (sender_id = auth.uid());
