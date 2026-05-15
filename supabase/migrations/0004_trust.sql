create type verification_status as enum ('not_applied', 'pending', 'approved', 'rejected');
create type report_reason as enum (
  'fake_event', 'event_cancelled_no_notice', 'no_refund',
  'misleading_description', 'fraud', 'other'
);
create type report_status as enum ('open', 'investigating', 'resolved', 'dismissed');

-- Promoter verification applications
create table promoter_verifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references profiles(id) on delete cascade,
  status verification_status not null default 'not_applied',
  legal_name text,
  business_reg_number text,
  id_document_url text,
  social_proof_urls jsonb default '[]',
  admin_note text,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Event verification (separate from promoter verification)
create table event_verifications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references events(id) on delete cascade,
  verified boolean not null default false,
  verified_at timestamptz,
  verified_by uuid references profiles(id),
  venue_confirmed boolean not null default false,
  venue_contact text,
  official_website text,
  notes text,
  created_at timestamptz not null default now()
);

-- Event reports
create table event_reports (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  reporter_id uuid references profiles(id),  -- nullable for anonymous
  reason report_reason not null,
  detail text,
  status report_status not null default 'open',
  reporter_email text,
  resolved_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Buyer protection policy version acknowledgements
create table policy_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  policy_version text not null default '1.0',
  acknowledged_at timestamptz not null default now()
);

-- Indexes
create index idx_promoter_verifications_status on promoter_verifications(status);
create index idx_event_reports_event_id on event_reports(event_id);
create index idx_event_reports_status on event_reports(status);

-- updated_at triggers
create trigger promoter_verifications_updated_at before update on promoter_verifications
  for each row execute function update_updated_at();
create trigger event_reports_updated_at before update on event_reports
  for each row execute function update_updated_at();

-- RLS
alter table promoter_verifications enable row level security;
alter table event_verifications enable row level security;
alter table event_reports enable row level security;
alter table policy_acknowledgements enable row level security;

create policy "Organizer reads own verification" on promoter_verifications
  for select using (profile_id = auth.uid());
create policy "Organizer applies for verification" on promoter_verifications
  for insert with check (profile_id = auth.uid());
create policy "Organizer updates own pending verification" on promoter_verifications
  for update using (profile_id = auth.uid() and status = 'not_applied');
create policy "Public reads event verifications" on event_verifications
  for select using (true);
create policy "Anyone can report events" on event_reports
  for insert with check (true);
create policy "Reporter reads own reports" on event_reports
  for select using (reporter_id = auth.uid());
create policy "User manages own acknowledgements" on policy_acknowledgements
  for all using (user_id = auth.uid());
create policy "Service role full access" on promoter_verifications
  for all using (auth.role() = 'service_role');
create policy "Service role full access event_reports" on event_reports
  for all using (auth.role() = 'service_role');
