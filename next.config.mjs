/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

// upgrade-insecure-requests ломает любой HTTP-стенд (dev, preview, тесты):
// браузер апгрейдит /_next/static до https://, файлы не грузятся и React не гидрируется.
// Директива нужна только когда сайт реально отдаётся по HTTPS.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
const serveOverHttps = siteUrl.startsWith("https://");

const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'" +
    (isProd ? "" : " 'unsafe-eval'") +
    " https://www.googletagmanager.com https://mc.yandex.ru",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://mc.yandex.ru https://generativelanguage.googleapis.com",
  "frame-src 'self' https://www.google.com https://www.youtube.com https://yandex.ru https://yandex.com",
  "media-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  ...(serveOverHttps ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: cspDirectives,
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // HSTS браузеры учитывают только для HTTPS-соединений, поэтому он безвреден
  // на локальном стенде, но не имеет смысла — оставляем только для HTTPS.
  ...(serveOverHttps
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    deviceSizes: [320, 375, 414, 640, 768, 1024, 1280, 1440, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
    outputFileTracingIncludes: {
      "/api/chat": ["./content/rag/**/*.md"],
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [];
  },
};

export default nextConfig;