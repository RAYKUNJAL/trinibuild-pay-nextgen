import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { llm } from "@/lib/llm/client";
import { BLOG_DRAFT_SYSTEM } from "@/lib/llm/prompts";

const DraftInputSchema = z.object({
  topic: z.string().min(3).max(300),
  keyword: z.string().max(120).optional().default(""),
  length: z.enum(["short", "medium", "long"]).default("medium"),
  island: z.string().max(8).optional().nullable(),
  audience: z.string().max(200).optional().default("Caribbean fete-goers and promoters"),
});

const LENGTH_TARGETS: Record<"short" | "medium" | "long", { words: number; maxTokens: number }> = {
  short: { words: 600, maxTokens: 1600 },
  medium: { words: 1200, maxTokens: 3000 },
  long: { words: 2000, maxTokens: 4000 },
};

function stubMdx(topic: string, keyword: string, island: string | null | undefined): string {
  const k = keyword || topic;
  const flag = island ? `(island: ${island})` : "";
  return `# ${topic}

> Draft scaffold — the LLM brain is not configured (\`ANTHROPIC_API_KEY\` is unset). Write this post by hand, or set the key and click **Draft with AI** again.

Target keyword: **${k}** ${flag}

## Intro

Open with a hook that names the keyword "${k}" in the first sentence. Tell the reader what they'll get from this article.

## The basics

- What is it?
- Who is it for?
- Why does it matter for Caribbean fete-goers?

## Practical guide

1. Step one — be specific.
2. Step two — show a real example.
3. Step three — recommend a tool or playbook.

## FAQs

**How much do tickets cost?** Open with a price range, then explain what drives it.

**When does it sell out?** Use historical data if you have it.

## Conclusion

Wrap with a clear call-to-action: "Browse upcoming fetes" → link to /discover.
`;
}

export async function POST(request: Request) {
  try {
    // Gate: admin only.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: profileRaw } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const profile = profileRaw as { role: string } | null;
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: admin role required" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = DraftInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { topic, keyword, length, island, audience } = parsed.data;
    const target = LENGTH_TARGETS[length];

    const prompt = `Write a blog post about: ${topic}.
Target keyword: ${keyword || topic}.
Audience: ${audience}.
Target length: ~${target.words} words.
${island ? `Geographic focus: island code "${island}".` : ""}

Return Markdown / MDX only. Start with an H1 (#) of the title, then write a magnetic intro paragraph, then well-structured sections with H2/H3 headings. Include a short FAQ section near the bottom and end with a soft CTA to browse upcoming fetes on WeFetePass.`;

    const result = await llm.text({
      prompt,
      system: BLOG_DRAFT_SYSTEM,
      model: "sonnet",
      maxTokens: target.maxTokens,
    });

    if (result === null) {
      // Graceful degradation — return a stub the admin can hand-write into.
      return NextResponse.json({
        text: stubMdx(topic, keyword, island),
        stub: true,
        reason: "LLM brain not configured",
      });
    }

    return NextResponse.json({
      text: result.text,
      stub: false,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      cacheReadTokens: result.cacheReadTokens,
      cacheCreateTokens: result.cacheCreateTokens,
      model: result.model,
    });
  } catch (err) {
    console.error("[POST /api/admin/blog/draft]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
