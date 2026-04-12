"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Sparkles } from "lucide-react";
import { CharacterModeNav } from "@/components/character-mode-nav";
import { createClient } from "@/lib/supabase/client";
import { DamageLevelCard } from "./damage-level-card";
import { SimpleEpicCard } from "./simple-epic-card";
import { BladeSystemCard } from "./blade-system-card";
import { getEpicEffects } from "@/lib/rules/epic-items";
import { getConstitutionModifiers } from "@/lib/rules/abilities";
import { getConBonusCap } from "@/lib/rules/hitpoints";
import { getClassGroup } from "@/lib/rules/classes";
import { getMulticlassHpDivisor } from "@/lib/rules/multiclass";
import type { CharacterRow, CharacterClassRow, EpicItemRow } from "@/lib/supabase/types";
import type { ClassId } from "@/lib/rules/types";

interface EpicEquipmentViewProps {
  character: Pick<
    CharacterRow,
    | "id"
    | "name"
    | "avatar_url"
    | "user_id"
    | "level"
    | "con"
    | "con_health"
    | "con_fitness"
    | "hp_max"
    | "hp_current"
  >;
  characterClasses: CharacterClassRow[];
  epicItems: EpicItemRow[];
  isOwner: boolean;
}

/**
 * Compute the HP delta that applies when the effective CON HP adjustment
 * differs from the stored value. Multiclass-aware (divisor applied per rules).
 */
function computeHpDelta(
  effectiveConHpAdj: number,
  storedConHpAdj: number,
  activeClasses: CharacterClassRow[]
): number {
  if (effectiveConHpAdj === storedConHpAdj) return 0;
  const divisor = getMulticlassHpDivisor(activeClasses.length);
  let totalDelta = 0;
  for (const cc of activeClasses) {
    const group = getClassGroup(cc.class_id as ClassId);
    const cap = getConBonusCap(group);
    // Apply cap only to positive bonuses (penalties are uncapped per AD&D rules)
    const cappedNew = effectiveConHpAdj < 0 ? effectiveConHpAdj : Math.min(effectiveConHpAdj, cap);
    const cappedOld = storedConHpAdj < 0 ? storedConHpAdj : Math.min(storedConHpAdj, cap);
    totalDelta += (cappedNew - cappedOld) * cc.level;
  }
  return Math.round(totalDelta / divisor);
}

