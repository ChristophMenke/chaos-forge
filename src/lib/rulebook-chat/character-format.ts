/**
 * A character as compact Markdown for SvenBot's prompt. Values come from the
 * same rules engine as play mode (computeCharacterCombatData,
 * computeSpellResources), so SvenBot sees what the player sees.
 *
 * Deliberately left out: notes, personal details (player name, age, size,
 * looks), avatar and XP history.
 */
import messages from "../../../messages/de.json";
import { getAlignmentLabel } from "@/lib/rules/alignment";
import { computeCharacterCombatData } from "@/lib/rules/character-computed";
import { getClass } from "@/lib/rules/classes";
import { FIGHTING_STYLES } from "@/lib/rules/fighting-styles";
import { getKit, getKitSpellFailure } from "@/lib/rules/kits";
import {
  getOppositionSchools,
  getPriestSpheres,
  getSpecialist,
  isPriestCaster,
} from "@/lib/rules/magic";
import { getMagicItemEffects } from "@/lib/rules/magic-items";
import { getPriesthood } from "@/lib/rules/priesthoods";
import { getRace } from "@/lib/rules/races";
import { computeSpellResources } from "@/lib/rules/spell-resources";
import type { AbilityKey } from "@/lib/rules/temporary-effects";
import type { ClassId, RaceId } from "@/lib/rules/types";
import type {
  CharacterEffectRow,
  CharacterSpellWithDetails,
  EffectModifier,
  MagicEffects,
} from "@/lib/supabase/types";
import type { CharacterBundle } from "./character-bundle";

export type FormatDetail = "full" | "compact";

const MAX_INVENTORY_ITEMS = 40;
const MAX_NOTE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 150;
/** Hard cap per character so one huge spellbook cannot crowd out the rules. */
export const MAX_CHARACTER_LENGTH = 12000;

const ABILITIES: { key: AbilityKey; label: string; subs: [string, string] }[] = [
  { key: "str", label: "ST", subs: ["Muskel", "Ausdauer"] },
  { key: "dex", label: "GE", subs: ["Zielen", "Gleichgewicht"] },
  { key: "con", label: "KO", subs: ["Gesundheit", "Fitness"] },
  { key: "int", label: "IN", subs: ["Wissen", "Verstand"] },
  { key: "wis", label: "WE", subs: ["Intuition", "Willenskraft"] },
  { key: "cha", label: "CH", subs: ["Führung", "Aussehen"] },
];

const THIEF_SKILLS = [
  ["openLocks", "Schlösser öffnen"],
  ["findTraps", "Fallen finden/entschärfen"],
  ["moveSilently", "Leise bewegen"],
  ["hideInShadows", "In Schatten verstecken"],
  ["detectNoise", "Geräusche hören"],
  ["climbWalls", "Klettern"],
  ["readLanguages", "Sprachen lesen"],
] as const;

const EFFECT_TARGETS = messages.effects.targets as Record<string, string>;
const EFFECT_FLAGS = messages.effects.flags as Record<string, string>;

const truncate = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "±0");

/** German name, English in brackets when it differs. */
const bilingual = (name: string, nameEn?: string | null) =>
  nameEn && nameEn !== name ? `${name} (${nameEn})` : name;

const list = (items: string[]) => (items.length > 0 ? items.join(" · ") : "—");

function formatStrength(value: number, exceptional: number | null): string {
  if (value !== 18 || !exceptional) return String(value);
  return `18/${exceptional >= 100 ? "00" : String(exceptional).padStart(2, "0")}`;
}

function formatModifier(m: EffectModifier): string {
  const target = EFFECT_TARGETS[m.target] ?? m.target;
  const value =
    m.op === "set"
      ? `= ${m.value}`
      : m.op === "factor"
        ? `×${+m.value.toFixed(2)}`
        : signed(m.value);
  return `${target} ${value}${m.condition ? ` (gegen ${m.condition})` : ""}`;
}

function formatEffect(effect: CharacterEffectRow): string {
  const parts = [
    ...effect.modifiers.map(formatModifier),
    ...effect.flags.map((f) => EFFECT_FLAGS[f] ?? f),
  ];
  if (effect.temp_hp_remaining > 0) parts.push(`${effect.temp_hp_remaining} temporäre TP übrig`);
  if (effect.duration_text) parts.push(`Dauer: ${effect.duration_text}`);
  if (effect.notes) parts.push(`Notiz: ${truncate(effect.notes, MAX_NOTE_LENGTH)}`);
  return `${effect.name}${parts.length ? ` (${parts.join(", ")})` : ""}`;
}

