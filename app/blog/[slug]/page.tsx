import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedPostBySlug, incrementViewCount, renderMarkdown, listPublishedPosts } from "@/lib/blog/queries";
import { JsonLd } from "@/components/json-ld";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/structured-data";
import { getIslandByCode } from "@/lib/islands";

export const revalidate = 600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) return { title: "Post not found" };
  const title = post.meta_title ?? post.title;
  const description = post.meta_description ?? post.excerpt ?? undefined;
  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      images: post.cover_image_url ? [{ url: post.cover_image_url }] : undefined,
      publishedTime: post.published_at ?? undefined,
      authors: post.author_name ? [post.author_name] : undefined,
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
    },
  };
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  // Fire-and-forget view tracking — don't await so render isn't blocked.
  void incrementViewCount(post.id);

  const island = post.island ? getIslandByCode(post.island) : null;
  const html = renderMarkdown(post.content_mdx);

  // Related posts: same island (or same first tag) excluding this one.
  const related = (
    await listPublishedPosts({
      limit: 4,
      ...(post.island ? { island: post.island } : post.tags[0] ? { tag: post.tags[0] } : {}),
    })
  ).filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 md:py-12">
      <JsonLd
        data={articleJsonLd({
          title: post.title,
          excerpt: post.excerpt,
          cover_image_url: post.cover_image_url,
          published_at: post.published_at,
          updated_at: post.updated_at,
          author_name: post.author_name,
          slug: post.slug,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: "/" },
          { name: "Blog", url: "/blog" },
          { name: post.title, url: `/blog/${post.slug}` },
        ])}
      />

      <nav className="mb-6 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/blog" className="hover:text-foreground">Blog</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{post.title}</span>
      </nav>

      <article>
        {post.cover_image_url ? (
          <div className="relative mb-6 aspect-[16/9] w-full overflow-hidden rounded-lg bg-muted">
            <Image
              src={post.cover_image_url}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        ) : null}

        <header className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {island ? (
              <Link
                href={`/fetes/${island.code}`}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 hover:bg-primary/10"
              >
                {island.flag} {island.name}
              </Link>
            ) : null}
            {post.tags.map((t) => (
              <span key={t} className="rounded-full bg-muted px-2 py-0.5">
                #{t}
              </span>
            ))}
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            {post.title}
          </h1>
          {post.excerpt ? (
            <p className="mt-3 text-lg text-muted-foreground">{post.excerpt}</p>
          ) : null}
          <div className="mt-4 text-sm text-muted-foreground">
            {post.author_name ? <span>By {post.author_name} · </span> : null}
            <time dateTime={post.published_at ?? undefined}>{formatDate(post.published_at)}</time>
          </div>
        </header>

        <div
          className="prose prose-neutral max-w-none dark:prose-invert"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>

      {related.length > 0 ? (
        <section className="mt-16 border-t border-border/60 pt-8">
          <h2 className="font-display text-xl font-bold">Keep reading</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {related.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/blog/${r.slug}`}
                  className="block rounded-lg border border-border/60 bg-card p-4 transition hover:border-primary/60"
                >
                  <h3 className="font-semibold">{r.title}</h3>
                  {r.excerpt ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.excerpt}</p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
