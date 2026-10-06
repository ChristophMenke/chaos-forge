"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Sparkles } from "lucide-react";
import { CharacterModeNav } from "@/components/character-mode-nav";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useUndo, useUndoSync } from "@/components/undo/undo-context";
import { rowUpdate } from "@/lib/undo/changes";
import { patchList, patchRow } from "@/lib/undo/patch";
import { localized } from "@/lib/utils/localize";
import type { RowChange, UndoLabel } from "@/lib/undo/types";
import { DamageLevelCard } from "./damage-level-card";
import { SimpleEpicCard } from "./simple-epic-card";
import { BladeSystemCard } from "./blade-system-card";
import { computeHpAfterConChange } from "@/lib/rules/epic-hp";
import type { CoinPurse } from "@/lib/rules/equipment";
import {
  adjustStock,
  craft,
  endCooldown,
  healOneHour,
  passOverclockHour,
  readOverclockState,
  readStock,
  resolveRepair,
  startOverclock,
  stopOverclock,
  toggleComponent,
  withDamageLevel,
  writeStock,
  type NamedStock,
  type OverclockAction,
  type StockChange,
  type StockTarget,
} from "@/lib/rules/sprocket-devices";
import type { CharacterRow, CharacterClassRow, EpicItemRow } from "@/lib/supabase/types";

const GOLD_COLUMNS = "gold_pp, gold_gp, gold_ep, gold_sp, gold_cp";
const ELIXIR: StockTarget = { kind: "elixir" };

type Gold = Pick<CharacterRow, "gold_pp" | "gold_gp" | "gold_ep" | "gold_sp" | "gold_cp">;
/** Character columns this page writes: current HP and the coin purse. */
type LiveCharacter = Pick<CharacterRow, "id" | "hp_current"> & Gold;
type ItemPatch = Partial<Pick<EpicItemRow, "equipped" | "damage_level" | "simple_effects">>;

function toPurse(gold: Gold): CoinPurse {
  return {
    pp: gold.gold_pp,
    gp: gold.gold_gp,
    ep: gold.gold_ep,
    sp: gold.gold_sp,
    cp: gold.gold_cp,
  };
}

function toGold(purse: CoinPurse): Gold {
  return {
    gold_pp: purse.pp,
    gold_gp: purse.gp,
    gold_ep: purse.ep,
    gold_sp: purse.sp,
    gold_cp: purse.cp,
  };
}

