"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  TUTORIAL_STEPS,
  type TutorialStep,
  dismissTutorial,
  isTutorialDismissed,
} from "@/lib/tutorial/steps";

interface TutorialOverlayProps {
  page: keyof typeof TUTORIAL_STEPS;
  /** Force show even if previously dismissed (used by the "?" help button). */
  forceShow?: boolean;
  onClose?: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function useElementRect(selector: string | undefined): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!selector || typeof window === "undefined") return;

    function measure() {
      const el = document.querySelector(selector!);
      if (!el) {
        setRect((prev) => (prev === null ? prev : null));
        return;
      }
      const r = el.getBoundingClientRect();
      setRect((prev) => {
        if (
          prev &&
          prev.top === r.top &&
          prev.left === r.left &&
          prev.width === r.width &&
          prev.height === r.height
        ) {
          return prev; // identity-stable: React bails out
        }
        return { top: r.top, left: r.left, width: r.width, height: r.height };
      });
    }

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);

    const interval = window.setInterval(measure, 500); // re-measure for dynamic content

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      window.clearInterval(interval);
    };
  }, [selector]);

  // When the selector is cleared, drop any cached rect so the tooltip recenters.
  return selector ? rect : null;
}

// Rough tooltip bounds — max-w-sm = 24rem ≈ 384px, height estimated.
// Used for viewport overflow detection; flips sides if the preferred position
// would push the tooltip off-screen.
const TOOLTIP_W = 384;
const TOOLTIP_H = 220;
const EDGE_MARGIN = 12;

function getTooltipPosition(rect: Rect | null, position: TutorialStep["position"]) {
  if (!rect) {
    return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  }

  const vw = typeof window !== "undefined" ? window.innerWidth : 1920;
  const vh = typeof window !== "undefined" ? window.innerHeight : 1080;
  const pref = position ?? "bottom";

  // Horizontal centering for top/bottom with edge clamping.
  const centerLeft = rect.left + rect.width / 2;
  const clampedLeft = Math.min(
    Math.max(EDGE_MARGIN + TOOLTIP_W / 2, centerLeft),
    vw - EDGE_MARGIN - TOOLTIP_W / 2
  );

  // Vertical centering for left/right with edge clamping.
  const centerTop = rect.top + rect.height / 2;
  const clampedTop = Math.min(
    Math.max(EDGE_MARGIN + TOOLTIP_H / 2, centerTop),
    vh - EDGE_MARGIN - TOOLTIP_H / 2
  );

  switch (pref) {
    case "top": {
      const flip = rect.top - TOOLTIP_H - 16 < 0;
      return flip
        ? {
            top: rect.top + rect.height + 16 + "px",
            left: clampedLeft + "px",
            transform: "translate(-50%, 0)",
          }
        : {
            top: rect.top - 16 + "px",
            left: clampedLeft + "px",
            transform: "translate(-50%, -100%)",
          };
    }
    case "left": {
      const flip = rect.left - TOOLTIP_W - 16 < 0;
      return flip
        ? {
            top: clampedTop + "px",
            left: rect.left + rect.width + 16 + "px",
            transform: "translate(0, -50%)",
          }
        : {
            top: clampedTop + "px",
            left: rect.left - 16 + "px",
            transform: "translate(-100%, -50%)",
          };
    }
    case "right": {
      const flip = rect.left + rect.width + 16 + TOOLTIP_W > vw;
      return flip
        ? {
            top: clampedTop + "px",
            left: rect.left - 16 + "px",
            transform: "translate(-100%, -50%)",
          }
        : {
            top: clampedTop + "px",
            left: rect.left + rect.width + 16 + "px",
            transform: "translate(0, -50%)",
          };
    }
    case "bottom":
    default: {
      const flip = rect.top + rect.height + 16 + TOOLTIP_H > vh;
      return flip
        ? {
            top: rect.top - 16 + "px",
            left: clampedLeft + "px",
            transform: "translate(-50%, -100%)",
          }
        : {
            top: rect.top + rect.height + 16 + "px",
            left: clampedLeft + "px",
            transform: "translate(-50%, 0)",
          };
    }
  }
}

