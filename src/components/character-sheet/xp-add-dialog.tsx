"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { localized } from "@/lib/utils/localize";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { previewXpGain, getXpForNextLevel, getXpThreshold } from "@/lib/rules/experience";
import { getThac0, getSavingThrows, getAttacksPerRound } from "@/lib/rules/combat";
import {
  getBardSpellSlots,
  getWizardSpellSlots,
  getPriestSpellSlots,
} from "@/lib/rules/spellslots";
import { getWeaponProficiencySlots, getNonweaponProficiencySlots } from "@/lib/rules/proficiencies";
import { CLASSES } from "@/lib/rules/classes";
import type { CharacterClassRow, SessionRow } from "@/lib/supabase/types";
import type { ClassId, ClassGroup } from "@/lib/rules/types";

interface XpAddDialogProps {
  open: boolean;
  characterId: string;
  characterClasses: CharacterClassRow[];
  sessions: Pick<SessionRow, "id" | "title" | "session_date">[];
  onClose: () => void;
  onClassesChange: (classes: CharacterClassRow[]) => void;
}

interface ChangeItem {
  label: string;
  before: string;
  after: string;
  changed: boolean;
}

function getClassGroup(classId: string): ClassGroup {
  return CLASSES[classId as ClassId]?.group ?? "warrior";
}

function formatSpellSlots(slots: number[]): string {
  const nonZero = slots.filter((s) => s > 0);
  return nonZero.length > 0 ? nonZero.join("/") : "—";
}

