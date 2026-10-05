/**
 * Vergleicht den DB-Stand eines Charakters mit einem Rescan-Payload und
 * erzeugt daraus die Liste der Änderungsvorschläge für die Review-UI.
 *
 * Reines Modul: kein DB-Zugriff, kein React. Stammdaten kommen über
 * `MatchCatalogs` herein.
 *
 * Zwei Leitplanken, die sich durch die gesamte Datei ziehen:
 *  1. **Nichts raten.** Felder, die der Scan nicht gelesen hat (null/undefined),
 *     erzeugen keinen Vorschlag — sonst würde ein unleserlicher Bogen Daten
 *     löschen.
 *  2. **Nichts stillschweigend entfernen.** Löschvorschläge entstehen nur,
 *     wenn der Scan die betreffende Liste überhaupt gefunden hat, und starten
 *     immer abgewählt.
 */

import type { CharacterRow } from "@/lib/supabase/types";
import { getRace } from "@/lib/rules/races";
import { ALL_ALIGNMENTS } from "@/lib/rules/alignment";
import type {
  ScannedCharacterFields,
  ScannedUpdatePayload,
  ScannedClassEntry,
  ScannedTraitEntry,
  ValueSource,
} from "./character-scan-prompt";
import type {
  CharacterSnapshot,
  MatchCatalogs,
  ScanChange,
  ChangeCategory,
  ChangeWrite,
} from "./character-diff-types";
import {
  matchesName,
  parseItemName,
  parseImperialHeight,
  normalizeRaceId,
  resolveFightingStyleId,
  isFightingStyleEntry,
  normalizeNwpName,
  matchNwp,
  matchSpell,
  normalizeWeaponProfName,
  VALID_CLASS_IDS,
  VALID_KIT_IDS,
} from "./character-matching";

// ─── Konfliktauflösung ─────────────────────────────────────────────────────

interface ResolvedValue<T> {
  value: T;
  source: ValueSource;
  conflict?: { printed: T; handwritten: T };
}

