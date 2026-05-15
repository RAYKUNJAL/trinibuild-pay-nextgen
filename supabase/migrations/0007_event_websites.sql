create type website_template as enum ('midnight_mas', 'carnival_vibes', 'beach_party', 'club_night', 'road_march');
create type website_status as enum ('draft', 'published', 'unpublished');

create table event_websites (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references events(id) on delete cascade,
  organizer_id uuid not null references profiles(id),
  template website_template not null default 'midnight_mas',
  custom_slug text unique,  -- if null, use events.slug
  headline text,
  subheadline text,
  description_html text,  -- rich text override
  gallery_image_urls jsonb default '[]',
  video_url text,
  dress_code text,
  lineup text[],
  sponsors jsonb default '[]',  -- [{name, logo_url, url}]
  faq jsonb default '[]',  -- [{question, answer}]
  venue_map_url text,
  venue_directions text,
  contact_whatsapp text,
  contact_email text,
  meta_pixel_id text,
  google_analytics_id text,
  custom_css text,
  status website_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index idx_event_websites_custom_slug on event_websites(custom_slug)
  where custom_slug is not null;
create index idx_event_websites_event_id on event_websites(event_id);

create trigger event_websites_updated_at before update on event_websites
  for each row execute function update_updated_at();

alter table event_websites enable row level security;

create policy "Public reads published websites" on event_websites
  for select using (status = 'published' or organizer_id = auth.uid());

create policy "Organizer manages own websites" on event_websites
  for all using (organizer_id = auth.uid());