export function XpAddDialog({
  open,
  characterId,
  characterClasses,
  sessions,
  onClose,
  onClassesChange,
}: XpAddDialogProps) {
  const t = useTranslations("sheet");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [xpAmount, setXpAmount] = useState<string>("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const activeClasses = characterClasses.filter((cc) => cc.is_active);
  const xpNum = parseInt(xpAmount) || 0;
  const xpPerClass = activeClasses.length > 0 ? Math.floor(xpNum / activeClasses.length) : 0;

  // Compute previews for each class
  const previews = useMemo(() => {
    if (xpPerClass <= 0) return [];

    return activeClasses.map((cc) => {
      const preview = previewXpGain(cc.class_id as ClassId, cc.level, cc.xp_current, xpPerClass);
      const group = getClassGroup(cc.class_id);
      const cls = CLASSES[cc.class_id as ClassId];
      const className = cls ? localized(cls.name, cls.name_en, locale) : cc.class_id;

      const changes: ChangeItem[] = [];

      // Level
      if (preview.levelsGained > 0) {
        changes.push({
          label: t("level"),
          before: String(preview.currentLevel),
          after: String(preview.newLevel),
          changed: true,
        });
      }

      // THAC0
      const oldThac0 = getThac0(group, preview.currentLevel);
      const newThac0 = getThac0(group, preview.newLevel);
      if (oldThac0 !== newThac0) {
        changes.push({
          label: "THAC0",
          before: String(oldThac0),
          after: String(newThac0),
          changed: true,
        });
      }

      // Saving Throws
      const oldSaves = getSavingThrows(group, preview.currentLevel);
      const newSaves = getSavingThrows(group, preview.newLevel);
      if (JSON.stringify(oldSaves) !== JSON.stringify(newSaves)) {
        changes.push({
          label: t("improvedSaves"),
          before: "",
          after: "",
          changed: true,
        });
      }

      // Spell Slots (bard — own table, max 6 spell levels)
      if (preview.classId === "bard") {
        const oldSlots = getBardSpellSlots(preview.currentLevel);
        const newSlots = getBardSpellSlots(preview.newLevel);
        if (JSON.stringify(oldSlots) !== JSON.stringify(newSlots)) {
          changes.push({
            label: t("newSpellSlots"),
            before: formatSpellSlots(oldSlots),
            after: formatSpellSlots(newSlots),
            changed: true,
          });
        }
      }

      // Spell Slots (wizard)
      if (group === "wizard" && preview.classId !== "bard") {
        const oldSlots = getWizardSpellSlots(preview.currentLevel);
        const newSlots = getWizardSpellSlots(preview.newLevel);
        if (JSON.stringify(oldSlots) !== JSON.stringify(newSlots)) {
          changes.push({
            label: t("newSpellSlots"),
            before: formatSpellSlots(oldSlots),
            after: formatSpellSlots(newSlots),
            changed: true,
          });
        }
      }

      // Spell Slots (priest)
      if (group === "priest") {
        const oldSlots = getPriestSpellSlots(preview.currentLevel);
        const newSlots = getPriestSpellSlots(preview.newLevel);
        if (JSON.stringify(oldSlots) !== JSON.stringify(newSlots)) {
          changes.push({
            label: t("newSpellSlots"),
            before: formatSpellSlots(oldSlots),
            after: formatSpellSlots(newSlots),
            changed: true,
          });
        }
      }

      // Attacks per round (warriors)
      if (group === "warrior") {
        const oldAtk = getAttacksPerRound(group, preview.currentLevel, false);
        const newAtk = getAttacksPerRound(group, preview.newLevel, false);
        if (oldAtk !== newAtk) {
          changes.push({
            label: t("attacksPerRound"),
            before: oldAtk,
            after: newAtk,
            changed: true,
          });
        }
      }

      // Weapon proficiency slots
      const oldWpSlots = getWeaponProficiencySlots(group, preview.currentLevel);
      const newWpSlots = getWeaponProficiencySlots(group, preview.newLevel);
      if (oldWpSlots !== newWpSlots) {
        changes.push({
          label: t("newProfSlots"),
          before: String(oldWpSlots),
          after: String(newWpSlots),
          changed: true,
        });
      }

      // NWP slots
      const oldNwpSlots = getNonweaponProficiencySlots(group, preview.currentLevel);
      const newNwpSlots = getNonweaponProficiencySlots(group, preview.newLevel);
      if (oldNwpSlots !== newNwpSlots) {
        changes.push({
          label: t("newNwpSlots"),
          before: String(oldNwpSlots),
          after: String(newNwpSlots),
          changed: true,
        });
      }

      // XP progress
      const nextLevelXp = getXpForNextLevel(cc.class_id as ClassId, preview.newLevel);
      const currentThreshold = getXpThreshold(cc.class_id as ClassId, preview.newLevel);
      const progressPct =
        nextLevelXp !== null && nextLevelXp > currentThreshold
          ? Math.min(
              100,
              Math.round(
                ((preview.newXp - currentThreshold) / (nextLevelXp - currentThreshold)) * 100
              )
            )
          : 100;

      return {
        classId: cc.class_id,
        className,
        preview,
        changes,
        xpPerClass,
        progressPct,
        nextLevelXp,
      };
    });
  }, [activeClasses, xpPerClass, locale, t]);

  async function handleApply() {
    if (xpNum <= 0) return;
    setSaving(true);

    const supabase = createClient();

    // Update each class's XP and level
    for (const cc of activeClasses) {
      const preview = previewXpGain(cc.class_id as ClassId, cc.level, cc.xp_current, xpPerClass);
      await supabase
        .from("character_classes")
        .update({ xp_current: preview.newXp, level: preview.newLevel })
        .eq("id", cc.id);
    }

    // Save to XP history
    await supabase.from("xp_history").insert({
      character_id: characterId,
      session_id: selectedSessionId || null,
      xp_amount: xpNum,
      note: note.trim(),
    });

    // Optimistic update: compute new XP/level for each class
    const updatedClasses = characterClasses.map((cc) => {
      if (!cc.is_active) return cc;
      const preview = previewXpGain(cc.class_id as ClassId, cc.level, cc.xp_current, xpPerClass);
      return { ...cc, xp_current: preview.newXp, level: preview.newLevel };
    });
    onClassesChange(updatedClasses);

    setSaving(false);
    setXpAmount("");
    setNote("");
    setSelectedSessionId("");
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
      data-testid="xp-add-dialog"
    >
      <div
        className="mx-4 flex w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-lg border border-border bg-card p-6"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-heading text-xl text-primary">{t("addXp")}</h3>

        {/* XP Amount */}
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

        {/* Multiclass hint */}
        {activeClasses.length > 1 && xpNum > 0 && (
          <p className="text-sm text-muted-foreground" data-testid="xp-split-info">
            {t("xpPerClass")}: {xpPerClass} XP ({activeClasses.length} {t("classes")})
          </p>
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

        {/* Preview */}
        {previews.length > 0 && (
          <div
            className="flex flex-col gap-3 rounded-md border border-border p-3"
            data-testid="xp-preview-section"
          >
            <h4 className="text-sm font-medium text-muted-foreground">{t("xpPreview")}</h4>

            {previews.map((p) => (
              <div key={p.classId} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{p.className}</span>
                  <span className="text-sm text-muted-foreground">+{p.xpPerClass} XP</span>
                </div>

                {/* XP Progress Bar */}
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${p.progressPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{p.preview.newXp.toLocaleString()} XP</span>
                  <span>
                    {p.nextLevelXp
                      ? `${t("nextLevel")}: ${p.nextLevelXp.toLocaleString()} XP`
                      : t("maxLevel")}
                  </span>
                </div>

                {/* Level-up indicator */}
                {p.preview.levelsGained > 0 && (
                  <div
                    className="rounded-md bg-green-900/30 px-3 py-2 text-sm text-green-300"
                    data-testid="level-up-indicator"
                  >
                    {t("levelUp")} {p.preview.currentLevel} → {p.preview.newLevel}
                  </div>
                )}

                {/* Changes */}
                {p.changes.length > 0 && (
                  <div className="flex flex-col gap-1 text-sm">
                    {p.changes.map((change, i) => (
                      <div key={i} className="flex justify-between text-muted-foreground">
                        <span>{change.label}</span>
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
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} data-testid="xp-cancel-button">
            {tc("cancel")}
          </Button>
          <Button
            onClick={handleApply}
            disabled={saving || xpNum <= 0}
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