export function TutorialOverlay({ page, forceShow = false, onClose }: TutorialOverlayProps) {
  const t = useTranslations("tutorial");
  const tCommon = useTranslations("common");
  const [stepIndex, setStepIndex] = useState(0);
  // Initial active state: true only when forceShow (imperative open). The
  // auto-start-after-mount path fires via a setTimeout so it isn't a synchronous
  // setState in an effect.
  const [active, setActive] = useState(forceShow);
  const steps = TUTORIAL_STEPS[page] ?? [];
  const currentStep = steps[stepIndex];
  const rect = useElementRect(currentStep?.target);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (forceShow) return; // already active from initial state
    if (isTutorialDismissed(page)) return;

    let timer: number | undefined;
    let cancelled = false;

    // Also respect profile.skip_tutorials (set for users that existed before
    // the tutorial feature shipped). If the flag is true, cache in localStorage
    // for cheap subsequent checks.
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (cancelled || !data.user) return;
        const { data: profile } = await supabase
          .from("profiles")
          .select("skip_tutorials")
          .eq("id", data.user.id)
          .maybeSingle();
        if (cancelled) return;
        if (profile?.skip_tutorials === true) {
          dismissTutorial(page);
          return;
        }
        timer = window.setTimeout(() => setActive(true), 600);
      } catch {
        if (!cancelled) timer = window.setTimeout(() => setActive(true), 600);
      }
    })();

    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [page, forceShow]);

  function close(markDismissed = true) {
    if (markDismissed) dismissTutorial(page);
    setActive(false);
    onClose?.();
  }

  function next() {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      close(true);
    }
  }

  function prev() {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  }

  if (!active || !currentStep) return null;

  const isLast = stepIndex === steps.length - 1;
  const tooltipStyle = getTooltipPosition(rect, currentStep.position);

  // Clamp the spotlight cutout to the viewport — getBoundingClientRect can
  // return negative coordinates when the target is scrolled off-screen, which
  // breaks the polygon cutout in some browsers.
  const vw = typeof window !== "undefined" ? window.innerWidth : 1920;
  const vh = typeof window !== "undefined" ? window.innerHeight : 1080;
  const cutoutPad = 8;
  const cutoutL = rect ? Math.max(0, rect.left - cutoutPad) : 0;
  const cutoutT = rect ? Math.max(0, rect.top - cutoutPad) : 0;
  const cutoutR = rect ? Math.min(vw, rect.left + rect.width + cutoutPad) : 0;
  const cutoutB = rect ? Math.min(vh, rect.top + rect.height + cutoutPad) : 0;
  const cutoutVisible =
    !!rect && cutoutL < cutoutR && cutoutT < cutoutB && cutoutR > 0 && cutoutB > 0;

  return (
    <div
      className="fixed inset-0 z-[100] pointer-events-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
      data-testid="tutorial-overlay"
    >
      {/* Backdrop with cutout for the highlighted element */}
      <div
        className="pointer-events-auto absolute inset-0 bg-black/60 transition-opacity"
        style={
          cutoutVisible
            ? {
                clipPath: `polygon(
                  0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
                  ${cutoutL}px ${cutoutT}px,
                  ${cutoutL}px ${cutoutB}px,
                  ${cutoutR}px ${cutoutB}px,
                  ${cutoutR}px ${cutoutT}px,
                  ${cutoutL}px ${cutoutT}px
                )`,
              }
            : undefined
        }
        onClick={() => close(true)}
      />

      {/* Highlight ring around target */}
      {rect && (
        <div
          className="pointer-events-none absolute rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-background/80 animate-pulse"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        className="pointer-events-auto absolute max-w-sm"
        style={tooltipStyle}
        data-testid="tutorial-tooltip"
      >
        <div className="glass glow-neutral rounded-xl p-5 shadow-2xl">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden />
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                {stepIndex + 1} / {steps.length}
              </span>
            </div>
            <button
              onClick={() => close(true)}
              aria-label={tCommon("close")}
              className="rounded p-1 text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              data-testid="tutorial-close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <h3 id="tutorial-title" className="font-heading text-lg tracking-wide text-foreground">
            {t(currentStep.titleKey)}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t(currentStep.descriptionKey)}
          </p>

          <div className="mt-5 flex items-center justify-between gap-2">
            <button
              onClick={() => close(true)}
              className="text-xs text-muted-foreground hover:text-foreground"
              data-testid="tutorial-skip"
            >
              {t("skip")}
            </button>
            <div className="flex items-center gap-2">
              {stepIndex > 0 && (
                <button
                  onClick={prev}
                  className="flex items-center gap-1 rounded-md border border-border/60 bg-card/40 px-3 py-1.5 text-sm transition-colors hover:bg-accent/40"
                  data-testid="tutorial-prev"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t("back")}
                </button>
              )}
              <button
                onClick={next}
                className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                data-testid="tutorial-next"
              >
                {isLast ? t("finish") : t("next")}
                {!isLast && <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
