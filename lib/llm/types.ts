/**
 * Shared types for the WeFetePass LLM brain.
 *
 * All public surfaces in `lib/llm/client.ts` reference these types so that
 * other agents (flyer maker, admin dashboard, blog system) can import a
 * stable contract from `@/lib/llm/types` if they prefer not to pull in the
 * full client.
 */

export type LLMModel = "haiku" | "sonnet" | "opus";

/**
 * Concrete Anthropic model IDs. Kept here (instead of inline in the client)
 * so that callers can also reference them directly when needed (e.g. tests
 * or admin tooling that wants to display the active model).
 */
export const MODEL_IDS = {
  haiku: "claude-haiku-4-5-20251001", // fast/cheap — copy variants, classification, summaries
  sonnet: "claude-sonnet-4-6",        // reasoning — debrief, blog drafts, support replies
  opus: "claude-opus-4-7",            // escape hatch — only when explicitly needed
} as const;

export interface LLMTextInput {
  /** The user-turn prompt. */
  prompt: string;
  /** Optional system prompt. Will be cached when `cache` resolves to true. */
  system?: string;
  /** Which model tier to use. Defaults to "haiku". */
  model?: LLMModel;
  /** Max output tokens. Defaults to 1024. */
  maxTokens?: number;
  /** Sampling temperature. Defaults to 0.7. */
  temperature?: number;
  /**
   * Enable prompt caching on the system prompt.
   * When omitted, defaults to true if the system prompt is >= 1024 chars.
   */
  cache?: boolean;
}

export interface LLMTextResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreateTokens: number;
  model: string;
}
