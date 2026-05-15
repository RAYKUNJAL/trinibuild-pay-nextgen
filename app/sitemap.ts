import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { ISLANDS } from "@/lib/islands";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wefetepass.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // ----------------------------------------------------------------- core
  entries.push({
    url: `${SITE}/`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 1.0,
  });
  entries.push({
    url: `${SITE}/discover`,
    lastModified: now,
    changeFrequency: "hourly",
    priority: 0.9,
  });
  entries.push({
    url: `${SITE}/blog`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  });

  // discover?island=xx
  for (const i of ISLANDS) {
    entries.push({
      url: `${SITE}/discover?island=${i.code}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  // -------------------------------------------------- programmatic /fetes
  for (const i of ISLANDS) {
    entries.push({
      url: `${SITE}/fetes/${i.code}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  // -------------------------------------------------- programmatic carnival
  for (const year of [2026, 2027, 2028]) {
    entries.push({
      url: `${SITE}/carnival/${year}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  // ----------------------------------------------- data-driven entries
  try {
    const supabase = await createClient();

    // Published events
    const { data: eventsData } = await supabase
      .from("events")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .select("slug, updated_at, city" as any)
      .eq("status", "published")
      .limit(2000);
    const events = (eventsData as unknown as Array<{ slug: string; updated_at: string; city: string }>) ?? [];
    for (const e of events) {
      entries.push({
        url: `${SITE}/events/${e.slug}`,
        lastModified: e.updated_at ? new Date(e.updated_at) : now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    // Top cities (by event count) — programmatic city pages
    const cityCounts = new Map<string, number>();
    for (const e of events) {
      if (!e.city) continue;
      cityCounts.set(e.city, (cityCounts.get(e.city) ?? 0) + 1);
    }
    const topCities = [...cityCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([city]) => city);
    for (const city of topCities) {
      entries.push({
        url: `${SITE}/events/city/${encodeURIComponent(city.toLowerCase().replace(/\s+/g, "-"))}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }

    // Published blog posts
    const { data: postsData } = await supabase
      .from("blog_posts")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .select("slug, updated_at, published_at" as any)
      .eq("status", "published")
      .limit(2000);
    const posts = (postsData as unknown as Array<{ slug: string; updated_at: string; published_at: string | null }>) ?? [];
    for (const p of posts) {
      entries.push({
        url: `${SITE}/blog/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch {
    // If Supabase is unavailable at build time, ship the static portion.
  }

  return entries;
}
