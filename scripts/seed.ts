/**
 * WeFetePass seed script
 * -----------------------
 * Populates the database with realistic Caribbean fete events across multiple
 * islands so the /discover page is not empty.
 *
 * Run:   npm run seed
 * Env:   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * The script is idempotent: a deterministic slug per event means re-running
 * it will skip events that already exist.
 */

import { createClient } from "@supabase/supabase-js";
import { slugify } from "../lib/utils";

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "[seed] Missing env. Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.\n" +
      "       Try: node --env-file=.env.local node_modules/.bin/tsx scripts/seed.ts",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const ORGANIZER_EMAIL = "seed-organizer@wefetepass.dev";
const ORGANIZER_NAME = "Seed Organizer";

interface TierSeed {
  name: string;
  description: string;
  price_cents: number;
  quantity: number;
}

interface EventSeed {
  title: string;
  tagline: string;
  description: string;
  venue: string;
  city: string;
  island: string;
  starts_at: string;
  ends_at: string;
  event_type: string;
  capacity: number;
  tiers: [TierSeed, TierSeed, TierSeed];
}

const EVENTS: EventSeed[] = [
  {
    title: "Soca Brainwash 2027",
    tagline: "The all-inclusive that broke the internet.",
    description:
      "Premium all-inclusive fete with top-shelf bars, gourmet food stations, and back-to-back soca from Trinidad's biggest acts. White attire.",
    venue: "Queen's Park Savannah",
    city: "Port of Spain",
    island: "tt",
    starts_at: "2027-01-18T20:00:00-04:00",
    ends_at: "2027-01-19T04:00:00-04:00",
    event_type: "all-inclusive",
    capacity: 5000,
    tiers: [
      { name: "General", description: "Standard entry with cash bar.", price_cents: 60000, quantity: 1500 },
      { name: "VIP", description: "Premium bar, fast-track entry, VIP washrooms.", price_cents: 180000, quantity: 1200 },
      { name: "All-Inclusive Premium", description: "Open top-shelf bar, gourmet food, lounge access.", price_cents: 550000, quantity: 800 },
    ],
  },
  {
    title: "Caesar's Army A.M.Bush 2027",
    tagline: "Paint, powder, and pure vibes from sunrise.",
    description:
      "The legendary j'ouvert experience. Buses, breakfast, paint, powder, and premium drinks from 4am till noon.",
    venue: "Five Islands",
    city: "Port of Spain",
    island: "tt",
    starts_at: "2027-02-07T04:00:00-04:00",
    ends_at: "2027-02-07T12:00:00-04:00",
    event_type: "j'ouvert",
    capacity: 4000,
    tiers: [
      { name: "General", description: "Entry, paint, powder, drinks.", price_cents: 80000, quantity: 2000 },
      { name: "VIP", description: "VIP truck, premium drinks, private washrooms.", price_cents: 250000, quantity: 1200 },
      { name: "All-Inclusive Premium", description: "Top-shelf truck, gourmet breakfast, exclusive paint kit.", price_cents: 720000, quantity: 600 },
    ],
  },
  {
    title: "Reggae Sumfest 2027",
    tagline: "The greatest reggae show on earth.",
    description:
      "Seven nights of reggae and dancehall featuring international and local headliners on Jamaica's north coast.",
    venue: "Catherine Hall Entertainment Centre",
    city: "Montego Bay",
    island: "jm",
    starts_at: "2027-07-18T19:00:00-05:00",
    ends_at: "2027-07-19T04:00:00-05:00",
    event_type: "festival",
    capacity: 15000,
    tiers: [
      { name: "General", description: "Festival grounds access.", price_cents: 750000, quantity: 8000 },
      { name: "VIP", description: "Elevated VIP deck with premium bar.", price_cents: 2400000, quantity: 3000 },
      { name: "All-Inclusive Premium", description: "Backstage lounge, hospitality, meet-and-greets.", price_cents: 7000000, quantity: 500 },
    ],
  },
  {
    title: "Crop Over Foreday Morning 2027",
    tagline: "Bajan j'ouvert done right.",
    description:
      "Crop Over's iconic pre-dawn paint and powder fete winding through the streets of Bridgetown.",
    venue: "Spring Garden Highway",
    city: "Bridgetown",
    island: "bb",
    starts_at: "2027-07-30T02:00:00-04:00",
    ends_at: "2027-07-30T09:00:00-04:00",
    event_type: "j'ouvert",
    capacity: 6000,
    tiers: [
      { name: "General", description: "Paint, powder, drinks, t-shirt.", price_cents: 18000, quantity: 3500 },
      { name: "VIP", description: "VIP truck, premium drinks.", price_cents: 65000, quantity: 1800 },
      { name: "All-Inclusive Premium", description: "Front-of-band, gourmet breakfast, top-shelf bar.", price_cents: 175000, quantity: 700 },
    ],
  },
  {
    title: "Spice Mas 2027",
    tagline: "Grenada's hottest carnival fete.",
    description:
      "The flagship Spice Mas all-inclusive featuring soca royalty and Grenadian flavours.",
    venue: "National Stadium",
    city: "St. George's",
    island: "gd",
    starts_at: "2027-08-08T18:00:00-04:00",
    ends_at: "2027-08-09T03:00:00-04:00",
    event_type: "all-inclusive",
    capacity: 3500,
    tiers: [
      { name: "General", description: "Entry with cash bar.", price_cents: 15000, quantity: 1500 },
      { name: "VIP", description: "Premium bar and VIP section.", price_cents: 50000, quantity: 1500 },
      { name: "All-Inclusive Premium", description: "Top-shelf bar, gourmet food, lounge.", price_cents: 130000, quantity: 500 },
    ],
  },
  {
    title: "Antigua Carnival Monday Mas 2027",
    tagline: "Jump up the streets of St. John's.",
    description:
      "Costumed road march through Antigua's capital with music trucks, premium drinks, and lunch served on-route.",
    venue: "Carnival City",
    city: "St. John's",
    island: "ag",
    starts_at: "2027-08-02T10:00:00-04:00",
    ends_at: "2027-08-02T19:00:00-04:00",
    event_type: "road-march",
    capacity: 4500,
    tiers: [
      { name: "General", description: "Road entry, drinks, lunch.", price_cents: 22000, quantity: 2500 },
      { name: "VIP", description: "VIP truck, premium drinks.", price_cents: 75000, quantity: 1500 },
      { name: "All-Inclusive Premium", description: "Front-line costume, top-shelf bar, hospitality.", price_cents: 200000, quantity: 500 },
    ],
  },
  {
    title: "Vincy Mas Soca Monarch 2027",
    tagline: "Crowning St. Vincent's soca king.",
    description:
      "The annual soca monarch competition featuring the Caribbean's top performers competing for the crown.",
    venue: "Victoria Park",
    city: "Kingstown",
    island: "vc",
    starts_at: "2027-07-05T20:00:00-04:00",
    ends_at: "2027-07-06T02:00:00-04:00",
    event_type: "competition",
    capacity: 4000,
    tiers: [
      { name: "General", description: "Stadium entry.", price_cents: 8000, quantity: 2500 },
      { name: "VIP", description: "VIP stand, premium bar.", price_cents: 28000, quantity: 1200 },
      { name: "All-Inclusive Premium", description: "Hospitality suite, meet-and-greet.", price_cents: 80000, quantity: 300 },
    ],
  },
  {
    title: "Guyana Mashramani 2027",
    tagline: "The biggest float parade in the Caribbean.",
    description:
      "Mashramani — Guyana's republic anniversary carnival — featuring float parades, costume bands, and continuous soca.",
    venue: "D'Urban Park",
    city: "Georgetown",
    island: "gy",
    starts_at: "2027-02-23T10:00:00-04:00",
    ends_at: "2027-02-23T20:00:00-04:00",
    event_type: "parade",
    capacity: 8000,
    tiers: [
      { name: "General", description: "Parade route entry.", price_cents: 500000, quantity: 5000 },
      { name: "VIP", description: "VIP stand with premium bar.", price_cents: 1800000, quantity: 2500 },
      { name: "All-Inclusive Premium", description: "Hospitality tent, gourmet food, top-shelf bar.", price_cents: 5000000, quantity: 500 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Organizer
// ---------------------------------------------------------------------------

async function getOrCreateOrganizer(): Promise<string> {
  // Try to find by listing users (admin) — paginate first page; demo email so it's near the top.
  const list = await (supabase.auth.admin as any).listUsers({ page: 1, perPage: 200 });
  if (list.error) throw new Error(`auth.admin.listUsers failed: ${list.error.message}`);
  const existing = list.data?.users?.find((u: any) => u.email === ORGANIZER_EMAIL);

  let userId: string;
  if (existing) {
    userId = existing.id;
    console.log(`[seed] organizer exists (${userId})`);
  } else {
    const created = await (supabase.auth.admin as any).createUser({
      email: ORGANIZER_EMAIL,
      email_confirm: true,
      password: "SeedOrganizer!" + Math.random().toString(36).slice(2, 10),
      user_metadata: { full_name: ORGANIZER_NAME },
    });
    if (created.error) throw new Error(`auth.admin.createUser failed: ${created.error.message}`);
    userId = created.data.user.id;
    console.log(`[seed] organizer created (${userId})`);
  }

  // Upsert profile row with organizer role.
  const profileUpsert = await (supabase.from("profiles") as any).upsert(
    {
      id: userId,
      full_name: ORGANIZER_NAME,
      role: "organizer",
    },
    { onConflict: "id" },
  );
  if (profileUpsert.error) {
    throw new Error(`profiles upsert failed: ${profileUpsert.error.message}`);
  }

  return userId;
}

// ---------------------------------------------------------------------------
// Events + tiers
// ---------------------------------------------------------------------------

interface SeedResult {
  created: number;
  skipped: number;
  islands: Set<string>;
}

async function seedEvents(organizerId: string): Promise<SeedResult> {
  const result: SeedResult = { created: 0, skipped: 0, islands: new Set() };

  for (const ev of EVENTS) {
    // Deterministic slug per event (no random suffix) so seed is idempotent.
    const slug = `${slugify(ev.title)}-${ev.island}`;

    // Check if event already exists by slug.
    const existing = await (supabase.from("events") as any)
      .select("id, island")
      .eq("slug", slug)
      .maybeSingle();

    if (existing.error) {
      throw new Error(`events select failed: ${existing.error.message}`);
    }

    if (existing.data) {
      console.log(`[seed]   skip  ${slug}`);
      result.skipped++;
      result.islands.add(ev.island);
      continue;
    }

    const inserted = await (supabase.from("events") as any)
      .insert({
        organizer_id: organizerId,
        slug,
        title: ev.title,
        tagline: ev.tagline,
        description: ev.description,
        venue: ev.venue,
        city: ev.city,
        island: ev.island,
        starts_at: ev.starts_at,
        ends_at: ev.ends_at,
        status: "published",
        event_type: ev.event_type,
        capacity: ev.capacity,
      })
      .select("id")
      .single();

    if (inserted.error) {
      throw new Error(`events insert failed for ${slug}: ${inserted.error.message}`);
    }

    const eventId = inserted.data.id as string;

    const tierRows = ev.tiers.map((t, idx) => ({
      event_id: eventId,
      name: t.name,
      description: t.description,
      price_cents: t.price_cents,
      quantity: t.quantity,
      position: idx,
    }));

    const tiersInserted = await (supabase.from("ticket_tiers") as any).insert(tierRows);
    if (tiersInserted.error) {
      throw new Error(`ticket_tiers insert failed for ${slug}: ${tiersInserted.error.message}`);
    }

    console.log(`[seed]   create ${slug}  (${ev.tiers.length} tiers)`);
    result.created++;
    result.islands.add(ev.island);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("[seed] starting WeFetePass seed");
  console.log(`[seed] target: ${SUPABASE_URL}`);

  const organizerId = await getOrCreateOrganizer();
  const result = await seedEvents(organizerId);

  console.log("");
  console.log(
    `[seed] done. Created ${result.created}, skipped ${result.skipped}. ` +
      `Events span ${result.islands.size} islands: ${[...result.islands].join(", ")}`,
  );
  console.log("[seed] Public URL: /discover?island=tt");
}

main().catch((err) => {
  console.error("[seed] FAILED:", err.message ?? err);
  process.exit(1);
});
