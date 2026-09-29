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
// Robots
// ==========================================================

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();
  const isProduction = process.env.NODE_ENV === "production";

  // На non-production окружениях закрываем индексацию полностью
  if (!isProduction) {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
      sitemap: `${baseUrl}/sitemap.xml`,
      host: baseUrl,
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
      {
        userAgent: "Yandex",
        allow: "/",
        disallow: ["/api/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}