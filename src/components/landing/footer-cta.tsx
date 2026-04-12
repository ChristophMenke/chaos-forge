import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

export async function LandingFooterCta() {
  const t = await getTranslations("landing");

  return (
    <section
      className="relative mx-auto w-full max-w-3xl px-6 py-20 sm:py-28"
      data-testid="landing-footer-cta"
    >
      <div className="glass glow-neutral rounded-2xl p-10 text-center sm:p-14">
        <h2 className="font-heading text-3xl tracking-wide text-primary sm:text-4xl">
          {t("footerTitle")}
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-base text-foreground/90 sm:text-lg">
          {t("footerSubtitle")}
        </p>
        <Link href="/login" className="mt-8 inline-block">
          <Button
            size="lg"
            className="h-12 px-8 text-base"
            data-testid="cta-login-button-footer"
            style={{ backgroundColor: "#fbbf24", color: "#18181b" }}
          >
            {t("cta")}
          </Button>
        </Link>
      </div>
    </section>
  );
}
