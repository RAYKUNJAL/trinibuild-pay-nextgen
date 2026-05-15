import Link from "next/link";
import Image from "next/image";
import { cn, formatTTD, formatDateTime } from "@/lib/utils";
import { PixelScript } from "@/components/pixel-script";

// ─── Local Types ─────────────────────────────────────────────────────────────

export type WebsiteTemplate =
  | "midnight_mas"
  | "carnival_vibes"
  | "beach_party"
  | "club_night"
  | "road_march";
export type WebsiteStatus = "draft" | "published" | "unpublished";

export interface EventWebsite {
  id: string;
  event_id: string;
  organizer_id: string;
  template: WebsiteTemplate;
  custom_slug: string | null;
  headline: string | null;
  subheadline: string | null;
  description_html: string | null;
  gallery_image_urls: string[];
  video_url: string | null;
  dress_code: string | null;
  lineup: string[];
  sponsors: Array<{ name: string; logo_url: string; url: string }>;
  faq: Array<{ question: string; answer: string }>;
  venue_map_url: string | null;
  venue_directions: string | null;
  contact_whatsapp: string | null;
  contact_email: string | null;
  meta_pixel_id: string | null;
  google_analytics_id: string | null;
  custom_css: string | null;
  status: WebsiteStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  venue: string;
  city: string;
  starts_at: string;
  ends_at: string | null;
  cover_image_url: string | null;
  gate_open_at: string | null;
  status: string;
  organizer_id: string;
  capacity: number | null;
}

export interface TicketTier {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  quantity: number;
  quantity_sold: number;
}

export interface PromoterProfile {
  id: string;
  brand_name: string | null;
  logo_url: string | null;
  verified: boolean;
  avg_trust_score: number;
}

export interface EventWebsitePreviewProps {
  website: EventWebsite;
  event: Event;
  tiers: TicketTier[];
  promoter: PromoterProfile | null;
  isPreview?: boolean;
}

// ─── Template theme map ───────────────────────────────────────────────────────

const THEMES: Record<
  WebsiteTemplate,
  {
    bg: string;
    heroBg: string;
    accentColor: string;
    accentText: string;
    ctaBg: string;
    ctaText: string;
    chipBg: string;
    chipText: string;
  }
