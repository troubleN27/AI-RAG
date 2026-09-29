import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import Script from "next/script";

import { ChatWidget } from "@/components/chat/ChatWidget";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ScrollTopButton } from "@/components/layout/ScrollTopButton";
import { LeadModal } from "@/components/lead/LeadModal";
import { ChatProvider } from "@/lib/chat/ChatContext";
import { LeadProvider } from "@/lib/lead/LeadContext";

import "./globals.css";

// ==========================================================
// Шрифты
// ==========================================================
const heading = Manrope({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-heading",
  weight: ["600", "700", "800"],
});


// ==========================================================
// Метаданные
// ==========================================================
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Образовательный центр — курсы и обучение",
    template: "%s | Образовательный центр",
  },
  description:
    "Современный образовательный центр: офлайн- и онлайн-курсы, опытные преподаватели, индивидуальный подход. Запишитесь на консультацию.",
  keywords: ["курсы", "обучение", "образовательный центр", "консультация", "онлайн-курсы"],
  authors: [{ name: "Образовательный центр" }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: siteUrl,
    siteName: "Образовательный центр",
    title: "Образовательный центр — курсы и обучение",
    description:
      "Современный образовательный центр: офлайн- и онлайн-курсы, опытные преподаватели, индивидуальный подход.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Образовательный центр",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Образовательный центр — курсы и обучение",
    description: "Современный образовательный центр: курсы, преподаватели, консультации.",
    images: ["/og-image.svg"],
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.svg", sizes: "180x180", type: "image/svg+xml" }],
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#08090f",
  colorScheme: "dark",
};

// ==========================================================
// Root Layout
// ==========================================================
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID?.trim();
  const ymId = process.env.NEXT_PUBLIC_YM_ID?.trim();

  return (
    <html lang="ru" className={heading.variable}>
      <body>
        <a href="#main" className="skip-link">
          Перейти к содержимому
        </a>

        <LeadProvider>
          <ChatProvider>
            <Header />

            <main id="main" className="min-h-[60svh]">
              {children}
            </main>

            <Footer />

            <ScrollTopButton />
            <ChatWidget />
            <LeadModal />
          </ChatProvider>
        </LeadProvider>

        {gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', { send_page_view: true });
              `}
            </Script>
          </>
        ) : null}

        {ymId ? (
          <>
            <Script id="ym-init" strategy="afterInteractive">
              {`
                (function(m,e,t,r,i,k,a){
                  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                  m[i].l=1*new Date();
                  for (var j = 0; j < document.scripts.length; j++) {
                    if (document.scripts[j].src === r) { return; }
                  }
                  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
                })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
                ym(${ymId}, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
              `}
            </Script>
            <noscript>
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://mc.yandex.ru/watch/${ymId}`}
                  style={{ position: "absolute", left: "-9999px" }}
                  alt=""
                />
              </div>
            </noscript>
          </>
        ) : null}
      </body>
    </html>
  );
}