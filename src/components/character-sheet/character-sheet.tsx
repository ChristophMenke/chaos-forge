"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { localized } from "@/lib/utils/localize";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RACES } from "@/lib/rules/races";
import { CLASSES } from "@/lib/rules/classes";
import { getAlignmentLabel } from "@/lib/rules/alignment";
import { getXpForNextLevel, getXpThreshold } from "@/lib/rules/experience";
import type { ClassId, RaceId } from "@/lib/rules/types";
import {
  getMulticlassThac0,
  getMulticlassSaves,
  multiclassHasExceptionalStr,
  getMulticlassGroups,
} from "@/lib/rules/multiclass";
import {
  getStrengthModifiers,
  getDexterityModifiers,
  getConstitutionModifiers,
  getIntelligenceModifiers,
  getWisdomModifiers,
  getCharismaModifiers,
} from "@/lib/rules/abilities";
import { getAttacksPerRound } from "@/lib/rules/combat";
import { calculateAC, calculateEncumbrance } from "@/lib/rules/equipment";
import { hasThiefSkills, getBackstabMultiplier } from "@/lib/rules/thief";
import { getKit, getEffectiveHitDie, getKitsForClass } from "@/lib/rules/kits";
import { getAllClasses } from "@/lib/rules/classes";
import { Spinner } from "@/components/ui/spinner";
import { AvatarUpload } from "@/components/avatar-upload";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ShareDialog } from "./share-dialog";
import { Share2, Swords, Printer, EyeOff, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import type {
  CharacterRow,
  CharacterClassRow,
  SessionRow,
  XpHistoryRow,
} from "@/lib/supabase/types";
import { TabEquipment } from "./tab-equipment";
import { TabSpells } from "./tab-spells";
import { TabThiefSkills } from "./tab-thief-skills";
import { TabProficiencies } from "./tab-proficiencies";
import { XpAddDialog } from "./xp-add-dialog";
import { PayDialog } from "./pay-dialog";
import type {
  CharacterEquipmentWithDetails,
  CharacterSpellWithDetails,
  WeaponRow,
  ArmorRow,
  SpellRow,
  CharacterWeaponProficiencyRow,
  CharacterNWPWithDetails,
  NonweaponProficiencyRow,
  CharacterLanguageRow,
  CharacterInventoryWithDetails,
  GeneralItemRow,
  CharacterFightingStyleRow,
} from "@/lib/supabase/types";

interface CharacterSheetProps {
  character: CharacterRow;
  characterClasses: CharacterClassRow[];
  userId: string;
  equipment: CharacterEquipmentWithDetails[];
  spells: CharacterSpellWithDetails[];
  allWeapons: WeaponRow[];
  allArmor: ArmorRow[];
  allSpells: SpellRow[];
  weaponProficiencies: CharacterWeaponProficiencyRow[];
  nonweaponProficiencies: CharacterNWPWithDetails[];
  inventory: CharacterInventoryWithDetails[];
  allGeneralItems: GeneralItemRow[];
  allNonweaponProficiencies: NonweaponProficiencyRow[];
  languages: CharacterLanguageRow[];
  fightingStyles: CharacterFightingStyleRow[];
  sessions: Pick<SessionRow, "id" | "title" | "session_date">[];
  xpHistory: XpHistoryRow[];
}

export function CharacterSheet({
  character: initial,
  characterClasses: initialClasses,
  userId,
  equipment,
  spells,
  allWeapons,
  allArmor,
  allSpells,
  weaponProficiencies,
  nonweaponProficiencies,
  allNonweaponProficiencies,
  inventory,
  allGeneralItems,
  languages,
  fightingStyles,
  sessions,
  xpHistory,
}: CharacterSheetProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("sheet");
  const tc = useTranslations("characters");
  const tcom = useTranslations("common");
  const ts = useTranslations("sharing");
  const [character, setCharacter] = useState(initial);
  const [charClasses, setCharClasses] = useState(initialClasses);
  const [equipmentState, setEquipment] = useState(equipment);
  const [spellsState, setSpells] = useState(spells);
  const [weaponProfsState, setWeaponProfs] = useState(weaponProficiencies);
  const [nwProfsState, setNwProfs] = useState(nonweaponProficiencies);
  const [inventoryState, setInventory] = useState(inventory);
  const [languagesState, setLanguages] = useState(languages);
  const [fightingStylesState, setFightingStyles] = useState(fightingStyles);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [xpDialogOpen, setXpDialogOpen] = useState(false);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [addClassId, setAddClassId] = useState("");

  const isOwner = character.user_id === userId;

  // Derive multiclass data
  const activeClasses = charClasses.filter((cc) => cc.is_active);
  const classIds = activeClasses.map((cc) => cc.class_id as ClassId);
  const classEntries = activeClasses.map((cc) => ({
    classId: cc.class_id as ClassId,
    level: cc.level,
  }));

  const race = character.race_id ? RACES[character.race_id as keyof typeof RACES] : null;
  const classNames = classIds
    .map((id) => {
      const cls = CLASSES[id];
      return cls ? localized(cls.name, cls.name_en, locale) : id;
    })
    .join(" / ");
  const levelDisplay =
    activeClasses.length > 1
      ? activeClasses.map((cc) => cc.level).join("/")
      : String(activeClasses[0]?.level ?? character.level);

  // Use multiclass-aware calculations
  const thac0 = classEntries.length > 0 ? getMulticlassThac0(classEntries) : 20;
  const saves = classEntries.length > 0 ? getMulticlassSaves(classEntries) : null;
  const classGroups = getMulticlassGroups(classIds);
  const hasExceptionalStr = multiclassHasExceptionalStr(classIds);

  // For spells tab: show if any class group is wizard/priest, or bard
  const showSpells =
    classGroups.includes("wizard") || classGroups.includes("priest") || classIds.includes("bard");
  const showThiefSkills = hasThiefSkills(classIds);

  // For spells/proficiencies: use primary (first) class
  const primaryClassId: ClassId | null = classIds[0] ?? ((character.class_id as ClassId) || null);
  const primaryClassGroup = classGroups[0] ?? "warrior";
  const primaryLevel = activeClasses[0]?.level ?? character.level;

  // For spells: find the caster class (wizard/priest/bard), not necessarily the first class
  const casterClass = activeClasses.find((cc) => {
    const g = CLASSES[cc.class_id as ClassId]?.group;
    return g === "wizard" || g === "priest" || cc.class_id === "bard";
  });
  const casterClassId: ClassId | null = (casterClass?.class_id as ClassId) ?? primaryClassId;
  const casterClassGroup = casterClass
    ? (CLASSES[casterClass.class_id as ClassId]?.group ?? "warrior")
    : primaryClassGroup;
  const casterLevel = casterClass?.level ?? primaryLevel;

  const strMods = getStrengthModifiers(
    character.str,
    character.str_exceptional ?? undefined,
    character.str_muscle,
    character.str_stamina
  );
  const dexMods = getDexterityModifiers(character.dex, character.dex_aim, character.dex_balance);
  const conMods = getConstitutionModifiers(
    character.con,
    character.con_health,
    character.con_fitness
  );
  const intMods = getIntelligenceModifiers(
    character.int,
    character.int_knowledge,
    character.int_reason
  );
  const wisMods = getWisdomModifiers(
    character.wis,
    character.wis_intuition,
    character.wis_willpower
  );
  const chaMods = getCharismaModifiers(
    character.cha,
    character.cha_leadership,
    character.cha_appearance
  );
  // AC calculation using equipped armor + shield + DEX + class bonuses (reactive to equipmentState)
  const equippedArmor = equipmentState.find(
    (e) => e.equipped && e.armor && e.armor.name !== "Shield"
  );
  const hasShield = equipmentState.some(
    (e) => e.equipped && e.armor && e.armor.name.toLowerCase().includes("shield")
  );
  const totalWeight = equipmentState.reduce(
    (sum, e) => sum + (e.weapon?.weight ?? e.armor?.weight ?? 0),
    0
  );
  const encumbranceLevel = calculateEncumbrance(totalWeight, strMods.weightAllow);
  const effectiveAC = calculateAC({
    equippedArmorAC: equippedArmor?.armor?.ac ?? null,
    shieldEquipped: hasShield,
    dexDefenseAdj: dexMods.defensiveAdj,
    classGroups,
    encumbrance: encumbranceLevel,
    ignoreEncumbrance: character.ignore_encumbrance,
    isMagicalProtection: equippedArmor?.armor?.is_magical_protection ?? false,
  });

  const handleIgnoreEncumbranceChange = useCallback(
    async (value: boolean) => {
      setCharacter((prev) => ({ ...prev, ignore_encumbrance: value }));
      const supabase = createClient();
      await supabase
        .from("characters")
        .update({ ignore_encumbrance: value })
        .eq("id", character.id);
    },
    [character.id]
  );

  function update(field: keyof CharacterRow, value: string | number | null) {
    if (!isOwner) return;
    setCharacter((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  }

  async function handleAddClass(classId: string) {
    if (!classId) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("character_classes")
      .insert({
        character_id: character.id,
        class_id: classId,
        level: 1,
        xp_current: 0,
        is_active: true,
      })
      .select("*")
      .single();
    if (!error && data) {
      setCharClasses((prev) => [...prev, data]);
      setAddClassId("");
    }
  }

  async function handleRemoveClass(ccId: string) {
    const supabase = createClient();
    await supabase.from("character_classes").delete().eq("id", ccId);
    setCharClasses((prev) => prev.filter((cc) => cc.id !== ccId));
  }

  function updateClassField(classId: string, field: "level" | "xp_current", value: number) {
    if (!isOwner) return;
    setCharClasses((prev) =>
      prev.map((cc) => (cc.class_id === classId ? { ...cc, [field]: value } : cc))
    );
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();

    // Save character fields
    const { error: charError } = await supabase
      .from("characters")
      .update({
        str: character.str,
        str_exceptional: character.str_exceptional,
        dex: character.dex,
        con: character.con,
        int: character.int,
        wis: character.wis,
        cha: character.cha,
        hp_current: character.hp_current,
        hp_max: character.hp_max,
        alignment: character.alignment,
        gold_pp: character.gold_pp,
        gold_gp: character.gold_gp,
        gold_ep: character.gold_ep,
        gold_sp: character.gold_sp,
        gold_cp: character.gold_cp,
        notes: character.notes,
        player_name: character.player_name,
        age: character.age,
        height_cm: character.height_cm,
        weight_kg: character.weight_kg,
        gender: character.gender,
        hair_color: character.hair_color,
        eye_color: character.eye_color,
        str_stamina: character.str_stamina,
        str_muscle: character.str_muscle,
        dex_aim: character.dex_aim,
        dex_balance: character.dex_balance,
        con_health: character.con_health,
        con_fitness: character.con_fitness,
        int_reason: character.int_reason,
        int_knowledge: character.int_knowledge,
        wis_intuition: character.wis_intuition,
        wis_willpower: character.wis_willpower,
        cha_leadership: character.cha_leadership,
        cha_appearance: character.cha_appearance,
        thief_pick_locks: character.thief_pick_locks,
        thief_find_traps: character.thief_find_traps,
        thief_move_silently: character.thief_move_silently,
        thief_hide_shadows: character.thief_hide_shadows,
        thief_climb_walls: character.thief_climb_walls,
        thief_detect_noise: character.thief_detect_noise,
        thief_read_languages: character.thief_read_languages,
        kit: character.kit,
      })
      .eq("id", character.id);

    if (charError) {
      setSaving(false);
      return;
    }

    // Save character_classes (level + xp per class) in parallel
    const classUpdates = charClasses.map((cc) =>
      supabase
        .from("character_classes")
        .update({ level: cc.level, xp_current: cc.xp_current })
        .eq("id", cc.id)
    );
    await Promise.all(classUpdates);

    setSaving(false);
    setDirty(false);
    router.refresh();
  }

  async function handleDelete() {
    const supabase = createClient();
    const { error } = await supabase.from("characters").delete().eq("id", character.id);
    if (error) return;
    router.push("/characters");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-4xl p-4 sm:p-6" data-testid="character-sheet">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 sm:gap-4">
          <AvatarUpload
            characterId={character.id}
            userId={userId}
            characterName={character.name}
            currentAvatarUrl={character.avatar_url}
            size={80}
            variant="square"
          />
          <div className="min-w-0 flex-1">
            <h1
              className="truncate font-heading text-2xl text-primary sm:text-3xl"
              data-testid="sheet-name"
            >
              {character.name}
            </h1>
            <div className="mt-1 flex flex-wrap gap-2">
              {race && <Badge>{localized(race.name, race.name_en, locale)}</Badge>}
              {classNames && <Badge data-testid="sheet-class-badge">{classNames}</Badge>}
              <Badge variant="outline" data-testid="sheet-level-badge">
                {t("levelPerClass")}: {levelDisplay}
              </Badge>
              <Badge variant="outline">{getAlignmentLabel(character.alignment, locale)}</Badge>
              {activeClasses.length > 1 && (
                <Badge variant="secondary" data-testid="sheet-multiclass-badge">
                  {t("multiclass")}
                </Badge>
              )}
              {character.kit &&
                (() => {
                  const kit = getKit(character.kit);
                  return kit ? (
                    <Badge variant="secondary" data-testid="badge-kit">
                      {localized(kit.name, kit.name_en, locale)}
                    </Badge>
                  ) : null;
                })()}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareDialog(true)}
              data-testid="sheet-share-button"
            >
              <Share2 className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">{ts("shareButton")}</span>
            </Button>
          )}
          <Link href={`/characters/${character.id}/play`}>
            <Button
              size="sm"
              className="bg-primary/20 font-heading text-primary hover:bg-primary/30"
              data-testid="sheet-play-button"
            >
              <Swords className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">{tc("playMode")}</span>
            </Button>
          </Link>
          <Link href={`/characters/${character.id}/print`}>
            <Button variant="outline" size="sm" data-testid="sheet-print-button">
              <Printer className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">{tc("printView")}</span>
            </Button>
          </Link>
          {dirty && isOwner && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              data-testid="sheet-save-button"
            >
              {saving ? (
                <>
                  <Spinner className="mr-2" />
                  {tcom("saving")}
                </>
              ) : (
                tcom("save")
              )}
            </Button>
          )}
          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const supabase = createClient();
                await supabase
                  .from("characters")
                  .update({ is_active: !character.is_active })
                  .eq("id", character.id);
                setCharacter((prev) => ({ ...prev, is_active: !prev.is_active }));
              }}
              data-testid="sheet-toggle-active-button"
            >
              {character.is_active !== false ? (
                <>
                  <EyeOff className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">{tc("setInactive")}</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">{tc("setActive")}</span>
                </>
              )}
            </Button>
          )}
          {isOwner && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              data-testid="sheet-delete-button"
            >
              <Trash2 className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">{tcom("delete")}</span>
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title={tc("deleteTitle")}
        message={tc("deleteMessage", { name: character.name })}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {isOwner && (
        <ShareDialog
          open={showShareDialog}
          characterId={character.id}
          characterName={character.name}
          currentUserId={userId}
          isPublic={character.is_public}
          onClose={() => setShowShareDialog(false)}
          onVisibilityChange={(val) => {
            setCharacter((prev) => ({ ...prev, is_public: val }));
          }}
        />
      )}

      <Tabs defaultValue="stats" className="w-full">
        <TabsList
          className="flex h-auto w-full flex-wrap justify-start gap-0.5 group-data-horizontal/tabs:h-auto sm:justify-center [&>*]:flex-none sm:[&>*]:flex-1"
          data-testid="sheet-tabs"
        >
          <TabsTrigger value="stats" data-testid="tab-trigger-stats">
            {t("stats")}
          </TabsTrigger>
          <TabsTrigger value="combat" data-testid="tab-trigger-combat">
            {t("combat")}
          </TabsTrigger>
          <TabsTrigger value="notes" data-testid="tab-trigger-notes">
            {t("notes")}
          </TabsTrigger>
          <TabsTrigger value="equipment" data-testid="tab-trigger-equipment">
            {t("equipment")}
          </TabsTrigger>
          {showSpells && (
            <TabsTrigger value="spells" data-testid="tab-trigger-spells">
              {t("spells")}
            </TabsTrigger>
          )}
          {showThiefSkills && (
            <TabsTrigger value="thief-skills" data-testid="tab-trigger-thief-skills">
              {t("thiefSkills")}
            </TabsTrigger>
          )}
          <TabsTrigger value="proficiencies" data-testid="tab-trigger-proficiencies">
            {t("proficiencies")}
          </TabsTrigger>
        </TabsList>

        {/* Stats Tab */}
        <TabsContent
          value="stats"
          className="glass glow-neutral rounded-xl p-4 flex flex-col gap-6"
        >
          {/* Personal Details */}
          <details data-testid="personal-details-section">
            <summary className="cursor-pointer font-heading text-lg">
              {t("personalDetails")}
            </summary>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="player-name" className="text-xs text-muted-foreground">
                  {t("playerName")}
                </Label>
                <Input
                  id="player-name"
                  type="text"
                  value={character.player_name ?? ""}
                  onChange={(e) => update("player_name", e.target.value)}
                  data-testid="sheet-player-name"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="age" className="text-xs text-muted-foreground">
                  {t("age")}
                </Label>
                <Input
                  id="age"
                  type="number"
                  min={0}
                  value={character.age ?? ""}
                  onChange={(e) =>
                    update(
                      "age",
                      e.target.value ? Math.max(0, parseInt(e.target.value) || 0) : null
                    )
                  }
                  data-testid="sheet-age"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="height-cm" className="text-xs text-muted-foreground">
                  {t("heightCm")}
                </Label>
                <Input
                  id="height-cm"
                  type="number"
                  min={0}
                  value={character.height_cm ?? ""}
                  onChange={(e) =>
                    update(
                      "height_cm",
                      e.target.value ? Math.max(0, parseInt(e.target.value) || 0) : null
                    )
                  }
                  data-testid="sheet-height-cm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="weight-kg" className="text-xs text-muted-foreground">
                  {t("weightKg")}
                </Label>
                <Input
                  id="weight-kg"
                  type="number"
                  min={0}
                  value={character.weight_kg ?? ""}
                  onChange={(e) =>
                    update(
                      "weight_kg",
                      e.target.value ? Math.max(0, parseInt(e.target.value) || 0) : null
                    )
                  }
                  data-testid="sheet-weight-kg"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="gender" className="text-xs text-muted-foreground">
                  {t("gender")}
                </Label>
                <Input
                  id="gender"
                  type="text"
                  value={character.gender ?? ""}
                  onChange={(e) => update("gender", e.target.value)}
                  data-testid="sheet-gender"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="hair-color" className="text-xs text-muted-foreground">
                  {t("hairColor")}
                </Label>
                <Input
                  id="hair-color"
                  type="text"
                  value={character.hair_color ?? ""}
                  onChange={(e) => update("hair_color", e.target.value)}
                  data-testid="sheet-hair-color"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="eye-color" className="text-xs text-muted-foreground">
                  {t("eyeColor")}
                </Label>
                <Input
                  id="eye-color"
                  type="text"
                  value={character.eye_color ?? ""}
                  onChange={(e) => update("eye_color", e.target.value)}
                  data-testid="sheet-eye-color"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="kit-select" className="text-xs text-muted-foreground">
                  {t("kit")}
                </Label>
                <select
                  id="kit-select"
                  value={character.kit ?? ""}
                  onChange={(e) => update("kit", e.target.value || null)}
                  className="rounded-md border border-input bg-input px-2 py-1 text-sm"
                  data-testid="sheet-kit-select"
                  disabled={!isOwner}
                >
                  <option value="">{t("noKit")}</option>
                  {activeClasses
                    .flatMap((cc) => getKitsForClass(cc.class_id as ClassId))
                    .map((kit) => (
                      <option key={kit.id} value={kit.id}>
                        {localized(kit.name, kit.name_en, locale)}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </details>

          <Separator />

          <div>
            <h3 className="mb-3 font-heading text-lg">{t("attributes")}</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                {
                  key: "str" as const,
                  label: "STR",
                  value: character.str,
                  mods: t("abilityModStr", {
                    hit: `${strMods.hitAdj >= 0 ? "+" : ""}${strMods.hitAdj}`,
                    dmg: `${strMods.dmgAdj >= 0 ? "+" : ""}${strMods.dmgAdj}`,
                  }),
                },
                {
                  key: "dex" as const,
                  label: "DEX",
                  value: character.dex,
                  mods: t("abilityModDex", {
                    ac: `${dexMods.defensiveAdj >= 0 ? "+" : ""}${dexMods.defensiveAdj}`,
                  }),
                },
                {
                  key: "con" as const,
                  label: "CON",
                  value: character.con,
                  mods: t("abilityModCon", {
                    hp: `${conMods.hpAdj >= 0 ? "+" : ""}${conMods.hpAdj}`,
                  }),
                },
                {
                  key: "int" as const,
                  label: "INT",
                  value: character.int,
                  mods: t("abilityModInt", { count: intMods.numberOfLanguages }),
                },
                {
                  key: "wis" as const,
                  label: "WIS",
                  value: character.wis,
                  mods: t("abilityModWis", {
                    adj: `${wisMods.magicalDefenseAdj >= 0 ? "+" : ""}${wisMods.magicalDefenseAdj}`,
                  }),
                },
                {
                  key: "cha" as const,
                  label: "CHA",
                  value: character.cha,
                  mods: t("abilityModCha", { count: chaMods.maxHenchmen }),
                },
              ].map(({ key, label, value, mods }) => {
                const subScoreMap: Record<
                  string,
                  {
                    key1: keyof CharacterRow;
                    label1: string;
                    key2: keyof CharacterRow;
                    label2: string;
                  }
                > = {
                  str: {
                    key1: "str_stamina",
                    label1: t("stamina"),
                    key2: "str_muscle",
                    label2: t("muscle"),
                  },
                  dex: {
                    key1: "dex_aim",
                    label1: t("aim"),
                    key2: "dex_balance",
                    label2: t("balance"),
                  },
                  con: {
                    key1: "con_health",
                    label1: t("health"),
                    key2: "con_fitness",
                    label2: t("fitness"),
                  },
                  int: {
                    key1: "int_reason",
                    label1: t("reason"),
                    key2: "int_knowledge",
                    label2: t("knowledge"),
                  },
                  wis: {
                    key1: "wis_intuition",
                    label1: t("intuition"),
                    key2: "wis_willpower",
                    label2: t("willpower"),
                  },
                  cha: {
                    key1: "cha_leadership",
                    label1: t("leadership"),
                    key2: "cha_appearance",
                    label2: t("appearance"),
                  },
                };
                const sub = subScoreMap[key];
                return (
                  <div key={key} className="rounded-md border border-border p-3">
                    <Label htmlFor={`sheet-${key}`} className="text-xs text-muted-foreground">
                      {label}
                    </Label>
                    <Input
                      id={`sheet-${key}`}
                      type="number"
                      min={3}
                      max={25}
                      value={value}
                      onChange={(e) =>
                        update(key, Math.max(3, Math.min(25, parseInt(e.target.value) || 3)))
                      }
                      className="mt-1 text-center font-mono text-lg"
                      data-testid={`sheet-ability-${key}`}
                    />
                    <div className="mt-1 text-xs text-muted-foreground">{mods}</div>
                    {key === "str" && character.str === 18 && hasExceptionalStr && (
                      <div className="mt-2 flex flex-col gap-1">
                        <Label
                          htmlFor="sheet-str-exceptional"
                          className="text-xs text-muted-foreground"
                        >
                          {t("exceptionalStr")}
                        </Label>
                        <Input
                          id="sheet-str-exceptional"
                          type="number"
                          min={1}
                          max={100}
                          value={character.str_exceptional ?? ""}
                          onChange={(e) =>
                            update(
                              "str_exceptional",
                              e.target.value
                                ? Math.max(1, Math.min(100, parseInt(e.target.value) || 1))
                                : null
                            )
                          }
                          className="w-20 text-center font-mono text-sm"
                          data-testid="sheet-str-exceptional"
                        />
                      </div>
                    )}
                    {sub && (
                      <details className="mt-2" data-testid={`sheet-subscores-${key}`}>
                        <summary className="cursor-pointer text-xs text-muted-foreground">
                          {t("subScores")}
                        </summary>
                        <div className="mt-1 flex gap-2">
                          <div className="flex flex-col gap-1">
                            <Label
                              htmlFor={`sheet-${sub.key1}`}
                              className="text-xs text-muted-foreground"
                            >
                              {sub.label1}
                            </Label>
                            <Input
                              id={`sheet-${sub.key1}`}
                              type="number"
                              min={3}
                              max={25}
                              value={(character[sub.key1] as number) ?? ""}
                              onChange={(e) =>
                                update(
                                  sub.key1,
                                  e.target.value
                                    ? Math.max(3, Math.min(25, parseInt(e.target.value) || 3))
                                    : null
                                )
                              }
                              className="w-16 text-center font-mono text-sm"
                              data-testid={`sheet-${sub.key1}`}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <Label
                              htmlFor={`sheet-${sub.key2}`}
                              className="text-xs text-muted-foreground"
                            >
                              {sub.label2}
                            </Label>
                            <Input
                              id={`sheet-${sub.key2}`}
                              type="number"
                              min={3}
                              max={25}
                              value={(character[sub.key2] as number) ?? ""}
                              onChange={(e) =>
                                update(
                                  sub.key2,
                                  e.target.value
                                    ? Math.max(3, Math.min(25, parseInt(e.target.value) || 3))
                                    : null
                                )
                              }
                              className="w-16 text-center font-mono text-sm"
                              data-testid={`sheet-${sub.key2}`}
                            />
                          </div>
                        </div>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-3 font-heading text-lg">{t("hitPoints")}</h3>
            <div className="flex gap-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="hp-current" className="text-xs text-muted-foreground">
                  {t("hpCurrent")}
                </Label>
                <Input
                  id="hp-current"
                  type="number"
                  min={0}
                  value={character.hp_current}
                  onChange={(e) => update("hp_current", Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-24 text-center font-mono text-lg"
                  data-testid="sheet-hp-current"
                />
              </div>
              <div className="flex items-end pb-2 text-lg text-muted-foreground">/</div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="hp-max" className="text-xs text-muted-foreground">
                  {t("hpMax")}
                </Label>
                <Input
                  id="hp-max"
                  type="number"
                  min={1}
                  value={character.hp_max}
                  onChange={(e) => update("hp_max", Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 text-center font-mono text-lg"
                  data-testid="sheet-hp-max"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* XP per Class */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-heading text-lg">{t("xp")}</h3>
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setXpDialogOpen(true)}
                  data-testid="sheet-add-xp-button"
                >
                  {t("addXp")}
                </Button>
              )}
            </div>
            <div className="flex flex-col gap-4">
              {activeClasses.map((cc) => {
                const clsDef = CLASSES[cc.class_id as ClassId];
                const nextLevelXp = getXpForNextLevel(cc.class_id as ClassId, cc.level);
                const currentThreshold = getXpThreshold(cc.class_id as ClassId, cc.level);
                const progress = nextLevelXp
                  ? Math.min(
                      100,
                      Math.max(
                        0,
                        ((cc.xp_current - currentThreshold) / (nextLevelXp - currentThreshold)) *
                          100
                      )
                    )
                  : 100;

                return (
                  <div
                    key={cc.class_id}
                    className="rounded-md border border-border p-3"
                    data-testid={`sheet-xp-${cc.class_id}`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-heading text-sm">
                          {clsDef ? localized(clsDef.name, clsDef.name_en, locale) : cc.class_id}
                        </span>
                        <div className="flex items-center gap-1">
                          <Label className="text-xs text-muted-foreground">{tc("level")}</Label>
                          <Input
                            type="number"
                            min={1}
                            max={20}
                            value={cc.level}
                            onChange={(e) =>
                              updateClassField(
                                cc.class_id,
                                "level",
                                Math.max(1, Math.min(20, parseInt(e.target.value) || 1))
                              )
                            }
                            className="w-16 text-center font-mono text-sm"
                            aria-label={`Level ${clsDef?.name ?? cc.class_id}`}
                            data-testid={`sheet-level-${cc.class_id}`}
                          />
                        </div>
                      </div>
                      {isOwner && activeClasses.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRemoveClass(cc.id)}
                          data-testid={`sheet-remove-class-${cc.class_id}`}
                        >
                          {tcom("remove")}
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={0}
                        value={cc.xp_current}
                        onChange={(e) =>
                          updateClassField(
                            cc.class_id,
                            "xp_current",
                            Math.max(0, parseInt(e.target.value) || 0)
                          )
                        }
                        className="w-32 text-center font-mono text-sm"
                        aria-label={`XP ${clsDef?.name ?? cc.class_id}`}
                        data-testid={`sheet-xp-input-${cc.class_id}`}
                      />
                      <div className="flex flex-1 flex-col gap-1">
                        <div className="text-xs text-muted-foreground">
                          {nextLevelXp
                            ? t("xpNextLevel", { xp: nextLevelXp.toLocaleString("de-DE") })
                            : t("xpMax")}
                        </div>
                        <div className="h-3 w-full rounded-full bg-muted">
                          <div
                            className="h-3 rounded-full bg-primary transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add class */}
            {isOwner && (
              <div className="mt-3 flex items-center gap-2" data-testid="add-class-section">
                <select
                  value={addClassId}
                  onChange={(e) => setAddClassId(e.target.value)}
                  className="rounded-md border border-input bg-input px-3 py-1.5 text-sm"
                  aria-label={t("addClass")}
                  data-testid="add-class-select"
                >
                  <option value="">{t("addClass")}</option>
                  {getAllClasses()
                    .filter((cls) => !classIds.includes(cls.id as ClassId))
                    .map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {localized(cls.name, cls.name_en, locale)}
                      </option>
                    ))}
                </select>
                <Button
                  size="sm"
                  onClick={() => handleAddClass(addClassId)}
                  disabled={!addClassId}
                  data-testid="add-class-button"
                >
                  {tcom("add")}
                </Button>
              </div>
            )}

            {/* XP History (last 5) */}
            {xpHistory.length > 0 && (
              <details className="mt-3" data-testid="xp-history-section">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  {t("xpHistory")} ({xpHistory.length})
                </summary>
                <div className="mt-2 flex flex-col gap-1">
                  {xpHistory.slice(0, 5).map((xh) => {
                    const session = sessions.find((s) => s.id === xh.session_id);
                    return (
                      <div
                        key={xh.id}
                        className="flex items-center justify-between rounded border border-border px-3 py-1.5 text-sm"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">+{xh.xp_amount.toLocaleString()} XP</span>
                          {xh.note && (
                            <span className="text-xs text-muted-foreground">{xh.note}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {session && <span className="mr-2">{session.title}</span>}
                          {new Date(xh.created_at).toLocaleDateString(locale)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            )}
          </div>

          <XpAddDialog
            open={xpDialogOpen}
            characterId={character.id}
            characterClasses={charClasses}
            sessions={sessions}
            onClose={() => setXpDialogOpen(false)}
            onClassesChange={setCharClasses}
          />

          <Separator />

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-heading text-lg">{t("gold")}</h3>
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPayDialogOpen(true)}
                  data-testid="sheet-pay-button"
                >
                  {t("pay")}
                </Button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {[
                { key: "gold_pp" as const, label: t("currencyPP") },
                { key: "gold_gp" as const, label: t("currencyGP") },
                { key: "gold_ep" as const, label: t("currencyEP") },
                { key: "gold_sp" as const, label: t("currencySP") },
                { key: "gold_cp" as const, label: t("currencyCP") },
              ].map(({ key, label }) => (
                <div key={key} className="flex flex-col gap-1">
                  <Label
                    htmlFor={`sheet-${key}`}
                    className="text-center text-xs text-muted-foreground"
                  >
                    {label}
                  </Label>
                  <Input
                    id={`sheet-${key}`}
                    type="number"
                    min={0}
                    value={character[key]}
                    onChange={(e) => update(key, Math.max(0, parseInt(e.target.value) || 0))}
                    className="text-center font-mono"
                    data-testid={`sheet-${key}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Pay Dialog */}
          {payDialogOpen && (
            <PayDialog
              purse={{
                pp: character.gold_pp,
                gp: character.gold_gp,
                ep: character.gold_ep,
                sp: character.gold_sp,
                cp: character.gold_cp,
              }}
              onPay={(remaining) => {
                update("gold_pp", remaining.pp);
                update("gold_gp", remaining.gp);
                update("gold_ep", remaining.ep);
                update("gold_sp", remaining.sp);
                update("gold_cp", remaining.cp);
                setPayDialogOpen(false);
              }}
              onClose={() => setPayDialogOpen(false)}
            />
          )}

          <Separator />

          <div>
            {race?.racialAbilities && race.racialAbilities.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 font-heading text-lg">{t("racialAbilities")}</h3>
                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                  {race.racialAbilities.map((ability, i) => (
                    <details key={i}>
                      <summary className="cursor-pointer">
                        {localized(ability.name, ability.name_en, locale)}
                      </summary>
                      <p className="mt-1 text-xs">
                        {localized(ability.description, ability.description_en, locale)}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            )}
            {/* Show class abilities for ALL classes */}
            {classIds.map((clsId) => {
              const clsDef = CLASSES[clsId];
              if (!clsDef?.classAbilities?.length) return null;
              return (
                <div key={clsId} className="mb-4">
                  <h3 className="mb-2 font-heading text-lg">
                    {t("classAbilities")} — {localized(clsDef.name, clsDef.name_en, locale)}
                  </h3>
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    {clsDef.classAbilities.map((ability, i) => (
                      <details key={i}>
                        <summary className="cursor-pointer">
                          {localized(ability.name, ability.name_en, locale)}
                        </summary>
                        <p className="mt-1 text-xs">
                          {localized(ability.description, ability.description_en, locale)}
                        </p>
                      </details>
                    ))}
                  </div>
                </div>
              );
            })}
            {/* Show kit abilities */}
            {character.kit &&
              (() => {
                const kitDef = getKit(character.kit);
                if (!kitDef?.abilities?.length) return null;
                return (
                  <div className="mb-4" data-testid="sheet-kit-abilities">
                    <h3 className="mb-2 font-heading text-lg">
                      {t("kitAbilities")} — {localized(kitDef.name, kitDef.name_en, locale)}
                    </h3>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      {kitDef.abilities.map((ability, i) => (
                        <details key={i}>
                          <summary className="cursor-pointer">
                            {localized(ability.name, ability.name_en, locale)}
                          </summary>
                          <p className="mt-1 text-xs">
                            {localized(ability.description, ability.description_en, locale)}
                          </p>
                        </details>
                      ))}
                    </div>
                  </div>
                );
              })()}
          </div>
        </TabsContent>

        {/* Combat Tab */}
        <TabsContent
          value="combat"
          className="glass glow-neutral rounded-xl p-4 flex flex-col gap-6"
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-md border border-border p-4 text-center">
              <div className="text-xs text-muted-foreground">{t("thac0")}</div>
              <div className="font-heading text-3xl text-primary" data-testid="sheet-thac0">
                {thac0}
              </div>
            </div>
            <div className="rounded-md border border-border p-4 text-center">
              <div className="text-xs text-muted-foreground">{t("armorClass")}</div>
              <div className="font-heading text-3xl text-primary" data-testid="sheet-ac">
                {effectiveAC}
              </div>
            </div>
            <div className="rounded-md border border-border p-4 text-center">
              <div className="text-xs text-muted-foreground">{t("hitDamage")}</div>
              <div className="font-heading text-2xl text-primary">
                {strMods.hitAdj >= 0 ? "+" : ""}
                {strMods.hitAdj} / {strMods.dmgAdj >= 0 ? "+" : ""}
                {strMods.dmgAdj}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-md border border-border p-4 text-center">
              <div className="text-xs text-muted-foreground">{t("attacksPerRound")}</div>
              <div className="font-heading text-2xl text-primary" data-testid="sheet-attacks">
                {classEntries.length > 0
                  ? classEntries
                      .map((ce) =>
                        getAttacksPerRound(CLASSES[ce.classId]?.group ?? "warrior", ce.level)
                      )
                      .filter((v, i, a) => a.indexOf(v) === i)
                      .join(" / ")
                  : "1"}
              </div>
            </div>
            <div className="rounded-md border border-border p-4 text-center">
              <div className="text-xs text-muted-foreground">{t("initiative")}</div>
              <div className="font-heading text-2xl text-primary" data-testid="sheet-initiative">
                {dexMods.reactionAdj >= 0 ? "+" : ""}
                {dexMods.reactionAdj}
              </div>
            </div>
            {showThiefSkills && (
              <div className="rounded-md border border-border p-4 text-center">
                <div className="text-xs text-muted-foreground">{t("backstabMultiplier")}</div>
                <div className="font-heading text-2xl text-primary" data-testid="sheet-backstab">
                  x{getBackstabMultiplier(primaryLevel)}
                </div>
              </div>
            )}
          </div>

          {saves && (
            <div>
              <h3 className="mb-3 font-heading text-lg">{t("savingThrows")}</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  { label: t("savePoison"), value: saves.paralyzation },
                  { label: t("saveRod"), value: saves.rod },
                  { label: t("savePetrification"), value: saves.petrification },
                  { label: t("saveBreath"), value: saves.breath },
                  { label: t("saveSpell"), value: saves.spell },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-md border border-border p-3 text-center">
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className="font-mono text-xl">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="glass glow-neutral rounded-xl p-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">{t("notes")}</Label>
            <textarea
              id="notes"
              value={character.notes}
              onChange={(e) => update("notes", e.target.value)}
              className="min-h-[200px] w-full rounded-md border border-input bg-input p-3 text-sm"
              placeholder={t("notesPlaceholder")}
              data-testid="sheet-notes"
            />
          </div>
        </TabsContent>

        <TabsContent value="equipment" className="glass glow-neutral rounded-xl p-4">
          <TabEquipment
            characterId={character.id}
            userId={userId}
            equipment={equipmentState}
            allWeapons={allWeapons}
            allArmor={allArmor}
            strWeightAllow={strMods.weightAllow}
            dexDefenseAdj={dexMods.defensiveAdj}
            inventory={inventoryState}
            allGeneralItems={allGeneralItems}
            baseMovement={race?.baseMovement ?? 12}
            readOnly={!isOwner}
            characterStr={character.str}
            characterStrExceptional={character.str_exceptional}
            characterDex={character.dex}
            characterClasses={charClasses}
            weaponProficiencies={weaponProfsState}
            ignoreEncumbrance={character.ignore_encumbrance}
            onEquipmentChange={setEquipment}
            onInventoryChange={setInventory}
            onIgnoreEncumbranceChange={handleIgnoreEncumbranceChange}
          />
        </TabsContent>

        {showSpells && primaryClassId && (
          <TabsContent value="spells" className="glass glow-neutral rounded-xl p-4">
            <TabSpells
              characterId={character.id}
              userId={userId}
              classId={casterClassId!}
              classGroup={casterClassGroup}
              level={casterLevel}
              intScore={character.int}
              wisScore={character.wis}
              spells={spellsState}
              allSpells={allSpells}
              spellSlotsAdj={character.spell_slots_adj ?? {}}
              spellSystem={character.spell_system ?? "slots"}
              readOnly={!isOwner}
              onSpellsChange={setSpells}
              onSpellSlotsAdjChange={(adj) =>
                setCharacter((prev) => ({ ...prev, spell_slots_adj: adj }))
              }
              onSpellSystemChange={(sys) =>
                setCharacter((prev) => ({ ...prev, spell_system: sys as "slots" | "points" }))
              }
            />
          </TabsContent>
        )}

        {showThiefSkills && (
          <TabsContent value="thief-skills" className="glass glow-neutral rounded-xl p-4">
            <TabThiefSkills
              character={character}
              raceId={(character.race_id as RaceId) ?? "human"}
              level={primaryLevel}
              onUpdate={update}
              readOnly={!isOwner}
            />
          </TabsContent>
        )}

        <TabsContent value="proficiencies" className="glass glow-neutral rounded-xl p-4">
          <TabProficiencies
            characterId={character.id}
            userId={userId}
            classId={primaryClassId ?? "fighter"}
            classGroup={primaryClassGroup}
            raceId={character.race_id ?? "human"}
            level={primaryLevel}
            intScore={character.int}
            weaponProficiencies={weaponProfsState}
            nonweaponProficiencies={nwProfsState}
            allNonweaponProficiencies={allNonweaponProficiencies}
            allWeapons={allWeapons}
            languages={languagesState}
            fightingStyles={fightingStylesState}
            weaponSlotsAdj={character.weapon_slots_adj ?? 0}
            nwpSlotsAdj={character.nwp_slots_adj ?? 0}
            languageSlotsAdj={character.language_slots_adj ?? 0}
            readOnly={!isOwner}
            onWeaponProfsChange={setWeaponProfs}
            onNwProfsChange={setNwProfs}
            onLanguagesChange={setLanguages}
            onFightingStylesChange={setFightingStyles}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
