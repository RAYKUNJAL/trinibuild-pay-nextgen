-- ============================================================
-- WeFetePass — Development Seed Data
-- Note: auth.users rows are assumed pre-created (e.g. via
-- supabase auth admin create) or via Supabase dashboard.
-- We insert directly into profiles using known UUIDs.
-- ============================================================

-- Seed UUIDs (fixed for repeatability)
-- Admin:     00000000-0000-0000-0000-000000000001
-- Organizer1:00000000-0000-0000-0000-000000000002
-- Organizer2:00000000-0000-0000-0000-000000000003
-- Attendee:  00000000-0000-0000-0000-000000000004

-- --------------------------------------------------------
-- Profiles
-- --------------------------------------------------------

insert into profiles (id, phone, full_name, role)
values
  ('00000000-0000-0000-0000-000000000001', '+18680000001', 'Admin User',       'admin'),
  ('00000000-0000-0000-0000-000000000002', '+18680000002', 'Trini Productions','organizer'),
  ('00000000-0000-0000-0000-000000000003', '+18680000003', 'Carnival Massive', 'organizer'),
  ('00000000-0000-0000-0000-000000000004', '+18680000004', 'Jay Williams',     'attendee')
on conflict (id) do nothing;

-- --------------------------------------------------------
-- Promoter Profiles
-- --------------------------------------------------------

insert into promoter_profiles (profile_id, brand_name, verified, avg_trust_score, social_links)
values
  (
    '00000000-0000-0000-0000-000000000002',
    'Trini Productions',
    true,
    92.5,
    '{"instagram":"@triniproductions","facebook":"TriniProductions"}'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Carnival Massive',
    false,
    78.0,
    '{"instagram":"@carnivalmassive"}'
  )
on conflict do nothing;

-- --------------------------------------------------------
-- Events
-- --------------------------------------------------------

insert into events (id, organizer_id, slug, title, venue, city, starts_at, ends_at, status, event_type)
values
  (
    'eeeeeeee-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'soca-massive-2026-abc123',
    'Soca Massive 2026',
    'Queen''s Park Savannah',
    'Port of Spain',
    '2026-08-15 20:00:00+00',
    '2026-08-16 04:00:00+00',
    'published',
    'fete'
  ),
  (
    'eeeeeeee-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'sunrise-fete-2026-def456',
    'Sunrise Fete 2026',
    'Maracas Beach',
    'Maracas',
    '2026-09-01 06:00:00+00',
    '2026-09-01 12:00:00+00',
    'draft',
    'fete'
  ),
  (
    'eeeeeeee-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003',
    'carnival-road-march-2026-ghi789',
    'Carnival Road March 2026',
    'Frederick Street',
    'Port of Spain',
    '2026-03-02 08:00:00+00',
    '2026-03-02 18:00:00+00',
    'soldout',
    'carnival'
  )
on conflict (id) do nothing;

-- --------------------------------------------------------
-- Ticket Tiers
-- --------------------------------------------------------

-- Soca Massive 2026 (published)
insert into ticket_tiers (id, event_id, name, price_cents, quantity, quantity_sold, position)
values
  ('tttttttt-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000001','General Admission', 15000, 500, 10, 1),
  ('tttttttt-0000-0000-0000-000000000002','eeeeeeee-0000-0000-0000-000000000001','VIP',                35000, 100,  0, 2),
  ('tttttttt-0000-0000-0000-000000000003','eeeeeeee-0000-0000-0000-000000000001','VVIP Table (4)',     80000,  20,  0, 3)
on conflict (id) do nothing;

-- Sunrise Fete 2026 (draft)
insert into ticket_tiers (id, event_id, name, price_cents, quantity, quantity_sold, position)
values
  ('tttttttt-0000-0000-0000-000000000004','eeeeeeee-0000-0000-0000-000000000002','Early Bird', 8000, 200, 0, 1),
  ('tttttttt-0000-0000-0000-000000000005','eeeeeeee-0000-0000-0000-000000000002','General',   12000, 300, 0, 2)
on conflict (id) do nothing;

-- Carnival Road March 2026 (soldout)
insert into ticket_tiers (id, event_id, name, price_cents, quantity, quantity_sold, position)
values
  ('tttttttt-0000-0000-0000-000000000006','eeeeeeee-0000-0000-0000-000000000003','Costume Package',50000, 300, 300, 1)
