import { getTranslations } from "next-intl/server";
import { Sword, Scroll, Sparkles, ShieldCheck } from "lucide-react";

export async function LandingFeatures() {
  const t = await getTranslations("landing");

  const features = [
    {
      id: "character",
      icon: Sword,
      glow: "glow-warrior",
      title: t("featureCharacterTitle"),
      description: t("featureCharacterDesc"),
      iconColor: "text-red-400",
    },
    {
      id: "session",
      icon: Scroll,
      glow: "glow-priest",
      title: t("featureSessionTitle"),
      description: t("featureSessionDesc"),
      iconColor: "text-amber-300",
    },
    {
      id: "chat",
      icon: Sparkles,
      glow: "glow-wizard",
      title: t("featureChatTitle"),
      description: t("featureChatDesc"),
      iconColor: "text-teal-300",
    },
    {
      id: "gm",
      icon: ShieldCheck,
      glow: "glow-rogue",
      title: t("featureGmTitle"),
      description: t("featureGmDesc"),
      iconColor: "text-indigo-300",
    },
  ];

  return (
    <section
      className="relative mx-auto w-full max-w-6xl px-6 py-20 sm:py-28"
      data-testid="landing-features"
    >
      <h2 className="font-heading mb-12 text-center text-3xl tracking-wide text-primary sm:text-4xl">
        {t("featuresTitle")}
      </h2>

      <div className="stagger-reveal grid grid-cols-1 gap-6 sm:grid-cols-2">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.id}
              className={`glass glass-hover tilt-card ${f.glow} rounded-xl p-6 sm:p-8`}
              data-testid={`landing-feature-${f.id}`}
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border/50 bg-card/40">
                  <Icon className={`h-5 w-5 ${f.iconColor}`} aria-hidden />
                </div>
                <h3 className="font-heading text-xl tracking-wide text-foreground sm:text-2xl">
                  {f.title}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">
                {f.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
