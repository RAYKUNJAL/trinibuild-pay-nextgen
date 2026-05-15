/**
 * Anthropic SDK wrapper for WeFetePass.
 *
 * This is the single import point for every feature in the app that wants to
 * use Claude (flyer copy, blog drafts, debrief enrichment, readiness
 * suggestions, support replies, etc).
 *
 * Design rules:
 *  - Graceful degradation: if `ANTHROPIC_API_KEY` is unset, `text()` returns
 *    `null` and `isConfigured()` returns `false`. Callers MUST handle null and
 *    fall back to their deterministic path. We never throw on a missing key.
 *  - Prompt caching is mandatory: long system prompts are sent with
 *    `cache_control: { type: "ephemeral" }` so the first call writes the
 *    cache and subsequent calls within the 5-minute TTL read from it.
 *  - Token accounting: every result includes input/output/cache-read/
 *    cache-create token counts so callers can attribute spend.
 */

import Anthropic from "@anthropic-ai/sdk";
import { MODEL_IDS, type LLMTextInput, type LLMTextResult } from "./types";

export type { LLMModel, LLMTextInput, LLMTextResult } from "./types";
export { MODEL_IDS } from "./types";

const apiKey = process.env.ANTHROPIC_API_KEY;

// Only construct a client when the key is actually present. This keeps the
// module import-safe in environments (preview branches, local dev without
// AI features) where no key is configured.
const client: Anthropic | null = apiKey ? new Anthropic({ apiKey }) : null;

let warnedMissingKey = false;
function warnOnceMissingKey() {
  if (warnedMissingKey) return;
  warnedMissingKey = true;
  // eslint-disable-next-line no-console
  console.warn(
    "[wefetepass/llm] ANTHROPIC_API_KEY is not set — LLM features will degrade to deterministic fallbacks.",
  );
}

/** Default cache threshold — long-ish system prompts auto-enable caching. */
const CACHE_AUTO_THRESHOLD_CHARS = 1024;

/**
 * Extract the concatenated text from an Anthropic Messages response.
 * The SDK returns a `content` array of blocks; we only care about text blocks.
 */
function extractText(content: Anthropic.Messages.ContentBlock[]): string {
  const parts: string[] = [];
  for (const block of content) {
    if (block.type === "text") {
      parts.push(block.text);
    }
  }
  return parts.join("");
}

export const llm = {
  /**
   * Plain text completion.
   *
   * Returns `null` when the LLM brain is not configured (missing API key).
   * Callers must handle the null path and fall back to deterministic logic.
   */
  async text(input: LLMTextInput): Promise<LLMTextResult | null> {
    if (!client) {
      warnOnceMissingKey();
      return null;
    }

    const modelKey = input.model ?? "haiku";
    const modelId = MODEL_IDS[modelKey];
    const maxTokens = input.maxTokens ?? 1024;
    const temperature = input.temperature ?? 0.7;

    // Caching defaults: explicit flag wins; otherwise auto-enable for any
    // system prompt above the threshold.
    const shouldCache =
      input.cache ??
      (input.system !== undefined && input.system.length >= CACHE_AUTO_THRESHOLD_CHARS);

    // The Anthropic SDK accepts either a plain string `system` or an array of
    // text blocks with `cache_control`. We use the array form whenever we
    // want caching turned on.
    const systemParam: Anthropic.Messages.MessageCreateParams["system"] =
      input.system === undefined
        ? undefined
        : shouldCache
          ? [
              {
                type: "text",
                text: input.system,
                cache_control: { type: "ephemeral" },
              },
            ]
          : input.system;

    try {
      const response = await client.messages.create({
        model: modelId,
        max_tokens: maxTokens,
        temperature,
        system: systemParam,
        messages: [{ role: "user", content: input.prompt }],
      });

      const text = extractText(response.content);
      const usage = response.usage;

      return {
        text,
        inputTokens: usage.input_tokens ?? 0,
        outputTokens: usage.output_tokens ?? 0,
        cacheReadTokens:
          (usage as { cache_read_input_tokens?: number }).cache_read_input_tokens ?? 0,
        cacheCreateTokens:
          (usage as { cache_creation_input_tokens?: number })
            .cache_creation_input_tokens ?? 0,
        model: response.model,
      };
    } catch (err) {
      // Never throw on transient LLM failure — surface as `null` so callers
      // fall back to their deterministic path.
      // eslint-disable-next-line no-console
      console.error("[wefetepass/llm] text() failed:", err);
      return null;
    }
  },

  /** Whether the LLM brain is configured & usable. */
  isConfigured(): boolean {
    return client !== null;
  },
};
