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

      <ol className="stagger-reveal relative space-y-10 border-l-2 border-primary/30 pl-8 sm:pl-12">
        {steps.map((s, i) => (
          <li key={s.num} className="relative" data-testid={`landing-step-${i + 1}`}>
            <span
              className="absolute -left-[3rem] flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-400 font-heading text-sm font-bold text-zinc-900 shadow-lg shadow-amber-400/30 sm:-left-[3.75rem] sm:h-12 sm:w-12 sm:text-base"
              aria-hidden
            >
              {s.num}
            </span>
            <h3 className="font-heading text-xl tracking-wide text-foreground sm:text-2xl">
              {s.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {s.desc}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
