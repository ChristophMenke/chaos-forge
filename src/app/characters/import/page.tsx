"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import type { RaceId, ClassId } from "@/lib/rules/types";
import { ALL_ALIGNMENTS, getAlignmentLabel } from "@/lib/rules/alignment";
import { validateImportFiles } from "./import-validation";

interface ScannedClassEntry {
  class: ClassId;
  level: number;
  xp: number;
}

interface ScannedCharacter {
  name: string;
  race: RaceId;
  // Legacy single-class (backward compat)
  class?: ClassId;
  level?: number;
  xp?: number;
  // New multiclass format
  classes?: ScannedClassEntry[];
  kit: string | null;
  alignment: string;
  str: number;
  strExceptional: number | null;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  // Player's Option Sub-Stats
  strStamina: number | null;
  strMuscle: number | null;
  dexAim: number | null;
  dexBalance: number | null;
  conHealth: number | null;
  conFitness: number | null;
  intReason: number | null;
  intKnowledge: number | null;
  wisIntuition: number | null;
  wisWillpower: number | null;
  chaLeadership: number | null;
  chaAppearance: number | null;
  hpMax: number;
  hpCurrent: number;
  goldPp: number;
  goldGp: number;
  goldSp: number;
  goldCp: number;
  playerName: string | null;
  age: number | null;
  gender: string | null;
  height: string | null;
  weight: number | null;
  weaponProficiencies: { name: string; specialized: boolean }[];
  equipment: { name: string; magicBonus: number }[];
  nwps: string[];
  spells: { name: string; level: number }[];
}

