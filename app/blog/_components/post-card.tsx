import Link from "next/link";
import Image from "next/image";
import { getIslandByCode } from "@/lib/islands";

export interface PostCardPost {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  author_name: string | null;
  published_at: string | null;
  tags: string[];
  island: string | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export function PostCard({ post }: { post: PostCardPost }) {
  const island = post.island ? getIslandByCode(post.island) : null;
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border/60 bg-card transition hover:border-primary/60 hover:shadow-md"
    >
      <div className="relative aspect-[16/9] w-full bg-muted">
        {post.cover_image_url ? (
          <Image
            src={post.cover_image_url}
            alt={post.title}
            fill
            className="object-cover transition group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">
            {island?.flag ?? "📰"}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {island ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
              {island.flag} {island.name}
            </span>
          ) : null}
          {post.tags.slice(0, 2).map((t) => (
            <span key={t} className="rounded-full bg-muted px-2 py-0.5">
              #{t}
            </span>
          ))}
        </div>
        <h3 className="font-display text-lg font-semibold leading-tight group-hover:text-primary">
          {post.title}
        </h3>
        {post.excerpt ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
        ) : null}
        <div className="mt-auto pt-2 text-xs text-muted-foreground">
          {post.author_name ? <span>{post.author_name} · </span> : null}
          <time dateTime={post.published_at ?? undefined}>{formatDate(post.published_at)}</time>
        </div>
      </div>
    </Link>
  );
}