on conflict (id) do nothing;

-- --------------------------------------------------------
-- Orders (for published event)
-- --------------------------------------------------------

insert into orders (id, buyer_id, event_id, subtotal_cents, fee_cents, total_cents, status, payment_provider, buyer_name, buyer_phone)
values
  (
    'oooooooo-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000004',
    'eeeeeeee-0000-0000-0000-000000000001',
    150000,
    11250,
    161250,
    'paid',
    'mock',
    'Jay Williams',
    '+18680000004'
  )
on conflict (id) do nothing;

-- --------------------------------------------------------
-- Order Items
-- --------------------------------------------------------

insert into order_items (order_id, tier_id, quantity, unit_price_cents)
values
  ('oooooooo-0000-0000-0000-000000000001','tttttttt-0000-0000-0000-000000000001', 10, 15000)
on conflict do nothing;

-- --------------------------------------------------------
-- Passes (10 for the published event order)
-- --------------------------------------------------------

insert into passes (id, order_id, event_id, tier_id, holder_name, code, status)
values
  ('pppppppp-0000-0000-0000-000000000001','oooooooo-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000001','tttttttt-0000-0000-0000-000000000001','Jay Williams','SEED01','valid'),
  ('pppppppp-0000-0000-0000-000000000002','oooooooo-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000001','tttttttt-0000-0000-0000-000000000001','Jay Williams','SEED02','valid'),
  ('pppppppp-0000-0000-0000-000000000003','oooooooo-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000001','tttttttt-0000-0000-0000-000000000001','Jay Williams','SEED03','valid'),
  ('pppppppp-0000-0000-0000-000000000004','oooooooo-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000001','tttttttt-0000-0000-0000-000000000001','Jay Williams','SEED04','valid'),
  ('pppppppp-0000-0000-0000-000000000005','oooooooo-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000001','tttttttt-0000-0000-0000-000000000001','Jay Williams','SEED05','valid'),
  ('pppppppp-0000-0000-0000-000000000006','oooooooo-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000001','tttttttt-0000-0000-0000-000000000001','Jay Williams','SEED06','valid'),
  ('pppppppp-0000-0000-0000-000000000007','oooooooo-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000001','tttttttt-0000-0000-0000-000000000001','Jay Williams','SEED07','valid'),
  ('pppppppp-0000-0000-0000-000000000008','oooooooo-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000001','tttttttt-0000-0000-0000-000000000001','Jay Williams','SEED08','used'),
  ('pppppppp-0000-0000-0000-000000000009','oooooooo-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000001','tttttttt-0000-0000-0000-000000000001','Jay Williams','SEED09','used'),
  ('pppppppp-0000-0000-0000-000000000010','oooooooo-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000001','tttttttt-0000-0000-0000-000000000001','Jay Williams','SEED10','valid')
on conflict (id) do nothing;

-- --------------------------------------------------------
-- Scan Events (3 scans)
-- --------------------------------------------------------

insert into scan_events (pass_id, scanner_id, event_id, result)
values
  ('pppppppp-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000002','eeeeeeee-0000-0000-0000-000000000001','valid'),
  ('pppppppp-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000002','eeeeeeee-0000-0000-0000-000000000001','valid'),
  ('pppppppp-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000002','eeeeeeee-0000-0000-0000-000000000001','duplicate');

-- --------------------------------------------------------
-- Event Readiness Checks (for published event)
-- --------------------------------------------------------

insert into event_readiness_checks (event_id, check_key, done)
values
  ('eeeeeeee-0000-0000-0000-000000000001','cover_image',          true),
  ('eeeeeeee-0000-0000-0000-000000000001','description',          true),
  ('eeeeeeee-0000-0000-0000-000000000001','at_least_one_tier',    true),
  ('eeeeeeee-0000-0000-0000-000000000001','payout_info_set',      false),
  ('eeeeeeee-0000-0000-0000-000000000001','scanner_team_added',   false),
  ('eeeeeeee-0000-0000-0000-000000000001','social_share_done',    false),
  ('eeeeeeee-0000-0000-0000-000000000001','vip_codes_generated',  false),
  ('eeeeeeee-0000-0000-0000-000000000001','gate_open_time_set',   false)
on conflict (event_id, check_key) do nothing;
