"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { PlayHpBar } from "./play-hp-bar";
import { PlayCombatPanel } from "./play-combat-panel";
import { PlaySpellbookPanel } from "./play-spellbook-panel";
import { PlayChecksPanel } from "./play-checks-panel";
import { PlayInventoryPanel } from "./play-inventory-panel";
import { PlayCoinPursePanel } from "./play-coin-purse-panel";
import { PlayTurnUndeadPanel } from "./play-turn-undead-panel";
import { PlayAbilitiesPanel } from "./play-abilities-panel";
import { PlayOverclockBanner } from "./play-overclock-banner";
import { RACES } from "@/lib/rules/races";
import { getActivePowers } from "@/lib/rules/priesthoods";
import {
  getMulticlassThac0,
  getMulticlassSaves,
  getMulticlassGroups,
  getMulticlassHpDivisor,
} from "@/lib/rules/multiclass";
import type { ClassId, RaceId } from "@/lib/rules/types";
import {
  getStrengthModifiers,
  getDexterityModifiers,
  getConstitutionModifiers,
  getIntelligenceModifiers,
  getWisdomModifiers,
  getCharismaModifiers,
} from "@/lib/rules/abilities";
import {
  calculateAC,
  calculateEncumbrance,
  getMovementRate,
  isShieldItem,
} from "@/lib/rules/equipment";
import { hasThiefSkills, getBackstabMultiplier } from "@/lib/rules/thief";
import { getConBonusCap } from "@/lib/rules/hitpoints";
import { getClassGroup } from "@/lib/rules/classes";
import { getEpicEffects, scaleSubStat } from "@/lib/rules/epic-items";
import type { EpicEffects } from "@/lib/rules/epic-items";
import { getClassGroupColors } from "@/lib/utils/class-colors";
import { getKit } from "@/lib/rules/kits";
import {
  priesthoodHasTurnUndead,
  priesthoodHasCommandUndead,
  getPriesthood,
} from "@/lib/rules/priesthoods";
import { localized } from "@/lib/utils/localize";
import { CharacterModeNav } from "@/components/character-mode-nav";
import type {
  CharacterRow,
  CharacterClassRow,
  CharacterEquipmentWithDetails,
  CharacterSpellWithDetails,
  CharacterWeaponProficiencyRow,
  CharacterNWPWithDetails,
  CharacterInventoryWithDetails,
  EpicItemRow,
  SpellRow,
} from "@/lib/supabase/types";
import type { CoinPurse } from "@/lib/rules/equipment";

// Icons as simple SVG components
function SwordIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
      <line x1="13" y1="19" x2="19" y2="13" />
      <line x1="16" y1="16" x2="20" y2="20" />
      <line x1="19" y1="21" x2="21" y2="19" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275z" />
    </svg>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function BackpackIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M9 6V4a3 3 0 0 1 6 0v2" />
      <path d="M8 21v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5" />
    </svg>
  );
}

function CoinsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
    </svg>
  );
}

type PanelId =
  | "combat"
  | "spellbook"
  | "turnUndead"
  | "abilities"
  | "checks"
  | "inventory"
  | "coinPurse";

interface PlayModeProps {
  character: CharacterRow;
  characterClasses: CharacterClassRow[];
  userId: string;
  equipment: CharacterEquipmentWithDetails[];
  spells: CharacterSpellWithDetails[];
  weaponProficiencies: CharacterWeaponProficiencyRow[];
  nonweaponProficiencies: CharacterNWPWithDetails[];
  inventory: CharacterInventoryWithDetails[];
  epicItems?: EpicItemRow[];
  priestAvailableSpells?: SpellRow[];
}