export function EpicEquipmentView({
  character,
  characterClasses,
  epicItems,
  isOwner,
}: EpicEquipmentViewProps) {
  const t = useTranslations("epic");
  const locale = useLocale();
  const [items, setItems] = useState<EpicItemRow[]>(epicItems);
  const [hpCurrent, setHpCurrent] = useState(character.hp_current);

  /**
   * After toggling equipped/damage_level for an item that changes effective CON,
   * persist the updated hp_current to the DB so that re-equipping doesn't
   * "heal" the character back to a higher current_hp. Christoph's rule:
   * CON↑ → max_hp rises, current_hp stays. CON↓ → current_hp is clamped down.
   */
  async function persistHpAfterConChange(newItems: EpicItemRow[]): Promise<void> {
    const activeClasses = characterClasses.filter((cc) => cc.is_active);
    const effectsBefore = getEpicEffects(items, character.level);
    const effectsAfter = getEpicEffects(newItems, character.level);

    const before = effectsBefore.forceStatOverrides.con ?? effectsBefore.statOverrides.con;
    const after = effectsAfter.forceStatOverrides.con ?? effectsAfter.statOverrides.con;
    const effectiveConBefore = before ?? character.con;
    const effectiveConAfter = after ?? character.con;
    if (effectiveConBefore === effectiveConAfter) return;

    // Compute effective max/current BEFORE and AFTER the toggle and apply the
    // asymmetric clamping rule on the stored current_hp.
    const storedConHpAdj = getConstitutionModifiers(
      character.con,
      character.con_health ?? undefined,
      character.con_fitness ?? undefined
    ).hpAdj;
    const effectiveConAfterMods = getConstitutionModifiers(effectiveConAfter).hpAdj;
    const effectiveConBeforeMods = getConstitutionModifiers(effectiveConBefore).hpAdj;

    const deltaBefore = computeHpDelta(effectiveConBeforeMods, storedConHpAdj, activeClasses);
    const deltaAfter = computeHpDelta(effectiveConAfterMods, storedConHpAdj, activeClasses);
    const effectiveMaxBefore = Math.max(1, character.hp_max + deltaBefore);
    const effectiveMaxAfter = Math.max(1, character.hp_max + deltaAfter);

    // Current HP visible BEFORE the toggle (this is what the player "has")
    const visibleCurrentBefore = Math.min(hpCurrent, effectiveMaxBefore);
    // Desired stored current_hp so that after the toggle the effective value
    // stays at visibleCurrentBefore (CON↓) or stays at visibleCurrentBefore
    // (CON↑, because max went up but current should not heal).
    const desiredEffectiveCurrent = Math.min(visibleCurrentBefore, effectiveMaxAfter);

    // Persist raw hp_current = desiredEffectiveCurrent (the same value, since
    // our computation uses raw hp_current as the display value + delta clamp).
    // After toggle, the effective view will be min(new stored + min(0, delta
    // from stored→after), effectiveMaxAfter). With delta=0 for the new stored
    // baseline, visible = new stored = desiredEffectiveCurrent.
    if (desiredEffectiveCurrent === hpCurrent) return;
    setHpCurrent(desiredEffectiveCurrent);
    const supabase = createClient();
    await supabase
      .from("characters")
      .update({ hp_current: desiredEffectiveCurrent })
      .eq("id", character.id);
  }

  async function handleToggleEquip(itemId: string) {
    const item = items.find((i) => i.id === itemId);
    if (!item || !isOwner) return;

    const newEquipped = !item.equipped;
    const newItems = items.map((i) => (i.id === itemId ? { ...i, equipped: newEquipped } : i));

    // Optimistic update
    setItems(newItems);

    const supabase = createClient();
    const { error } = await supabase
      .from("epic_items")
      .update({ equipped: newEquipped })
      .eq("id", itemId);

    if (error) {
      // Rollback on error
      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, equipped: !newEquipped } : i)));
      return;
    }

    await persistHpAfterConChange(newItems);
  }

  async function handleDamageLevelChange(itemId: string, newLevel: number) {
    const item = items.find((i) => i.id === itemId);
    if (!item || !isOwner) return;

    const oldLevel = item.damage_level;
    const newItems = items.map((i) => (i.id === itemId ? { ...i, damage_level: newLevel } : i));

    // Optimistic update
    setItems(newItems);

    const supabase = createClient();
    const { error } = await supabase
      .from("epic_items")
      .update({ damage_level: newLevel })
      .eq("id", itemId);

    if (error) {
      // Rollback
      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, damage_level: oldLevel } : i)));
      return;
    }

    // Damage level changes alter the CON override on items like the Kondensator
    await persistHpAfterConChange(newItems);
  }

  async function handleOverclockToggle(itemId: string, active: boolean, endTime: number | null) {
    const item = items.find((i) => i.id === itemId);
    if (!item || !isOwner) return;

    const oldEffects = { ...item.simple_effects } as Record<string, unknown>;

    // Optimistic update
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? {
              ...i,
              simple_effects: {
                ...i.simple_effects,
                overclock_active: active,
                overclock_end_time: endTime,
              },
            }
          : i
      )
    );

    const supabase = createClient();
    const newEffects = {
      ...item.simple_effects,
      overclock_active: active,
      overclock_end_time: endTime,
    };
    const { error } = await supabase
      .from("epic_items")
      .update({ simple_effects: newEffects })
      .eq("id", itemId);

    if (error) {
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, simple_effects: oldEffects } : i))
      );
    }
  }

  return (
    <div className="flex w-full flex-col gap-6 p-4 sm:p-6" data-testid="epic-equipment-page">
      {/* Mode Navigation */}
      <CharacterModeNav characterId={character.id} hasEpicItems={true} />

      <div className="flex items-center gap-4">
        {character.avatar_url ? (
          <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-primary/30">
            <Image
              src={character.avatar_url}
              alt={character.name}
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary/30 bg-muted font-heading text-lg">
            {character.name.charAt(0)}
          </div>
        )}
        <div>
          <h1
            className="flex items-center gap-2 font-heading text-2xl text-primary"
            data-testid="epic-title"
          >
            <Sparkles className="h-6 w-6" />
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{character.name}</p>
        </div>
      </div>

      {/* Item list */}
      {items.length === 0 ? (
        <div
          className="glass rounded-xl p-8 text-center text-muted-foreground"
          data-testid="epic-no-items"
        >
          {t("noItems")}
        </div>
      ) : (
        <div className="flex flex-col gap-4" data-testid="epic-items-list">
          {items.map((item) => {
            const isBladeSystem =
              (item.simple_effects as Record<string, unknown>)?.type === "blade_system";
            if (item.max_damage_level > 0) {
              return (
                <DamageLevelCard
                  key={item.id}
                  item={item}
                  locale={locale}
                  isOwner={isOwner}
                  characterLevel={character.level}
                  onToggleEquip={handleToggleEquip}
                  onDamageLevelChange={handleDamageLevelChange}
                  onOverclockToggle={handleOverclockToggle}
                />
              );
            }
            if (isBladeSystem) {
              return (
                <BladeSystemCard
                  key={item.id}
                  item={item}
                  locale={locale}
                  isOwner={isOwner}
                  onToggleEquip={handleToggleEquip}
                />
              );
            }
            return (
              <SimpleEpicCard
                key={item.id}
                item={item}
                locale={locale}
                isOwner={isOwner}
                onToggleEquip={handleToggleEquip}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
