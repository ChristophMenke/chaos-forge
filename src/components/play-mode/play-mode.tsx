"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LevelUpDialog } from "@/components/level-up/level-up-dialog";
import { EffectsBar } from "@/components/effects/effects-bar";
import { useCharacterEffects } from "@/lib/hooks/use-character-effects";
import { useUndo, useUndoSync } from "@/components/undo/undo-context";
import { rowUpdate } from "@/lib/undo/changes";
import { levelUpChanges } from "@/lib/level-up/undo-changes";
import { patchList, patchRow, touches } from "@/lib/undo/patch";
import type { RowChange, UndoLabel } from "@/lib/undo/types";
import { aggregateEffects } from "@/lib/rules/temporary-effects";
import { resolveEffectiveStats } from "@/lib/rules/effective-stats";
import { PendingLevelUpBanner } from "@/components/level-up/pending-level-up-banner";
import type { LevelUpPlan } from "@/lib/level-up/apply-level-up";
import { PlayHpBar } from "./play-hp-bar";
import { PlayCombatPanel } from "./play-combat-panel";
import { PlaySpellbookPanel } from "./play-spellbook-panel";
import { PlayChecksPanel } from "./play-checks-panel";
import { PlayInventoryPanel } from "./play-inventory-panel";
import { PlayCoinPursePanel } from "./play-coin-purse-panel";
import { PlayTurnUndeadPanel } from "./play-turn-undead-panel";
import { PlayAbilitiesPanel } from "./play-abilities-panel";
import { PlayMagicItemsPanel } from "./play-magic-items-panel";
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
import { getConstitutionModifiers } from "@/lib/rules/abilities";
import {
  calculateAC,
  calculateEncumbrance,
  getMovementRate,
  getShieldProficiencyBonus,
} from "@/lib/rules/equipment";
import { hasThiefSkills, getBackstabMultiplier } from "@/lib/rules/thief";
import { getConBonusCap, clampHpCurrentToMax, getDeathThreshold } from "@/lib/rules/hitpoints";
import { CLASSES, getClassGroup } from "@/lib/rules/classes";
import { getEpicEffects } from "@/lib/rules/epic-items";
import { computeHpAfterConChange } from "@/lib/rules/epic-hp";
import { findProficiency, getNwpCheckTarget } from "@/lib/rules/proficiencies";
import {
  endCooldown,
  findOverclockItem,
  healOneHour,
  passOverclockHour,
  readOverclockState,
  startOverclock,
  stopOverclock,
  withDamageLevel,
  type OverclockAction,
} from "@/lib/rules/sprocket-devices";
import type { EpicEffects } from "@/lib/rules/epic-items";
import { getMagicItemEffects, isMagicItem } from "@/lib/rules/magic-items";
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
  CharacterFightingStyleRow,
  CharacterEffectRow,
} from "@/lib/supabase/types";
import type { CoinPurse } from "@/lib/rules/equipment";
import { getSingleWeaponStyleBonus } from "@/lib/rules/fighting-styles";
import { toast } from "sonner";

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

function WandIcon({ className }: { className?: string }) {
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
      <path d="m15 4-1 1 4 4 1-1a2.83 2.83 0 1 0-4-4z" />
      <path d="m13 6-8.5 8.5a2.12 2.12 0 1 0 3 3L16 9" />
      <path d="m8 16 1.5-1.5" />
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
  | "magicItems"
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
  fightingStyles?: CharacterFightingStyleRow[];
  /** Active temporary effects (character_effects, ended_at is null). */
  effects?: CharacterEffectRow[];
  priestAvailableSpells?: SpellRow[];
  basePath?: string;
}

/**
 * Two-column layout from `sm` on. `minmax(0, …)` lets the columns shrink below
 * their content width — plain `1fr` (= minmax(auto, 1fr)) let a wide panel push
 * the page past the viewport on 800px tablets. 11fr/9fr keeps the former
 * 55/45 split at `lg` without percentages overflowing together with the gap.
 */
export const PLAY_DESKTOP_GRID_CLASS =
  "hidden gap-4 p-4 sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]";

