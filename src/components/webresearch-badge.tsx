"use client";

import { useTranslations } from "next-intl";
import { GlobeIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function WebresearchBadge() {
  const t = useTranslations("common");

  return (
    <Tooltip>
      <TooltipTrigger
        className="inline-flex shrink-0 items-center gap-0.5 rounded-sm bg-amber-800/40 px-1 py-0.5 text-[9px] text-amber-300"
        data-testid="webresearch-badge"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <GlobeIcon className="h-2.5 w-2.5" />
        Web
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        {t("webresearchTooltip")}
      </TooltipContent>
    </Tooltip>
  );
}

/** Print-friendly marker (no tooltip) */
export function WebresearchPrintMarker() {
  return (
    <span className="text-[8px] text-gray-400" data-testid="webresearch-print-marker">
      {" "}
      (W)
    </span>
  );
}