function formatMagicEffects(e: MagicEffects): string[] {
  const parts: string[] = [];
  for (const key of ["str", "dex", "con", "int", "wis", "cha"] as const) {
    if (e[key]) parts.push(`${key.toUpperCase()} ${signed(e[key]!)}`);
    const override = e.stat_overrides?.[key];
    if (override) parts.push(`${key.toUpperCase()} = ${override}`);
  }
  if (e.ac_bonus) parts.push(`RK ${signed(e.ac_bonus)}`);
  if (e.attack_bonus) parts.push(`Angriff ${signed(e.attack_bonus)}`);
  if (e.damage_bonus) parts.push(`Schaden ${signed(e.damage_bonus)}`);
  if (e.save_all) parts.push(`alle RW ${signed(e.save_all)}`);
  if (e.save_vs_spell) parts.push(`RW Zauber ${signed(e.save_vs_spell)}`);
  if (e.save_vs_poison) parts.push(`RW Gift/Tod ${signed(e.save_vs_poison)}`);
  if (e.save_vs_breath) parts.push(`RW Odem ${signed(e.save_vs_breath)}`);
  if (e.save_vs_petrification) parts.push(`RW Versteinerung ${signed(e.save_vs_petrification)}`);
  if (e.save_vs_rod) parts.push(`RW Stab ${signed(e.save_vs_rod)}`);
  if (e.magic_resistance) parts.push(`Magieresistenz ${e.magic_resistance} %`);
  if (e.spell_failure) parts.push(`Zauberpatzer ${e.spell_failure} %`);
  if (e.perception_bonus) parts.push(`Wahrnehmung ${signed(e.perception_bonus)}`);
  if (e.max_charges) parts.push(`Ladungen ${e.current_charges ?? 0}/${e.max_charges}`);
  for (const a of e.spell_abilities ?? []) {
    parts.push(
      `${bilingual(a.name, a.name_en)} ${a.uses_per_day ? `${a.uses_per_day}×/Tag` : "beliebig"}`
    );
  }
  parts.push(...(e.resistances ?? []), ...(e.passive_abilities ?? []));
  if (e.is_cursed) parts.push("verflucht");
  if (e.description) parts.push(truncate(e.description, MAX_DESCRIPTION_LENGTH));
  return parts;
}

function spellTags(s: CharacterSpellWithDetails, isPriestList: boolean): string {
  const tags: string[] = [];
  if (!isPriestList && s.prepared) tags.push("memoriert");
  if (s.expended) tags.push("gewirkt");
  return tags.length ? ` [${tags.join(", ")}]` : "";
}

function formatSpellList(
  title: string,
  spells: CharacterSpellWithDetails[],
  isPriestList: boolean
): string[] {
  if (spells.length === 0) return [];
  const byLevel = new Map<number, CharacterSpellWithDetails[]>();
  for (const s of [...spells].sort((a, b) => a.spell.name.localeCompare(b.spell.name))) {
    byLevel.set(s.spell.level, [...(byLevel.get(s.spell.level) ?? []), s]);
  }
  const lines = [`  ${title}:`];
  for (const level of [...byLevel.keys()].sort((a, b) => a - b)) {
    const entries = byLevel.get(level)!.map((s) => {
      const kind = s.spell.school ?? s.spell.sphere;
      const name = bilingual(s.spell.name, s.spell.name_en);
      return `${name}${kind ? ` – ${kind}` : ""}${spellTags(s, isPriestList)}`;
    });
    lines.push(`    Grad ${level}: ${entries.join(" · ")}`);
  }
  return lines;
}

function header(bundle: CharacterBundle): string {
  const { character } = bundle;
  const kind = character.is_npc ? "NPC" : "Spieler-Charakter";
  const state = character.is_active ? "aktiv" : "archiviert";
  return `## ${character.name} (${kind}, ${state})`;
}

