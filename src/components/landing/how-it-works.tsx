import { getTranslations } from "next-intl/server";

export async function LandingHowItWorks() {
  const t = await getTranslations("landing");

  const steps = [
    { num: "I", title: t("step1Title"), desc: t("step1Desc") },
    { num: "II", title: t("step2Title"), desc: t("step2Desc") },
    { num: "III", title: t("step3Title"), desc: t("step3Desc") },
  ];

  return (
    <section
      className="relative mx-auto w-full max-w-4xl px-6 py-20 sm:py-28"
      data-testid="landing-how-it-works"
    >
      <h2 className="font-heading mb-16 text-center text-3xl tracking-wide text-primary sm:text-4xl">
        {t("howItWorksTitle")}
      </h2>

      <ol className="stagger-reveal space-y-8">
        {steps.map((s, i) => (
          <li key={s.num} className="flex gap-4 sm:gap-6" data-testid={`landing-step-${i + 1}`}>
            {/* Decorative step badge — aria-hidden; visible number is not
                read by screen readers. Uses inline style so axe measures the
                opaque background correctly regardless of ancestor cascade. */}
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-heading text-base font-bold shadow-lg sm:h-14 sm:w-14 sm:text-lg"
              style={{
                backgroundColor: "#fbbf24",
                color: "#18181b",
                boxShadow: "0 4px 16px rgba(251, 191, 36, 0.35)",
              }}
              aria-hidden
            >
              {s.num}
            </span>
            <div className="flex-1">
              <h3 className="font-heading text-xl tracking-wide text-foreground sm:text-2xl">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90 sm:text-base">
                {s.desc}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