function isMissing(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

/**
 * Wählt zwischen gedrucktem und handschriftlichem Wert. Handschrift gewinnt —
 * sie ist die neuere Information und der eigentliche Grund für den Rescan.
 * Weichen beide voneinander ab, wird der Konflikt für die UI festgehalten.
 */
function resolveValue<T>(printed: T | null | undefined, handwritten: T | null | undefined) {
  const hasPrinted = !isMissing(printed);
  const hasHandwritten = !isMissing(handwritten);

  if (hasHandwritten) {
    const result: ResolvedValue<T> = { value: handwritten as T, source: "handwritten" };
    if (hasPrinted && printed !== handwritten) {
      result.conflict = { printed: printed as T, handwritten: handwritten as T };
    }
    return result;
  }
  if (hasPrinted) return { value: printed as T, source: "printed" } as ResolvedValue<T>;
  return null;
}

// ─── Skalare Felder ────────────────────────────────────────────────────────

interface ScalarFieldSpec {
  key: keyof ScannedCharacterFields;
  column: keyof CharacterRow;
  category: ChangeCategory;
  valueType: "number" | "text" | "none";
  /** Überschreibt die Kategorie-Vorgabe (siehe `isDefaultSelected`). */
  forceUnselected?: boolean;
  noteKey?: string;
  /** Wandelt den Scan-Wert in die DB-Repräsentation. */
  transform?: (raw: never) => unknown;
  /** Liefert false, wenn der Wert verworfen werden soll. */
  validate?: (value: unknown) => boolean;
}

const ABILITY_FIELDS: ScalarFieldSpec[] = (
  [
    ["str", "str"],
    ["strExceptional", "str_exceptional"],
    ["dex", "dex"],
    ["con", "con"],
    ["int", "int"],
    ["wis", "wis"],
    ["cha", "cha"],
    ["strStamina", "str_stamina"],
    ["strMuscle", "str_muscle"],
    ["dexAim", "dex_aim"],
    ["dexBalance", "dex_balance"],
    ["conHealth", "con_health"],
    ["conFitness", "con_fitness"],
    ["intReason", "int_reason"],
    ["intKnowledge", "int_knowledge"],
    ["wisIntuition", "wis_intuition"],
    ["wisWillpower", "wis_willpower"],
    ["chaLeadership", "cha_leadership"],
    ["chaAppearance", "cha_appearance"],
  ] as const
).map(([key, column]) => ({
  key: key as keyof ScannedCharacterFields,
  column: column as keyof CharacterRow,
  category: "core" as const,
  valueType: "number" as const,
}));

const GOLD_FIELDS: ScalarFieldSpec[] = (
  [
    ["goldPp", "gold_pp"],
    ["goldGp", "gold_gp"],
    ["goldEp", "gold_ep"],
    ["goldSp", "gold_sp"],
    ["goldCp", "gold_cp"],
  ] as const
).map(([key, column]) => ({
  key: key as keyof ScannedCharacterFields,
  column: column as keyof CharacterRow,
  category: "core" as const,
  valueType: "number" as const,
}));

/** Vergleicht Vor-/Nachteile über ihre Namen — Reihenfolge ist unerheblich. */
function traitSignature(entries: unknown): string {
  if (!Array.isArray(entries)) return "";
  return entries
    .map((e) => String((e as { name?: unknown })?.name ?? "").toLowerCase())
    .filter(Boolean)
    .sort()
    .join("|");
}

function toTraitEntries(raw: never): unknown {
  const entries = raw as unknown as ScannedTraitEntry[];
  if (!Array.isArray(entries)) return [];
  return entries
    .filter((e) => e && typeof e.name === "string" && e.name.trim())
    .map((e) => ({
      name: e.name.trim(),
      name_en: e.name.trim(),
      description: e.description ?? "",
      description_en: e.description ?? "",
      cost: typeof e.cost === "number" ? e.cost : 0,
    }));
}

const SCALAR_FIELDS: ScalarFieldSpec[] = [
  // ── Stammdaten ──
  { key: "name", column: "name", category: "identity", valueType: "text" },
  {
    key: "race",
    column: "race_id",
    category: "identity",
    valueType: "text",
    transform: (raw) => normalizeRaceId(raw as string),
    validate: (v) => Boolean(getRace(v as never)),
  },
  {
    key: "kit",
    column: "kit",
    category: "identity",
    valueType: "text",
    validate: (v) => (VALID_KIT_IDS as readonly string[]).includes(v as string),
  },
  {
    key: "alignment",
    column: "alignment",
    category: "identity",
    valueType: "text",
    validate: (v) => (ALL_ALIGNMENTS as readonly string[]).includes(v as string),
  },

  // ── Kernwerte ──
  ...ABILITY_FIELDS,
  { key: "hpMax", column: "hp_max", category: "core", valueType: "number" },
  {
    key: "hpCurrent",
    column: "hp_current",
    category: "core",
    valueType: "number",
    forceUnselected: true,
    noteKey: "hpCurrentPlayModeHint",
  },
  ...GOLD_FIELDS,

  // ── Weitere Felder ──
  { key: "playerName", column: "player_name", category: "extended", valueType: "text" },
  { key: "age", column: "age", category: "extended", valueType: "number" },
  { key: "gender", column: "gender", category: "extended", valueType: "text" },
  {
    key: "height",
    column: "height_cm",
    category: "extended",
    valueType: "number",
    transform: (raw) => {
      const cm = parseImperialHeight(String(raw));
      return cm > 0 ? Math.round(cm) : null;
    },
    validate: (v) => typeof v === "number" && v > 0,
  },
  {
    key: "weight",
    column: "weight_kg",
    category: "extended",
    valueType: "number",
    transform: (raw) => Math.round(Number(raw) * 0.4536),
    validate: (v) => typeof v === "number" && v > 0,
  },
  { key: "deity", column: "deity", category: "extended", valueType: "text" },
  { key: "priesthood", column: "priesthood", category: "extended", valueType: "text" },
  {
    key: "notes",
    column: "notes",
    category: "extended",
    valueType: "text",
    forceUnselected: true,
  },
  {
    key: "traits",
    column: "traits",
    category: "extended",
    valueType: "none",
    transform: toTraitEntries,
  },
  {
    key: "disadvantages",
    column: "disadvantages",
    category: "extended",
    valueType: "none",
    transform: toTraitEntries,
  },
];

/** Stammdaten und Notizen starten abgewählt, alles andere ist vorausgewählt. */
function isDefaultSelected(category: ChangeCategory, spec?: ScalarFieldSpec): boolean {
  if (spec?.forceUnselected) return false;
  return category !== "identity";
}

// ─── ID-Vergabe ────────────────────────────────────────────────────────────

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "item"
  );
}

