# Compendium-Snapshot (Monstrous Manual + Monstrous Compendium I/II)

Dieser Snapshot wurde einmalig extrahiert aus:

- **Upstream**: https://github.com/decheine/complete-compendium
- **Datum**: 2026-04-11
- **Upstream-Commit**: 7477daae88291d86d1a9dbf620bc7eeac05dd8f7
- **Extraktions-Filter**: TSR-Produkt-IDs 2140, 2102, 2103
  - `2140` — Monstrous Manual (1995)
  - `2102` — Monstrous Compendium Volume I (1989)
  - `2103` — Monstrous Compendium Volume II (1989)

Enthält die HTML-Stat-Block-Dateien und die dazugehörigen GIF-Illustrationen
für Monster aus dem Monstrous Manual und seinen Vorgänger-Compendia
(© Wizards of the Coast, vormals TSR) plus die Buch-Lookup-Daten
(`all_tsr.json`). Die Vorgänger-Compendia liefern Monster, die nicht ins
MM übernommen wurden und sonst fehlen würden.

## Verwendungszweck

Einmaliger Backfill-Import für die private Spielgruppe "Chaos RPG"
(≤ 10 Nutzer, nicht-kommerziell). Das Rechtsprofil entspricht der bereits
vorhandenen Nutzung von `ressources/monsters/Monstrous Manual.pdf`.

## Inhalt

- `all_tsr.json` — TSR-Produkt-ID → Buchtitel-Lookup (vom Upstream übernommen)
- `mm/*.html` — 353 Monstrous-Manual-Monster-HTMLs
- `mm/img/*.gif` — 325 Monster-Illustrationen (einige Monster haben upstream kein Bild)
- `parsed.json` — Wird von `scripts/parse-compendium.ts` generiert (strukturiertes JSON)
- `translated.json` — Wird von `scripts/translate-monster-narrative.ts` generiert (DE-Übersetzung)

## Verwandte Dokumente

- Research: `docs/agents/research/2026-04-10-monster-data-completeness.md`
- Plan: `docs/agents/plans/2026-04-10-monster-data-completeness.md`

## Erneuerung

Der Snapshot kann via `npx tsx scripts/extract-compendium-snapshot.ts` neu
erstellt werden. Der alte Inhalt von `mm/` wird dabei ersetzt.
