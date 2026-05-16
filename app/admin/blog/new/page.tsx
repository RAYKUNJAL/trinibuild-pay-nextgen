import { requireAdmin } from "@/app/admin/_lib/auth";
import { BlogPostForm } from "../_form";

export const dynamic = "force-dynamic";

export default async function NewBlogPostPage() {
  const { profile } = await requireAdmin();
  // Gate "Draft with AI" on the server-side key — otherwise /api/admin/blog/draft
  // returns a hardcoded stub and shipping the button would be a UX lie.
  const llmConfigured = Boolean(process.env.ANTHROPIC_API_KEY);
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6">
      <header className="border-b border-border/60 pb-4">
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          New blog post
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Draft a post, ask the AI to start it, then publish when you're happy.
        </p>
      </header>
      <BlogPostForm
        mode="create"
        defaultAuthorName={profile.full_name ?? ""}
        llmConfigured={llmConfigured}
      />
    </main>
  );
}