function identityLine(bundle: CharacterBundle): string {
  const { character, classes } = bundle;
  const race = character.race_id ? getRace(character.race_id as RaceId) : undefined;
  const classText = classes
    .map((cc) => {
      const name = getClass(cc.class_id as ClassId)?.name ?? cc.class_id;
      if (cc.is_active) return `${name} ${cc.level}`;
      return `${name} ${cc.level} (ruhend, Dual-Class)`;
    })
    .join(" / ");
  const kit = getKit(character.kit);
  return [
    race?.name ?? character.race_id ?? "Rasse unbekannt",
    classText || "keine Klasse",
    kit ? `Kit: ${kit.name}` : null,
    `Gesinnung: ${getAlignmentLabel(character.alignment)}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function formatCharacter(bundle: CharacterBundle, detail: FormatDetail): string {
  const { character, classes, equipment, epicItems, effects } = bundle;
  const combat = computeCharacterCombatData(
    character,
    classes,
    equipment,
    epicItems,
    bundle.weaponProficiencies,
    bundle.fightingStyles,
    effects
  );
  const stats = combat.effectiveStats;

  const abilityText = ABILITIES.map(({ key, label }) => {
    const stored =
      key === "str" ? formatStrength(character.str, character.str_exceptional) : character[key];
    const value = stats.values[key];
    return stats.modified[key] ? `${label} ${stored} (effektiv ${value})` : `${label} ${stored}`;
  }).join(" · ");

  const hp = `TP ${combat.hpCurrent}/${combat.hpMax}${combat.tempHp > 0 ? ` (+${combat.tempHp} temporär)` : ""}`;
  const thac0 =
    combat.thac0Effective !== combat.thac0
      ? `ETW0 ${combat.thac0} (effektiv ${combat.thac0Effective})`
      : `ETW0 ${combat.thac0}`;
  const combatParts = [hp, `RK ${combat.ac}`, thac0];
  if (combat.primaryWeapon) {
    combatParts.push(`Angriffe/Runde ${combat.primaryWeapon.attacksPerRound}`);
  }
  combatParts.push(`Wahrnehmung ${combat.perception}`);
  if (combat.magicResistance > 0) combatParts.push(`Magieresistenz ${combat.magicResistance} %`);
  if (combat.backstabMultiplier) combatParts.push(`Hinterhalt ×${combat.backstabMultiplier}`);

  const s = combat.saves;
  const savesLine = `- Rettungswürfe: Lähmung/Gift/Tod ${s.paralyzation} · Stab/Rute/Zauberstab ${s.rod} · Versteinerung/Verwandlung ${s.petrification} · Odem ${s.breath} · Zauber ${s.spell}`;

  const thiefLine = combat.thiefSkills
    ? `- Diebesfertigkeiten: ${THIEF_SKILLS.map(([k, label]) => `${label} ${combat.thiefSkills![k]} %`).join(" · ")}`
    : null;

  const lines = [
    header(bundle),
    `- ${identityLine(bundle)}`,
    `- Attribute: ${abilityText}`,
    `- ${combatParts.join(" · ")}`,
    savesLine,
    thiefLine,
  ];

  if (detail === "compact") {
    if (effects.length > 0)
      lines.push(`- Aktive Effekte: ${effects.map((e) => e.name).join(", ")}`);
    return lines.filter(Boolean).join("\n");
  }

  // Sub-stats (Player's Option), effective values
  const subText = ABILITIES.flatMap(({ key, label, subs }) => {
    const [a, b] = stats.subs[key];
    if (a === undefined && b === undefined) return [];
    return [`${label}: ${subs[0]} ${a ?? "—"}, ${subs[1]} ${b ?? "—"}`];
  });
  if (subText.length > 0) lines.push(`- Unterwerte: ${subText.join(" · ")}`);

  lines.push(...formatMagic(bundle, stats.values.wis, combat.epicEffects.bonusSpellPoints));

  // Spell failure from all sources
  const hasArmor = equipment.some((e) => e.equipped && e.armor && !e.armor.is_shield);
  const failure = [
    combat.epicEffects.spellFailure > 0 && `Episch ${combat.epicEffects.spellFailure} %`,
    combat.effectSummary.spellFailure > 0 && `Effekte ${combat.effectSummary.spellFailure} %`,
    getMagicItemEffects(equipment).spellFailure > 0 &&
      `Magische Items ${getMagicItemEffects(equipment).spellFailure} %`,
    getKitSpellFailure(character.kit, hasArmor) > 0 &&
      `Kit in Rüstung ${getKitSpellFailure(character.kit, hasArmor)} %`,
    combat.epicEffects.wildMagic > 0 && `wilde Magie ${combat.epicEffects.wildMagic} %`,
  ].filter(Boolean);
  if (failure.length > 0) lines.push(`- Zauberpatzer: ${failure.join(" · ")}`);
  if (combat.effectSummary.cannotCast) lines.push("- Kann derzeit nicht zaubern (Effekt)");

  lines.push(...formatEquipment(bundle, combat.epicEffects));

  // Skills
  const weaponProfs = bundle.weaponProficiencies.map(
    (p) => `${p.weapon_name}${p.specialization ? " (spezialisiert)" : ""}`
  );
  const nwps = bundle.nonweaponProficiencies.map((p) =>
    p.proficiency ? `${p.proficiency.name} (${p.proficiency.ability})` : p.proficiency_id
  );
  const styles = bundle.fightingStyles.map(
    (f) => `${FIGHTING_STYLES[f.style_id]?.name ?? f.style_id} (${f.slots_invested})`
  );
  lines.push(`- Waffenfertigkeiten: ${list(weaponProfs)}`);
  lines.push(`- Allgemeine Fertigkeiten: ${list(nwps)}`);
  if (styles.length > 0) lines.push(`- Kampfstile: ${list(styles)}`);
  lines.push(`- Sprachen: ${list(bundle.languages.map((l) => l.language_name))}`);

  const traits = (character.traits ?? []).map((t) => t.name);
  const disadvantages = (character.disadvantages ?? []).map((t) => t.name);
  if (traits.length > 0) lines.push(`- Eigenschaften: ${list(traits)}`);
  if (disadvantages.length > 0) lines.push(`- Nachteile: ${list(disadvantages)}`);

  if (effects.length > 0) {
    lines.push(`- Aktive Effekte: ${effects.map(formatEffect).join(" · ")}`);
  }

  const inventory = bundle.inventory.map((i) => {
    const name = i.item?.name ?? i.custom_name ?? "?";
    return i.quantity > 1 ? `${name} ×${i.quantity}` : name;
  });
  if (inventory.length > 0) {
    const shown = inventory.slice(0, MAX_INVENTORY_ITEMS);
    const more = inventory.length - shown.length;
    lines.push(`- Inventar: ${shown.join(" · ")}${more > 0 ? ` · … und ${more} weitere` : ""}`);
  }

  const purse = [
    [character.gold_pp, "PM"],
    [character.gold_gp, "GM"],
    [character.gold_ep, "EM"],
    [character.gold_sp, "SM"],
    [character.gold_cp, "KM"],
  ]
    .filter(([amount]) => Number(amount) > 0)
    .map(([amount, coin]) => `${amount} ${coin}`);
  lines.push(`- Börse: ${list(purse)}`);

  return truncate(lines.filter(Boolean).join("\n"), MAX_CHARACTER_LENGTH);
}

function formatMagic(bundle: CharacterBundle, effectiveWis: number, epicBonus: number): string[] {
  const { character, classes, spells } = bundle;
  const activeEntries = classes
    .filter((cc) => cc.is_active)
    .map((cc) => ({ classId: cc.class_id, level: cc.level }));
  const resources = computeSpellResources({
    character,
    classEntries: activeEntries,
    effectiveWis,
    epicBonusSpellPoints: epicBonus,
    spells,
  });
  if (resources.mode === "none" && spells.length === 0) return [];

  const lines: string[] = [];
  if (resources.mode === "points") {
    lines.push(
      `- Zauber (Zauberpunkte): ${resources.pointsRemaining} von ${resources.totalPoints} übrig`
    );
  } else if (resources.mode === "slots") {
    const slots = resources.totalSlots
      .map((total, i) => ({ level: i + 1, total }))
      .filter((s) => s.total > 0)
      .map(({ level, total }) => {
        const free = Math.max(0, total - (resources.expendedByLevel[level] ?? 0));
        return `Grad ${level}: ${free} von ${total} frei`;
      });
    lines.push(`- Zauber (Slots): ${list(slots)}`);
  } else {
    lines.push("- Zauber:");
  }

  const casterId = resources.casterClass.classId as ClassId;
  const specialist = getSpecialist(casterId);
  if (specialist) {
    lines.push(
      `  Spezialist: ${getClass(casterId)?.name ?? casterId} · Oppositionsschulen: ${list(getOppositionSchools(casterId))}`
    );
  }

  const priestClass = classes.find((cc) => cc.is_active && isPriestCaster(cc.class_id as ClassId));
  if (priestClass) {
    const spheres = getPriestSpheres(
      priestClass.class_id as ClassId,
      character.priesthood,
      character.alignment
    );
    const major = Object.entries(spheres)
      .filter(([, access]) => access === "major")
      .map(([sphere]) => sphere);
    const minor = Object.entries(spheres)
      .filter(([, access]) => access === "minor")
      .map(([sphere]) => sphere);
    const priesthood = character.priesthood ? getPriesthood(character.priesthood) : null;
    const faith = [
      character.deity && `Gottheit: ${character.deity}`,
      priesthood && `Priesterschaft: ${priesthood.name}`,
    ].filter(Boolean);
    if (faith.length > 0) lines.push(`  ${faith.join(" · ")}`);
    lines.push(`  Sphären: Hauptzugang ${list(major)} · Nebenzugang ${list(minor)}`);
  }

  const wizardSpells = spells.filter((s) => s.spell.spell_type === "wizard");
  const priestSpells = spells.filter((s) => s.spell.spell_type === "priest");
  lines.push(...formatSpellList("Zauberbuch", wizardSpells, false));
  lines.push(...formatSpellList("Vorbereitete Priesterzauber", priestSpells, true));
  return lines;
}

function formatEquipment(
  bundle: CharacterBundle,
  epicEffects: ReturnType<typeof computeCharacterCombatData>["epicEffects"]
): string[] {
  const lines: string[] = [];
  const equippedTag = (equipped: boolean) => (equipped ? ", angelegt" : "");

  const weapons = bundle.equipment
    .filter((e) => e.weapon)
    .map((e) => {
      const name = e.custom_label ?? bilingual(e.weapon!.name, e.weapon!.name_en);
      const bonus = [
        e.hit_bonus ? `Treffer ${signed(e.hit_bonus)}` : null,
        e.damage_bonus ? `Schaden ${signed(e.damage_bonus)}` : null,
      ].filter(Boolean);
      const extra = [`${e.weapon!.damage_sm}/${e.weapon!.damage_l}`, ...bonus].join(", ");
      return `${name}${e.quantity > 1 ? ` ×${e.quantity}` : ""} (${extra}${equippedTag(e.equipped)})`;
    });
  const armor = bundle.equipment
    .filter((e) => e.armor)
    .map((e) => {
      const name = e.custom_label ?? bilingual(e.armor!.name, e.armor!.name_en);
      const kind = e.armor!.is_shield ? "Schild" : `RK ${e.armor!.ac}`;
      return `${name} (${kind}${equippedTag(e.equipped)})`;
    });
  const magicItems = bundle.equipment
    .filter((e) => !e.weapon && !e.armor)
    .map((e) => {
      const effects = formatMagicEffects(e.magic_effects ?? {});
      const details = [...effects, e.equipped ? "angelegt" : null].filter(Boolean);
      return `${e.custom_label ?? "?"}${details.length ? ` (${details.join(", ")})` : ""}`;
    });
  lines.push(`- Waffen: ${list(weapons)}`);
  lines.push(`- Rüstung/Schild: ${list(armor)}`);
  if (magicItems.length > 0) lines.push(`- Magische Gegenstände: ${list(magicItems)}`);

  const epic = bundle.epicItems.map((item) => {
    const level = item.damage_levels?.[String(item.damage_level)]?.description;
    const parts = [
      item.max_damage_level > 0
        ? `Schadensstufe ${item.damage_level}/${item.max_damage_level}`
        : null,
      level ? truncate(level, MAX_DESCRIPTION_LENGTH) : null,
      item.equipped ? "angelegt" : "abgelegt",
    ].filter(Boolean);
    return `${bilingual(item.name, item.name_en)} (${parts.join(", ")})`;
  });
  if (epic.length > 0) lines.push(`- Epische Ausrüstung: ${list(epic)}`);

  const abilities = epicEffects.spellAbilities.map((a) => {
    const uses = a.usesPerDay
      ? `${a.usesPerDay}×/Tag`
      : a.usesPerWeek
        ? `${a.usesPerWeek}×/Woche`
        : "beliebig";
    return `${bilingual(a.name, a.name_en)} (${uses})`;
  });
  if (abilities.length > 0) lines.push(`  Freigeschaltete Fähigkeiten: ${list(abilities)}`);
  const passives = [...epicEffects.passiveAbilities, ...epicEffects.miscEffects];
  if (passives.length > 0) lines.push(`  Passive Effekte: ${list(passives)}`);

  return lines;
}

/** The prompt block for all characters SvenBot gets this time. */
export function formatCharacterBlock(full: CharacterBundle[], compact: CharacterBundle[]): string {
  if (full.length === 0 && compact.length === 0) return "";
  const parts = full.map((b) => formatCharacter(b, "full"));
  if (compact.length > 0) {
    parts.push(
      "### Weitere aktive Helden der Gruppe (Kurzfassung)\n" +
        compact.map((b) => formatCharacter(b, "compact")).join("\n\n")
    );
  }
  return parts.join("\n\n");
}
