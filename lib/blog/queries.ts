import "server-only";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content_mdx: string;
  cover_image_url: string | null;
  author_id: string | null;
  author_name: string | null;
  tags: string[];
  island: string | null;
  meta_title: string | null;
  meta_description: string | null;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

/** Fetch a single published post by slug. */
export async function getPublishedPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .select("*" as any)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as BlogPost;
}

/** Fetch all published posts (most recent first). */
export async function listPublishedPosts(opts: { limit?: number; island?: string; tag?: string } = {}): Promise<BlogPost[]> {
  const supabase = await createClient();
  let query = supabase
    .from("blog_posts")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .select("*" as any)
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (opts.island) query = query.eq("island", opts.island);
  if (opts.tag) query = query.contains("tags", [opts.tag]);
  if (opts.limit) query = query.limit(opts.limit);
  const { data } = await query;
  return (data as unknown as BlogPost[]) ?? [];
}

/** Admin: list every post regardless of status. */
export async function listAllPosts(): Promise<BlogPost[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .select("*" as any)
    .order("updated_at", { ascending: false });
  return (data as unknown as BlogPost[]) ?? [];
}

/** Admin: get one post by id. */
export async function getPostById(id: string): Promise<BlogPost | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .select("*" as any)
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as BlogPost) ?? null;
}

/** Best-effort increment of view_count. Never throws. */
export async function incrementViewCount(id: string): Promise<void> {
  try {
    const service = await createServiceClient();
    // Read-then-write — fine for non-critical analytics counters.
    const { data } = await service
      .from("blog_posts")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .select("view_count" as any)
      .eq("id", id)
      .maybeSingle();
    const current = ((data as unknown as { view_count?: number } | null)?.view_count ?? 0) + 1;
    await service
      .from("blog_posts")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ view_count: current } as any)
      .eq("id", id);
  } catch {
    // Swallow — counter is best-effort.
  }
}

// ---------------------------------------------------------------------------
// Tiny hand-rolled Markdown -> HTML converter.
// Handles: # ## ### headings, **bold**, *italic*, [text](url), ```fenced```
// code blocks, `inline code`, - / 1. lists, paragraphs, blockquotes, and
// passes through raw HTML EXCEPT <script>...</script> which is stripped.
// Not a full CommonMark implementation — good enough for our blog corpus.
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInline(s: string): string {
  // Inline code first so its contents are escaped & untouched by other rules.
  s = s.replace(/`([^`]+)`/g, (_m, code) => `<code>${escapeHtml(code)}</code>`);
  // Links [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, href) => {
    const safeHref = href.replace(/["<>]/g, "");
    return `<a href="${safeHref}" class="underline text-primary">${text}</a>`;
  });
  // Bold then italic (order matters because ** contains *).
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return s;
}

export function renderMarkdown(md: string): string {
  if (!md) return "";
  // Strip <script>...</script> blocks first — never trust author markup.
  let src = md.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  // Strip inline event handlers like onclick=...
  src = src.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "").replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "");

  const lines = src.split(/\r?\n/);
  const out: string[] = [];
  let i = 0;
  let inUl = false;
  let inOl = false;
  const closeLists = () => {
    if (inUl) {
      out.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      out.push("</ol>");
      inOl = false;
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code blocks
    if (/^```/.test(line)) {
      closeLists();
      const lang = line.replace(/^```/, "").trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      i++; // consume closing ```
      const langAttr = lang ? ` class="language-${escapeHtml(lang)}"` : "";
      out.push(`<pre><code${langAttr}>${escapeHtml(buf.join("\n"))}</code></pre>`);
      continue;
    }

    // Headings
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      closeLists();
      const level = heading[1].length;
      out.push(`<h${level} class="font-display font-bold mt-8 mb-3 text-${level === 1 ? "3xl" : level === 2 ? "2xl" : "xl"}">${renderInline(heading[2])}</h${level}>`);
      i++;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      closeLists();
      const quoted: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoted.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      out.push(`<blockquote class="border-l-4 border-border pl-4 italic my-4">${renderInline(quoted.join(" "))}</blockquote>`);
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(line)) {
      if (!inUl) {
        closeLists();
        out.push('<ul class="list-disc pl-6 my-4 space-y-1">');
        inUl = true;
      }
      out.push(`<li>${renderInline(line.replace(/^[-*]\s+/, ""))}</li>`);
      i++;
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      if (!inOl) {
        closeLists();
        out.push('<ol class="list-decimal pl-6 my-4 space-y-1">');
        inOl = true;
      }
      out.push(`<li>${renderInline(line.replace(/^\d+\.\s+/, ""))}</li>`);
      i++;
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      closeLists();
      i++;
      continue;
    }

    // Raw HTML pass-through (single-line check)
    if (/^\s*<[a-z]/i.test(line)) {
      closeLists();
      out.push(line);
      i++;
      continue;
    }

    // Paragraph: collect until blank
    closeLists();
    const para: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== "" && !/^(#{1,6}\s|[-*]\s|\d+\.\s|>|```)/.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    out.push(`<p class="my-4 leading-relaxed">${renderInline(para.join(" "))}</p>`);
  }
  closeLists();
  return out.join("\n");
}