/** Vergibt eindeutige, sprechende Change-IDs — React-Key und Test-Selektor. */
function createIdFactory() {
  const used = new Set<string>();
  return (candidate: string): string => {
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
    let n = 2;
    while (used.has(`${candidate}-${n}`)) n++;
    const id = `${candidate}-${n}`;
    used.add(id);
    return id;
  };
}

// ─── Diff-Bausteine ────────────────────────────────────────────────────────

function diffScalars(
  snapshot: CharacterSnapshot,
  payload: ScannedUpdatePayload,
  nextId: (candidate: string) => string
): ScanChange[] {
  const changes: ScanChange[] = [];

  for (const spec of SCALAR_FIELDS) {
    const resolved = resolveValue(payload.printed[spec.key], payload.handwritten[spec.key]);
    if (!resolved) continue;

    const apply = (raw: unknown) => (spec.transform ? spec.transform(raw as never) : raw);
    const proposed = apply(resolved.value);
    if (spec.validate && !spec.validate(proposed)) continue;

    const current = snapshot.character[spec.column];

    // Vor-/Nachteile werden über ihre Namen verglichen, nicht über Objektgleichheit.
    const unchanged =
      spec.valueType === "none"
        ? traitSignature(proposed) === traitSignature(current)
        : proposed === current;
    if (unchanged) continue;

    changes.push({
      id: nextId(`${spec.category}:${spec.column}`),
      category: spec.category,
      kind: "scalar",
      labelKey: `field.${spec.column}`,
      currentValue: current,
      proposedValue: proposed,
      source: resolved.source,
      conflict: resolved.conflict
        ? {
            printed: apply(resolved.conflict.printed),
            handwritten: apply(resolved.conflict.handwritten),
          }
        : undefined,
      defaultSelected: isDefaultSelected(spec.category, spec),
      noteKey: spec.noteKey,
      valueType: spec.valueType,
      target: { writes: [{ table: "characters", field: spec.column as string }] },
    });
  }

  return changes;
}

function indexClasses(entries: ScannedClassEntry[] | undefined): Map<string, ScannedClassEntry> {
  const map = new Map<string, ScannedClassEntry>();
  if (!Array.isArray(entries)) return map;
  for (const entry of entries) {
    const classId = String(entry?.class ?? "")
      .toLowerCase()
      .trim();
    if (!(VALID_CLASS_IDS as readonly string[]).includes(classId)) continue;
    map.set(classId, { ...entry, class: classId });
  }
  return map;
}

function diffClasses(
  snapshot: CharacterSnapshot,
  payload: ScannedUpdatePayload,
  nextId: (candidate: string) => string
): ScanChange[] {
  const printed = indexClasses(payload.printed.classes);
  const handwritten = indexClasses(payload.handwritten.classes);
  const scannedIds = new Set([...printed.keys(), ...handwritten.keys()]);
  if (scannedIds.size === 0) return [];

  const changes: ScanChange[] = [];
  const primaryClassId = snapshot.character.class_id;

  for (const classId of scannedIds) {
    const existing = snapshot.classes.find((c) => c.class_id === classId);

    if (!existing) {
      const entry = handwritten.get(classId) ?? printed.get(classId)!;
      changes.push({
        id: nextId(`identity:class:add:${classId}`),
        category: "identity",
        kind: "list-add",
        labelKey: "change.classAdded",
        labelText: classId,
        currentValue: null,
        proposedValue: entry.level ?? 1,
        source: handwritten.has(classId) ? "handwritten" : "printed",
        defaultSelected: false,
        valueType: "number",
        target: {
          writes: [
            {
              table: "character_classes",
              matchKey: { class_id: classId },
              values: {
                class_id: classId,
                level: entry.level ?? 1,
                xp_current: entry.xp ?? 0,
                is_active: true,
              },
            },
          ],
        },
      });
      continue;
    }

    const isPrimary = classId === primaryClassId;

    for (const [field, column, charColumn] of [
      ["level", "level", "level"],
      ["xp", "xp_current", "xp_current"],
    ] as const) {
      const resolved = resolveValue(
        printed.get(classId)?.[field],
        handwritten.get(classId)?.[field]
      );
      if (!resolved) continue;

      const proposed = Number(resolved.value);
      if (!Number.isFinite(proposed)) continue;
      const current = existing[column];
      if (proposed === current) continue;

      // Die primäre Klasse ist auf `characters` denormalisiert — beide Tabellen
      // gehören zu einem fachlichen Sachverhalt, also zu einer Zeile.
      const writes: ChangeWrite[] = [
        { table: "character_classes", field: column, matchKey: { class_id: classId } },
      ];
      if (isPrimary) writes.push({ table: "characters", field: charColumn });

      changes.push({
        id: nextId(`core:class:${classId}:${field}`),
        category: "core",
        kind: "scalar",
        labelKey: field === "level" ? "change.classLevel" : "change.classXp",
        labelText: classId,
        currentValue: current,
        proposedValue: proposed,
        source: resolved.source,
        conflict: resolved.conflict
          ? {
              printed: Number(resolved.conflict.printed),
              handwritten: Number(resolved.conflict.handwritten),
            }
          : undefined,
        defaultSelected: true,
        valueType: "number",
        target: { writes },
      });
    }
  }

  for (const existing of snapshot.classes) {
    if (scannedIds.has(existing.class_id)) continue;
    changes.push({
      id: nextId(`identity:class:remove:${existing.class_id}`),
      category: "identity",
      kind: "list-remove",
      labelKey: "change.classRemoved",
      labelText: existing.class_id,
      currentValue: existing.level,
      proposedValue: null,
      source: "printed",
      defaultSelected: false,
      noteKey: "removeHint",
      valueType: "none",
      target: { writes: [{ table: "character_classes", rowId: existing.id }] },
    });
  }

  return changes;
}