/** Parse imperial height like 5'10" or "5 ft 10 in" to centimeters */
function parseImperialHeight(h: string): number {
  const match = h.match(/(\d+)'?\s*(\d+)?/);
  if (!match) return 0;
  const feet = parseInt(match[1]) || 0;
  const inches = parseInt(match[2]) || 0;
  return (feet * 12 + inches) * 2.54;
}

interface FilePreview {
  file: File;
  previewUrl: string | null; // null for PDFs
}

interface ImportCharacterPageProps {
  basePath?: string;
  isNpc?: boolean;
}

export default function ImportCharacterPage({
  basePath = "/characters",
  isNpc = false,
}: ImportCharacterPageProps = {}) {
  const router = useRouter();
  const t = useTranslations("import");
  const tc = useTranslations("common");
  const locale = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanned, setScanned] = useState<ScannedCharacter | null>(null);
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const [preciseMode, setPreciseMode] = useState(false);

  // Keep a ref to the latest filePreviews so the unmount cleanup can access them
  // without re-running the effect on every change. Ref is synced inside an effect
  // to comply with React Compiler rules.
  const filePreviewsRef = useRef(filePreviews);
  useEffect(() => {
    filePreviewsRef.current = filePreviews;
  }, [filePreviews]);

  // Revoke any remaining preview object URLs on unmount
  useEffect(() => {
    return () => {
      for (const fp of filePreviewsRef.current) {
        if (fp.previewUrl) URL.revokeObjectURL(fp.previewUrl);
      }
    };
  }, []);

  const validateFiles = useCallback(
    (files: File[]): string | null => {
      const result = validateImportFiles(files);
      if (!result.valid && result.errorKey) {
        return t(result.errorKey, result.errorParams);
      }
      return null;
    },
    [t]
  );

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files ?? []);
    if (selectedFiles.length === 0) return;

    // Combine with existing files
    const allFiles = [...filePreviews.map((fp) => fp.file), ...selectedFiles];

    const validationError = validateFiles(allFiles);
    if (validationError) {
      setError(validationError);
      return;
    }

    const newPreviews: FilePreview[] = selectedFiles.map((file) => ({
      file,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    }));

    setFilePreviews((prev) => [...prev, ...newPreviews]);
    setError(null);

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(index: number) {
    setFilePreviews((prev) => {
      const removed = prev[index];
      if (removed.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleScan() {
    if (filePreviews.length === 0) {
      setError(t("noFiles"));
      return;
    }

    setError(null);
    setScanning(true);

    try {
      const formData = new FormData();
      for (const { file } of filePreviews) {
        formData.append("files", file);
      }
      if (preciseMode) {
        formData.append("precise", "true");
      }

      const res = await fetch("/api/scan-character", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        const char = data.character;
        // Normalize race subraces to base race
        const raceMap: Record<string, string> = {
          stout_halfling: "halfling",
          tallfellow_halfling: "halfling",
          hairfeet_halfling: "halfling",
          standard_half_elf: "half_elf",
          wood_elf: "elf",
          high_elf: "elf",
          grey_elf: "elf",
          wild_elf: "elf",
          hill_dwarf: "dwarf",
          mountain_dwarf: "dwarf",
          rock_gnome: "gnome",
          deep_gnome: "gnome",
        };
        if (char.race && raceMap[char.race]) {
          char.race = raceMap[char.race];
        }
        // Normalize equipment: support both string[] (legacy) and {name, magicBonus}[]
        if (Array.isArray(char.equipment)) {
          char.equipment = char.equipment.map(
            (item: string | { name: string; magicBonus?: number }) => {
              if (typeof item === "string") {
                const bonusMatch = item.match(/\+(\d+)/);
                return { name: item, magicBonus: bonusMatch ? parseInt(bonusMatch[1]) : 0 };
              }
              return { name: item.name, magicBonus: item.magicBonus ?? 0 };
            }
          );
        }
        // Normalize classes: ensure level is never null, fallback to legacy level field
        if (Array.isArray(char.classes)) {
          char.classes = char.classes.map(
            (cc: { class: string; level: number | null; xp: number | null }) => ({
              ...cc,
              level: cc.level ?? char.level ?? 1,
              xp: cc.xp ?? char.xp ?? 0,
            })
          );
        }
        setScanned(char);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan fehlgeschlagen.");
    }

    setScanning(false);
  }

  function updateField<K extends keyof ScannedCharacter>(key: K, value: ScannedCharacter[K]) {
    if (!scanned) return;
    setScanned({ ...scanned, [key]: value });
  }

  async function handleCreate() {
    if (!scanned) return;
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError(tc("notLoggedIn"));
        setSaving(false);
        return;
      }

      // Resolve classes: new multiclass format or legacy single-class
      const validClassIds = [
        "fighter",
        "ranger",
        "paladin",
        "mage",
        "abjurer",
        "conjurer",
        "diviner",
        "enchanter",
        "illusionist",
        "invoker",
        "necromancer",
        "transmuter",
        "cleric",
        "druid",
        "thief",
        "bard",
      ];
      const resolvedClasses: ScannedClassEntry[] = (
        scanned.classes?.length
          ? scanned.classes
          : scanned.class
            ? [{ class: scanned.class, level: scanned.level ?? 1, xp: scanned.xp ?? 0 }]
            : []
      )
        .map((cc) => ({
          ...cc,
          class: cc.class.toLowerCase().trim() as ClassId,
        }))
        .filter((cc) => validClassIds.includes(cc.class));

      const primaryClass = resolvedClasses[0]?.class ?? null;
      const primaryLevel = resolvedClasses[0]?.level ?? 1;
      const primaryXp = resolvedClasses[0]?.xp ?? 0;

      // Validate kit: only allow known kits
      const validKits = [
        "barbarian",
        "cavalier",
        "swashbuckler",
        "berserker",
        "gladiator",
        "myrmidon",
        "assassin",
        "bounty_hunter",
        "acrobat",
        "scout",
        "burglar",
        "spy",
        "witch",
        "militant_wizard",
        "savage_wizard",
        "academician",
        "fighting_monk",
        "pacifist_priest",
        "beastmaster",
        "blade",
      ];
      const validatedKit = scanned.kit && validKits.includes(scanned.kit) ? scanned.kit : null;

      const { data, error: insertError } = await supabase
        .from("characters")
        .insert({
          user_id: user.id,
          name: scanned.name,
          level: primaryLevel,
          race_id: scanned.race,
          class_id: primaryClass,
          kit: validatedKit,
          alignment: scanned.alignment || "true_neutral",
          xp_current: primaryXp,
          str: scanned.str,
          str_exceptional: scanned.strExceptional,
          dex: scanned.dex,
          con: scanned.con,
          int: scanned.int,
          wis: scanned.wis,
          cha: scanned.cha,
          str_stamina: scanned.strStamina,
          str_muscle: scanned.strMuscle,
          dex_aim: scanned.dexAim,
          dex_balance: scanned.dexBalance,
          con_health: scanned.conHealth,
          con_fitness: scanned.conFitness,
          int_reason: scanned.intReason,
          int_knowledge: scanned.intKnowledge,
          wis_intuition: scanned.wisIntuition,
          wis_willpower: scanned.wisWillpower,
          cha_leadership: scanned.chaLeadership,
          cha_appearance: scanned.chaAppearance,
          hp_current: scanned.hpCurrent || scanned.hpMax,
          hp_max: scanned.hpMax,
          gold_pp: scanned.goldPp || 0,
          gold_gp: scanned.goldGp || 0,
          gold_sp: scanned.goldSp || 0,
          gold_cp: scanned.goldCp || 0,
          player_name: scanned.playerName || "",
          age: scanned.age,
          gender: scanned.gender || "",
          height_cm: scanned.height ? Math.round(parseImperialHeight(scanned.height)) : null,
          weight_kg: scanned.weight ? Math.round(scanned.weight * 0.4536) : null,
          ...(isNpc ? { is_npc: true, npc_visible_to_players: false, is_active: false } : {}),
        })
        .select("id")
        .single();

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }

      // Insert ALL classes (supports multiclass)
      if (resolvedClasses.length > 0) {
        const classRows = resolvedClasses.map((cc) => ({
          character_id: data.id,
          class_id: cc.class,
          level: cc.level ?? 1,
          xp_current: cc.xp || 0,
        }));
        const { error: classError } = await supabase.from("character_classes").insert(classRows);
        if (classError) {
          console.error("character_classes insert failed:", classError);
        }
      }

      // Fetch all weapons for proficiency name normalization and equipment matching
      const { data: allWeapons } = await supabase.from("weapons").select("id, name, name_en");

      // Separate fighting styles from weapon proficiencies
      const fightingStyleEntries =
        scanned.weaponProficiencies?.filter((wp) =>
          wp.name.toLowerCase().startsWith("fighting style")
        ) ?? [];
      const actualWeaponProfs =
        scanned.weaponProficiencies?.filter(
          (wp) => !wp.name.toLowerCase().startsWith("fighting style")
        ) ?? [];

      // Insert fighting styles
      for (const fs of fightingStyleEntries) {
        const styleId = fs.name.toLowerCase().includes("two weapon")
          ? "two_weapon"
          : fs.name.toLowerCase().includes("two-hander") ||
              fs.name.toLowerCase().includes("two handed")
            ? "two_hander"
            : fs.name.toLowerCase().includes("shield")
              ? "weapon_and_shield"
              : fs.name.toLowerCase().includes("single")
                ? "single_weapon"
                : null;
        if (styleId) {
          await supabase.from("character_fighting_styles").insert({
            character_id: data.id,
            style_id: styleId,
            slots_invested: 1,
          });
        }
      }

      // Insert weapon proficiencies (normalize to canonical DE name)
      if (actualWeaponProfs.length > 0) {
        const wpRows = actualWeaponProfs.map((wp) => {
          const matchedWeapon = allWeapons?.find(
            (w) =>
              w.name.toLowerCase() === wp.name.toLowerCase() ||
              (w.name_en ?? "").toLowerCase() === wp.name.toLowerCase()
          );
          return {
            character_id: data.id,
            weapon_name: matchedWeapon ? matchedWeapon.name : wp.name,
            specialization: wp.specialized,
          };
        });
        await supabase.from("character_weapon_proficiencies").insert(wpRows);
      }

      // Try to match and insert NWPs
      if (scanned.nwps?.length > 0) {
        const { data: allNwps } = await supabase
          .from("nonweapon_proficiencies")
          .select("id, name, name_en");
        if (allNwps) {
          const insertedNwpIds = new Set<string>();
          for (const nwpName of scanned.nwps) {
            const nwpLower = nwpName
              .toLowerCase()
              .replace(/^native languages?:\s*/i, "")
              .trim();
            if (nwpLower.startsWith("common") || nwpLower.startsWith("native")) continue;
            const match = allNwps.find(
              (n) =>
                n.name.toLowerCase() === nwpLower ||
                n.name_en?.toLowerCase() === nwpLower ||
                n.name.toLowerCase().includes(nwpLower) ||
                (n.name_en && n.name_en.toLowerCase().includes(nwpLower))
            );
            if (match && !insertedNwpIds.has(match.id)) {
              insertedNwpIds.add(match.id);
              await supabase.from("character_nonweapon_proficiencies").insert({
                character_id: data.id,
                proficiency_id: match.id,
              });
            }
          }
        }
      }

      // Try to match and insert equipment (weapons + armor)
      if (scanned.equipment?.length > 0) {
        const { data: allArmor } = await supabase.from("armor").select("id, name, name_en");

        for (const item of scanned.equipment) {
          // Strip magic bonus and quantity from name for matching
          const baseName = item.name
            .replace(/\s*\+\d+/, "")
            .replace(/\s*x\d+$/, "")
            .toLowerCase()
            .trim();
          if (!baseName) continue;
          const qty = item.name.match(/x(\d+)$/)?.[1]
            ? parseInt(item.name.match(/x(\d+)$/)![1])
            : 1;
          const bonus = item.magicBonus ?? 0;

          // Tokenize for flexible matching (e.g. "Axe, hand/throwing" matches "Hand Axe")
          const baseTokens = baseName.split(/[\s,/]+/).filter((t) => t.length > 2);
          const matchesName = (dbName: string) => {
            const db = dbName.toLowerCase();
            // Direct substring match
            if (db.includes(baseName) || baseName.includes(db)) return true;
            // Token-based: all DB name words appear in the scanned name
            const dbTokens = db.split(/[\s,/]+/).filter((t) => t.length > 2);
            if (
              dbTokens.length > 0 &&
              dbTokens.every((dt) => baseTokens.some((bt) => bt.includes(dt) || dt.includes(bt)))
            )
              return true;
            return false;
          };

          // Try to match weapon
          const weapon = allWeapons?.find(
            (w) => matchesName(w.name) || (w.name_en && matchesName(w.name_en))
          );
          if (weapon) {
            await supabase.from("character_equipment").insert({
              character_id: data.id,
              weapon_id: weapon.id,
              quantity: qty,
              equipped: true,
              hit_bonus: bonus,
              damage_bonus: bonus,
            });
            continue;
          }

          // Try to match armor
          const armor = allArmor?.find(
            (a) => matchesName(a.name) || (a.name_en && matchesName(a.name_en))
          );
          if (armor) {
            await supabase.from("character_equipment").insert({
              character_id: data.id,
              armor_id: armor.id,
              quantity: 1,
              equipped: true,
            });
            continue;
          }

          // Unmatched items go to inventory
          await supabase.from("character_inventory").insert({
            character_id: data.id,
            custom_name: item.name,
            quantity: qty,
          });
        }
      }

      // Try to match and insert spells
      if (scanned.spells?.length > 0) {
        // Fetch all spells from DB (paginated for >1000 rows)
        let allSpells: { id: string; name: string; name_en: string | null; level: number }[] = [];
        let from = 0;
        const batchSize = 1000;
        let hasMore = true;
        while (hasMore) {
          const { data: batch } = await supabase
            .from("spells")
            .select("id, name, name_en, level")
            .range(from, from + batchSize - 1);
          if (batch && batch.length > 0) {
            allSpells = allSpells.concat(batch);
            from += batchSize;
            hasMore = batch.length === batchSize;
          } else {
            hasMore = false;
          }
        }

        const spellInserts: { character_id: string; spell_id: string; prepared: boolean }[] = [];
        const matchedIds = new Set<string>();

        for (const scannedSpell of scanned.spells) {
          if (!scannedSpell.name.trim()) continue;
          const spellLower = scannedSpell.name.toLowerCase().trim();

          const match = allSpells.find((s) => {
            if (s.level !== scannedSpell.level) return false;
            const nameLower = s.name.toLowerCase();
            const nameEnLower = s.name_en?.toLowerCase() ?? "";
            return (
              nameLower === spellLower ||
              nameEnLower === spellLower ||
              nameLower.includes(spellLower) ||
              (nameEnLower && nameEnLower.includes(spellLower)) ||
              spellLower.includes(nameLower) ||
              (nameEnLower && spellLower.includes(nameEnLower))
            );
          });

          if (match && !matchedIds.has(match.id)) {
            matchedIds.add(match.id);
            spellInserts.push({
              character_id: data.id,
              spell_id: match.id,
              prepared: false,
            });
          }
        }

        if (spellInserts.length > 0) {
          await supabase.from("character_spells").insert(spellInserts);
        }
      }

      router.push(`${basePath}/${data.id}/manage`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("createFailed"));
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6" data-testid="import-page">
      <h1 className="font-heading text-3xl text-primary">{t("title")}</h1>
      <p className="text-muted-foreground">{t("description")}</p>

      {/* Upload area */}
      {!scanned && (
        <>
          <div
            className="flex cursor-pointer flex-col items-center gap-4 rounded-md border-2 border-dashed border-border p-12 transition-colors hover:border-primary/50"
            onClick={() => fileInputRef.current?.click()}
            data-testid="import-dropzone"
          >
            {filePreviews.length === 0 ? (
              <div className="flex flex-col items-center gap-2">
                <p className="text-muted-foreground">{t("dropzone")}</p>
                <p className="text-xs text-muted-foreground/70">{t("dropzoneHint")}</p>
              </div>
            ) : (
              <p className="text-sm text-primary">
                {t("filesSelected", { count: filePreviews.length })}
              </p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              data-testid="import-file-input"
            />
          </div>

          {/* Preview grid */}
          {filePreviews.length > 0 && (
            <div
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5"
              data-testid="import-preview-grid"
            >
              {filePreviews.map((fp, index) => (
                <div
                  key={`${fp.file.name}-${index}`}
                  className="group relative flex flex-col items-center gap-2 rounded-md border border-border p-2"
                  data-testid={`import-preview-${index}`}
                >
                  {fp.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={fp.previewUrl}
                      alt={fp.file.name}
                      className="h-24 w-full rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-full items-center justify-center rounded bg-muted text-sm font-medium text-primary">
                      PDF
                    </div>
                  )}
                  <p className="w-full truncate text-center text-xs text-muted-foreground">
                    {fp.file.name}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground shadow-sm hover:bg-destructive/80"
                    aria-label={t("removeFile")}
                    data-testid={`import-remove-file-${index}`}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Scan mode toggle + button */}
          {filePreviews.length > 0 && (
            <div className="flex flex-col items-center gap-3">
              <label className="flex items-center gap-2 text-sm" data-testid="precise-mode-toggle">
                <input
                  type="checkbox"
                  checked={preciseMode}
                  onChange={(e) => setPreciseMode(e.target.checked)}
                  className="rounded"
                />
                <span className="text-muted-foreground">{t("preciseMode")}</span>
              </label>
              <Button onClick={handleScan} disabled={scanning} data-testid="import-scan-button">
                {scanning ? t("scanning") : t("title")}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Scanned result — editable */}
      {scanned && (
        <div className="glass glow-neutral rounded-xl p-6" data-testid="import-result">
          <h2 className="font-heading text-xl text-primary mb-4">{t("resultTitle")}</h2>
          <div className="flex flex-col gap-4">
            {/* Basic Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="import-name">Name</Label>
                <Input
                  id="import-name"
                  value={scanned.name ?? ""}
                  onChange={(e) => updateField("name", e.target.value)}
                  data-testid="import-name"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="import-race">{t("race")}</Label>
                <select
                  id="import-race"
                  className="rounded-md border border-border bg-transparent px-3 py-2 text-sm"
                  value={scanned.race ?? "human"}
                  onChange={(e) => updateField("race", e.target.value as RaceId)}
                  data-testid="import-race"
                >
                  {(
                    [
                      "human",
                      "elf",
                      "half_elf",
                      "dwarf",
                      "gnome",
                      "halfling",
                      "half_orc",
                      "kobold",
                    ] as const
                  ).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Classes */}
            <div data-testid="import-classes">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{t("classes")}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const current = scanned.classes ?? [];
                    updateField("classes", [
                      ...current,
                      { class: "fighter" as ClassId, level: 1, xp: 0 },
                    ]);
                  }}
                  data-testid="import-add-class"
                >
                  {t("addClass")}
                </Button>
              </div>
              {(scanned.classes ?? []).map((cc, i) => (
                <div
                  key={i}
                  className="mb-2 flex items-center gap-2"
                  data-testid={`import-class-${i}`}
                >
                  <select
                    className="rounded-md border border-border bg-transparent px-2 py-1.5 text-sm"
                    value={cc.class}
                    onChange={(e) => {
                      const updated = [...(scanned.classes ?? [])];
                      updated[i] = { ...updated[i], class: e.target.value as ClassId };
                      updateField("classes", updated);
                    }}
                    data-testid={`import-class-select-${i}`}
                  >
                    {(
                      [
                        "fighter",
                        "ranger",
                        "paladin",
                        "mage",
                        "abjurer",
                        "conjurer",
                        "diviner",
                        "enchanter",
                        "illusionist",
                        "invoker",
                        "necromancer",
                        "transmuter",
                        "cleric",
                        "druid",
                        "thief",
                        "bard",
                      ] as const
                    ).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={cc.level}
                    onChange={(e) => {
                      const updated = [...(scanned.classes ?? [])];
                      updated[i] = {
                        ...updated[i],
                        level: Math.max(1, parseInt(e.target.value) || 1),
                      };
                      updateField("classes", updated);
                    }}
                    className="h-8 w-20 text-center text-sm"
                    data-testid={`import-class-level-${i}`}
                  />
                  <Input
                    type="number"
                    min={0}
                    value={cc.xp}
                    onChange={(e) => {
                      const updated = [...(scanned.classes ?? [])];
                      updated[i] = { ...updated[i], xp: parseInt(e.target.value) || 0 };
                      updateField("classes", updated);
                    }}
                    className="h-8 w-28 text-center text-sm"
                    placeholder="XP"
                    data-testid={`import-class-xp-${i}`}
                  />
                  {(scanned.classes ?? []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (scanned.classes ?? []).filter((_, idx) => idx !== i);
                        updateField("classes", updated);
                      }}
                      className="text-destructive hover:text-destructive/80"
                      aria-label={t("removeClass")}
                      data-testid={`import-class-remove-${i}`}
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Kit, Alignment */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="import-kit">Kit</Label>
                <Input
                  id="import-kit"
                  value={scanned.kit ?? ""}
                  onChange={(e) => updateField("kit", e.target.value || null)}
                  placeholder={t("noKit")}
                  data-testid="import-kit"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="import-alignment">{t("alignment")}</Label>
                <select
                  id="import-alignment"
                  className="rounded-md border border-border bg-transparent px-3 py-2 text-sm"
                  value={
                    (ALL_ALIGNMENTS as readonly string[]).includes(scanned.alignment)
                      ? scanned.alignment
                      : "true_neutral"
                  }
                  onChange={(e) => updateField("alignment", e.target.value)}
                  data-testid="import-alignment"
                >
                  {ALL_ALIGNMENTS.map((a) => (
                    <option key={a} value={a}>
                      {getAlignmentLabel(a, locale)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Personal Details */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="import-playerName">{t("player")}</Label>
                <Input
                  id="import-playerName"
                  value={scanned.playerName ?? ""}
                  onChange={(e) => updateField("playerName", e.target.value || null)}
                  data-testid="import-playerName"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="import-age">{t("age")}</Label>
                <Input
                  id="import-age"
                  type="number"
                  min={0}
                  value={scanned.age ?? ""}
                  onChange={(e) =>
                    updateField("age", e.target.value ? parseInt(e.target.value) : null)
                  }
                  data-testid="import-age"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="import-gender">{t("gender")}</Label>
                <Input
                  id="import-gender"
                  value={scanned.gender ?? ""}
                  onChange={(e) => updateField("gender", e.target.value || null)}
                  data-testid="import-gender"
                />
              </div>
            </div>

            {/* Ability Scores */}
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {(["str", "dex", "con", "int", "wis", "cha"] as const).map((attr) => (
                <div key={attr} className="flex flex-col gap-1">
                  <Label htmlFor={`import-${attr}`} className="text-xs uppercase">
                    {attr}
                  </Label>
                  <Input
                    id={`import-${attr}`}
                    type="number"
                    min={3}
                    max={18}
                    value={scanned[attr]}
                    onChange={(e) => updateField(attr, parseInt(e.target.value) || 0)}
                    onBlur={(e) =>
                      updateField(attr, Math.max(3, Math.min(18, parseInt(e.target.value) || 3)))
                    }
                    className="text-center"
                    data-testid={`import-${attr}`}
                  />
                </div>
              ))}
            </div>

            {/* Sub-Stats (only shown if any are non-null) */}
            {(scanned.strStamina !== null ||
              scanned.strMuscle !== null ||
              scanned.dexAim !== null ||
              scanned.dexBalance !== null ||
              scanned.conHealth !== null ||
              scanned.conFitness !== null ||
              scanned.intReason !== null ||
              scanned.intKnowledge !== null ||
              scanned.wisIntuition !== null ||
              scanned.wisWillpower !== null ||
              scanned.chaLeadership !== null ||
              scanned.chaAppearance !== null) && (
              <div data-testid="import-substats-section">
                <p className="mb-2 text-sm font-medium text-muted-foreground">{t("subStats")}</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(
                    [
                      ["strStamina", "STR/Stam"],
                      ["strMuscle", "STR/Musc"],
                      ["dexAim", "DEX/Aim"],
                      ["dexBalance", "DEX/Bal"],
                      ["conHealth", "CON/Hlth"],
                      ["conFitness", "CON/Fit"],
                      ["intReason", "INT/Reas"],
                      ["intKnowledge", "INT/Know"],
                      ["wisIntuition", "WIS/Intu"],
                      ["wisWillpower", "WIS/Will"],
                      ["chaLeadership", "CHA/Lead"],
                      ["chaAppearance", "CHA/App"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="flex flex-col gap-1">
                      <Label htmlFor={`import-${key}`} className="text-xs">
                        {label}
                      </Label>
                      <Input
                        id={`import-${key}`}
                        type="number"
                        min={1}
                        max={20}
                        value={scanned[key] ?? ""}
                        onChange={(e) =>
                          updateField(key, e.target.value ? parseInt(e.target.value) : null)
                        }
                        className="text-center"
                        data-testid={`import-${key}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* HP */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="import-hp">{t("maxHp")}</Label>
                <Input
                  id="import-hp"
                  type="number"
                  min={1}
                  value={scanned.hpMax ?? ""}
                  onChange={(e) => updateField("hpMax", Math.max(1, parseInt(e.target.value) || 1))}
                  className="max-w-[100px]"
                  data-testid="import-hp"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="import-hpCurrent">{t("currentHp")}</Label>
                <Input
                  id="import-hpCurrent"
                  type="number"
                  min={0}
                  value={scanned.hpCurrent ?? scanned.hpMax ?? ""}
                  onChange={(e) =>
                    updateField("hpCurrent", Math.max(0, parseInt(e.target.value) || 0))
                  }
                  className="max-w-[100px]"
                  data-testid="import-hpCurrent"
                />
              </div>
            </div>

            {/* Gold */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  ["goldPp", "PP"],
                  ["goldGp", "GP"],
                  ["goldSp", "SP"],
                  ["goldCp", "CP"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex flex-col gap-1">
                  <Label htmlFor={`import-${key}`} className="text-xs">
                    {label}
                  </Label>
                  <Input
                    id={`import-${key}`}
                    type="number"
                    min={0}
                    value={scanned[key] ?? 0}
                    onChange={(e) => updateField(key, parseInt(e.target.value) || 0)}
                    className="text-center"
                    data-testid={`import-${key}`}
                  />
                </div>
              ))}
            </div>

            {/* Weapon Proficiencies */}
            <div data-testid="import-weapon-proficiencies">
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                {t("weaponProficiencies")}
              </p>
              <div className="flex flex-col gap-1">
                {(scanned.weaponProficiencies ?? []).map((wp, i) => (
                  <div key={i} className="flex items-center gap-2" data-testid={`import-wp-${i}`}>
                    <Input
                      value={wp.name}
                      onChange={(e) => {
                        const updated = [...(scanned.weaponProficiencies ?? [])];
                        updated[i] = { ...updated[i], name: e.target.value };
                        updateField("weaponProficiencies", updated);
                      }}
                      className="h-8 text-sm"
                      data-testid={`import-wp-name-${i}`}
                    />
                    <label className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={wp.specialized}
                        onChange={(e) => {
                          const updated = [...(scanned.weaponProficiencies ?? [])];
                          updated[i] = { ...updated[i], specialized: e.target.checked };
                          updateField("weaponProficiencies", updated);
                        }}
                        className="rounded"
                      />
                      {t("specialized")}
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        updateField(
                          "weaponProficiencies",
                          (scanned.weaponProficiencies ?? []).filter((_, idx) => idx !== i)
                        )
                      }
                      className="text-destructive hover:text-destructive/80"
                      data-testid={`import-wp-remove-${i}`}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* NWPs */}
            <div data-testid="import-nwps">
              <p className="mb-2 text-sm font-medium text-muted-foreground">{t("nwps")}</p>
              <div className="flex flex-col gap-1">
                {(scanned.nwps ?? []).map((nwp, i) => (
                  <div key={i} className="flex items-center gap-2" data-testid={`import-nwp-${i}`}>
                    <Input
                      value={nwp}
                      onChange={(e) => {
                        const updated = [...(scanned.nwps ?? [])];
                        updated[i] = e.target.value;
                        updateField("nwps", updated);
                      }}
                      className="h-8 text-sm"
                      data-testid={`import-nwp-name-${i}`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateField(
                          "nwps",
                          (scanned.nwps ?? []).filter((_, idx) => idx !== i)
                        )
                      }
                      className="text-destructive hover:text-destructive/80"
                      data-testid={`import-nwp-remove-${i}`}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div data-testid="import-equipment">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{t("equipment")}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateField("equipment", [
                      ...(scanned.equipment ?? []),
                      { name: "", magicBonus: 0 },
                    ])
                  }
                  data-testid="import-add-equipment"
                >
                  {t("addEquipment")}
                </Button>
              </div>
              <div className="flex flex-col gap-1">
                {(scanned.equipment ?? []).map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2"
                    data-testid={`import-equip-${i}`}
                  >
                    <Input
                      value={item.name}
                      onChange={(e) => {
                        const updated = [...(scanned.equipment ?? [])];
                        updated[i] = { ...updated[i], name: e.target.value };
                        updateField("equipment", updated);
                      }}
                      className="h-8 text-sm"
                      data-testid={`import-equip-name-${i}`}
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">+</span>
                      <Input
                        type="number"
                        min={0}
                        max={5}
                        value={item.magicBonus}
                        onChange={(e) => {
                          const updated = [...(scanned.equipment ?? [])];
                          updated[i] = {
                            ...updated[i],
                            magicBonus: Math.max(0, parseInt(e.target.value) || 0),
                          };
                          updateField("equipment", updated);
                        }}
                        className="h-8 w-14 text-center text-sm"
                        data-testid={`import-equip-bonus-${i}`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateField(
                          "equipment",
                          (scanned.equipment ?? []).filter((_, idx) => idx !== i)
                        )
                      }
                      className="text-destructive hover:text-destructive/80"
                      data-testid={`import-equip-remove-${i}`}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Spells */}
            <div data-testid="import-spells">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{t("spellsKnown")}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateField("spells", [...(scanned.spells ?? []), { name: "", level: 1 }])
                  }
                  data-testid="import-add-spell"
                >
                  {t("addSpell")}
                </Button>
              </div>
              {(scanned.spells ?? []).length > 0 ? (
                <div className="flex flex-col gap-2">
                  {Object.entries(
                    (scanned.spells ?? []).reduce<
                      Record<number, { name: string; level: number; idx: number }[]>
                    >((acc, spell, idx) => {
                      (acc[spell.level] ??= []).push({ ...spell, idx });
                      return acc;
                    }, {})
                  )
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([level, spells]) => (
                      <div key={level}>
                        <p className="text-xs font-medium text-primary mb-1">
                          {t("spellLevel")} {level}
                        </p>
                        <div className="flex flex-col gap-1">
                          {spells.map(({ name, idx }) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2"
                              data-testid={`import-spell-${idx}`}
                            >
                              <Input
                                value={name}
                                onChange={(e) => {
                                  const updated = [...(scanned.spells ?? [])];
                                  updated[idx] = { ...updated[idx], name: e.target.value };
                                  updateField("spells", updated);
                                }}
                                className="h-8 text-sm"
                                placeholder={t("spellName")}
                                data-testid={`import-spell-name-${idx}`}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = (scanned.spells ?? []).filter(
                                    (_, i) => i !== idx
                                  );
                                  updateField("spells", updated);
                                }}
                                className="text-destructive hover:text-destructive/80"
                                aria-label={t("removeSpell")}
                                data-testid={`import-spell-remove-${idx}`}
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground/70">{t("noSpells")}</p>
              )}
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setScanned(null);
                  // Clean up preview URLs
                  for (const fp of filePreviews) {
                    if (fp.previewUrl) URL.revokeObjectURL(fp.previewUrl);
                  }
                  setFilePreviews([]);
                }}
              >
                {t("newPhoto")}
              </Button>
              <Button onClick={handleCreate} disabled={saving} data-testid="import-create-button">
                {saving ? t("creating") : t("createCharacter")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive" data-testid="import-error">
          {error}
        </p>
      )}
    </div>
  );
}
