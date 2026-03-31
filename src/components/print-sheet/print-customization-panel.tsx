"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronUp, ChevronDown, Settings, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PrintPreferences, PrintSectionId } from "@/lib/print-config";

interface PrintCustomizationPanelProps {
  preferences: PrintPreferences;
  hasData: Record<PrintSectionId, boolean>;
  onToggle: (id: PrintSectionId) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  onReset: () => void;
}

export function PrintCustomizationPanel({
  preferences,
  hasData,
  onToggle,
  onMove,
  onReset,
}: PrintCustomizationPanelProps) {
  const t = useTranslations("print");
  const [open, setOpen] = useState(false);

  return (
    <div className="print:hidden" data-testid="print-customization">
      <div className="flex justify-center">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 rounded px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
          data-testid="print-customize-toggle"
        >
          <Settings className="h-4 w-4" />
          {t("customizeSections")}
        </button>
      </div>

      {open && (
        <div
          className="mx-auto mb-4 max-w-md rounded-lg border border-gray-300 bg-white p-3 shadow-sm"
          data-testid="print-customization-panel"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">{t("customizeSections")}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-7 text-xs text-gray-700"
              data-testid="print-customize-reset"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              {t("resetLayout")}
            </Button>
          </div>

          <div className="flex flex-col gap-1">
            {preferences.sections.map((section, index) => (
              <div
                key={section.id}
                className={`flex items-center gap-2 rounded border px-2 py-1.5 text-sm ${
                  section.visible
                    ? "border-gray-200 bg-gray-50 text-gray-900"
                    : "border-gray-100 bg-gray-100 text-gray-500"
                }`}
                data-testid={`print-section-config-${section.id}`}
              >
                <input
                  type="checkbox"
                  checked={section.visible}
                  onChange={() => onToggle(section.id)}
                  className="h-4 w-4 rounded border-gray-400 accent-blue-600"
                  data-testid={`print-toggle-${section.id}`}
                />
                <span className="flex-1 text-sm font-medium">
                  {t(`section_${section.id}` as Parameters<typeof t>[0])}
                  {!hasData[section.id] && (
                    <span className="ml-1 text-xs font-normal text-gray-500">
                      {t("sectionEmpty")}
                    </span>
                  )}
                </span>
                <div className="flex gap-0.5">
                  <button
                    onClick={() => onMove(index, index - 1)}
                    disabled={index === 0}
                    className="rounded p-0.5 text-gray-600 hover:text-gray-900 disabled:invisible"
                    aria-label={t("moveUp")}
                    data-testid={`print-move-up-${section.id}`}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onMove(index, index + 1)}
                    disabled={index === preferences.sections.length - 1}
                    className="rounded p-0.5 text-gray-600 hover:text-gray-900 disabled:invisible"
                    aria-label={t("moveDown")}
                    data-testid={`print-move-down-${section.id}`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
