"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { multiclassHasExceptionalStr } from "@/lib/rules/multiclass";
import { isPriestCaster } from "@/lib/rules/magic";
import type { ClassId } from "@/lib/rules/types";
import { Spinner } from "@/components/ui/spinner";
import { StepBasics } from "./step-basics";
import { StepAbilities } from "./step-abilities";
import { StepRace } from "./step-race";
import { StepClass } from "./step-class";
import { StepKit } from "./step-kit";
import { StepPriesthood } from "./step-priesthood";
import { StepCombat } from "./step-combat";
import { StepSummary } from "./step-summary";
import { WIZARD_STEPS, INITIAL_WIZARD_STATE, type WizardState } from "./wizard-types";

const STEP_LABEL_KEYS = [
  "basics",
  "abilities",
  "race",
  "class",
  "kit",
  "priesthood",
  "combat",
  "summary",
] as const;

interface CharacterWizardProps {
  basePath?: string;
  isNpc?: boolean;
}

export function CharacterWizard({
  basePath = "/characters",
  isNpc = false,
}: CharacterWizardProps = {}) {
  const router = useRouter();
  const t = useTranslations("wizard");
  const tc = useTranslations("common");
  const [currentStep, setCurrentStep] = useState(0);
  const [state, setState] = useState<WizardState>(INITIAL_WIZARD_STATE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateState(updates: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...updates }));
  }

  function canProceed(): boolean {
    switch (WIZARD_STEPS[currentStep].id) {
      case "basics":
        return state.name.trim().length > 0 && state.level >= 1;
      case "abilities":
        return true;
      case "race":
        return state.raceId !== null;
      case "class":
        return state.classIds.length > 0;
      case "kit":
        return true;
      case "priesthood":
        return true;
      case "combat":
        return state.hpMax >= 1;
      case "summary":
        return true;
      default:
        return false;
    }
  }

  const isWarriorClass = multiclassHasExceptionalStr(state.classIds);
  const isPriest = state.classIds.some((id) => isPriestCaster(id as ClassId));

  function shouldSkipStep(stepIndex: number): boolean {
    const stepId = WIZARD_STEPS[stepIndex]?.id;
    if (stepId === "priesthood" && !isPriest) return true;
    return false;
  }

  function goToNextStep() {
    let next = currentStep + 1;
    while (next < WIZARD_STEPS.length && shouldSkipStep(next)) next++;
    setCurrentStep(next);
  }

  function goToPrevStep() {
    let prev = currentStep - 1;
    while (prev >= 0 && shouldSkipStep(prev)) prev--;
    setCurrentStep(Math.max(0, prev));
  }

  async function handleCreate() {
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError(tc("notLoggedIn"));
      setSaving(false);
      return;
    }

    // Insert character (class_id = first class for backward compat)
    const { data, error: insertError } = await supabase
      .from("characters")
      .insert({
        user_id: user.id,
        name: state.name.trim(),
        level: state.level,
        alignment: state.alignment,
        race_id: state.raceId,
        class_id: state.classIds[0] ?? null,
        str: state.str,
        str_exceptional: isWarriorClass && state.str === 18 ? state.strExceptional : null,
        dex: state.dex,
        con: state.con,
        int: state.int,
        wis: state.wis,
        cha: state.cha,
        hp_current: state.hpMax,
        hp_max: state.hpMax,
        kit: state.kit,
        deity: state.deity.trim() || null,
        priesthood: state.priesthood,
        ...(isNpc ? { is_npc: true, npc_visible_to_players: false, is_active: false } : {}),
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    // Insert character_classes entries
    if (state.classIds.length > 0) {
      const classRows = state.classIds.map((classId) => ({
        character_id: data.id,
        class_id: classId,
        level: state.level,
        xp_current: 0,
      }));

      const { error: classError } = await supabase.from("character_classes").insert(classRows);

      if (classError) {
        setError(classError.message);
        setSaving(false);
        return;
      }
    }

    router.push(`${basePath}/${data.id}/manage`);
  }

  const isLastStep = currentStep === WIZARD_STEPS.length - 1;

  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6"
      data-testid="character-wizard"
    >
      {/* Progress indicator */}
      <div className="flex gap-1">
        {WIZARD_STEPS.map((step, i) => (
          <div
            key={step.id}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= currentStep ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <h2 className="font-heading text-2xl text-primary">{t(STEP_LABEL_KEYS[currentStep])}</h2>

      {/* Step content */}
      {WIZARD_STEPS[currentStep].id === "basics" && (
        <StepBasics state={state} onChange={updateState} />
      )}
      {WIZARD_STEPS[currentStep].id === "abilities" && (
        <StepAbilities state={state} onChange={updateState} showExceptionalStr={isWarriorClass} />
      )}
      {WIZARD_STEPS[currentStep].id === "race" && <StepRace state={state} onChange={updateState} />}
      {WIZARD_STEPS[currentStep].id === "class" && (
        <StepClass state={state} onChange={updateState} />
      )}
      {WIZARD_STEPS[currentStep].id === "kit" && <StepKit state={state} onChange={updateState} />}
      {WIZARD_STEPS[currentStep].id === "priesthood" && (
        <StepPriesthood state={state} onChange={updateState} />
      )}
      {WIZARD_STEPS[currentStep].id === "combat" && (
        <StepCombat state={state} onChange={updateState} />
      )}
      {WIZARD_STEPS[currentStep].id === "summary" && <StepSummary state={state} />}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={goToPrevStep}
          disabled={currentStep === 0}
          data-testid="wizard-prev-button"
        >
          {tc("back")}
        </Button>

        {isLastStep ? (
          <Button
            onClick={handleCreate}
            disabled={saving || !canProceed()}
            data-testid="wizard-create-button"
          >
            {saving ? (
              <>
                <Spinner className="mr-2" />
                {t("creating")}
              </>
            ) : (
              t("createCharacter")
            )}
          </Button>
        ) : (
          <Button onClick={goToNextStep} disabled={!canProceed()} data-testid="wizard-next-button">
            {tc("next")}
          </Button>
        )}
      </div>

      <p
        id="wizard-error"
        role="alert"
        className={`text-sm text-destructive ${error ? "" : "sr-only"}`}
        data-testid="wizard-error"
      >
        {error ?? ""}
      </p>
    </div>
  );
}
