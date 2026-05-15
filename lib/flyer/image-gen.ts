// REPLICATE_API_TOKEN required for image generation.
// Without it, copy is still generated but no image is produced.
// Get one at https://replicate.com/account/api-tokens

import "server-only";
import type { AspectRatioId } from "./styles";

/**
 * Generate a flyer image via Replicate's flux-schnell model.
 *
 * flux-schnell is fast (~2-4s) and cheap (~$0.003/image at the time of
 * writing), making it appropriate for promoter-initiated generation where
 * latency matters more than max quality.
 *
 * Returns `{ imageUrl: null }` when:
 *  - `REPLICATE_API_TOKEN` is not configured (degrades to copy-only mode)
 *  - The API call fails for any reason
 *
 * We use `Prefer: wait` so a single POST returns the finished prediction
 * inline (up to 60 seconds). For flux-schnell that's well within budget.
 */
export async function generateFlyerImage(
  prompt: string,
  aspectRatio: AspectRatioId,
): Promise<{ imageUrl: string | null; cached: boolean }> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return { imageUrl: null, cached: false };

  try {
    const res = await fetch(
      "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "wait",
        },
        body: JSON.stringify({
          input: {
            prompt,
            aspect_ratio: aspectRatio,
            num_outputs: 1,
            output_format: "webp",
            output_quality: 90,
          },
        }),
      },
    );

    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.error("[flyer/image-gen] Replicate HTTP", res.status, await res.text().catch(() => ""));
      return { imageUrl: null, cached: false };
    }

    const data = (await res.json()) as {
      status?: string;
      output?: string | string[] | null;
      error?: string | null;
    };

    if (data.error) {
      // eslint-disable-next-line no-console
      console.error("[flyer/image-gen] Replicate error:", data.error);
      return { imageUrl: null, cached: false };
    }

    const output = data.output;
    const imageUrl = Array.isArray(output) ? output[0] ?? null : output ?? null;

    return { imageUrl, cached: false };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[flyer/image-gen] generateFlyerImage failed:", err);
    return { imageUrl: null, cached: false };
  }
}
