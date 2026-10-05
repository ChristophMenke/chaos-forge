"use client";

/**
 * Orchestriert den Rescan: Dateien hochladen → Vision-Scan → Diff gegen den
 * DB-Stand → kuratierte Änderungsliste → schreiben.
 *
 * Die Komponente hält nur den Ablauf. Vergleich (`buildChangeSet`), Planung
 * (`buildApplyPlan`) und Ausführung (`executeApplyPlan`) liegen in
 * `src/lib/scan/` und sind dort unit-getestet.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useUndo } from "@/components/undo/undo-context";
import { getSpellNameIndex } from "@/lib/catalog/spell-catalog";
import { Button } from "@/components/ui/button";
import { buildChangeSet } from "@/lib/scan/character-diff";
import { buildApplyPlan } from "@/lib/scan/character-apply";
import { executeApplyPlan } from "@/lib/scan/execute-apply-plan";
import type {
  CharacterSnapshot,
  MatchCatalogs,
  ScanChange,
  SelectedChange,
} from "@/lib/scan/character-diff-types";
import type { ScannedUpdatePayload } from "@/lib/scan/character-scan-prompt";
import { ChangeList } from "./change-list";
import { ScanUploadPanel } from "./scan-upload-panel";

export interface RescanViewProps {
  snapshot: CharacterSnapshot;
  basePath?: string;
}

/**
 * Holt nur die Stammdaten, die der Scan tatsächlich braucht. Ein Bogen ohne
 * Zauber lädt keine 3.200 Zauber.
 */
async function loadCatalogs(
  supabase: ReturnType<typeof createClient>,
  payload: ScannedUpdatePayload
): Promise<MatchCatalogs> {
  const needsItems = payload.equipment.length > 0 || payload.weaponProficiencies.length > 0;
  const needsNwps = payload.nwps.length > 0;
  const needsSpells = payload.spells.length > 0;

  const [weapons, armor, nwps, spells] = await Promise.all([
    needsItems
      ? supabase
          .from("weapons")
          .select("id, name, name_en")
          .then((r) => r.data ?? [])
      : Promise.resolve([]),
    needsItems
      ? supabase
          .from("armor")
          .select("id, name, name_en")
          .then((r) => r.data ?? [])
      : Promise.resolve([]),
    needsNwps
      ? supabase
          .from("nonweapon_proficiencies")
          .select("id, name, name_en")
          .then((r) => r.data ?? [])
      : Promise.resolve([]),
    needsSpells ? getSpellNameIndex() : Promise.resolve([]),
  ]);

  return { weapons, armor, nwps, spells };
}

export function RescanView({ snapshot, basePath = "/characters" }: RescanViewProps) {
  const t = useTranslations("rescan");
  const undo = useUndo();
  const router = useRouter();

  const [scanning, setScanning] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changes, setChanges] = useState<ScanChange[] | null>(null);

  async function handleScan(files: File[], preciseMode: boolean) {
    setError(null);
    setScanning(true);

    try {
      const formData = new FormData();
      for (const file of files) formData.append("files", file);
      formData.append("mode", "update");
      if (preciseMode) formData.append("precise", "true");

      const res = await fetch("/api/scan-character", { method: "POST", body: formData });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      const payload = data.payload as ScannedUpdatePayload;
      const supabase = createClient();
      const catalogs = await loadCatalogs(supabase, payload);
      setChanges(buildChangeSet(snapshot, payload, catalogs));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("scanFailed"));
    } finally {
      setScanning(false);
    }
  }

  async function handleApply(selected: SelectedChange[]) {
    setApplying(true);
    setError(null);

    try {
      const operations = buildApplyPlan(selected, snapshot);
      const result = await executeApplyPlan(createClient(), operations);
      // Rescan writes are not recorded; older steps would only conflict.
      undo?.clear();

      if (result.failed.length > 0) {
        // Teilerfolge bleiben stehen — der Nutzer erfährt, was nicht durchkam,
        // statt stillschweigend mit halb geschriebenen Daten weiterzugehen.
        console.error("Rescan apply failures:", result.failed);
        setError(t("applyFailed", { count: result.failed.length }));
        setApplying(false);
        return;
      }

      router.push(`${basePath}/${snapshot.character.id}/manage`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("applyFailed", { count: 1 }));
      setApplying(false);
    }
  }

  function reset() {
    setChanges(null);
    setError(null);
  }

  return (
    <div
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6"
      data-testid="rescan-page"
    >
      <div>
        <h1 className="font-heading text-2xl text-primary sm:text-3xl">
          {t("titleWithName", { name: snapshot.character.name })}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
      </div>

      {changes === null ? (
        <ScanUploadPanel scanning={scanning} onScan={handleScan} onError={setError} />
      ) : (
        <>
          <ChangeList changes={changes} onApply={handleApply} applying={applying} />
          <div>
            <Button variant="outline" onClick={reset} data-testid="rescan-new-files-button">
              {t("newFiles")}
            </Button>
          </div>
        </>
      )}

      {error && (
        <p className="text-sm text-destructive" data-testid="rescan-error">
          {error}
        </p>
      )}
    </div>
  );
}