export function PlayMode({
  character: initialCharacter,
  characterClasses,
  userId,
  equipment: initialEquipment,
  spells: initialSpells,
  weaponProficiencies,
  nonweaponProficiencies,
  inventory: initialInventory,
  epicItems: initialEpicItems = [],
  fightingStyles = [],
  effects: initialEffects = [],
  priestAvailableSpells = [],
  basePath = "/characters",
}: PlayModeProps) {
  const t = useTranslations("playMode");
  const locale = useLocale();
  const [character, setCharacter] = useState(initialCharacter);
  const effectsState = useCharacterEffects(initialCharacter.id, initialEffects);
  const router = useRouter();
  const [levelUpOpen, setLevelUpOpen] = useState(false);
  // Levels saved by the level-up assistant before the server props catch up
  // (characterClasses is a plain prop here, refreshed via router.refresh()).
  const [appliedLevels, setAppliedLevels] = useState<Record<string, number>>({});
  const levelUpClasses = useMemo(
    () =>
      characterClasses.map((cc) =>
        (appliedLevels[cc.id] ?? 0) > cc.level ? { ...cc, level: appliedLevels[cc.id] } : cc
      ),
    [characterClasses, appliedLevels]
  );
  const [equipment, setEquipment] = useState(initialEquipment);
  const [spells, setSpells] = useState(initialSpells);
  const [inventory, setInventory] = useState(initialInventory);
  const [epicItems, setEpicItems] = useState(initialEpicItems);
  const [activePanel, setActivePanel] = useState<PanelId>("combat");
  const [tradeCharacters, setTradeCharacters] = useState<
    { id: string; name: string; user_id: string }[]
  >([]);

  const isOwner = character.user_id === userId;

  // Undo/redo: record own writes, follow undone/redone rows in the page state.
  const undo = useUndo();
  const characterRef = useRef(character);
  useEffect(() => {
    characterRef.current = character;
  });
  const recordChanges = useCallback(
    (label: UndoLabel, changes: (RowChange | null)[], coalesceKey?: string) => {
      const real = changes.filter((c): c is RowChange => c !== null);
      if (real.length > 0) undo?.record({ label, changes: real, coalesceKey });
    },
    [undo]
  );
  useUndoSync((changes, direction) => {
    setCharacter((prev) => patchRow(prev, "characters", changes, direction));
    setSpells((prev) => patchList(prev, "character_spells", changes, direction));
    setEquipment((prev) => patchList(prev, "character_equipment", changes, direction));
    setInventory((prev) => patchList(prev, "character_inventory", changes, direction));
    setEpicItems((prev) => patchList(prev, "epic_items", changes, direction));
    // Class levels are props (router.refresh() brings them); drop the bridge.
    if (touches(changes, "character_classes")) setAppliedLevels({});
  });

  // Fetch active characters for trading
  useEffect(() => {
    if (!isOwner) return;
    const supabase = createClient();
    supabase
      .from("characters")
      .select("id, name, user_id")
      .eq("is_active", true)
      .neq("id", character.id)
      .order("name")
      .then(({ data }) => {
        if (data) setTradeCharacters(data);
      });
  }, [character.id, isOwner]);

  // Epic item effects (with auto-unlock based on character level)
  const characterLevel = character.level;
  const epicEffects: EpicEffects = useMemo(
    () => getEpicEffects(epicItems, characterLevel),
    [epicItems, characterLevel]
  );
  const magicEffects = useMemo(() => getMagicItemEffects(equipment), [equipment]);
  const hasMagicItems = useMemo(() => equipment.some(isMagicItem), [equipment]);
  // Overclock (Kondensator): state lives in the item's simple_effects
  const overclockItem = findOverclockItem(epicItems);
  const overclockState = overclockItem ? readOverclockState(overclockItem.simple_effects) : null;
  const overclockActive = overclockState?.active ?? false;

  // Overclock is only effective when the ability exists and is active
  const overclockEffective = overclockActive && epicEffects.overclockAbility != null;

  // Effective abilities and modifiers: items, overclock and temporary effects
  // through the shared resolver (same rules as the GM dashboard and the sheet).
  const effectSummary = useMemo(
    () => aggregateEffects(effectsState.effects),
    [effectsState.effects]
  );
  const effectiveStats = useMemo(
    () =>
      resolveEffectiveStats(
        character,
        { epicEffects, magicEffects, overclockActive: overclockEffective },
        effectSummary
      ),
    [character, epicEffects, magicEffects, overclockEffective, effectSummary]
  );
  const {
    str: effectiveStr,
    dex: effectiveDex,
    con: effectiveCon,
    int: effectiveInt,
    wis: effectiveWis,
    cha: effectiveCha,
  } = effectiveStats.values;

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
  const baseSaves = useMemo(
    () => getMulticlassSaves(effectiveClassEntries),
    [effectiveClassEntries]
  );
  // Apply magic item save bonuses (lower is better in AD&D → subtract)
  const msb = magicEffects.saveBonuses;
  // Temporary effect save bonuses are in player terms (+ = better) → subtract too.
  const esb = effectSummary.saves;
  const saves = useMemo(
    () => ({
      paralyzation: baseSaves.paralyzation - (msb.paralyzation ?? 0) - esb.paralyzation,
      rod: baseSaves.rod - (msb.rod ?? 0) - esb.rod,
      petrification: baseSaves.petrification - (msb.petrification ?? 0) - esb.petrification,
      breath: baseSaves.breath - (msb.breath ?? 0) - esb.breath,
      spell: baseSaves.spell - (msb.spell ?? 0) - esb.spell,
    }),
    [baseSaves, msb, esb]
  );
  // THAC0 including attack modifiers from temporary effects (+ = better → lower)
  const effectiveThac0 = thac0 - effectSummary.attack;

  const {
    str: strMods,
    dex: dexMods,
    con: conMods,
    int: intMods,
    wis: wisMods,
    cha: chaMods,
  } = effectiveStats.mods;

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
  const effectiveHpCurrent = clampHpCurrentToMax(character.hp_current, effectiveHpMax);

  // Equipment calculations — use DB is_shield flag instead of name heuristic
  const equippedArmor = useMemo(
    () => equipment.find((e) => e.equipped && e.armor && !e.armor.is_shield),
    [equipment]
  );
  const equippedShield = useMemo(
    () => equipment.some((e) => e.equipped && e.armor && e.armor.is_shield),
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
  const baseMovementRate = useMemo(
    () => getMovementRate(12, character.ignore_encumbrance ? "unencumbered" : encumbranceLevel),
    [encumbranceLevel, character.ignore_encumbrance]
  );
  const movementRate = Math.floor(baseMovementRate * effectSummary.movementFactor);

  const isMagicalProtection = equippedArmor?.armor?.is_magical_protection ?? false;
  const equippedShieldItem = useMemo(
    () => equipment.find((e) => e.equipped && e.armor && e.armor.is_shield),
    [equipment]
  );
  const equippedShieldName = equippedShieldItem?.armor?.name ?? null;
  const singleWeaponStyleBonus = useMemo(
    () => getSingleWeaponStyleBonus(fightingStyles),
    [fightingStyles]
  );
  const shieldProficiencyBonus = useMemo(
    () =>
      getShieldProficiencyBonus(
        equippedShieldItem?.armor?.shield_type ?? null,
        equippedShieldName,
        weaponProficiencies
      ),
    [equippedShieldItem, equippedShieldName, weaponProficiencies]
  );

  const ac = useMemo(
    () =>
      calculateAC({
        equippedArmorAC: equippedArmor?.armor?.ac ?? null,
        shieldEquipped: equippedShield,
        dexDefenseAdj: dexMods.defensiveAdj,
        magicACModifier: magicEffects.acBonus,
        classGroups,
        encumbrance: encumbranceLevel,
        ignoreEncumbrance: character.ignore_encumbrance,
        isMagicalProtection,
        epicAcBonus: epicEffects.acBonus,
        singleWeaponStyleBonus,
        shieldProficiencyBonus,
        effectAcBonus: effectSummary.acBonus,
        effectAcSet: effectSummary.acSet,
        noDexBonus: effectSummary.noDexAc,
        noShield: effectSummary.noShield,
      }),
    [
      effectSummary,
      equippedArmor,
      equippedShield,
      dexMods.defensiveAdj,
      magicEffects.acBonus,
      classGroups,
      encumbranceLevel,
      character.ignore_encumbrance,
      epicEffects.acBonus,
      isMagicalProtection,
      singleWeaponStyleBonus,
      shieldProficiencyBonus,
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
    const hasClassAbilities = classIds.some(
      (id) => (CLASSES[id as ClassId]?.classAbilities?.length ?? 0) > 0
    );
    return hasRacialAbilities || hasGrantedPowers || hasClassAbilities;
  }, [character.race_id, character.priesthood, activeClasses, classIds]);

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

  // Instant DB write helper; returns the change for undo (null on error).
  const updateCharacter = useCallback(
    async (updates: Partial<CharacterRow>): Promise<RowChange | null> => {
      const before = characterRef.current;
      setCharacter((prev) => ({ ...prev, ...updates }));
      const supabase = createClient();
      const { error } = await supabase.from("characters").update(updates).eq("id", before.id);
      if (error) {
        toast.error(t("saveFailed"));
        return null;
      }
      return rowUpdate("characters", { id: before.id }, before, updates);
    },
    [t]
  );

  /** Sets hit points; `record: false` lets a caller record them with more rows. */
  const handleHpChange = useCallback(
    async (newEffectiveHp: number, options: { record?: boolean } = {}) => {
      // Inverse of asymmetric formula: effective = base + min(0, delta)
      // => base = effective - min(0, delta)
      // HP can go negative (down to -maxHP = death threshold)
      const baseHp = newEffectiveHp - Math.min(0, hpDelta);
      const clampedBaseHp = Math.max(-character.hp_max, Math.min(character.hp_max, baseHp));
      const change = await updateCharacter({ hp_current: clampedBaseHp });
      if (options.record !== false) {
        recordChanges(
          { key: "hp", values: { from: effectiveHpCurrent, to: newEffectiveHp } },
          [change],
          "hp"
        );
      }
      return change;
    },
    [hpDelta, character.hp_max, updateCharacter, recordChanges, effectiveHpCurrent]
  );

  // Damage goes through temporary hit points (effects) first; the rest hits HP.
  const { absorbDamage } = effectsState;
  const handleDamage = useCallback(
    async (amount: number) => {
      const { remainingDamage, changes } = await absorbDamage(amount);
      const hpChange =
        remainingDamage > 0
          ? await handleHpChange(
              Math.max(getDeathThreshold(effectiveHpMax), effectiveHpCurrent - remainingDamage),
              { record: false }
            )
          : null;
      recordChanges({ key: "damage", values: { amount } }, [...changes, hpChange]);
    },
    [absorbDamage, handleHpChange, effectiveHpMax, effectiveHpCurrent, recordChanges]
  );

  /** Optimistic write of one epic item row; null (with toast) on failure. */
  async function updateEpicItem(
    item: EpicItemRow,
    patch: Partial<Pick<EpicItemRow, "damage_level" | "simple_effects">>
  ): Promise<RowChange | null> {
    const previous = Object.fromEntries(
      Object.keys(patch).map((key) => [key, item[key as keyof EpicItemRow]])
    );
    setEpicItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...patch } : i)));
    let failed: boolean;
    try {
      const { error } = await createClient().from("epic_items").update(patch).eq("id", item.id);
      failed = Boolean(error);
    } catch {
      failed = true;
    }
    if (failed) {
      setEpicItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...previous } : i)));
      toast.error(t("saveFailed"));
      return null;
    }
    return rowUpdate("epic_items", { id: item.id }, previous, patch);
  }

  /** Overclock steps from the banner; each is one undo step. */
  async function handleOverclockAction(action: OverclockAction) {
    const item = overclockItem;
    const ability = epicEffects.overclockAbility;
    if (!item || !ability || !isOwner) return;
    const se = item.simple_effects;
    const name = localized(item.name, item.name_en, locale);

    if (action.type === "start") {
      const result = startOverclock(se, action.success);
      if (!result) return;
      if (result.damageLevelDelta === 0) {
        const change = await updateEpicItem(item, { simple_effects: result.effects });
        recordChanges({ key: "overclockOn", values: { name } }, [change]);
        return;
      }
      // Failed start: the Condenser takes a damage level (CON drops, HP follow).
      const level = Math.min(item.max_damage_level, item.damage_level + result.damageLevelDelta);
      const next = withDamageLevel(item, level);
      const patch = next.simple_effects === se ? { damage_level: level } : next;
      const change = await updateEpicItem(item, patch);
      if (!change) return;
      const hp = computeHpAfterConChange({
        itemsBefore: epicItems,
        itemsAfter: epicItems.map((i) => (i.id === item.id ? { ...i, ...patch } : i)),
        character,
        activeClasses: characterClasses.filter((cc) => cc.is_active),
        hpCurrent: character.hp_current,
        characterLevel: character.level,
      });
      const hpChange = hp === null ? null : await updateCharacter({ hp_current: hp });
      recordChanges({ key: "overclockFailed", values: { name, level } }, [change, hpChange]);
      return;
    }

    if (action.type === "hour") {
      const next = passOverclockHour(se, action.success);
      if (next === se) return;
      const itemChange = await updateEpicItem(item, { simple_effects: next });
      if (!itemChange) return;
      const healed = healOneHour(effectiveHpCurrent, effectiveHpMax, ability.healsPerHour);
      const hpChange =
        healed === effectiveHpCurrent ? null : await handleHpChange(healed, { record: false });
      const hour = readOverclockState(next).hours;
      recordChanges(
        { key: action.success ? "overclockHour" : "overclockCooledDown", values: { name, hour } },
        [itemChange, hpChange]
      );
      return;
    }

    if (action.type === "stop") {
      const change = await updateEpicItem(item, { simple_effects: stopOverclock(se) });
      recordChanges({ key: "overclockOff", values: { name } }, [change]);
      return;
    }

    const change = await updateEpicItem(item, { simple_effects: endCooldown(se) });
    recordChanges({ key: "overclockCooldownEnded", values: { name } }, [change]);
  }

  // Engineering target for the overclock checks (null without the proficiency)
  const overclockCheck = epicEffects.overclockAbility;
  const engineering = overclockCheck
    ? findProficiency(
        nonweaponProficiencies,
        overclockCheck.requiresCheck,
        overclockCheck.requiresCheck_en
      )
    : null;
  const overclockBaseTarget = engineering
    ? getNwpCheckTarget(engineering, effectiveStats.values, effectSummary.abilityChecks)
    : null;

  /** Coin purse; money sent to another character is not undoable. */
  const handleCoinChange = useCallback(
    async (newPurse: CoinPurse, options: { record?: boolean } = {}) => {
      const change = await updateCharacter({
        gold_pp: newPurse.pp,
        gold_gp: newPurse.gp,
        gold_ep: newPurse.ep,
        gold_sp: newPurse.sp,
        gold_cp: newPurse.cp,
      });
      if (options.record !== false) recordChanges({ key: "coins" }, [change]);
    },
    [updateCharacter, recordChanges]
  );

  const spellLabel = useCallback(
    (spellId: string) => {
      const spell =
        spells.find((s) => s.spell_id === spellId)?.spell ??
        priestAvailableSpells.find((s) => s.id === spellId);
      return spell ? localized(spell.name, spell.name_en, locale) : "";
    },
    [spells, priestAvailableSpells, locale]
  );

  const handleCastSpell = useCallback(
    async (spellId: string, pointsCost: number) => {
      const spellName = spellLabel(spellId);
      const label: UndoLabel = { key: "spellCast", values: { name: spellName } };
      if (character.spell_system === "points") {
        const newUsed = character.spell_points_used + pointsCost;
        recordChanges(label, [await updateCharacter({ spell_points_used: newUsed })]);
      } else {
        // Slots mode: one row per spell (key character_id + spell_id)
        setSpells((prev) =>
          prev.map((s) =>
            s.spell_id === spellId && s.prepared && !s.expended ? { ...s, expended: true } : s
          )
        );
        const supabase = createClient();
        const { data, error } = await supabase
          .from("character_spells")
          .update({ expended: true })
          .eq("character_id", character.id)
          .eq("spell_id", spellId)
          .eq("prepared", true)
          .eq("expended", false)
          .select("character_id, spell_id");
        if (error) toast.error(t("spellCastFailed"));
        else if (data && data.length > 0) {
          const key = { character_id: character.id, spell_id: spellId };
          recordChanges(label, [
            rowUpdate("character_spells", key, { expended: false }, { expended: true }),
          ]);
        }
      }
    },
    [
      character.id,
      character.spell_system,
      character.spell_points_used,
      updateCharacter,
      recordChanges,
      spellLabel,
      t,
    ]
  );

  function handleLevelUpApplied(plan: LevelUpPlan) {
    const classRow = levelUpClasses.find((cc) => cc.id === plan.classRowId);
    recordChanges(
      { key: "levelUp", values: { level: plan.toLevel } },
      levelUpChanges(plan, {
        classLevel: classRow?.level ?? plan.toLevel - 1,
        hp_max: character.hp_max,
        level: character.level,
        thief: character as unknown as Record<string, number>,
      })
    );
    setAppliedLevels((prev) => ({ ...prev, [plan.classRowId]: plan.toLevel }));
    setCharacter((prev) => ({
      ...prev,
      hp_max: plan.hpMaxAfter,
      level: plan.characterLevelAfter,
      ...plan.thiefSkillUpdates,
    }));
    router.refresh();
  }

  const handleRest = useCallback(async () => {
    if (character.spell_system === "points") {
      recordChanges({ key: "rest" }, [await updateCharacter({ spell_points_used: 0 })]);
    } else {
      setSpells((prev) => prev.map((s) => (s.prepared ? { ...s, expended: false } : s)));
      const supabase = createClient();
      // Only rows that were expended change — those are the undo step.
      const { data, error } = await supabase
        .from("character_spells")
        .update({ expended: false })
        .eq("character_id", character.id)
        .eq("prepared", true)
        .eq("expended", true)
        .select("character_id, spell_id");
      if (error) toast.error(t("restFailed"));
      else {
        toast.success(t("restSuccess"));
        recordChanges(
          { key: "rest" },
          (data ?? []).map((row) =>
            rowUpdate(
              "character_spells",
              { character_id: row.character_id, spell_id: row.spell_id },
              { expended: true },
              { expended: false }
            )
          )
        );
      }
    }
  }, [character.id, character.spell_system, updateCharacter, recordChanges, t]);

  // Netherese Blooded (Lvl9-10): convert current HP into bonus spell points.
  // No floor clamp here — handleHpChange already allows hp_current down to
  // -hp_max for the unconsciousness/death spiral, so clamping to 1 here would
  // incorrectly "heal" a character who is already at or below 0 HP. The UI
  // instead disables the action once hp_current <= 1 (see PlaySpellbookPanel).
  const handleConvertHpToSp = useCallback(
    async (hpAmount: number) => {
      const ratio = epicEffects.hpToSpConversion?.ratio ?? 0;
      const change = await updateCharacter({
        hp_current: character.hp_current - hpAmount,
        spell_points_used: character.spell_points_used - hpAmount * ratio,
      });
      recordChanges({ key: "hpToSp", values: { amount: hpAmount } }, [change]);
    },
    [
      character.hp_current,
      character.spell_points_used,
      epicEffects.hpToSpConversion,
      updateCharacter,
      recordChanges,
    ]
  );

  const panels = useMemo(
    () => [
      {
        id: "combat" as PanelId,
        label: t("combat"),
        icon: <SwordIcon className="h-4 w-4" />,
        show: true,
      },
      {
        id: "spellbook" as PanelId,
        label: t("spellbook"),
        icon: <SparklesIcon className="h-4 w-4" />,
        show: showSpells,
      },
      {
        id: "turnUndead" as PanelId,
        label: t("turnUndead"),
        icon: <TargetIcon className="h-4 w-4" />,
        show: turnUndeadInfo.show,
      },
      {
        id: "abilities" as PanelId,
        label: t("abilities"),
        icon: <SparklesIcon className="h-4 w-4" />,
        show: showAbilities,
      },
      {
        id: "magicItems" as PanelId,
        label: t("magicItems"),
        icon: <WandIcon className="h-4 w-4" />,
        show: hasMagicItems,
      },
      {
        id: "checks" as PanelId,
        label: t("checks"),
        icon: <TargetIcon className="h-4 w-4" />,
        show: true,
      },
      {
        id: "inventory" as PanelId,
        label: t("inventory"),
        icon: <BackpackIcon className="h-4 w-4" />,
        show: true,
      },
      {
        id: "coinPurse" as PanelId,
        label: t("coinPurse"),
        icon: <CoinsIcon className="h-4 w-4" />,
        show: true,
      },
    ],
    [t, showSpells, turnUndeadInfo.show, showAbilities, hasMagicItems]
  );

  const visiblePanels = useMemo(() => panels.filter((p) => p.show), [panels]);

  // Fallback to combat if the active panel is no longer visible (e.g. last magic item removed)
  const effectivePanel = visiblePanels.some((p) => p.id === activePanel) ? activePanel : "combat";

  // Swipe gesture for mobile panel switching
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const prefersReducedMotionRef = useRef(
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      touchStartRef.current = null;
      // Require min 50px horizontal swipe, max 30px vertical drift
      if (Math.abs(dx) < 50 || Math.abs(dy) > 30) return;
      if (prefersReducedMotionRef.current) return;
      const currentIdx = visiblePanels.findIndex((p) => p.id === effectivePanel);
      if (dx < 0 && currentIdx < visiblePanels.length - 1) {
        setActivePanel(visiblePanels[currentIdx + 1].id);
      } else if (dx > 0 && currentIdx > 0) {
        setActivePanel(visiblePanels[currentIdx - 1].id);
      }
    },
    [visiblePanels, effectivePanel]
  );

  return (
    <div className="w-full" data-testid="play-mode">
      <div className="px-4 pt-3 pb-2">
        <CharacterModeNav
          characterId={character.id}
          hasEpicItems={epicItems.length > 0}
          basePath={basePath}
        />
      </div>
      <PlayHpBar
        characterId={character.id}
        name={character.name}
        avatarUrl={character.avatar_url}
        raceId={character.race_id ?? undefined}
        hpCurrent={effectiveHpCurrent}
        hpMax={effectiveHpMax}
        ac={ac}
        thac0={effectiveThac0}
        classGroup={primaryGroup}
        kitName={kitDisplayName}
        deity={character.deity}
        priesthoodName={priesthoodDisplayName}
        readOnly={!isOwner}
        onHpChange={handleHpChange}
        tempHp={effectsState.effects.reduce((sum, e) => sum + e.temp_hp_remaining, 0)}
        onDamage={isOwner && !character.is_npc ? (amount) => void handleDamage(amount) : undefined}
      />

      <div className={character.is_npc ? "hidden" : "px-4 pt-2"}>
        <EffectsBar
          state={effectsState}
          readOnly={!isOwner}
          values={{
            str: effectiveStr,
            dex: effectiveDex,
            con: effectiveCon,
            int: effectiveInt,
            wis: effectiveWis,
            cha: effectiveCha,
          }}
        />
      </div>

      <div className="px-4 pt-2 empty:hidden">
        <PendingLevelUpBanner
          classes={levelUpClasses}
          isOwner={isOwner}
          onStart={() => setLevelUpOpen(true)}
        />
      </div>
      {isOwner && (
        <LevelUpDialog
          open={levelUpOpen}
          onOpenChange={setLevelUpOpen}
          character={character}
          classes={levelUpClasses}
          epicItems={epicItems}
          onApplied={handleLevelUpApplied}
        />
      )}

      {/* Overclock (Kondensator): active for everyone, start/cooldown only for the owner */}
      {epicEffects.overclockAbility && overclockState && (overclockState.active || isOwner) && (
        <div className="mt-2">
          <PlayOverclockBanner
            ability={epicEffects.overclockAbility}
            state={overclockState}
            baseTarget={overclockBaseTarget}
            isOwner={isOwner}
            onAction={handleOverclockAction}
          />
        </div>
      )}

      {/* Mobile: Pill navigation with ARIA tabs */}
      <div
        className="sticky top-[72px] z-20 flex flex-wrap justify-center gap-1 bg-background/80 px-2 py-2 backdrop-blur-sm sm:hidden"
        role="tablist"
        aria-label={t("panelNavigation")}
        data-testid="play-panel-nav"
      >
        {visiblePanels.map((panel) => (
          <button
            key={panel.id}
            role="tab"
            aria-selected={effectivePanel === panel.id}
            aria-controls={`panel-${panel.id}`}
            id={`tab-${panel.id}`}
            tabIndex={effectivePanel === panel.id ? 0 : -1}
            onClick={() => setActivePanel(panel.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              effectivePanel === panel.id
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
      <div className={PLAY_DESKTOP_GRID_CLASS}>
        {/* Left column */}
        <div className="flex min-w-0 flex-col gap-4">
          <PlayCombatPanel
            equipment={equipment}
            weaponProficiencies={weaponProficiencies}
            thac0={effectiveThac0}
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
            readOnly={!isOwner}
            onEquipmentChange={setEquipment}
            epicEffects={epicEffects}
            magicAcBonus={magicEffects.acBonus}
            effectSummary={effectSummary}
            characterKit={character.kit}
            singleWeaponStyleBonus={singleWeaponStyleBonus}
            shieldProficiencyBonus={shieldProficiencyBonus}
            equippedShieldName={equippedShieldName}
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
              effectCannotCast={effectSummary.cannotCast}
              effectSpellFailure={effectSummary.spellFailure}
              epicWildMagic={epicEffects.wildMagic}
              epicBonusSpellPoints={epicEffects.bonusSpellPoints}
              hpToSpConversion={epicEffects.hpToSpConversion}
              onConvertHpToSp={handleConvertHpToSp}
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
        <div className="flex min-w-0 flex-col gap-4">
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
            magicThiefBonuses={magicEffects.thiefSkillBonuses}
            effective={effectiveStats}
            effectSummary={effectSummary}
          />
          {hasMagicItems && (
            <PlayMagicItemsPanel
              equipment={equipment}
              hpCurrent={effectiveHpCurrent}
              hpMax={effectiveHpMax}
              readOnly={!isOwner}
              onEquipmentChange={setEquipment}
              onHpChange={handleHpChange}
            />
          )}
          <PlayCoinPursePanel
            characterId={character.id}
            characterName={character.name}
            coinPurse={coinPurse}
            readOnly={!isOwner}
            tradeCharacters={tradeCharacters}
            onCoinChange={handleCoinChange}
          />
          <PlayInventoryPanel
            characterId={character.id}
            characterName={character.name}
            inventory={inventory}
            totalWeight={totalWeight}
            encumbrance={encumbranceLevel}
            ignoreEncumbrance={character.ignore_encumbrance}
            readOnly={!isOwner}
            tradeCharacters={tradeCharacters}
            onInventoryChange={setInventory}
          />
        </div>
      </div>

      {/* Mobile: Single panel view with swipe support */}
      <div
        className="p-3 sm:hidden"
        role="tabpanel"
        id={`panel-${effectivePanel}`}
        aria-labelledby={`tab-${effectivePanel}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {effectivePanel === "combat" && (
          <PlayCombatPanel
            equipment={equipment}
            weaponProficiencies={weaponProficiencies}
            thac0={effectiveThac0}
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
            readOnly={!isOwner}
            onEquipmentChange={setEquipment}
            epicEffects={epicEffects}
            magicAcBonus={magicEffects.acBonus}
            effectSummary={effectSummary}
            characterKit={character.kit}
            singleWeaponStyleBonus={singleWeaponStyleBonus}
            shieldProficiencyBonus={shieldProficiencyBonus}
            equippedShieldName={equippedShieldName}
          />
        )}
        {effectivePanel === "spellbook" && showSpells && (
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
            effectCannotCast={effectSummary.cannotCast}
            effectSpellFailure={effectSummary.spellFailure}
            epicWildMagic={epicEffects.wildMagic}
            epicBonusSpellPoints={epicEffects.bonusSpellPoints}
            hpToSpConversion={epicEffects.hpToSpConversion}
            onConvertHpToSp={handleConvertHpToSp}
            characterKit={character.kit}
            hasArmor={!!equippedArmor}
            priestAvailableSpells={priestAvailableSpells}
          />
        )}
        {effectivePanel === "turnUndead" && turnUndeadInfo.show && (
          <PlayTurnUndeadPanel
            clericLevel={turnUndeadInfo.level}
            isPaladin={turnUndeadInfo.isPaladin}
            isEvil={turnUndeadInfo.isEvil}
          />
        )}
        {effectivePanel === "abilities" && showAbilities && (
          <PlayAbilitiesPanel
            raceId={character.race_id ?? "human"}
            classIds={classIds}
            priesthoodId={character.priesthood}
            priestLevel={priestClassForAbilities?.level ?? 1}
          />
        )}
        {effectivePanel === "magicItems" && hasMagicItems && (
          <PlayMagicItemsPanel
            equipment={equipment}
            hpCurrent={effectiveHpCurrent}
            hpMax={effectiveHpMax}
            readOnly={!isOwner}
            onEquipmentChange={setEquipment}
            onHpChange={handleHpChange}
          />
        )}
        {effectivePanel === "checks" && (
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
            magicThiefBonuses={magicEffects.thiefSkillBonuses}
            effective={effectiveStats}
            effectSummary={effectSummary}
          />
        )}
        {effectivePanel === "inventory" && (
          <PlayInventoryPanel
            characterId={character.id}
            characterName={character.name}
            inventory={inventory}
            totalWeight={totalWeight}
            encumbrance={encumbranceLevel}
            ignoreEncumbrance={character.ignore_encumbrance}
            readOnly={!isOwner}
            tradeCharacters={tradeCharacters}
            onInventoryChange={setInventory}
          />
        )}
        {effectivePanel === "coinPurse" && (
          <PlayCoinPursePanel
            characterId={character.id}
            characterName={character.name}
            coinPurse={coinPurse}
            readOnly={!isOwner}
            tradeCharacters={tradeCharacters}
            onCoinChange={handleCoinChange}
          />
        )}
      </div>
    </div>
  );
}
