import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const PostUpdateSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  title: z.string().min(1).max(300).optional(),
  excerpt: z.string().max(500).optional().nullable(),
  content_mdx: z.string().min(1).optional(),
  cover_image_url: z.string().url().optional().nullable(),
  author_name: z.string().max(120).optional().nullable(),
  tags: z.array(z.string()).optional(),
  island: z.string().max(8).optional().nullable(),
  meta_title: z.string().max(300).optional().nullable(),
  meta_description: z.string().max(500).optional().nullable(),
  status: z.enum(["draft", "published", "archived"]).optional(),
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

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, ctx: RouteCtx) {
  try {
    const gate = await assertAdmin();
    if ("error" in gate) return gate.error;

    const { id } = await ctx.params;
    const body = await request.json();
    const parsed = PostUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const update: Record<string, unknown> = { ...parsed.data };

    // Auto-set published_at when transitioning to 'published' without an
    // explicit timestamp.
    if (update.status === "published" && !update.published_at) {
      update.published_at = new Date().toISOString();
    }
    if (update.status === "draft" || update.status === "archived") {
      // Leave the original published_at intact unless explicitly cleared.
    }

    const service = await createServiceClient();
    const { data: row, error } = await service
      .from("blog_posts")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(update as any)
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ post: row });
  } catch (err) {
    console.error("[PUT /api/admin/blog/[id]]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, ctx: RouteCtx) {
  try {
    const gate = await assertAdmin();
    if ("error" in gate) return gate.error;
    const { id } = await ctx.params;
    const service = await createServiceClient();
    const { error } = await service.from("blog_posts").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/blog/[id]]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
