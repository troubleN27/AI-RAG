import type { MetadataRoute } from "next";

// ==========================================================
// Утилиты
// ==========================================================

function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  return url && url.trim().length > 0
    ? url.replace(/\/$/, "")
    : "https://example.com";
}

// ==========================================================
// Sitemap
// ==========================================================

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Секции главной страницы как отдельные якоря (для индексации)
  const sectionAnchors = [
    "about",
    "courses",
    "teachers",
    "benefits",
    "reviews",
    "faq",
    "contact",
  ];

  const anchorRoutes: MetadataRoute.Sitemap = sectionAnchors.map((id) => ({
    url: `${baseUrl}/#${id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...anchorRoutes];
}