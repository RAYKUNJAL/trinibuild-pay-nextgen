import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedPosts } from "@/lib/blog/queries";
import { PostCard } from "./_components/post-card";
import { ISLANDS } from "@/lib/islands";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbJsonLd, organizationJsonLd } from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  title: "Caribbean Fete & Carnival Blog — Guides, Tips, Lineups",
  description:
    "The WeFetePass blog: guides to Caribbean carnival, all-inclusive fetes, soca artists, ticketing tips, and travel for fete-goers and promoters.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "WeFetePass Blog",
    description: "Caribbean fete guides, carnival deep-dives, and promoter playbooks.",
    type: "website",
  },
};

export const revalidate = 300;

export default async function BlogIndexPage() {
  const posts = await listPublishedPosts({ limit: 60 });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
      <JsonLd data={organizationJsonLd()} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "/" },
          { name: "Blog", url: "/blog" },
        ])}
      />

      <header className="border-b border-border/60 pb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          The WeFetePass Blog
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Caribbean carnival guides, fete lineups, promoter playbooks, and ticketing tips —
          straight from the soundsystem.
        </p>
      </header>

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Filter by island">
        <Link
          href="/blog"
          className="rounded-full border border-border/60 bg-card px-3 py-1 text-sm hover:border-primary"
        >
          All
        </Link>
        {ISLANDS.map((i) => (
          <Link
            key={i.code}
            href={`/fetes/${i.code}`}
            className="rounded-full border border-border/60 bg-card px-3 py-1 text-sm hover:border-primary"
          >
            {i.flag} {i.name}
          </Link>
        ))}
      </nav>

      <section className="mt-8">
        {posts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 bg-card p-12 text-center">
            <p className="text-lg font-medium">No posts published yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Check back soon for carnival guides and fete recaps.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <PostCard
                key={p.id}
                post={{
                  slug: p.slug,
                  title: p.title,
                  excerpt: p.excerpt,
                  cover_image_url: p.cover_image_url,
                  author_name: p.author_name,
                  published_at: p.published_at,
                  tags: p.tags,
                  island: p.island,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