export function PlayMode({
  character: initialCharacter,
  characterClasses,
  userId,
  equipment: initialEquipment,
  spells: initialSpells,
  weaponProficiencies,
  nonweaponProficiencies,
  inventory: initialInventory,
  epicItems = [],
  priestAvailableSpells = [],
}: PlayModeProps) {
  const t = useTranslations("playMode");
  const locale = useLocale();
  const [character, setCharacter] = useState(initialCharacter);
  const [equipment, setEquipment] = useState(initialEquipment);
  const [spells, setSpells] = useState(initialSpells);
  const [inventory, setInventory] = useState(initialInventory);
  const [activePanel, setActivePanel] = useState<PanelId>("combat");

  const isOwner = character.user_id === userId;

  // Epic item effects (with auto-unlock based on character level)
  const characterLevel = character.level;
  const epicEffects: EpicEffects = useMemo(
    () => getEpicEffects(epicItems, characterLevel),
    [epicItems, characterLevel]
  );
  // Overclock state — read from epicItems simple_effects (persisted in DB via Epic Equipment page)
  let overclockState = { active: false, endTime: null as number | null };
  for (const item of epicItems) {
    if (!item.equipped) continue;
    const se = item.simple_effects as Record<string, unknown> | null;
    if (se?.overclock_active) {
      const endTime = (se.overclock_end_time as number | null) ?? null;
      overclockState = { active: true, endTime };
      break;
    }
  }
  const overclockActive = overclockState.active;

  const eo = epicEffects.statOverrides;

  // Overclock is only effective when the ability exists and is active
  const overclockEffective = overclockActive && epicEffects.overclockAbility != null;

  // Effective stats (with epic overrides + overclock)
  const effectiveStr = eo.str ?? character.str;
  const effectiveDex = eo.dex ?? character.dex;
  const effectiveCon = overclockEffective
    ? epicEffects.overclockAbility!.conOverride
    : (eo.con ?? character.con);
  const effectiveInt = eo.int ?? character.int;
  const effectiveWis = eo.wis ?? character.wis;
  const effectiveCha = eo.cha ?? character.cha;

  // Derived rules engine values
  const activeClasses = useMemo(
    () => characterClasses.filter((cc) => cc.is_active),
    [characterClasses]
  );
  const classEntries = useMemo(
    () => activeClasses.map((cc) => ({ classId: cc.class_id as ClassId, level: cc.level })),
    [activeClasses]
  );
  const classIds = useMemo(
    () => activeClasses.map((cc) => cc.class_id as ClassId),
    [activeClasses]
  );
  const classGroups = useMemo(() => getMulticlassGroups(classIds), [classIds]);
  const primaryGroup = classGroups[0] ?? "warrior";

  // Dual-class: use effective entries (dormant = only new class, active = best of both)
  const effectiveClassEntries = useMemo(() => {
    const dualOrig = characterClasses.find((cc) => cc.switch_level != null);
    if (!dualOrig) return classEntries;
    const dualNew = activeClasses.find((cc) => cc.class_id !== dualOrig.class_id);
    if (!dualNew) return classEntries;
    const dormant = dualNew.level <= dualOrig.switch_level!;
    if (dormant) return [{ classId: dualNew.class_id as ClassId, level: dualNew.level }];
    return [
      { classId: dualOrig.class_id as ClassId, level: dualOrig.switch_level! },
      { classId: dualNew.class_id as ClassId, level: dualNew.level },
    ];
  }, [characterClasses, activeClasses, classEntries]);

  const thac0 = useMemo(() => getMulticlassThac0(effectiveClassEntries), [effectiveClassEntries]);
  const saves = useMemo(() => getMulticlassSaves(effectiveClassEntries), [effectiveClassEntries]);

  const strMods = useMemo(
    () =>
      getStrengthModifiers(
        effectiveStr,
        character.str_exceptional ?? undefined,
        eo.str != null
          ? (scaleSubStat(character.str, character.str_muscle, effectiveStr) ?? undefined)
          : (character.str_muscle ?? undefined),
        eo.str != null
          ? (scaleSubStat(character.str, character.str_stamina, effectiveStr) ?? undefined)
          : (character.str_stamina ?? undefined)
      ),
    [
      effectiveStr,
      character.str,
      character.str_exceptional,
      character.str_muscle,
      character.str_stamina,
      eo.str,
    ]
  );
  const dexMods = useMemo(
    () =>
      getDexterityModifiers(
        effectiveDex,
        eo.dex != null
          ? (scaleSubStat(character.dex, character.dex_aim, effectiveDex) ?? undefined)
          : (character.dex_aim ?? undefined),
        eo.dex != null
          ? (scaleSubStat(character.dex, character.dex_balance, effectiveDex) ?? undefined)
          : (character.dex_balance ?? undefined)
      ),
    [effectiveDex, character.dex, character.dex_aim, character.dex_balance, eo.dex]
  );
  const conIsOverridden = overclockEffective || eo.con != null;
  const conMods = useMemo(
    () =>
      getConstitutionModifiers(
        effectiveCon,
        conIsOverridden
          ? (scaleSubStat(character.con, character.con_health, effectiveCon) ?? undefined)
          : (character.con_health ?? undefined),
        conIsOverridden
          ? (scaleSubStat(character.con, character.con_fitness, effectiveCon) ?? undefined)
          : (character.con_fitness ?? undefined)
      ),
    [effectiveCon, character.con, character.con_health, character.con_fitness, conIsOverridden]
  );
  const intMods = useMemo(
    () =>
      getIntelligenceModifiers(
        effectiveInt,
        eo.int != null
          ? (scaleSubStat(character.int, character.int_knowledge, effectiveInt) ?? undefined)
          : (character.int_knowledge ?? undefined),
        eo.int != null
          ? (scaleSubStat(character.int, character.int_reason, effectiveInt) ?? undefined)
          : (character.int_reason ?? undefined)
      ),
    [effectiveInt, character.int, character.int_knowledge, character.int_reason, eo.int]
  );
  const wisMods = useMemo(
    () =>
      getWisdomModifiers(
        effectiveWis,
        eo.wis != null
          ? (scaleSubStat(character.wis, character.wis_intuition, effectiveWis) ?? undefined)
          : (character.wis_intuition ?? undefined),
        eo.wis != null
          ? (scaleSubStat(character.wis, character.wis_willpower, effectiveWis) ?? undefined)
          : (character.wis_willpower ?? undefined)
      ),
    [effectiveWis, character.wis, character.wis_intuition, character.wis_willpower, eo.wis]
  );
  const chaMods = useMemo(
    () =>
      getCharismaModifiers(
        effectiveCha,
        eo.cha != null
          ? (scaleSubStat(character.cha, character.cha_leadership, effectiveCha) ?? undefined)
          : (character.cha_leadership ?? undefined),
        eo.cha != null
          ? (scaleSubStat(character.cha, character.cha_appearance, effectiveCha) ?? undefined)
          : (character.cha_appearance ?? undefined)
      ),
    [effectiveCha, character.cha, character.cha_leadership, character.cha_appearance, eo.cha]
  );

  // HP adjustment from epic CON overrides
  // hp_max in DB is based on base CON. If epic items change CON, adjust HP accordingly.
  // Non-warriors are capped at +2 HP/level from CON (warriors get up to +4).
  // For multiclass: each class contributes (cappedAdj × level), sum is divided by class count.
  const baseConMods = useMemo(
    () =>
      getConstitutionModifiers(
        character.con,
        character.con_health ?? undefined,
        character.con_fitness ?? undefined
      ),
    [character.con, character.con_health, character.con_fitness]
  );
  const hpDelta = useMemo(() => {
    if (conMods.hpAdj === baseConMods.hpAdj) return 0;
    const divisor = getMulticlassHpDivisor(activeClasses.length);
    let totalDelta = 0;
    for (const cc of activeClasses) {
      const group = getClassGroup(cc.class_id as ClassId);
      const cap = getConBonusCap(group);
      const cappedNew = Math.min(conMods.hpAdj, cap);
      const cappedOld = Math.min(baseConMods.hpAdj, cap);
      totalDelta += (cappedNew - cappedOld) * cc.level;
    }
    return Math.round(totalDelta / divisor);
  }, [activeClasses, conMods.hpAdj, baseConMods.hpAdj]);
  const effectiveHpMax = Math.max(1, character.hp_max + hpDelta);
  const effectiveHpCurrent = Math.max(0, Math.min(character.hp_current + hpDelta, effectiveHpMax));

  // Equipment calculations
  const equippedArmor = useMemo(
    () => equipment.find((e) => e.equipped && e.armor && !isShieldItem(e.armor.name)),
    [equipment]
  );
  const equippedShield = useMemo(
    () => equipment.some((e) => e.equipped && e.armor && isShieldItem(e.armor.name)),
    [equipment]
  );
  const totalWeight = useMemo(() => {
    const eqWeight = equipment.reduce((sum, e) => {
      const w = e.weapon?.weight ?? e.armor?.weight ?? 0;
      return sum + w * e.quantity;
    }, 0);
    const invWeight = inventory.reduce((sum, i) => {
      const w = i.item?.weight ?? 0;
      return sum + w * i.quantity;
    }, 0);
    return eqWeight + invWeight;
  }, [equipment, inventory]);
  const encumbranceLevel = useMemo(
    () => calculateEncumbrance(totalWeight, strMods.weightAllow),
    [totalWeight, strMods.weightAllow]
  );
  const movementRate = useMemo(
    () => getMovementRate(12, character.ignore_encumbrance ? "unencumbered" : encumbranceLevel),
    [encumbranceLevel, character.ignore_encumbrance]
  );

  const isMagicalProtection = equippedArmor?.armor?.is_magical_protection ?? false;

  const ac = useMemo(
    () =>
      calculateAC({
        equippedArmorAC: equippedArmor?.armor?.ac ?? null,
        shieldEquipped: equippedShield,
        dexDefenseAdj: dexMods.defensiveAdj,
        classGroups,
        encumbrance: encumbranceLevel,
        ignoreEncumbrance: character.ignore_encumbrance,
        isMagicalProtection,
        epicAcBonus: epicEffects.acBonus,
      }),
    [
      equippedArmor,
      equippedShield,
      dexMods.defensiveAdj,
      classGroups,
      encumbranceLevel,
      character.ignore_encumbrance,
      epicEffects.acBonus,
      isMagicalProtection,
    ]
  );

  const showSpells = useMemo(
    () => classGroups.some((g) => g === "wizard" || g === "priest") || classIds.includes("bard"),
    [classGroups, classIds]
  );
  const showThiefSkills = useMemo(() => hasThiefSkills(classIds), [classIds]);

  // Turn Undead: show for generic clerics, priesthoods with Turn/Command Undead, or paladins (L3+)
  const turnUndeadInfo = useMemo(() => {
    const isCleric = classIds.includes("cleric");
    const isPaladinClass = classIds.includes("paladin");
    const priesthoodId = character.priesthood;
    const evilAlignments = ["chaotic_evil", "neutral_evil", "lawful_evil"];
    const charIsEvil = evilAlignments.includes(character.alignment ?? "");

    if (isCleric) {
      const clericEntry = activeClasses.find((c) => c.class_id === "cleric");
      const level = clericEntry?.level ?? 1;

      // Check for Command Undead (e.g. Death priesthood — always command, regardless of alignment)
      if (priesthoodId && priesthoodHasCommandUndead(priesthoodId)) {
        return { show: true, level, isPaladin: false, isEvil: true };
      }

      // Generic cleric (no priesthood) always has Turn Undead
      // Priesthood cleric: check if priesthood grants Turn Undead
      const hasTurn = !priesthoodId || priesthoodHasTurnUndead(priesthoodId);
      if (hasTurn) {
        return { show: true, level, isPaladin: false, isEvil: charIsEvil };
      }
    }

    if (isPaladinClass) {
      const paladinEntry = activeClasses.find((c) => c.class_id === "paladin");
      const pLevel = paladinEntry?.level ?? 1;
      if (pLevel >= 3) {
        return { show: true, level: pLevel, isPaladin: true, isEvil: false };
      }
    }

    return { show: false, level: 0, isPaladin: false, isEvil: false };
  }, [classIds, character.priesthood, character.alignment, activeClasses]);

  // Abilities panel: show if race has abilities or priesthood has granted powers
  const showAbilities = useMemo(() => {
    const race = RACES[character.race_id as RaceId];
    const hasRacialAbilities = (race?.racialAbilities?.length ?? 0) > 0;
    const priestClass = activeClasses.find(
      (cc) => cc.class_id === "cleric" || cc.class_id === "druid"
    );
    const hasGrantedPowers =
      character.priesthood && priestClass
        ? getActivePowers(character.priesthood, priestClass.level).length > 0
        : false;
    return hasRacialAbilities || hasGrantedPowers;
  }, [character.race_id, character.priesthood, activeClasses]);

  const priestClassForAbilities = useMemo(() => {
    return activeClasses.find((cc) => cc.class_id === "cleric" || cc.class_id === "druid");
  }, [activeClasses]);

  const backstabMultiplier = useMemo(() => {
    if (!showThiefSkills) return null;
    const thiefClass = activeClasses.find(
      (cc) => cc.class_id === "thief" || cc.class_id === "bard"
    );
    return thiefClass ? getBackstabMultiplier(thiefClass.level) : null;
  }, [showThiefSkills, activeClasses]);

  // Poison save penalty from overclock
  const poisonSavePenalty = overclockEffective
    ? epicEffects.overclockAbility!.poisonSavePenalty
    : 0;

  const colors = getClassGroupColors(primaryGroup);
  const kitDef = useMemo(() => getKit(character.kit), [character.kit]);
  const kitDisplayName = kitDef ? localized(kitDef.name, kitDef.name_en, locale) : null;
  const priesthoodDef = useMemo(
    () => (character.priesthood ? getPriesthood(character.priesthood) : null),
    [character.priesthood]
  );
  const priesthoodDisplayName = priesthoodDef
    ? localized(priesthoodDef.name, priesthoodDef.name_en, locale)
    : null;

  // Coin purse
  const coinPurse: CoinPurse = useMemo(
    () => ({
      pp: character.gold_pp,
      gp: character.gold_gp,
      ep: character.gold_ep,
      sp: character.gold_sp,
      cp: character.gold_cp,
    }),
    [character.gold_pp, character.gold_gp, character.gold_ep, character.gold_sp, character.gold_cp]
  );

  // Instant DB write helper
  const updateCharacter = useCallback(
    async (updates: Partial<CharacterRow>) => {
      setCharacter((prev) => ({ ...prev, ...updates }));
      const supabase = createClient();
      const { error } = await supabase.from("characters").update(updates).eq("id", character.id);
      if (error) console.error("Failed to update character:", error);
    },
    [character.id]
  );

  function handleHpChange(newEffectiveHp: number) {
    // Convert effective HP back to base HP for DB storage
    const baseHp = newEffectiveHp - hpDelta;
    updateCharacter({ hp_current: Math.max(0, baseHp) });
  }

  function handleCoinChange(newPurse: CoinPurse) {
    updateCharacter({
      gold_pp: newPurse.pp,
      gold_gp: newPurse.gp,
      gold_ep: newPurse.ep,
      gold_sp: newPurse.sp,
      gold_cp: newPurse.cp,
    });
  }

  async function handleCastSpell(spellId: string, pointsCost: number) {
    if (character.spell_system === "points") {
      const newUsed = character.spell_points_used + pointsCost;
      updateCharacter({ spell_points_used: newUsed });
    } else {
      // Slots mode: mark first non-expended instance as expended
      let marked = false;
      setSpells((prev) =>
        prev.map((s) => {
          if (!marked && s.spell_id === spellId && s.prepared && !s.expended) {
            marked = true;
            return { ...s, expended: true };
          }
          return s;
        })
      );
      const supabase = createClient();
      // Only mark one row — use prepared=true and expended=false filter with limit
      const { error } = await supabase
        .from("character_spells")
        .update({ expended: true })
        .eq("character_id", character.id)
        .eq("spell_id", spellId)
        .eq("prepared", true)
        .eq("expended", false);
      if (error) console.error("Failed to mark spell as expended:", error);
    }
  }

  async function handleRest() {
    if (character.spell_system === "points") {
      updateCharacter({ spell_points_used: 0 });
    } else {
      setSpells((prev) => prev.map((s) => (s.prepared ? { ...s, expended: false } : s)));
      const supabase = createClient();
      const { error } = await supabase
        .from("character_spells")
        .update({ expended: false })
        .eq("character_id", character.id)
        .eq("prepared", true);
      if (error) console.error("Failed to reset spell slots:", error);
    }
  }

  const panels: { id: PanelId; label: string; icon: React.ReactNode; show: boolean }[] = [
    { id: "combat", label: t("combat"), icon: <SwordIcon className="h-4 w-4" />, show: true },
    {
      id: "spellbook",
      label: t("spellbook"),
      icon: <SparklesIcon className="h-4 w-4" />,
      show: showSpells,
    },
    {
      id: "turnUndead",
      label: locale === "de" ? "Untote" : "Undead",
      icon: <TargetIcon className="h-4 w-4" />,
      show: turnUndeadInfo.show,
    },
    {
      id: "abilities",
      label: t("abilities"),
      icon: <SparklesIcon className="h-4 w-4" />,
      show: showAbilities,
    },
    { id: "checks", label: t("checks"), icon: <TargetIcon className="h-4 w-4" />, show: true },
    {
      id: "inventory",
      label: t("inventory"),
      icon: <BackpackIcon className="h-4 w-4" />,
      show: true,
    },
    { id: "coinPurse", label: t("coinPurse"), icon: <CoinsIcon className="h-4 w-4" />, show: true },
  ];

  const visiblePanels = panels.filter((p) => p.show);

  return (
    <div className="mx-auto w-full max-w-7xl" data-testid="play-mode">
      <div className="flex justify-end px-4 pt-3">
        <CharacterModeNav characterId={character.id} hasEpicItems={epicItems.length > 0} />
      </div>
      <PlayHpBar
        characterId={character.id}
        name={character.name}
        avatarUrl={character.avatar_url}
        hpCurrent={effectiveHpCurrent}
        hpMax={effectiveHpMax}
        ac={ac}
        thac0={thac0}
        classGroup={primaryGroup}
        kitName={kitDisplayName}
        deity={character.deity}
        priesthoodName={priesthoodDisplayName}
        onHpChange={handleHpChange}
      />

      {/* Overclock banner (Kondensator) — read-only display of active overclock */}
      {overclockEffective && epicEffects.overclockAbility && (
        <div className="mt-2">
          <PlayOverclockBanner
            ability={epicEffects.overclockAbility}
            endTime={overclockState.endTime}
          />
        </div>
      )}

      {/* Mobile: Pill navigation */}
      <div
        className="sticky top-[72px] z-20 flex flex-wrap justify-center gap-1 bg-background/80 px-2 py-2 backdrop-blur-sm sm:hidden"
        data-testid="play-panel-nav"
      >
        {visiblePanels.map((panel) => (
          <button
            key={panel.id}
            onClick={() => setActivePanel(panel.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              activePanel === panel.id
                ? `${colors.badge}`
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
            data-testid={`play-nav-${panel.id}`}
          >
            {panel.icon}
            {panel.label}
          </button>
        ))}
      </div>

      {/* Desktop: All panels visible in 2-column grid */}
      <div className="hidden gap-4 p-4 sm:grid sm:grid-cols-[1fr_1fr] lg:grid-cols-[55%_45%]">
        {/* Left column */}
        <div className="flex flex-col gap-4">
          <PlayCombatPanel
            equipment={equipment}
            weaponProficiencies={weaponProficiencies}
            thac0={thac0}
            strMods={strMods}
            dexMods={dexMods}
            classGroups={classGroups}
            classEntries={classEntries}
            equippedArmor={equippedArmor ?? null}
            equippedShield={equippedShield}
            dexDefenseAdj={dexMods.defensiveAdj}
            ac={ac}
            encumbrance={encumbranceLevel}
            movementRate={movementRate}
            backstabMultiplier={backstabMultiplier}
            ignoreEncumbrance={character.ignore_encumbrance}
            isMagicalProtection={isMagicalProtection}
            onEquipmentChange={setEquipment}
            epicEffects={epicEffects}
            characterKit={character.kit}
          />
          {showSpells && (
            <PlaySpellbookPanel
              spells={spells}
              character={character}
              classGroups={classGroups}
              classEntries={classEntries}
              wisScore={effectiveWis}
              readOnly={!isOwner}
              onCast={handleCastSpell}
              onRest={handleRest}
              epicSpellFailure={epicEffects.spellFailure}
              epicWildMagic={epicEffects.wildMagic}
              characterKit={character.kit}
              hasArmor={!!equippedArmor}
              priestAvailableSpells={priestAvailableSpells}
            />
          )}
          {turnUndeadInfo.show && (
            <PlayTurnUndeadPanel
              clericLevel={turnUndeadInfo.level}
              isPaladin={turnUndeadInfo.isPaladin}
              isEvil={turnUndeadInfo.isEvil}
            />
          )}
          {showAbilities && (
            <PlayAbilitiesPanel
              raceId={character.race_id ?? "human"}
              classIds={classIds}
              priesthoodId={character.priesthood}
              priestLevel={priestClassForAbilities?.level ?? 1}
            />
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          <PlayChecksPanel
            saves={saves}
            character={character}
            strMods={strMods}
            dexMods={dexMods}
            conMods={conMods}
            intMods={intMods}
            wisMods={wisMods}
            chaMods={chaMods}
            showThiefSkills={showThiefSkills}
            nonweaponProficiencies={nonweaponProficiencies}
            epicEffects={epicEffects}
            poisonSavePenalty={poisonSavePenalty}
          />
          <PlayCoinPursePanel
            characterId={character.id}
            coinPurse={coinPurse}
            readOnly={!isOwner}
            onCoinChange={handleCoinChange}
          />
          <PlayInventoryPanel
            characterId={character.id}
            inventory={inventory}
            totalWeight={totalWeight}
            encumbrance={encumbranceLevel}
            ignoreEncumbrance={character.ignore_encumbrance}
            readOnly={!isOwner}
            onInventoryChange={setInventory}
          />
        </div>
      </div>

      {/* Mobile: Single panel view */}
      <div className="p-3 sm:hidden">
        {activePanel === "combat" && (
          <PlayCombatPanel
            equipment={equipment}
            weaponProficiencies={weaponProficiencies}
            thac0={thac0}
            strMods={strMods}
            dexMods={dexMods}
            classGroups={classGroups}
            classEntries={classEntries}
            equippedArmor={equippedArmor ?? null}
            equippedShield={equippedShield}
            dexDefenseAdj={dexMods.defensiveAdj}
            ac={ac}
            encumbrance={encumbranceLevel}
            movementRate={movementRate}
            backstabMultiplier={backstabMultiplier}
            ignoreEncumbrance={character.ignore_encumbrance}
            isMagicalProtection={isMagicalProtection}
            onEquipmentChange={setEquipment}
            epicEffects={epicEffects}
            characterKit={character.kit}
          />
        )}
        {activePanel === "spellbook" && showSpells && (
          <PlaySpellbookPanel
            spells={spells}
            character={character}
            classGroups={classGroups}
            classEntries={classEntries}
            wisScore={effectiveWis}
            readOnly={!isOwner}
            onCast={handleCastSpell}
            onRest={handleRest}
            epicSpellFailure={epicEffects.spellFailure}
            epicWildMagic={epicEffects.wildMagic}
            characterKit={character.kit}
            hasArmor={!!equippedArmor}
            priestAvailableSpells={priestAvailableSpells}
          />
        )}
        {activePanel === "turnUndead" && turnUndeadInfo.show && (
          <PlayTurnUndeadPanel
            clericLevel={turnUndeadInfo.level}
            isPaladin={turnUndeadInfo.isPaladin}
            isEvil={turnUndeadInfo.isEvil}
          />
        )}
        {activePanel === "abilities" && showAbilities && (
          <PlayAbilitiesPanel
            raceId={character.race_id ?? "human"}
            priesthoodId={character.priesthood}
            priestLevel={priestClassForAbilities?.level ?? 1}
          />
        )}
        {activePanel === "checks" && (
          <PlayChecksPanel
            saves={saves}
            character={character}
            strMods={strMods}
            dexMods={dexMods}
            conMods={conMods}
            intMods={intMods}
            wisMods={wisMods}
            chaMods={chaMods}
            showThiefSkills={showThiefSkills}
            nonweaponProficiencies={nonweaponProficiencies}
            epicEffects={epicEffects}
            poisonSavePenalty={poisonSavePenalty}
          />
        )}
        {activePanel === "inventory" && (
          <PlayInventoryPanel
            characterId={character.id}
            inventory={inventory}
            totalWeight={totalWeight}
            encumbrance={encumbranceLevel}
            ignoreEncumbrance={character.ignore_encumbrance}
            readOnly={!isOwner}
            onInventoryChange={setInventory}
          />
        )}
        {activePanel === "coinPurse" && (
          <PlayCoinPursePanel
            characterId={character.id}
            coinPurse={coinPurse}
            readOnly={!isOwner}
            onCoinChange={handleCoinChange}
          />
        )}
      </div>
    </div>
  );
}