/** Ein Gegenstand, den der Charakter laut DB besitzt — Ausrüstung oder Inventar. */
interface OwnedItem {
  rowId: string;
  table: "character_equipment" | "character_inventory";
  label: string;
  names: string[];
  quantity: number;
  magicBonus: number | null;
  matched: boolean;
}

function collectOwnedItems(snapshot: CharacterSnapshot): OwnedItem[] {
  const owned: OwnedItem[] = [];

  for (const row of snapshot.equipment) {
    const names = [
      row.weapon?.name,
      row.weapon?.name_en,
      row.armor?.name,
      row.armor?.name_en,
      row.custom_label,
    ].filter((n): n is string => Boolean(n));
    if (names.length === 0) continue;
    owned.push({
      rowId: row.id,
      table: "character_equipment",
      label: names[0],
      names,
      quantity: row.quantity,
      magicBonus: row.hit_bonus,
      matched: false,
    });
  }

  for (const row of snapshot.inventory) {
    const names = [row.custom_name, row.item?.name, row.item?.name_en].filter((n): n is string =>
      Boolean(n)
    );
    if (names.length === 0) continue;
    owned.push({
      rowId: row.id,
      table: "character_inventory",
      label: names[0],
      names,
      quantity: row.quantity,
      magicBonus: null,
      matched: false,
    });
  }

  return owned;
}

