import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/admin/_lib/auth";
import { getPostById } from "@/lib/blog/queries";
import { BlogPostForm } from "../../_form";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBlogPostPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6">
      <header className="border-b border-border/60 pb-4">
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          Edit: {post.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          /{post.slug} · {post.status} · {post.view_count} view{post.view_count === 1 ? "" : "s"}
        </p>
      </header>
      <BlogPostForm
        mode="edit"
        postId={post.id}
        initial={{
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? "",
          cover_image_url: post.cover_image_url ?? "",
          author_name: post.author_name ?? "",
          tags: post.tags.join(", "),
          island: post.island ?? "",
          meta_title: post.meta_title ?? "",
          meta_description: post.meta_description ?? "",
          status: post.status,
          content_mdx: post.content_mdx,
        }}
      />
    </main>
  );
}
