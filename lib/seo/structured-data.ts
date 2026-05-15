/**
 * JSON-LD schema.org builders. Each function returns a plain object the caller
 * stringifies into a <script type="application/ld+json">.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wefetepass.com";
const ORG_NAME = "WeFetePass";

export interface ArticleInput {
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  updated_at?: string | null;
  author_name: string | null;
  slug: string;
}

export function articleJsonLd(post: ArticleInput): object {
  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.cover_image_url ? [post.cover_image_url] : undefined,
    datePublished: post.published_at ?? undefined,
    dateModified: post.updated_at ?? post.published_at ?? undefined,
    author: post.author_name
      ? { "@type": "Person", name: post.author_name }
      : { "@type": "Organization", name: ORG_NAME },
    publisher: {
      "@type": "Organization",
      name: ORG_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/favicon.ico`,
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
  };
}

export interface EventInput {
  title: string;
  starts_at: string;
  ends_at?: string | null;
  venue: string;
  city: string;
  island?: string | null;
  slug: string;
  cover_image_url?: string | null;
  description?: string | null;
  priceFromCents?: number;
  currency?: string;
}

export function eventJsonLd(event: EventInput): object {
  const url = `${SITE_URL}/events/${event.slug}`;
  const obj: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.starts_at,
    endDate: event.ends_at ?? undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.venue,
      address: {
        "@type": "PostalAddress",
        addressLocality: event.city,
        addressCountry: event.island ?? undefined,
      },
    },
    image: event.cover_image_url ? [event.cover_image_url] : undefined,
    description: event.description ?? undefined,
    url,
    organizer: { "@type": "Organization", name: ORG_NAME, url: SITE_URL },
  };
  if (typeof event.priceFromCents === "number") {
    obj.offers = {
      "@type": "Offer",
      url,
      price: (event.priceFromCents / 100).toFixed(2),
      priceCurrency: event.currency ?? "USD",
      availability: "https://schema.org/InStock",
    };
  }
  return obj;
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url.startsWith("http") ? it.url : `${SITE_URL}${it.url}`,
    })),
  };
}

export function organizationJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORG_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.ico`,
    description:
      "Caribbean fete ticketing platform. Discover fetes, all-inclusives, and carnival events across the Caribbean.",
    sameAs: [],
  };
}