/** The current values of the patched columns (for rollback and undo). */
function pickColumns<T extends object>(row: T, patch: object): Partial<T> {
  return Object.fromEntries(
    Object.keys(patch).map((key) => [key, row[key as keyof T]])
  ) as Partial<T>;
}

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
    | "gold_pp"
    | "gold_gp"
    | "gold_ep"
    | "gold_sp"
    | "gold_cp"
  >;
  characterClasses: CharacterClassRow[];
  epicItems: EpicItemRow[];
  isOwner: boolean;
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
  const [live, setLive] = useState<LiveCharacter>({
    id: character.id,
    hp_current: character.hp_current,
    gold_pp: character.gold_pp,
    gold_gp: character.gold_gp,
    gold_ep: character.gold_ep,
    gold_sp: character.gold_sp,
    gold_cp: character.gold_cp,
  });
  const hpCurrent = live.hp_current;
  const purse = toPurse(live);
  const undo = useUndo();
  // Crafting re-reads the gold first; a second click meanwhile would pay twice.
  const craftingRef = useRef(false);

  useUndoSync((changes, direction) => {
    setItems((prev) => patchList(prev, "epic_items", changes, direction));
    setLive((prev) => patchRow(prev, "characters", changes, direction));
  });

  function record(label: UndoLabel, changes: (RowChange | null)[]) {
    const real = changes.filter((c): c is RowChange => c !== null);
    if (real.length > 0) undo?.record({ label, changes: real });
  }

  const itemName = (item: EpicItemRow) => localized(item.name, item.name_en, locale);
  const stockName = (stock: NamedStock) => localized(stock.name, stock.name_en, locale);

  /** Optimistic write of character columns; null (with toast) on failure. */
  async function writeCharacter(
    updates: Partial<LiveCharacter>,
    before: LiveCharacter = live
  ): Promise<RowChange | null> {
    setLive((prev) => ({ ...prev, ...updates }));
    let failed: boolean;
    try {
      const { error } = await createClient()
        .from("characters")
        .update(updates)
        .eq("id", character.id);
      failed = Boolean(error);
    } catch {
      failed = true;
    }
    if (failed) {
      setLive((prev) => ({ ...prev, ...pickColumns(before, updates) }));
      toast.error(t("saveError"));
      return null;
    }
    return rowUpdate("characters", { id: character.id }, before, { ...before, ...updates });
  }

  /** Optimistic write of one epic item row; null (with toast) on failure. */
  async function writeItem(item: EpicItemRow, patch: ItemPatch): Promise<RowChange | null> {
    const previous = pickColumns(item, patch);
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...patch } : i)));
    let failed: boolean;
    try {
      const { error } = await createClient().from("epic_items").update(patch).eq("id", item.id);
      failed = Boolean(error);
    } catch {
      failed = true;
    }
    if (failed) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...previous } : i)));
      toast.error(t("saveError"));
      return null;
    }
    return rowUpdate("epic_items", { id: item.id }, previous, patch);
  }

  /**
   * After toggling equipped/damage_level for an item that changes effective CON,
   * persist the updated hp_current to the DB so that re-equipping doesn't
   * "heal" the character back to a higher current_hp. Christoph's rule:
   * CON↑ → max_hp rises, current_hp stays. CON↓ → current_hp is clamped down.
   */
  async function persistHpAfterConChange(
    item: EpicItemRow,
    patch: ItemPatch
  ): Promise<RowChange | null> {
    const desired = computeHpAfterConChange({
      itemsBefore: items,
      itemsAfter: items.map((i) => (i.id === item.id ? { ...i, ...patch } : i)),
      character,
      activeClasses: characterClasses.filter((cc) => cc.is_active),
      hpCurrent,
      characterLevel: character.level,
    });
    return desired === null ? null : writeCharacter({ hp_current: desired });
  }

  /**
   * New damage level (and optionally new simple_effects) in one row update;
   * a device that goes offline stops overclocking in the same write.
   */
  async function changeDamageLevel(
    item: EpicItemRow,
    newLevel: number,
    simpleEffects = item.simple_effects
  ): Promise<(RowChange | null)[] | null> {
    const next = withDamageLevel(
      { damage_levels: item.damage_levels, simple_effects: simpleEffects },
      newLevel
    );
    const patch: ItemPatch = { damage_level: next.damage_level };
    if (next.simple_effects !== item.simple_effects) patch.simple_effects = next.simple_effects;
    const change = await writeItem(item, patch);
    if (!change) return null;
    return [change, await persistHpAfterConChange(item, patch)];
  }

  function findOwnItem(itemId: string): EpicItemRow | null {
    if (!isOwner) return null;
    return items.find((i) => i.id === itemId) ?? null;
  }

  async function handleToggleEquip(itemId: string) {
    const item = findOwnItem(itemId);
    if (!item) return;
    const newEquipped = !item.equipped;
    const change = await writeItem(item, { equipped: newEquipped });
    if (!change) return;
    const hpChange = await persistHpAfterConChange(item, { equipped: newEquipped });
    record({ key: newEquipped ? "equip" : "unequip", values: { name: itemName(item) } }, [
      change,
      hpChange,
    ]);
  }

  async function handleDamageLevelChange(itemId: string, newLevel: number) {
    const item = findOwnItem(itemId);
    if (!item) return;
    const changes = await changeDamageLevel(item, newLevel);
    if (!changes) return;
    record({ key: "damageLevel", values: { name: itemName(item), level: newLevel } }, changes);
  }

  /** Saves simple_effects (blades, checklists, stocks) optimistically and records it. */
  async function updateSimpleEffects(
    itemId: string,
    newEffects: Record<string, unknown>,
    label: UndoLabel | null
  ) {
    const item = findOwnItem(itemId);
    if (!item) return;
    const change = await writeItem(item, { simple_effects: newEffects });
    if (label) record(label, [change]);
  }

  async function handleOverclockAction(itemId: string, action: OverclockAction) {
    const item = findOwnItem(itemId);
    if (!item) return;
    const se = item.simple_effects;
    const name = itemName(item);

    if (action.type === "start") {
      const result = startOverclock(se, action.success);
      if (!result) return;
      if (result.damageLevelDelta === 0) {
        const change = await writeItem(item, { simple_effects: result.effects });
        record({ key: "overclockOn", values: { name } }, [change]);
        return;
      }
      const level = Math.min(item.max_damage_level, item.damage_level + result.damageLevelDelta);
      const changes = await changeDamageLevel(item, level);
      if (changes) record({ key: "overclockFailed", values: { name, level } }, changes);
      return;
    }

    if (action.type === "hour") {
      const next = passOverclockHour(se, action.success);
      if (next === se) return;
      const itemChange = await writeItem(item, { simple_effects: next });
      if (!itemChange) return;
      const overclock = se.overclock as Record<string, unknown>;
      const healed = healOneHour(
        hpCurrent,
        character.hp_max,
        (overclock.heals_per_hour as number) ?? 0
      );
      const hpChange = healed === hpCurrent ? null : await writeCharacter({ hp_current: healed });
      const hour = readOverclockState(next).hours;
      record(
        { key: action.success ? "overclockHour" : "overclockCooledDown", values: { name, hour } },
        [itemChange, hpChange]
      );
      return;
    }

    if (action.type === "stop") {
      const change = await writeItem(item, { simple_effects: stopOverclock(se) });
      record({ key: "overclockOff", values: { name } }, [change]);
      return;
    }

    const change = await writeItem(item, { simple_effects: endCooldown(se) });
    record({ key: "overclockCooldownEnded", values: { name } }, [change]);
  }

  async function handleRepair(itemId: string, input: { useElixir: boolean; success: boolean }) {
    const item = findOwnItem(itemId);
    if (!item) return;
    const se = item.simple_effects;
    const elixir = readStock(se, ELIXIR);
    const result = resolveRepair({
      damageLevel: item.damage_level,
      elixirCount: elixir?.count ?? 0,
      useElixir: input.useElixir && elixir !== null,
      success: input.success,
    });
    if (!input.success) toast(t("repairFailedToast"));
    const newEffects =
      elixir && result.elixirCount !== elixir.count
        ? writeStock(se, ELIXIR, { ...elixir, count: result.elixirCount })
        : se;
    // A failed repair without elixir changes nothing.
    if (result.damageLevel === item.damage_level && newEffects === se) return;
    const changes = await changeDamageLevel(item, result.damageLevel, newEffects);
    if (!changes) return;
    record(
      {
        key: input.success ? "repairSucceeded" : "repairFailed",
        values: { name: itemName(item), level: result.damageLevel },
      },
      changes
    );
  }

  async function handleStockChange(itemId: string, target: StockTarget, change: StockChange) {
    const item = findOwnItem(itemId);
    if (!item) return;
    const se = item.simple_effects;
    const stock = readStock(se, target);
    if (!stock) return;
    const name = stockName(stock);

    if (change.type === "toggle") {
      const next = toggleComponent(stock, change.key);
      await updateSimpleEffects(itemId, writeStock(se, target, next), {
        key: "componentToggled",
        values: { name },
      });
      return;
    }
    if (change.type === "adjust") {
      const next = adjustStock(stock, change.delta);
      if (next.count === stock.count) return;
      await updateSimpleEffects(itemId, writeStock(se, target, next), {
        key: "stockChanged",
        values: { name, count: next.count },
      });
      return;
    }
    if (craftingRef.current) return;
    craftingRef.current = true;
    try {
      await persistCraft(item, target, stock, name);
    } finally {
      craftingRef.current = false;
    }
  }

  /**
   * Crafting pays from the purse: re-read the gold first (it may have been
   * spent elsewhere), charge it, then write the item. If the item write fails
   * the gold is paid back and nothing is recorded.
   */
  async function persistCraft(
    item: EpicItemRow,
    target: StockTarget,
    stock: NamedStock,
    name: string
  ) {
    let before = live;
    if (stock.recipe?.cost_gp) {
      const { data, error } = await createClient()
        .from("characters")
        .select(GOLD_COLUMNS)
        .eq("id", character.id)
        .single<Gold>();
      if (error || !data) {
        toast.error(t("saveError"));
        return;
      }
      before = { ...live, ...data };
      setLive(before);
    }
    const result = craft(stock, toPurse(before));
    if (!result) {
      toast.error(t("recipeNotEnoughMoney"));
      return;
    }
    const goldChange = stock.recipe?.cost_gp
      ? await writeCharacter(toGold(result.purse), before)
      : null;
    if (stock.recipe?.cost_gp && !goldChange) return;
    const itemChange = await writeItem(item, {
      simple_effects: writeStock(item.simple_effects, target, result.stock),
    });
    if (!itemChange) {
      if (goldChange)
        await writeCharacter(pickColumns(before, toGold(result.purse)), {
          ...before,
          ...toGold(result.purse),
        });
      return;
    }
    record({ key: "crafted", values: { name, count: result.stock.count } }, [
      goldChange,
      itemChange,
    ]);
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
                  purse={purse}
                  onOverclockAction={handleOverclockAction}
                  onRepair={handleRepair}
                  onStockChange={handleStockChange}
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
                  onSimpleEffectsChange={updateSimpleEffects}
                  purse={purse}
                  onStockChange={handleStockChange}
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
