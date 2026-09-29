import type { Metadata } from "next";

import { About } from "@/components/sections/About";
import { Benefits } from "@/components/sections/Benefits";
import { Contacts } from "@/components/sections/Contacts";
import { Directions } from "@/components/sections/Directions";
import { Faq } from "@/components/sections/Faq";
import { Hero } from "@/components/sections/Hero";
import { Reviews } from "@/components/sections/Reviews";
import { Teachers } from "@/components/sections/Teachers";
import { getFaq, getSiteConfig } from "@/lib/content";
import { generateFaqJsonLd, generateOrganizationJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Образовательный центр — курсы, преподаватели, консультации",
  description:
    "Образовательный центр: офлайн и онлайн курсы, опытные преподаватели, индивидуальный подход. Запишитесь на бесплатную консультацию.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  const site = getSiteConfig();
  const faq = getFaq();

  const organizationJsonLd = generateOrganizationJsonLd(site);
  const faqJsonLd = generateFaqJsonLd(faq);

  return (
    <>
      {/* JSON-LD: Organization */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      {/* JSON-LD: FAQPage */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <Hero />
      <About />
      <Directions />
      <Benefits />
      <Teachers />
      <Reviews />
      <Faq />
      <Contacts />
    </>
  );
}