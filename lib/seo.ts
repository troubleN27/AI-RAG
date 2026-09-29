import type {
  Course,
  FaqItem,
  SiteConfig,
} from "@/lib/content/types";

// ==========================================================
// Базовые URL
// ==========================================================

function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  return url && url.trim().length > 0 ? url.replace(/\/$/, "") : "https://example.com";
}

// ==========================================================
// EducationalOrganization + LocalBusiness
// ==========================================================

export interface JsonLdOrganization {
  "@context": "https://schema.org";
  "@type": ["EducationalOrganization", "LocalBusiness"];
  name: string;
  description: string;
  url: string;
  telephone: string;
  email: string;
  image?: string;
  logo?: string;
  address: Array<{
    "@type": "PostalAddress";
    streetAddress: string;
    addressLocality?: string;
    addressCountry?: string;
  }>;
  sameAs: string[];
  openingHours?: string;
}

export function generateOrganizationJsonLd(site: SiteConfig): JsonLdOrganization {
  const baseUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": ["EducationalOrganization", "LocalBusiness"],
    name: site.name,
    description: site.tagline,
    url: baseUrl,
    telephone: site.phone,
    email: site.email,
    image: `${baseUrl}/og-image.jpg`,
    logo: `${baseUrl}/favicon-32.png`,
    address: site.addresses.map((addr) => ({
      "@type": "PostalAddress",
      streetAddress: addr.address,
      addressCountry: "UZ",
    })),
    sameAs: [
      ...site.socials.map((s) => s.url),
      ...site.messengers.map((m) => m.url),
    ].filter((url, index, arr) => arr.indexOf(url) === index),
    openingHours: site.workingHours,
  };
}

// ==========================================================
// FAQPage
// ==========================================================

export interface JsonLdFaq {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }>;
}

export function generateFaqJsonLd(items: FaqItem[]): JsonLdFaq {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

// ==========================================================
// Course
// ==========================================================

export interface JsonLdCourse {
  "@context": "https://schema.org";
  "@type": "Course";
  name: string;
  description: string;
  provider: {
    "@type": "EducationalOrganization";
    name: string;
    sameAs: string;
  };
  offers?: {
    "@type": "Offer";
    category: string;
    price?: number;
    priceCurrency?: string;
  };
}

export function generateCourseJsonLd(
  course: Course,
  site: SiteConfig,
): JsonLdCourse {
  const baseUrl = getSiteUrl();

  const jsonLd: JsonLdCourse = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.shortDescription || (course.description ?? ""),
    provider: {
      "@type": "EducationalOrganization",
      name: site.name,
      sameAs: baseUrl,
    },
  };

  if (course.price) {
    jsonLd.offers = {
      "@type": "Offer",
      category: "Paid",
      price: course.price.amount,
      priceCurrency: course.price.currency,
    };
  }

  return jsonLd;
}

// ==========================================================
// BreadcrumbList (опционально, для внутренних страниц)
// ==========================================================

export interface JsonLdBreadcrumb {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }>;
}

export function generateBreadcrumbsJsonLd(
  items: Array<{ name: string; path: string }>,
): JsonLdBreadcrumb {
  const baseUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.path.startsWith("/") ? item.path : `/${item.path}`}`,
    })),
  };
}