> = {
  midnight_mas: {
    bg: "bg-[#030303]",
    heroBg: "from-[#1a0e00] via-[#0a0a0a] to-[#030303]",
    accentColor: "#d8ab5b",
    accentText: "text-[#d8ab5b]",
    ctaBg: "bg-gradient-to-r from-[#b9853f] via-[#e6bf78] to-[#a36e31]",
    ctaText: "text-black",
    chipBg: "bg-[#1a130b] border border-[#d8ab5b]/30",
    chipText: "text-[#d8ab5b]",
  },
  carnival_vibes: {
    bg: "bg-[#0d0000]",
    heroBg: "from-[#2d0000] via-[#1a0000] to-[#0d0000]",
    accentColor: "#e84141",
    accentText: "text-[#e84141]",
    ctaBg: "bg-gradient-to-r from-[#c01414] via-[#e84141] to-[#c01414]",
    ctaText: "text-white",
    chipBg: "bg-[#1f0505] border border-[#e84141]/30",
    chipText: "text-[#e84141]",
  },
  beach_party: {
    bg: "bg-[#011a1a]",
    heroBg: "from-[#012d2d] via-[#011a1a] to-[#020f12]",
    accentColor: "#2eccc7",
    accentText: "text-[#2eccc7]",
    ctaBg: "bg-gradient-to-r from-[#1a9e9a] via-[#2eccc7] to-[#1a9e9a]",
    ctaText: "text-black",
    chipBg: "bg-[#021a1a] border border-[#2eccc7]/30",
    chipText: "text-[#2eccc7]",
  },
  club_night: {
    bg: "bg-[#06000f]",
    heroBg: "from-[#12002a] via-[#0c0018] to-[#06000f]",
    accentColor: "#c56aff",
    accentText: "text-[#c56aff]",
    ctaBg: "bg-gradient-to-r from-[#8b20d0] via-[#c56aff] to-[#8b20d0]",
    ctaText: "text-white",
    chipBg: "bg-[#100018] border border-[#c56aff]/30",
    chipText: "text-[#c56aff]",
  },
  road_march: {
    bg: "bg-[#050505]",
    heroBg: "from-[#1a0000] via-[#0d0000] to-[#050505]",
    accentColor: "#ff3b3b",
    accentText: "text-[#ff3b3b]",
    ctaBg: "bg-gradient-to-r from-[#b00000] via-[#ff3b3b] to-[#b00000]",
    ctaText: "text-white",
    chipBg: "bg-[#120000] border border-[#ff3b3b]/30",
    chipText: "text-[#ff3b3b]",
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionDivider({ accentColor }: { accentColor: string }) {
  return (
    <div className="flex items-center gap-4 my-12">
      <span className="h-px flex-1 opacity-20" style={{ backgroundColor: accentColor }} />
      <span
        className="h-2 w-2 rotate-45 border opacity-50"
        style={{ borderColor: accentColor }}
        aria-hidden
      />
      <span className="h-px flex-1 opacity-20" style={{ backgroundColor: accentColor }} />
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border-b border-white/10 last:border-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-medium text-white/90 hover:text-white">
        {question}
        <span
          className="shrink-0 text-white/40 transition-transform group-open:rotate-45"
          aria-hidden
        >
          +
        </span>
      </summary>
      <p className="pb-4 text-sm leading-relaxed text-white/60">{answer}</p>
    </details>
  );
}

// ─── Main preview component ───────────────────────────────────────────────────

export function EventWebsitePreview({
  website,
  event,
  tiers,
  promoter,
  isPreview = false,
}: EventWebsitePreviewProps) {
  const theme = THEMES[website.template];
  const effectiveSlug = website.custom_slug ?? event.slug;

  const headline = website.headline ?? event.title;
  const subheadline = website.subheadline ?? event.tagline ?? "";
  const description = website.description_html ?? event.description ?? "";
  const gallery = (website.gallery_image_urls ?? []).slice(0, 6);
  const lineup = website.lineup ?? [];
  const sponsors = website.sponsors ?? [];
  const faq = website.faq ?? [];
  const isSoldOut = event.status === "soldout";

  const checkoutHref = isSoldOut ? `/events/${effectiveSlug}` : `/events/${effectiveSlug}#tickets`;

  return (
    <div className={cn("min-h-screen font-sans antialiased", theme.bg, "text-white")}>
      {/* Pixel tracking */}
      <PixelScript
        metaPixelId={website.meta_pixel_id ?? undefined}
        googleAnalyticsId={website.google_analytics_id ?? undefined}
      />

      {/* Custom CSS injection */}
      {website.custom_css ? (
        // eslint-disable-next-line react/no-danger
        <style dangerouslySetInnerHTML={{ __html: website.custom_css }} />
      ) : null}

      {/* Preview banner */}
      {isPreview ? (
        <div className="fixed inset-x-0 top-0 z-[9999] flex h-10 items-center justify-center gap-3 bg-amber-500 text-xs font-semibold uppercase tracking-widest text-black shadow-lg">
          <span className="h-1.5 w-1.5 rounded-full bg-black/40" aria-hidden />
          PREVIEW MODE — not published yet
          <span className="h-1.5 w-1.5 rounded-full bg-black/40" aria-hidden />
        </div>
      ) : null}

      {/* ── 1. HERO ─────────────────────────────────────────────────────────── */}
      <section
        className={cn(
          "relative flex min-h-[92vh] flex-col items-center justify-end pb-16 pt-20",
          isPreview ? "min-h-[80vh] pt-20" : "",
        )}
      >
        {/* Background */}
        {event.cover_image_url ? (
          <Image
            src={event.cover_image_url}
            alt={headline}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : null}
        {/* Gradient overlay always rendered */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-b",
            event.cover_image_url
              ? "from-black/30 via-black/50 to-black/90"
              : cn("from-transparent via-transparent to-[#030303]", theme.heroBg),
          )}
          aria-hidden
        />
        {/* If no cover, show template gradient */}
        {!event.cover_image_url ? (
          <div
            className={cn("absolute inset-0 bg-gradient-to-br opacity-70", theme.heroBg)}
            aria-hidden
          />
        ) : null}

        <div className="relative z-10 mx-auto w-full max-w-3xl px-6 text-center">
          <p
            className={cn("mb-3 text-[11px] font-semibold uppercase tracking-[0.4em]", theme.accentText)}
          >
            {formatDateTime(event.starts_at)}
          </p>
          <h1
            className="font-display text-4xl font-bold tracking-tight text-white sm:text-6xl"
            style={{ textShadow: "0 2px 20px rgba(0,0,0,0.6)" }}
          >
            {headline}
          </h1>
          {subheadline ? (
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/75">{subheadline}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm text-white/60">
            <span>{event.venue}</span>
            {event.city ? (
              <>
                <span aria-hidden>·</span>
                <span>{event.city}</span>
              </>
            ) : null}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href={checkoutHref}
              className={cn(
                "inline-flex h-14 min-w-[200px] items-center justify-center rounded-lg px-8 text-[13px] font-semibold uppercase tracking-[0.3em] shadow-xl transition-opacity hover:opacity-90",
                theme.ctaBg,
                theme.ctaText,
              )}
            >
              {isSoldOut ? "Join Waitlist" : "Get Tickets"}
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. ABOUT ────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <SectionDivider accentColor={theme.accentColor} />

        <h2
          className={cn("mb-6 text-[11px] font-semibold uppercase tracking-[0.4em]", theme.accentText)}
        >
          About the event
        </h2>

        {description ? (
          <div
            className="prose prose-invert max-w-none text-base leading-relaxed text-white/80"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: description.replace(/\n/g, "<br/>") }}
          />
        ) : null}

        {website.dress_code ? (
          <div className="mt-6 flex flex-wrap gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider",
                theme.chipBg,
                theme.chipText,
              )}
            >
              Dress Code: {website.dress_code}
            </span>
          </div>
        ) : null}

        {event.gate_open_at ? (
          <p className="mt-4 text-sm text-white/50">
            Gates open: {formatDateTime(event.gate_open_at)}
          </p>
        ) : null}
      </section>

      {/* ── 3. LINEUP ───────────────────────────────────────────────────────── */}
      {lineup.length > 0 ? (
        <section className="mx-auto max-w-3xl px-6 pb-16">
          <SectionDivider accentColor={theme.accentColor} />
          <h2
            className={cn(
              "mb-6 text-[11px] font-semibold uppercase tracking-[0.4em]",
              theme.accentText,
            )}
          >
            Lineup
          </h2>
          <div className="flex flex-wrap gap-3">
            {lineup.map((artist) => (
              <span
                key={artist}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium",
                  theme.chipBg,
                  theme.chipText,
                )}
              >
                {artist}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── 4. GALLERY ──────────────────────────────────────────────────────── */}
      {gallery.length > 0 ? (
        <section className="mx-auto max-w-5xl px-6 pb-16">
          <SectionDivider accentColor={theme.accentColor} />
          <h2
            className={cn(
              "mb-6 text-[11px] font-semibold uppercase tracking-[0.4em]",
              theme.accentText,
            )}
          >
            Gallery
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {gallery.map((url, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-xl bg-white/5">
                <Image
                  src={url}
                  alt={`Gallery image ${i + 1}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── 5. VIDEO ────────────────────────────────────────────────────────── */}
      {website.video_url ? (
        <section className="mx-auto max-w-3xl px-6 pb-16">
          <SectionDivider accentColor={theme.accentColor} />
          <h2
            className={cn(
              "mb-6 text-[11px] font-semibold uppercase tracking-[0.4em]",
              theme.accentText,
            )}
          >
            Watch
          </h2>
          <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black/50">
            <iframe
              src={website.video_url}
              title="Event video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        </section>
      ) : null}

      {/* ── 6. TICKET TIERS ─────────────────────────────────────────────────── */}
      {tiers.length > 0 ? (
        <section id="tickets" className="mx-auto max-w-3xl px-6 pb-16">
          <SectionDivider accentColor={theme.accentColor} />
          <h2
            className={cn(
              "mb-6 text-[11px] font-semibold uppercase tracking-[0.4em]",
              theme.accentText,
            )}
          >
            Tickets
          </h2>
          <div className="space-y-3">
            {tiers.map((tier) => {
              const remaining = Math.max(0, tier.quantity - tier.quantity_sold);
              const tierSoldOut = remaining === 0;
              return (
                <div
                  key={tier.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{tier.name}</p>
                    {tier.description ? (
                      <p className="mt-0.5 text-xs text-white/55">{tier.description}</p>
                    ) : null}
                    {remaining < 20 && !tierSoldOut ? (
                      <p className="mt-1 text-xs font-medium text-amber-400">
                        Only {remaining} left
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span
                      className={cn("text-lg font-bold", theme.accentText)}
                    >
                      {formatTTD(tier.price_cents)}
                    </span>
                    {tierSoldOut ? (
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/40">
                        Sold Out
                      </span>
                    ) : (
                      <Link
                        href={`/events/${effectiveSlug}#tickets`}
                        className={cn(
                          "rounded-lg px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-opacity hover:opacity-90",
                          theme.ctaBg,
                          theme.ctaText,
                        )}
                      >
                        Buy
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* ── 7. SPONSORS ─────────────────────────────────────────────────────── */}
      {sponsors.length > 0 ? (
        <section className="mx-auto max-w-3xl px-6 pb-16">
          <SectionDivider accentColor={theme.accentColor} />
          <h2
            className={cn(
              "mb-6 text-[11px] font-semibold uppercase tracking-[0.4em]",
              theme.accentText,
            )}
          >
            Sponsors
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {sponsors.map((s, i) => (
              <a
                key={i}
                href={s.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-80"
              >
                {s.logo_url ? (
                  <Image
                    src={s.logo_url}
                    alt={s.name}
                    width={120}
                    height={48}
                    className="h-12 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
                  />
                ) : (
                  <span className="text-sm font-semibold text-white/50 hover:text-white/80">
                    {s.name}
                  </span>
                )}
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── 8. FAQ ──────────────────────────────────────────────────────────── */}
      {faq.length > 0 ? (
        <section className="mx-auto max-w-3xl px-6 pb-16">
          <SectionDivider accentColor={theme.accentColor} />
          <h2
            className={cn(
              "mb-6 text-[11px] font-semibold uppercase tracking-[0.4em]",
              theme.accentText,
            )}
          >
            FAQ
          </h2>
          <div className="divide-y divide-white/10 rounded-xl border border-white/10 bg-white/[0.03] px-5">
            {faq.map((item, i) => (
              <FaqItem key={i} question={item.question} answer={item.answer} />
            ))}
          </div>
        </section>
      ) : null}

      {/* ── 9. VENUE ────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 pb-16">
        <SectionDivider accentColor={theme.accentColor} />
        <h2
          className={cn(
            "mb-6 text-[11px] font-semibold uppercase tracking-[0.4em]",
            theme.accentText,
          )}
        >
          Venue
        </h2>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <p className="font-semibold text-white">{event.venue}</p>
          <p className="mt-1 text-sm text-white/60">{event.city}</p>
          {website.venue_directions ? (
            <p className="mt-3 text-sm leading-relaxed text-white/60">{website.venue_directions}</p>
          ) : null}
          {website.venue_map_url ? (
            <div className="mt-4 aspect-video overflow-hidden rounded-lg">
              <iframe
                src={website.venue_map_url}
                title="Venue map"
                loading="lazy"
                className="h-full w-full border-0"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : null}
        </div>
      </section>

      {/* ── 10. PROMOTER ────────────────────────────────────────────────────── */}
      {promoter ? (
        <section className="mx-auto max-w-3xl px-6 pb-16">
          <SectionDivider accentColor={theme.accentColor} />
          <h2
            className={cn(
              "mb-6 text-[11px] font-semibold uppercase tracking-[0.4em]",
              theme.accentText,
            )}
          >
            Presented by
          </h2>
          <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
            {promoter.logo_url ? (
              <Image
                src={promoter.logo_url}
                alt={promoter.brand_name ?? "Promoter"}
                width={56}
                height={56}
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/10 text-xl font-bold text-white">
                {(promoter.brand_name ?? "P").charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-white">{promoter.brand_name ?? "WeFetePass Promoter"}</p>
              {promoter.verified ? (
                <span
                  className={cn(
                    "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    theme.chipBg,
                    theme.chipText,
                  )}
                >
                  Verified
                </span>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 px-6 py-12">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <h3
            className={cn("text-sm font-semibold uppercase tracking-widest", theme.accentText)}
          >
            {headline}
          </h3>

          <div className="flex flex-wrap justify-center gap-4">
            {website.contact_whatsapp ? (
              <a
                href={`https://wa.me/${website.contact_whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                WhatsApp
              </a>
            ) : null}
            {website.contact_email ? (
              <a
                href={`mailto:${website.contact_email}`}
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                Email
              </a>
            ) : null}
          </div>

          <p className="text-xs text-white/30">
            Powered by{" "}
            <a href="https://wefetepass.com" className="hover:text-white/50 transition-colors">
              WeFetePass
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
