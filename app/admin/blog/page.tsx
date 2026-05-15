import Link from "next/link";
import { requireAdmin } from "@/app/admin/_lib/auth";
import { listAllPosts } from "@/lib/blog/queries";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
}

export default async function AdminBlogPage() {
  await requireAdmin();
  const posts = await listAllPosts();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <header className="flex flex-col gap-3 border-b border-border/60 pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Blog</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {posts.length} post{posts.length === 1 ? "" : "s"} · manage drafts, publish, archive.
          </p>
        </div>
        <Link href="/admin/blog/new">
          <Button>New post</Button>
        </Link>
      </header>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Island</th>
              <th className="px-4 py-2">Views</th>
              <th className="px-4 py-2">Published</th>
              <th className="px-4 py-2">Updated</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  No posts yet. <Link href="/admin/blog/new" className="text-primary underline">Create the first one</Link>.
                </td>
              </tr>
            ) : (
              posts.map((p) => (
                <tr key={p.id} className="border-t border-border/60">
                  <td className="px-4 py-2">
                    <div className="font-medium">{p.title}</div>
                    <div className="text-xs text-muted-foreground">/{p.slug}</div>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-xs " +
                        (p.status === "published"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : p.status === "archived"
                            ? "bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200")
                      }
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">{p.island ?? "—"}</td>
                  <td className="px-4 py-2">{p.view_count}</td>
                  <td className="px-4 py-2">{formatDate(p.published_at)}</td>
                  <td className="px-4 py-2">{formatDate(p.updated_at)}</td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/admin/blog/${p.id}/edit`}
                      className="text-primary underline"
                    >
                      Edit
                    </Link>
                    {p.status === "published" ? (
                      <>
                        <span className="mx-2 text-muted-foreground">·</span>
                        <Link href={`/blog/${p.slug}`} target="_blank" className="text-primary underline">
                          View
                        </Link>
                      </>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
