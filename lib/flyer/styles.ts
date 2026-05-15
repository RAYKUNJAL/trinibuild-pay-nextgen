/**
 * Flyer style presets for the WeFetePass AI flyer generator.
 *
 * Each preset contributes a `promptSuffix` to the image-generation prompt.
 * The suffix is appended after the event title + tagline so the image model
 * picks up the desired aesthetic without the user having to hand-craft a
 * full art-direction prompt.
 *
 * Keep this list curated — 6 strong styles beat 20 mediocre ones. New styles
 * should reflect actual Caribbean fete archetypes.
 */

export const FLYER_STYLES = [
  {
    id: "luxury",
    label: "Luxury Mas",
    emoji: "👑",
    description: "Premium feathers, gold, masquerade elegance.",
    promptSuffix:
      "premium gold and black, masquerade mask, deluxe carnival aesthetic, feathers, glitter, sophisticated lighting",
  },
  {
    id: "soca_energy",
    label: "Soca Energy",
    emoji: "🔥",
    description: "Loud, colourful, dancers in motion.",
    promptSuffix:
      "vibrant tropical colors, dancers in motion, neon palette, high-energy carnival, sound system glow",
  },
  {
    id: "cooler_fete",
    label: "Cooler Fete",
    emoji: "🥥",
    description: "Beach, palms, daytime party.",
    promptSuffix:
      "beach sunset, palm trees, casual day-party vibe, ice and coolers, warm golden hour lighting",
  },
  {
    id: "j_ouvert",
    label: "J'Ouvert",
    emoji: "🎨",
    description: "Paint, powder, predawn carnival.",
    promptSuffix:
      "paint and powder, predawn carnival, dark moody palette, mud and chocolate, atmospheric haze",
  },
  {
    id: "all_inclusive",
    label: "All-Inclusive",
    emoji: "🥂",
    description: "Champagne, gold, upscale party.",
    promptSuffix:
      "champagne flutes, gold details, sophisticated party, well-dressed crowd, elegant venue, soft bokeh",
  },
  {
    id: "road_march",
    label: "Road March",
    emoji: "🚛",
    description: "Sound truck, big crowd, motion.",
    promptSuffix:
      "sound truck, crowd of revellers, dynamic motion blur, flags waving, street parade energy",
  },
] as const;

export type FlyerStyleId = (typeof FLYER_STYLES)[number]["id"];

export function getFlyerStyle(id: string) {
  return FLYER_STYLES.find((s) => s.id === id);
}

export const ASPECT_RATIOS = [
  { id: "1:1", label: "Square (IG post)" },
  { id: "9:16", label: "Story (IG/WhatsApp)" },
  { id: "4:5", label: "Portrait (IG)" },
] as const;

export type AspectRatioId = (typeof ASPECT_RATIOS)[number]["id"];

export function isAspectRatio(value: string): value is AspectRatioId {
  return ASPECT_RATIOS.some((a) => a.id === value);
}
