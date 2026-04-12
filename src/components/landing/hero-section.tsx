import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";

export async function LandingHero() {
  const t = await getTranslations("landing");

  return (
    <section
      className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden px-6 text-center"
      data-testid="landing-hero"
    >
      {/* Background artwork */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#0a0810]" />
        <picture>
          <source
            media="(min-aspect-ratio: 4/3)"
            srcSet="/images/login/login-party-landscape.webp"
          />
          <img
            src="/images/login/login-party-portrait.webp"
            alt=""
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover object-top opacity-70"
          />
        </picture>
        {/* Gradient overlays for readability + cinematic feel */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0810]/40 via-[#0a0810]/50 to-background" />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-accent/10 mix-blend-overlay" />
      </div>

      <div className="relative z-10 flex max-w-3xl flex-col items-center gap-6 stagger-reveal">
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-600/40 bg-amber-950/40 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-amber-200 backdrop-blur-md">
          <Flame className="h-3 w-3" aria-hidden />
          {t("heroBadge")}
        </span>

        <h1 className="font-heading text-5xl tracking-wide text-amber-100 drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] sm:text-6xl md:text-7xl">
          {t("tagline")}
        </h1>

        <p className="max-w-xl text-lg text-amber-50/80 drop-shadow-md sm:text-xl">
          {t("subtitle")}
        </p>

        <Link href="/login" className="mt-2 inline-block">
          <Button
            size="lg"
            data-testid="cta-login-button"
            className="h-12 px-8 text-base shadow-xl shadow-primary/30"
          >
            {t("cta")}
          </Button>
        </Link>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce opacity-60">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-amber-200"
          aria-hidden
        >
          <path d="M12 5v14" />
          <path d="m19 12-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}
