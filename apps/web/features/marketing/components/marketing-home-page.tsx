import { listRegisteredTools } from "@sohappypdf/tools/catalog";
import { getLocale, getTranslations } from "next-intl/server";
import {
  LatestPostsSection,
  listBlogPosts,
  toBlogPostCard,
} from "@/features/blog";
import { Hero } from "@/features/marketing/components/hero";
import { HomeCtaBanner } from "@/features/marketing/components/home-cta-banner";
import { OverviewSection } from "@/features/marketing/components/overview-section";
import { ProductJsonLd } from "@/features/marketing/components/product-json-ld";
import { SpotlightsSection } from "@/features/marketing/components/spotlights-section";
import { TestimonialsSection } from "@/features/marketing/components/testimonials-section";
import { WhyChooseSection } from "@/features/marketing/components/why-choose-section";
import { resolveMarketingCtas } from "@/features/marketing/lib/marketing-cta";

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