function diffEquipment(
  snapshot: CharacterSnapshot,
  payload: ScannedUpdatePayload,
  catalogs: MatchCatalogs,
  nextId: (candidate: string) => string
): ScanChange[] {
  if (payload.equipment.length === 0) return [];

  const changes: ScanChange[] = [];
  const owned = collectOwnedItems(snapshot);

  for (const scanned of payload.equipment) {
    const rawName = String(scanned?.name ?? "").trim();
    if (!rawName) continue;
    const { baseName, quantity } = parseItemName(rawName);
    if (!baseName) continue;
    const bonus = Number(scanned.magicBonus) || 0;

    const hit = owned.find((o) => !o.matched && o.names.some((n) => matchesName(n, baseName)));

    if (hit) {
      hit.matched = true;

      if (hit.magicBonus !== null && hit.magicBonus !== bonus) {
        changes.push({
          id: nextId(`lists:item:bonus:${slugify(hit.label)}`),
          category: "lists",
          kind: "list-update",
          labelKey: "change.itemBonus",
          labelText: hit.label,
          currentValue: hit.magicBonus,
          proposedValue: bonus,
          source: scanned.source,
          defaultSelected: true,
          valueType: "number",
          target: {
            writes: [
              { table: hit.table, field: "hit_bonus", rowId: hit.rowId },
              { table: hit.table, field: "damage_bonus", rowId: hit.rowId },
            ],
          },
        });
      }

      if (hit.quantity !== quantity) {
        changes.push({
          id: nextId(`lists:item:qty:${slugify(hit.label)}`),
          category: "lists",
          kind: "list-update",
          labelKey: "change.itemQuantity",
          labelText: hit.label,
          currentValue: hit.quantity,
          proposedValue: quantity,
          source: scanned.source,
          defaultSelected: true,
          valueType: "number",
          target: { writes: [{ table: hit.table, field: "quantity", rowId: hit.rowId }] },
        });
      }
      continue;
    }

    const weapon = catalogs.weapons.find(
      (w) => matchesName(w.name, baseName) || (w.name_en && matchesName(w.name_en, baseName))
    );
    const armor = weapon
      ? undefined
      : catalogs.armor.find(
          (a) => matchesName(a.name, baseName) || (a.name_en && matchesName(a.name_en, baseName))
        );

    const write: ChangeWrite = weapon
      ? {
          table: "character_equipment",
          values: {
            weapon_id: weapon.id,
            quantity,
            equipped: true,
            hit_bonus: bonus,
            damage_bonus: bonus,
          },
        }
      : armor
        ? { table: "character_equipment", values: { armor_id: armor.id, quantity, equipped: true } }
        : { table: "character_inventory", values: { custom_name: rawName, quantity } };

    changes.push({
      id: nextId(`lists:item:add:${slugify(baseName)}`),
      category: "lists",
      kind: "list-add",
      labelKey: "change.itemAdded",
      labelText: rawName,
      currentValue: null,
      proposedValue: quantity,
      source: scanned.source,
      defaultSelected: true,
      valueType: "number",
      target: { writes: [write] },
    });
  }

  for (const item of owned) {
    if (item.matched) continue;
    changes.push({
      id: nextId(`lists:item:remove:${slugify(item.label)}`),
      category: "lists",
      kind: "list-remove",
      labelKey: "change.itemRemoved",
      labelText: item.label,
      currentValue: item.quantity,
      proposedValue: null,
      source: "printed",
      defaultSelected: false,
      noteKey: "removeHint",
      valueType: "none",
      target: { writes: [{ table: item.table, rowId: item.rowId }] },
    });
  }

  return changes;
}

function diffSpells(
  snapshot: CharacterSnapshot,
  payload: ScannedUpdatePayload,
  catalogs: MatchCatalogs,
  nextId: (candidate: string) => string
): ScanChange[] {
  if (payload.spells.length === 0) return [];

  const changes: ScanChange[] = [];
  const knownIds = new Set(snapshot.spells.map((s) => s.spell_id));
  const scannedIds = new Set<string>();

  for (const scanned of payload.spells) {
    const match = matchSpell(
      { name: String(scanned?.name ?? ""), level: scanned.level },
      catalogs.spells
    );
    if (!match) continue;
    scannedIds.add(match.id);
    if (knownIds.has(match.id)) continue;

    changes.push({
      id: nextId(`lists:spell:add:${slugify(match.name)}`),
      category: "lists",
      kind: "list-add",
      labelKey: "change.spellAdded",
      labelText: match.name,
      labelParams: { level: match.level },
      currentValue: null,
      proposedValue: match.name,
      source: scanned.source,
      defaultSelected: true,
      valueType: "none",
      target: {
        writes: [
          {
            table: "character_spells",
            matchKey: { spell_id: match.id },
            values: { spell_id: match.id, prepared: false },
          },
        ],
      },
    });
  }

  for (const known of snapshot.spells) {
    if (scannedIds.has(known.spell_id)) continue;
    changes.push({
      id: nextId(`lists:spell:remove:${slugify(known.spell?.name ?? known.spell_id)}`),
      category: "lists",
      kind: "list-remove",
      labelKey: "change.spellRemoved",
      labelText: known.spell?.name ?? known.spell_id,
      currentValue: known.spell?.name ?? known.spell_id,
      proposedValue: null,
      source: "printed",
      defaultSelected: false,
      noteKey: "removeHint",
      valueType: "none",
      // character_spells hat einen zusammengesetzten PK — gelöscht wird über
      // den Match, nicht über eine Zeilen-ID.
      target: { writes: [{ table: "character_spells", matchKey: { spell_id: known.spell_id } }] },
    });
  }

  return changes;
}

