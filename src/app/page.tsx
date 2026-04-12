import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/supabase/auth";
import { LandingHero } from "@/components/landing/hero-section";
import { LandingFeatures } from "@/components/landing/feature-cards";
import { LandingHowItWorks } from "@/components/landing/how-it-works";
import { LandingFooterCta } from "@/components/landing/footer-cta";

export default async function Home() {
  const user = await getOptionalUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col" data-testid="landing-page">
      <LandingHero />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingFooterCta />
    </div>
  );
}
