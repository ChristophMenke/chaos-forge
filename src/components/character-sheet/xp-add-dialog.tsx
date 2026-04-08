"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { localized } from "@/lib/utils/localize";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  previewXpGain,
  getXpForNextLevel,
  getXpThreshold,
  getNextLevelChanges,
} from "@/lib/rules/experience";
import { CLASSES } from "@/lib/rules/classes";
import type { CharacterClassRow, SessionRow } from "@/lib/supabase/types";
import type { ClassId } from "@/lib/rules/types";

interface XpAddDialogProps {
  open: boolean;
  characterId: string;
  characterClasses: CharacterClassRow[];
  sessions: Pick<SessionRow, "id" | "title" | "session_date">[];
  onClose: () => void;
  onClassesChange: (classes: CharacterClassRow[]) => void;
  initialSessionId?: string;
  initialAmount?: number;
}

export function XpAddDialog({
  open,
  characterId,
  characterClasses,
  sessions,
  onClose,
  onClassesChange,
  initialSessionId,
  initialAmount,
}: XpAddDialogProps) {
  const t = useTranslations("sheet");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [xpAmount, setXpAmount] = useState<string>(initialAmount ? initialAmount.toString() : "");
  const [selectedSessionId, setSelectedSessionId] = useState<string>(initialSessionId ?? "");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const activeClasses = characterClasses.filter((cc) => cc.is_active);

  // Per-class XP overrides — only set when user manually edits a class input
  const [classXpOverrides, setClassXpOverrides] = useState<Record<string, string>>({});
  const [hasManualOverride, setHasManualOverride] = useState(false);

  const xpNum = parseInt(xpAmount) || 0;

  // Compute per-class XP: use overrides if user edited, else equal split
  const classXpMap = useMemo(() => {
    if (xpNum <= 0 || activeClasses.length === 0) return {};
    if (hasManualOverride) return classXpOverrides;

    // Default: equal split
    const perClass = Math.floor(xpNum / activeClasses.length);
    const remainder = xpNum - perClass * activeClasses.length;
    const map: Record<string, string> = {};
    activeClasses.forEach((cc, i) => {
      map[cc.class_id] = String(perClass + (i === 0 ? remainder : 0));
    });
    return map;
  }, [xpNum, activeClasses, hasManualOverride, classXpOverrides]);

  // Compute per-class XP values and remaining
  const classXpValues = useMemo(() => {
    return activeClasses.map((cc) => ({
      classId: cc.class_id,
      xp: parseInt(classXpMap[cc.class_id] ?? "0") || 0,
    }));
  }, [activeClasses, classXpMap]);

  const totalDistributed = classXpValues.reduce((sum, v) => sum + v.xp, 0);
  const remaining = xpNum - totalDistributed;

  // Compute previews for each class (with XP gain)
  const previews = useMemo(() => {
    return activeClasses.map((cc) => {
      const classXp = classXpValues.find((v) => v.classId === cc.class_id)?.xp ?? 0;
      const cls = CLASSES[cc.class_id as ClassId];
      const className = cls ? localized(cls.name, cls.name_en, locale) : cc.class_id;

      // XP gain preview
      const preview =
        classXp > 0
          ? previewXpGain(cc.class_id as ClassId, cc.level, cc.xp_current, classXp)
          : null;

      const effectiveNewLevel = preview?.newLevel ?? cc.level;
      const effectiveNewXp = preview?.newXp ?? cc.xp_current;

      // XP progress bar
      const nextLevelXp = getXpForNextLevel(cc.class_id as ClassId, effectiveNewLevel);
      const currentThreshold = getXpThreshold(cc.class_id as ClassId, effectiveNewLevel);
      const progressPct =
        nextLevelXp !== null && nextLevelXp > currentThreshold
          ? Math.min(
              100,
              Math.round(
                ((effectiveNewXp - currentThreshold) / (nextLevelXp - currentThreshold)) * 100
              )
            )
          : 100;

      // Next-level changes (always shown)
      const nextLevelChanges = getNextLevelChanges(cc.class_id as ClassId, effectiveNewLevel);

      return {
        classId: cc.class_id,
        className,
        currentLevel: cc.level,
        currentXp: cc.xp_current,
        classXp,
        preview,
        effectiveNewLevel,
        effectiveNewXp,
        progressPct,
        nextLevelXp,
        nextLevelChanges,
      };
    });
  }, [activeClasses, classXpValues, locale]);

  async function handleApply() {
    if (xpNum <= 0 || remaining < 0) return;
    setSaving(true);

    try {
      const supabase = createClient();

      // Update each class's XP and level (parallel)
      const classUpdates = activeClasses
        .map((cc) => {
          const classXp = classXpValues.find((v) => v.classId === cc.class_id)?.xp ?? 0;
          if (classXp <= 0) return null;
          const preview = previewXpGain(cc.class_id as ClassId, cc.level, cc.xp_current, classXp);
          return supabase
            .from("character_classes")
            .update({ xp_current: preview.newXp, level: preview.newLevel })
            .eq("id", cc.id);
        })
        .filter(Boolean);

      await Promise.all(classUpdates);

      // Save to XP history
      await supabase.from("xp_history").insert({
        character_id: characterId,
        session_id: selectedSessionId || null,
        xp_amount: xpNum,
        note: note.trim(),
      });

      // Optimistic update (only on success)
      const updatedClasses = characterClasses.map((cc) => {
        if (!cc.is_active) return cc;
        const classXp = classXpValues.find((v) => v.classId === cc.class_id)?.xp ?? 0;
        if (classXp <= 0) return cc;
        const preview = previewXpGain(cc.class_id as ClassId, cc.level, cc.xp_current, classXp);
        return { ...cc, xp_current: preview.newXp, level: preview.newLevel };
      });
      onClassesChange(updatedClasses);

      setXpAmount("");
      setNote("");
      setSelectedSessionId("");
      setClassXpOverrides({});
      setHasManualOverride(false);
      onClose();
    } catch (err) {
      console.error("Failed to save XP:", err);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="xp-dialog-title"
      tabIndex={-1}
      data-testid="xp-add-dialog"
    >
      <div
        className="mx-4 flex w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-lg border border-border bg-card p-6"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="xp-dialog-title" className="font-heading text-xl text-primary">
          {t("addXp")}
        </h3>

        {/* Total XP Amount */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="xp-amount">{t("xpAmount")}</Label>
          <Input
            id="xp-amount"
            type="number"
            min={1}
            value={xpAmount}
            onChange={(e) => setXpAmount(e.target.value)}
            placeholder="2000"
            autoFocus
            data-testid="xp-amount-input"
          />
        </div>

        {/* Per-class XP distribution (only for multiclass) */}
        {activeClasses.length > 1 && xpNum > 0 && (
          <div className="flex flex-col gap-3" data-testid="xp-distribution-section">
            {activeClasses.map((cc) => {
              const cls = CLASSES[cc.class_id as ClassId];
              const className = cls ? localized(cls.name, cls.name_en, locale) : cc.class_id;
              return (
                <div key={cc.class_id} className="flex flex-col gap-1">
                  <Label htmlFor={`xp-class-${cc.class_id}`}>
                    {t("xpClassLabel", { className })} (L{cc.level})
                  </Label>
                  <Input
                    id={`xp-class-${cc.class_id}`}
                    type="number"
                    min={0}
                    value={classXpMap[cc.class_id] ?? ""}
                    onChange={(e) => {
                      setHasManualOverride(true);
                      setClassXpOverrides((prev) => ({ ...prev, [cc.class_id]: e.target.value }));
                    }}
                    data-testid={`xp-class-input-${cc.class_id}`}
                  />
                </div>
              );
            })}

            {/* Remaining indicator */}
            <p
              className={`text-sm font-medium ${remaining < 0 ? "text-red-400" : remaining === 0 ? "text-green-400" : "text-muted-foreground"}`}
              data-testid="xp-remaining"
            >
              {t("xpRemaining", { xp: remaining })}
            </p>
          </div>
        )}

        {/* Session selection */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="xp-session">{t("xpSession")}</Label>
          <select
            id="xp-session"
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="rounded-md border border-input bg-input px-3 py-2 text-sm"
            data-testid="xp-session-select"
          >
            <option value="">{t("noSession")}</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({new Date(s.session_date).toLocaleDateString(locale)})
              </option>
            ))}
          </select>
        </div>

        {/* Note */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="xp-note">{t("xpNote")}</Label>
          <Input
            id="xp-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("xpNotePlaceholder")}
            data-testid="xp-note-input"
          />
        </div>

        {/* Per-class preview + next-level info */}
        <div
          className="flex flex-col gap-3 rounded-md border border-border p-3"
          data-testid="xp-preview-section"
        >
          <h4 className="text-sm font-medium text-muted-foreground">{t("xpPreview")}</h4>

          {previews.map((p) => (
            <div key={p.classId} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {p.className} (L{p.effectiveNewLevel})
                </span>
                {p.classXp > 0 && (
                  <span className="text-sm text-muted-foreground">+{p.classXp} XP</span>
                )}
              </div>

              {/* XP Progress Bar */}
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{ width: `${p.progressPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{p.effectiveNewXp.toLocaleString()} XP</span>
                <span>
                  {p.nextLevelXp
                    ? `${t("nextLevel")}: ${p.nextLevelXp.toLocaleString()} XP`
                    : t("maxLevel")}
                </span>
              </div>

              {/* Level-up indicator */}
              {p.preview && p.preview.levelsGained > 0 && (
                <div
                  className="rounded-md bg-green-900/30 px-3 py-2 text-sm text-green-300"
                  data-testid={`level-up-indicator-${p.classId}`}
                >
                  {t("levelUp")} {p.preview.currentLevel} → {p.preview.newLevel}
                </div>
              )}

              {/* Next-level changes (always shown) */}
              {p.nextLevelChanges.length > 0 && (
                <div className="flex flex-col gap-1 rounded bg-background/30 p-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("nextLevelPreview", { level: p.effectiveNewLevel + 1 })}
                  </span>
                  {p.nextLevelChanges.map((change, i) => (
                    <div key={i} className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {change.type === "thac0" && "THAC0"}
                        {change.type === "saves" && t("improvedSaves")}
                        {change.type === "spellSlots" && t("newSpellSlots")}
                        {change.type === "attacks" && t("attacksPerRound")}
                        {change.type === "weaponProf" && t("newProfSlots")}
                        {change.type === "nwpProf" && t("newNwpSlots")}
                        {change.type === "backstab" && t("backstab")}
                      </span>
                      {change.before && change.after ? (
                        <span>
                          {change.before} → <span className="text-green-400">{change.after}</span>
                        </span>
                      ) : (
                        <span className="text-green-400">✓</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} data-testid="xp-cancel-button">
            {tc("cancel")}
          </Button>
          <Button
            onClick={handleApply}
            disabled={saving || xpNum <= 0 || remaining < 0}
            data-testid="xp-apply-button"
          >
            {saving ? (
              <>
                <Spinner className="mr-2" />
                {tc("saving")}
              </>
            ) : (
              t("xpApply")
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
