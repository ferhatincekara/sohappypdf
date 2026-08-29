import { listRegisteredTools } from "@repo/tools/catalog";
import { getLocale, getTranslations } from "next-intl/server";
import {
  LatestPostsSection,
  listBlogPosts,
  toBlogPostCard,
} from "@/features/blog";
import { resolveMarketingCtas } from "../lib/marketing-cta";
import { Hero } from "./hero";
import { HomeCtaBanner } from "./home-cta-banner";
import { OverviewSection } from "./overview-section";
import { ProductJsonLd } from "./product-json-ld";
import { SpotlightsSection } from "./spotlights-section";
import { TestimonialsSection } from "./testimonials-section";
import { WhyChooseSection } from "./why-choose-section";

export async function MarketingHomePage({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const t = await getTranslations("marketing");
  const locale = await getLocale();
  const { startHref } = resolveMarketingCtas(isAuthenticated);
  const toolCount = listRegisteredTools().length;
  const posts = listBlogPosts(locale).map((post) =>
    toBlogPostCard(post, locale),
  );
  const startLabel = isAuthenticated
    ? t("hero.secondaryCta")
    : t("hero.primaryCta");

  return (
    <>
      <ProductJsonLd
        name={t("nav.brand")}
        description={t("metadata.homeDescription")}
        freePlanName={t("pricing.free.name")}
      />
      <Hero
        isAuthenticated={isAuthenticated}
        startHref={startHref}
        toolCount={toolCount}
      />
      <OverviewSection startHref={startHref} startLabel={startLabel} />
      <SpotlightsSection />
      <WhyChooseSection toolCount={toolCount} />
      <TestimonialsSection />
      <LatestPostsSection posts={posts} />
      <HomeCtaBanner toolCount={toolCount} />
    </>
  );
}
