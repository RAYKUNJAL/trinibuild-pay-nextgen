export type Experiment = {
  id: string;
  variants: readonly string[]; // first is control by convention
  weight?: number[]; // optional, defaults to uniform
};

export const EXPERIMENTS = {
  hero_headline: {
    id: "hero_headline",
    variants: ["control", "benefit_led", "scarcity"] as const,
  },
  primary_cta_copy: {
    id: "primary_cta_copy",
    variants: ["find_your_next_fete", "see_this_weekend", "browse_fetes"] as const,
  },
  featured_strip_count: {
    id: "featured_strip_count",
    variants: ["6", "3"] as const,
  },
} satisfies Record<string, Experiment>;

export type ExperimentKey = keyof typeof EXPERIMENTS;
export type VariantOf<K extends ExperimentKey> = (typeof EXPERIMENTS)[K]["variants"][number];
