# A/B Testing

Lightweight, cookie-free, middleware-free A/B framework for the WeFetePass Next.js app.

## 1. Concept

Variant assignment is **deterministic**: we hash `IP + User-Agent + experiment_id + day-bucket` with SHA-256 and mod by the number of variants. The same visitor stays in the same variant for 24h and rolls into a (possibly) new variant the next day. No cookies are written during render (Next 15 forbids that in server components), and no extra middleware is added.

## 2. Adding an experiment

Edit `lib/ab/variants.ts`:

```ts
export const EXPERIMENTS = {
  my_new_test: {
    id: "my_new_test",
    variants: ["control", "treatment"] as const,
  },
  // ...
} satisfies Record<string, Experiment>;
```

The first variant is the control by convention.

## 3. Using in a page

```tsx
import { Variant } from "@/components/ab/variant";

<Variant experiment="hero_headline" name="control">Your fete ticket, sorted.</Variant>
<Variant experiment="hero_headline" name="benefit_led">Skip the line. Walk in with a QR.</Variant>
<Variant experiment="hero_headline" name="scarcity">Fetes drop weekly. Don't miss the next one.</Variant>
```

`<Variant>` is a server component — only the branch that matches the assignment renders.

## 4. Tracking exposure

Pair each branch with a tiny client component that logs which variant was shown:

```tsx
"use client";
import { useExposure } from "@/lib/ab/track";
export function HeroExposure({ variant }: { variant: string }) {
  useExposure("hero_headline", variant);
  return null;
}
```

Drop `<HeroExposure variant="benefit_led" />` inside the matching `<Variant>` block.

## 5. Reading results in Plausible

Filter by goal `ab_exposure`, then segment by the custom props `experiment` and `variant`. Cross-reference with your conversion goal (e.g. `checkout_complete`) to compute lift.

## 6. Caveats

- Variant assignment rotates **daily** (good for recency, but a visitor may see a different headline tomorrow). To make it sticker, change `dayBucket` in `get-variant.ts` to a weekly or monthly bucket.
- We hash IP + UA. IP is considered personal data under GDPR — it's hashed and never stored, but document this in your privacy notice if you ship to the EU.
- Bots and shared NATs may concentrate in one variant. Filter `ab_exposure` events by a known-good goal before drawing conclusions.

## 7. Statistical significance

Use https://abtestguide.com/calc/ — paste in exposures and conversions per variant. You typically need **500+ exposures per variant** to detect a 5% lift with 95% confidence. Don't peek before then.
