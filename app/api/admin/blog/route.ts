import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const PostInputSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "slug must be lowercase letters, numbers, hyphens"),
  title: z.string().min(1).max(300),
  excerpt: z.string().max(500).optional().nullable(),
  content_mdx: z.string().min(1),
  cover_image_url: z.string().url().optional().nullable(),
  author_name: z.string().max(120).optional().nullable(),
  tags: z.array(z.string()).default([]),
  island: z.string().max(8).optional().nullable(),
  meta_title: z.string().max(300).optional().nullable(),
  meta_description: z.string().max(500).optional().nullable(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  published_at: z.string().datetime().optional().nullable(),
});

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { data: profileRaw } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const profile = profileRaw as { role: string } | null;
  if (!profile || profile.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden: admin role required" }, { status: 403 }) };
  }
  return { user };
}

export async function POST(request: Request) {
  try {
    const gate = await assertAdmin();
    if ("error" in gate) return gate.error;

    const body = await request.json();
    const parsed = PostInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const data = parsed.data;
    const publishedAt =
      data.status === "published" ? (data.published_at ?? new Date().toISOString()) : null;

    const service = await createServiceClient();
    const insert = {
      slug: data.slug,
      title: data.title,
      excerpt: data.excerpt ?? null,
      content_mdx: data.content_mdx,
      cover_image_url: data.cover_image_url ?? null,
      author_id: gate.user.id,
      author_name: data.author_name ?? null,
      tags: data.tags ?? [],
      island: data.island ?? null,
      meta_title: data.meta_title ?? null,
      meta_description: data.meta_description ?? null,
      status: data.status,
      published_at: publishedAt,
    };

    const { data: row, error } = await service
      .from("blog_posts")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(insert as any)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ post: row }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/blog]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
