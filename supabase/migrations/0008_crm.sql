create type campaign_type as enum ('street_team', 'influencer', 'social', 'email', 'whatsapp', 'other');
create type buyer_segment as enum ('vip', 'loyal', 'first_timer', 'lapsed', 'at_risk');

create table campaign_links (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references profiles(id),
  event_id uuid references events(id),
  name text not null,
  campaign_type campaign_type not null default 'other',
  utm_source text not null,
  utm_medium text not null,
  utm_campaign text not null,
  utm_content text,
  slug text not null,  -- short identifier for the link
  base_url text not null,
  full_url text not null,  -- computed: base_url + utm params
  click_count integer not null default 0,
  conversion_count integer not null default 0,
  revenue_cents integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table campaign_clicks (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaign_links(id) on delete cascade,
  visitor_id text,  -- anonymous browser ID from cookie
  ip_hash text,
  user_agent text,
  converted boolean not null default false,
  order_id uuid references orders(id),
  created_at timestamptz not null default now()
);

-- Abandoned checkout sessions
create table checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  buyer_id uuid references profiles(id),
  event_id uuid not null references events(id),
  tier_selections jsonb not null default '[]',
  buyer_phone text,
  buyer_email text,
  buyer_name text,
  subtotal_cents integer not null,
  campaign_id uuid references campaign_links(id),
  abandoned_at timestamptz,
  recovered_at timestamptz,
  recovery_message_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Buyer CRM tags
create table buyer_crm_tags (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references profiles(id),
  buyer_id uuid not null references profiles(id),
  tag text not null,  -- 'vip', 'early_bird', 'loyal', 'birthday_month', custom text
  notes text,
  created_at timestamptz not null default now(),
  unique(organizer_id, buyer_id, tag)
);

-- Buyer birthday / preferences
create table buyer_preferences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references profiles(id),
  birth_month integer check (birth_month between 1 and 12),
  birth_day integer check (birth_day between 1 and 31),
  preferred_event_types text[],
  preferred_cities text[],
  whatsapp_opted_in boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_campaign_links_organizer_id on campaign_links(organizer_id);
create index idx_campaign_links_event_id on campaign_links(event_id);
create index idx_campaign_clicks_campaign_id on campaign_clicks(campaign_id);
create index idx_checkout_sessions_event_id on checkout_sessions(event_id);
create index idx_checkout_sessions_abandoned on checkout_sessions(abandoned_at) where abandoned_at is not null and recovered_at is null;
create index idx_buyer_crm_tags_organizer_id on buyer_crm_tags(organizer_id);
create index idx_buyer_crm_tags_buyer_id on buyer_crm_tags(buyer_id);

-- Triggers
create trigger campaign_links_updated_at before update on campaign_links
  for each row execute function update_updated_at();
create trigger checkout_sessions_updated_at before update on checkout_sessions
  for each row execute function update_updated_at();
create trigger buyer_preferences_updated_at before update on buyer_preferences
  for each row execute function update_updated_at();

-- RLS
alter table campaign_links enable row level security;
alter table campaign_clicks enable row level security;
alter table checkout_sessions enable row level security;
alter table buyer_crm_tags enable row level security;
alter table buyer_preferences enable row level security;

create policy "Organizer manages own campaigns" on campaign_links
  for all using (organizer_id = auth.uid());
create policy "Anyone can record clicks" on campaign_clicks
  for insert with check (true);
create policy "Organizer reads clicks for own campaigns" on campaign_clicks
  for select using (
    campaign_id in (select id from campaign_links where organizer_id = auth.uid())
  );
create policy "Organizer reads abandoned checkouts for own events" on checkout_sessions
  for select using (
    event_id in (select id from events where organizer_id = auth.uid())
  );
create policy "System manages checkout sessions" on checkout_sessions
  for all using (auth.role() = 'service_role' or buyer_id = auth.uid());
create policy "Organizer manages own crm tags" on buyer_crm_tags
  for all using (organizer_id = auth.uid());
create policy "User manages own preferences" on buyer_preferences
  for all using (profile_id = auth.uid());