function diffProficiencies(
  snapshot: CharacterSnapshot,
  payload: ScannedUpdatePayload,
  catalogs: MatchCatalogs,
  nextId: (candidate: string) => string
): ScanChange[] {
  if (payload.weaponProficiencies.length === 0) return [];

  const changes: ScanChange[] = [];
  const scannedStyles = new Set<string>();
  const scannedProfs = new Set<string>();

  for (const scanned of payload.weaponProficiencies) {
    const rawName = String(scanned?.name ?? "").trim();
    if (!rawName) continue;

    if (isFightingStyleEntry(rawName)) {
      const styleId = resolveFightingStyleId(rawName);
      if (!styleId) continue;
      scannedStyles.add(styleId);
      if (snapshot.fightingStyles.some((s) => s.style_id === styleId)) continue;

      changes.push({
        id: nextId(`lists:style:add:${styleId}`),
        category: "lists",
        kind: "list-add",
        labelKey: "change.fightingStyleAdded",
        labelText: styleId,
        currentValue: null,
        proposedValue: styleId,
        source: scanned.source,
        defaultSelected: true,
        valueType: "none",
        target: {
          writes: [
            {
              table: "character_fighting_styles",
              matchKey: { style_id: styleId },
              values: { style_id: styleId, slots_invested: 1 },
            },
          ],
        },
      });
      continue;
    }

    const canonical = normalizeWeaponProfName(rawName, catalogs.weapons);
    scannedProfs.add(canonical.toLowerCase());
    const existing = snapshot.weaponProficiencies.find(
      (p) => p.weapon_name.toLowerCase() === canonical.toLowerCase()
    );

    if (!existing) {
      changes.push({
        id: nextId(`lists:prof:add:${slugify(canonical)}`),
        category: "lists",
        kind: "list-add",
        labelKey: "change.weaponProfAdded",
        labelText: canonical,
        currentValue: null,
        proposedValue: canonical,
        source: scanned.source,
        defaultSelected: true,
        valueType: "none",
        target: {
          writes: [
            {
              table: "character_weapon_proficiencies",
              matchKey: { weapon_name: canonical },
              values: { weapon_name: canonical, specialization: Boolean(scanned.specialized) },
            },
          ],
        },
      });
      continue;
    }

    if (existing.specialization !== Boolean(scanned.specialized)) {
      changes.push({
        id: nextId(`lists:prof:spec:${slugify(canonical)}`),
        category: "lists",
        kind: "list-update",
        labelKey: "change.weaponProfSpecialization",
        labelText: canonical,
        currentValue: existing.specialization,
        proposedValue: Boolean(scanned.specialized),
        source: scanned.source,
        defaultSelected: true,
        valueType: "none",
        target: {
          writes: [
            {
              table: "character_weapon_proficiencies",
              field: "specialization",
              rowId: existing.id,
            },
          ],
        },
      });
    }
  }

  for (const existing of snapshot.weaponProficiencies) {
    if (scannedProfs.has(existing.weapon_name.toLowerCase())) continue;
    changes.push({
      id: nextId(`lists:prof:remove:${slugify(existing.weapon_name)}`),
      category: "lists",
      kind: "list-remove",
      labelKey: "change.weaponProfRemoved",
      labelText: existing.weapon_name,
      currentValue: existing.weapon_name,
      proposedValue: null,
      source: "printed",
      defaultSelected: false,
      noteKey: "removeHint",
      valueType: "none",
      target: { writes: [{ table: "character_weapon_proficiencies", rowId: existing.id }] },
    });
  }

  for (const existing of snapshot.fightingStyles) {
    if (scannedStyles.has(existing.style_id)) continue;
    changes.push({
      id: nextId(`lists:style:remove:${existing.style_id}`),
      category: "lists",
      kind: "list-remove",
      labelKey: "change.fightingStyleRemoved",
      labelText: existing.style_id,
      currentValue: existing.style_id,
      proposedValue: null,
      source: "printed",
      defaultSelected: false,
      noteKey: "removeHint",
      valueType: "none",
      target: { writes: [{ table: "character_fighting_styles", rowId: existing.id }] },
    });
  }

  return changes;
}

