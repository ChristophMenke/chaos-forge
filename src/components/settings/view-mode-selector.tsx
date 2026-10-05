"use client";

import { useTranslations } from "next-intl";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Radio } from "@base-ui/react/radio";
import { Monitor, MonitorSmartphone, Smartphone, type LucideIcon } from "lucide-react";
import { useViewMode } from "@/lib/hooks/use-view-mode";
import { parseViewMode, type ViewMode } from "@/lib/view-mode";

const OPTIONS: { mode: ViewMode; icon: LucideIcon; labelKey: string }[] = [
  { mode: "auto", icon: MonitorSmartphone, labelKey: "viewModeAuto" },
  { mode: "mobile", icon: Smartphone, labelKey: "viewModeMobile" },
  { mode: "desktop", icon: Monitor, labelKey: "viewModeDesktop" },
];

/**
 * Segmented control for the device's layout (auto/mobile/desktop). Applies
 * immediately — the choice is a class on <html> that the breakpoint variants
 * in globals.css react to.
 */
export function ViewModeSelector() {
  const t = useTranslations("settings");
  const [mode, setMode] = useViewMode();

  return (
    <RadioGroup
      value={mode}
      onValueChange={(value) => setMode(parseViewMode(value))}
      aria-label={t("viewMode")}
      className="inline-flex flex-wrap rounded-lg border border-border"
      data-testid="view-mode-selector"
    >
      {OPTIONS.map(({ mode: option, icon: Icon, labelKey }) => (
        <Radio.Root
          key={option}
          value={option}
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground transition-colors first:rounded-l-lg last:rounded-r-lg hover:bg-accent/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[checked]:bg-primary/20 data-[checked]:text-primary"
          data-testid={`view-mode-${option}`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {t(labelKey)}
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}
