-- Migration 0012: AI flyer generator
--
-- Stores LLM-generated copy + Replicate-generated images for events.
-- Each row is one generation attempt; promoters can have many per event.

create table flyers (
  id                    uuid primary key default gen_random_uuid(),
  event_id              uuid not null references events(id) on delete cascade,
  created_by            uuid not null references auth.users(id),
  prompt                text not null,
  style                 text not null,
  aspect_ratio          text not null default '1:1',
  copy_json             jsonb,        -- { headline, subhead, cta, hashtags[] }
  image_url             text,         -- Supabase Storage path or Replicate URL
  generation_cost_cents int  default 0,
  created_at            timestamptz not null default now()
);

create index idx_flyers_event on flyers (event_id, created_at desc);

alter table flyers enable row level security;

-- Promoter can read flyers for their own events
create policy flyers_select_own on flyers
  for select using (
    exists (
      select 1 from events e
      where e.id = flyers.event_id
        and e.organizer_id = auth.uid()
    )
  );

-- Promoter can insert flyers for their own events
create policy flyers_insert_own on flyers
  for insert with check (
    exists (
      select 1 from events e
      where e.id = event_id
        and e.organizer_id = auth.uid()
    )
  );

-- Promoter can delete flyers for their own events
create policy flyers_delete_own on flyers
  for delete using (
    exists (
      select 1 from events e
      where e.id = flyers.event_id
        and e.organizer_id = auth.uid()
    )
  );
