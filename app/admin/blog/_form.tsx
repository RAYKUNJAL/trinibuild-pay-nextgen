"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Sparkles, Loader2, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ISLANDS } from "@/lib/islands";
import { slugify } from "@/lib/utils";

const FormSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, hyphens only"),
  excerpt: z.string().max(500).optional().or(z.literal("")),
  cover_image_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  author_name: z.string().max(120).optional().or(z.literal("")),
  tags: z.string().optional().or(z.literal("")),
  island: z.string().optional().or(z.literal("")),
  meta_title: z.string().max(300).optional().or(z.literal("")),
  meta_description: z.string().max(500).optional().or(z.literal("")),
  status: z.enum(["draft", "published", "archived"]),
  content_mdx: z.string().min(1, "Body cannot be empty"),
});

type FormValues = z.infer<typeof FormSchema>;

export interface BlogPostFormProps {
  mode: "create" | "edit";
  postId?: string;
  defaultAuthorName?: string;
  initial?: Partial<FormValues>;
  /** Whether ANTHROPIC_API_KEY is configured on the server. */
  llmConfigured?: boolean;
}

export function BlogPostForm({
  mode,
  postId,
  defaultAuthorName = "",
  initial,
  llmConfigured = false,
}: BlogPostFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftOpen, setDraftOpen] = useState(false);
  const [draftTopic, setDraftTopic] = useState("");
  const [draftKeyword, setDraftKeyword] = useState("");
  const [draftLength, setDraftLength] = useState<"short" | "medium" | "long">("medium");

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: initial?.title ?? "",
      slug: initial?.slug ?? "",
      excerpt: initial?.excerpt ?? "",
      cover_image_url: initial?.cover_image_url ?? "",
      author_name: initial?.author_name ?? defaultAuthorName,
      tags: initial?.tags ?? "",
      island: initial?.island ?? "",
      meta_title: initial?.meta_title ?? "",
      meta_description: initial?.meta_description ?? "",
      status: (initial?.status as FormValues["status"]) ?? "draft",
      content_mdx: initial?.content_mdx ?? "",
    },
  });

  const watchedTitle = form.watch("title");
  const watchedSlug = form.watch("slug");

  // Auto-derive slug from title until the user edits it manually.
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  if (!slugTouched && watchedTitle) {
    const derived = slugify(watchedTitle);
    if (derived && derived !== watchedSlug) {
      form.setValue("slug", derived, { shouldValidate: false });
    }
  }

  async function onSubmit(values: FormValues) {
    const payload = {
      title: values.title,
      slug: values.slug,
      excerpt: values.excerpt || null,
      cover_image_url: values.cover_image_url || null,
      author_name: values.author_name || null,
      tags: values.tags
        ? values.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
      island: values.island || null,
      meta_title: values.meta_title || null,
      meta_description: values.meta_description || null,
      status: values.status,
      content_mdx: values.content_mdx,
    };

    startTransition(async () => {
      const url = mode === "create" ? "/api/admin/blog" : `/api/admin/blog/${postId}`;
      const method = mode === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error ?? "Failed to save post");
        return;
      }
      toast.success(mode === "create" ? "Post created" : "Post updated");
      router.push("/admin/blog");
      router.refresh();
    });
  }

  async function handleDraft() {
    if (!draftTopic.trim()) {
      toast.error("Enter a topic for the AI draft");
      return;
    }
    setIsDrafting(true);
    try {
      const res = await fetch("/api/admin/blog/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: draftTopic,
          keyword: draftKeyword,
          length: draftLength,
          island: form.getValues("island") || null,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        toast.error(j.error ?? "AI draft failed");
        return;
      }
      form.setValue("content_mdx", j.text, { shouldValidate: true });
      // Try to derive a title from the first H1.
      const h1 = /^#\s+(.+)$/m.exec(j.text);
      if (h1 && !form.getValues("title")) {
        form.setValue("title", h1[1].trim());
      }
      if (j.stub) {
        toast.warning("LLM not configured — inserted a hand-writable stub.");
      } else {
        toast.success(`Draft inserted (${j.outputTokens ?? 0} tokens)`);
      }
      setDraftOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI draft failed");
    } finally {
      setIsDrafting(false);
    }
  }

  async function handleDelete() {
    if (mode !== "edit" || !postId) return;
    if (!confirm("Delete this post? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/blog/${postId}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast.error(j.error ?? "Failed to delete");
      return;
    }
    toast.success("Post deleted");
    router.push("/admin/blog");
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...form.register("title")} />
          {form.formState.errors.title ? (
            <p className="mt-1 text-xs text-destructive">{form.formState.errors.title.message}</p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" {...form.register("slug")} onChange={(e) => {
            setSlugTouched(true);
            form.setValue("slug", e.target.value);
          }} />
          {form.formState.errors.slug ? (
            <p className="mt-1 text-xs text-destructive">{form.formState.errors.slug.message}</p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            {...form.register("status")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea id="excerpt" rows={2} {...form.register("excerpt")} />
        </div>

        <div>
          <Label htmlFor="cover_image_url">Cover image URL</Label>
          <Input id="cover_image_url" {...form.register("cover_image_url")} />
        </div>

        <div>
          <Label htmlFor="author_name">Author name</Label>
          <Input id="author_name" {...form.register("author_name")} />
        </div>

        <div>
          <Label htmlFor="tags">Tags (comma separated)</Label>
          <Input id="tags" placeholder="carnival,trinidad,soca" {...form.register("tags")} />
        </div>

        <div>
          <Label htmlFor="island">Island</Label>
          <select
            id="island"
            {...form.register("island")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">— None —</option>
            {ISLANDS.map((i) => (
              <option key={i.code} value={i.code}>
                {i.flag} {i.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="meta_title">SEO meta title</Label>
          <Input id="meta_title" {...form.register("meta_title")} />
        </div>

        <div>
          <Label htmlFor="meta_description">SEO meta description</Label>
          <Input id="meta_description" {...form.register("meta_description")} />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label htmlFor="content_mdx">Body (Markdown / MDX)</Label>
          {!llmConfigured ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border/70 px-2.5 py-1 text-xs text-muted-foreground"
              title="The Draft with AI feature is disabled because ANTHROPIC_API_KEY is not set on the server."
            >
              <Info className="h-3.5 w-3.5" aria-hidden />
              Set ANTHROPIC_API_KEY to enable AI drafts
            </span>
          ) : (
          <Dialog open={draftOpen} onOpenChange={setDraftOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <Sparkles className="mr-2 h-4 w-4" /> Draft with AI
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Draft a post with AI</DialogTitle>
                <DialogDescription>
                  Claude will write a first draft. You'll always edit & approve before publishing.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="draftTopic">Topic</Label>
                  <Input
                    id="draftTopic"
                    placeholder="e.g. The complete guide to Trinidad Carnival 2027"
                    value={draftTopic}
                    onChange={(e) => setDraftTopic(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="draftKeyword">Target keyword</Label>
                  <Input
                    id="draftKeyword"
                    placeholder="trinidad carnival 2027 tickets"
                    value={draftKeyword}
                    onChange={(e) => setDraftKeyword(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="draftLength">Length</Label>
                  <select
                    id="draftLength"
                    value={draftLength}
                    onChange={(e) => setDraftLength(e.target.value as "short" | "medium" | "long")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="short">Short (~600 words)</option>
                    <option value="medium">Medium (~1200 words)</option>
                    <option value="long">Long (~2000 words)</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setDraftOpen(false)} disabled={isDrafting}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleDraft} disabled={isDrafting}>
                  {isDrafting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Drafting…
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" /> Draft
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          )}
        </div>
        <Textarea
          id="content_mdx"
          rows={24}
          className="font-mono text-sm"
          {...form.register("content_mdx")}
        />
        {form.formState.errors.content_mdx ? (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.content_mdx.message}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-3 border-t border-border/60 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
            </>
          ) : mode === "create" ? (
            "Create post"
          ) : (
            "Save changes"
          )}
        </Button>
        {mode === "edit" ? (
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
            Delete
          </Button>
        ) : null}
      </div>
    </form>
  );
}