function diffNwps(
  snapshot: CharacterSnapshot,
  payload: ScannedUpdatePayload,
  catalogs: MatchCatalogs,
  nextId: (candidate: string) => string
): ScanChange[] {
  if (payload.nwps.length === 0) return [];

  const changes: ScanChange[] = [];
  const knownIds = new Set(snapshot.nonweaponProficiencies.map((p) => p.proficiency_id));
  const scannedIds = new Set<string>();

  for (const scanned of payload.nwps) {
    const normalized = normalizeNwpName(String(scanned?.name ?? ""));
    if (!normalized) continue;
    const match = matchNwp(normalized, catalogs.nwps);
    if (!match) continue;
    scannedIds.add(match.id);
    if (knownIds.has(match.id)) continue;

    changes.push({
      id: nextId(`lists:nwp:add:${slugify(match.id)}`),
      category: "lists",
      kind: "list-add",
      labelKey: "change.nwpAdded",
      labelText: match.name,
      currentValue: null,
      proposedValue: match.name,
      source: scanned.source,
      defaultSelected: true,
      valueType: "none",
      target: {
        writes: [
          {
            table: "character_nonweapon_proficiencies",
            matchKey: { proficiency_id: match.id },
            values: { proficiency_id: match.id },
          },
        ],
      },
    });
  }

  for (const existing of snapshot.nonweaponProficiencies) {
    if (scannedIds.has(existing.proficiency_id)) continue;
    changes.push({
      id: nextId(`lists:nwp:remove:${slugify(existing.proficiency_id)}`),
      category: "lists",
      kind: "list-remove",
      labelKey: "change.nwpRemoved",
      labelText: existing.proficiency?.name ?? existing.proficiency_id,
      currentValue: existing.proficiency?.name ?? existing.proficiency_id,
      proposedValue: null,
      source: "printed",
      defaultSelected: false,
      noteKey: "removeHint",
      valueType: "none",
      target: { writes: [{ table: "character_nonweapon_proficiencies", rowId: existing.id }] },
    });
  }

  return changes;
}

function diffLanguages(
  snapshot: CharacterSnapshot,
  payload: ScannedUpdatePayload,
  nextId: (candidate: string) => string
): ScanChange[] {
  if (payload.languages.length === 0) return [];

  const changes: ScanChange[] = [];
  const known = new Map(snapshot.languages.map((l) => [l.language_name.toLowerCase(), l]));
  const scanned = new Set<string>();

  for (const entry of payload.languages) {
    const name = String(entry?.name ?? "").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (key === "common" || key.startsWith("native")) continue;
    scanned.add(key);
    if (known.has(key)) continue;

    changes.push({
      id: nextId(`lists:language:add:${slugify(name)}`),
      category: "lists",
      kind: "list-add",
      labelKey: "change.languageAdded",
      labelText: name,
      currentValue: null,
      proposedValue: name,
      source: entry.source,
      defaultSelected: true,
      valueType: "none",
      target: {
        writes: [
          {
            table: "character_languages",
            matchKey: { language_name: name },
            values: { language_name: name },
          },
        ],
      },
    });
  }

  for (const [key, row] of known) {
    if (scanned.has(key)) continue;
    changes.push({
      id: nextId(`lists:language:remove:${slugify(row.language_name)}`),
      category: "lists",
      kind: "list-remove",
      labelKey: "change.languageRemoved",
      labelText: row.language_name,
      currentValue: row.language_name,
      proposedValue: null,
      source: "printed",
      defaultSelected: false,
      noteKey: "removeHint",
      valueType: "none",
      target: { writes: [{ table: "character_languages", rowId: row.id }] },
    });
  }

  return changes;
}

// ─── Einstiegspunkt ────────────────────────────────────────────────────────

/**
 * Erzeugt die Liste der Änderungsvorschläge aus DB-Stand und Scan-Payload.
 * Leeres Ergebnis heißt: der Bogen deckt sich mit dem gespeicherten Stand.
 */
export function buildChangeSet(
  snapshot: CharacterSnapshot,
  payload: ScannedUpdatePayload,
  catalogs: MatchCatalogs
): ScanChange[] {
  const nextId = createIdFactory();

  return [
    ...diffScalars(snapshot, payload, nextId),
    ...diffClasses(snapshot, payload, nextId),
    ...diffEquipment(snapshot, payload, catalogs, nextId),
    ...diffSpells(snapshot, payload, catalogs, nextId),
    ...diffProficiencies(snapshot, payload, catalogs, nextId),
    ...diffNwps(snapshot, payload, catalogs, nextId),
    ...diffLanguages(snapshot, payload, nextId),
  ];
}
