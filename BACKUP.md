# Backup & Restore — Chaos Forge

Anleitung zum Erstellen und Einspielen eines vollständigen Backups (Datenbank + Storage).

## Voraussetzungen

- Node.js + npm (für Supabase CLI)
- Supabase CLI (`npm install -g supabase` oder `brew install supabase/tap/supabase`)
- Python 3 (für die Backup-Skripte)
- Zugriff auf `.env.local` mit gültigem `SUPABASE_SERVICE_ROLE_KEY`

Die `.env.local` muss folgende Variablen enthalten:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

## Backup erstellen

### 1. Datenbank exportieren (alle 34 Tabellen als JSON)

```bash
mkdir -p backup-$(date +%F)

SERVICE_KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' .env.local | head -1 | cut -d= -f2)
BASE="$(grep '^NEXT_PUBLIC_SUPABASE_URL=' .env.local | head -1 | cut -d= -f2)/rest/v1"

python3 << 'PYEOF'
import json, urllib.request, os, datetime

service_key = os.popen("grep '^SUPABASE_SERVICE_ROLE_KEY=' .env.local | head -1 | cut -d= -f2").read().strip()
base_url = os.popen("grep '^NEXT_PUBLIC_SUPABASE_URL=' .env.local | head -1 | cut -d= -f2").read().strip()
base = f"{base_url}/rest/v1"
headers = {"apikey": service_key, "Authorization": f"Bearer {service_key}"}
backup_dir = f"backup-{datetime.date.today()}"

# Tabellenliste aus Swagger-Definition lesen
req = urllib.request.Request(f"{base}/", headers=headers)
with urllib.request.urlopen(req) as resp:
    swagger = json.loads(resp.read())
tables = sorted(swagger.get("definitions", {}).keys())

print(f"Exportiere {len(tables)} Tabellen nach {backup_dir}/...")

for table in tables:
    all_rows = []
    offset = 0
    batch = 1000
    while True:
        url = f"{base}/{table}?select=*&limit={batch}&offset={offset}&order=id"
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as resp:
            chunk = json.loads(resp.read())
        all_rows.extend(chunk)
        if len(chunk) < batch:
            break
        offset += batch

    with open(f"{backup_dir}/{table}.json", "w") as f:
        json.dump(all_rows, f, ensure_ascii=False)
    print(f"  {table}: {len(all_rows)} Einträge")

print("Datenbank-Export abgeschlossen.")
PYEOF
```

### 2. Storage exportieren (Avatare, NPC-Avatare, Monster-Bilder)

```bash
python3 << 'PYEOF'
import json, urllib.request, os, pathlib, datetime

service_key = os.popen("grep '^SUPABASE_SERVICE_ROLE_KEY=' .env.local | head -1 | cut -d= -f2").read().strip()
base_url = os.popen("grep '^NEXT_PUBLIC_SUPABASE_URL=' .env.local | head -1 | cut -d= -f2").read().strip()
base = f"{base_url}/storage/v1"
backup_dir = f"backup-{datetime.date.today()}/storage"

headers_json = {
    "apikey": service_key,
    "Authorization": f"Bearer {service_key}",
    "Content-Type": "application/json"
}
headers_dl = {"apikey": service_key, "Authorization": f"Bearer {service_key}"}

# Alle Buckets auflisten
req = urllib.request.Request(f"{base}/bucket", headers=headers_dl)
with urllib.request.urlopen(req) as resp:
    buckets = [b["name"] for b in json.loads(resp.read())]

total = 0
for bucket in buckets:
    print(f"Bucket: {bucket}")

    # Top-Level-Einträge lesen
    req = urllib.request.Request(
        f"{base}/object/list/{bucket}",
        data=json.dumps({"prefix": "", "limit": 1000}).encode(),
        headers=headers_json
    )
    with urllib.request.urlopen(req) as resp:
        entries = json.loads(resp.read())

    for entry in entries:
        name = entry.get("name", "")
        if entry.get("id"):
            # Direkte Datei
            path = f"{backup_dir}/{bucket}/{name}"
            pathlib.Path(path).parent.mkdir(parents=True, exist_ok=True)
            req = urllib.request.Request(f"{base}/object/{bucket}/{name}", headers=headers_dl)
            with urllib.request.urlopen(req) as resp:
                with open(path, "wb") as f:
                    f.write(resp.read())
            total += 1
        else:
            # Ordner — Untereinträge lesen
            req = urllib.request.Request(
                f"{base}/object/list/{bucket}",
                data=json.dumps({"prefix": name, "limit": 1000}).encode(),
                headers=headers_json
            )
            with urllib.request.urlopen(req) as resp:
                files = json.loads(resp.read())
            for file in files:
                if file.get("id"):
                    fname = file["name"]
                    path = f"{backup_dir}/{bucket}/{name}/{fname}"
                    pathlib.Path(path).parent.mkdir(parents=True, exist_ok=True)
                    req = urllib.request.Request(
                        f"{base}/object/{bucket}/{name}/{fname}", headers=headers_dl
                    )
                    with urllib.request.urlopen(req) as resp:
                        with open(path, "wb") as f:
                            f.write(resp.read())
                    total += 1

print(f"\nStorage-Export abgeschlossen: {total} Dateien")
PYEOF
```

### 3. Backup verifizieren

```bash
# Zeilenzahlen pro Tabelle prüfen
for f in backup-$(date +%F)/*.json; do
  count=$(python3 -c "import json; print(len(json.load(open('$f'))))")
  printf "%-45s %6s Einträge\n" "$(basename $f .json)" "$count"
done

# Storage-Dateien zählen
find backup-$(date +%F)/storage -type f | wc -l
```

**Erwartete Richtwerte (Stand April 2026):**

| Tabelle         | ca. Einträge |
| --------------- | ------------ |
| spells          | 3.200+       |
| rulebook_chunks | 3.400+       |
| monsters        | 400+         |
| general_items   | 140+         |
| weapons         | 100+         |
| characters      | 10+          |

| Storage-Bucket | ca. Dateien |
| -------------- | ----------- |
| avatars        | 25+         |
| npc-avatars    | 25+         |
| monster-images | 400+        |

---

## Backup einspielen (Restore)

### Szenario A: Restore in bestehendes Supabase-Projekt

> **Achtung:** Dies überschreibt alle bestehenden Daten!

#### 1. Schema wiederherstellen (Migrationen)

Die 213 SQL-Migrationen unter `supabase/migrations/` definieren das vollständige Schema:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

#### 2. Daten importieren

```bash
python3 << 'PYEOF'
import json, urllib.request, os, sys

service_key = os.popen("grep '^SUPABASE_SERVICE_ROLE_KEY=' .env.local | head -1 | cut -d= -f2").read().strip()
base_url = os.popen("grep '^NEXT_PUBLIC_SUPABASE_URL=' .env.local | head -1 | cut -d= -f2").read().strip()
base = f"{base_url}/rest/v1"

backup_dir = sys.argv[1] if len(sys.argv) > 1 else "backup-2026-04-07"

# Reihenfolge beachten wegen Foreign Keys:
# Zuerst Stammdaten, dann abhängige Tabellen
import_order = [
    # Stammdaten (keine FK-Abhängigkeiten)
    "profiles", "races", "classes", "race_class_restrictions",
    "armor", "weapons", "general_items", "nonweapon_proficiencies",
    "spells", "rulebook_chunks", "epic_items", "tags", "monsters",
    # Charaktere
    "characters",
    # Charakter-Abhängigkeiten
    "character_classes", "character_equipment", "character_fighting_styles",
    "character_inventory", "character_languages",
    "character_nonweapon_proficiencies", "character_shares",
    "character_spells", "character_weapon_proficiencies",
    # Sessions & Chronik
    "sessions", "session_entries", "session_tags",
    "chronicle_npcs", "chronicle_quotes", "chronicle_quote_reactions",
    # Party & Loot
    "party_loot_gold", "party_loot_items", "party_loot_log",
    # Sonstiges
    "xp_history", "notifications", "gm_bookmarks",
]

for table in import_order:
    filepath = f"{backup_dir}/{table}.json"
    try:
        with open(filepath) as f:
            rows = json.load(f)
    except FileNotFoundError:
        print(f"  SKIP {table} (Datei nicht gefunden)")
        continue

    if not rows:
        print(f"  SKIP {table} (leer)")
        continue

    # In Batches von 500 einfügen (Supabase-Limit)
    batch_size = 500
    inserted = 0
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        data = json.dumps(batch, ensure_ascii=False).encode("utf-8")
        headers = {
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }
        req = urllib.request.Request(f"{base}/{table}", data=data, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req) as resp:
                inserted += len(batch)
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            print(f"  FEHLER {table} (batch {i}): {e.code} — {body[:200]}")
            break

    print(f"  {table}: {inserted} Einträge importiert")

print("\nDaten-Import abgeschlossen.")
PYEOF
```

> **Hinweis:** Der Header `Prefer: resolution=merge-duplicates` sorgt dafür, dass bestehende Zeilen
> per Upsert aktualisiert werden statt zu Duplikat-Fehlern zu führen.

#### 3. Storage wiederherstellen

```bash
python3 << 'PYEOF'
import json, urllib.request, os, pathlib, sys

service_key = os.popen("grep '^SUPABASE_SERVICE_ROLE_KEY=' .env.local | head -1 | cut -d= -f2").read().strip()
base_url = os.popen("grep '^NEXT_PUBLIC_SUPABASE_URL=' .env.local | head -1 | cut -d= -f2").read().strip()
base = f"{base_url}/storage/v1"

backup_dir = sys.argv[1] if len(sys.argv) > 1 else "backup-2026-04-07"
storage_dir = pathlib.Path(f"{backup_dir}/storage")

headers_base = {"apikey": service_key, "Authorization": f"Bearer {service_key}"}

total = 0
for bucket_dir in sorted(storage_dir.iterdir()):
    if not bucket_dir.is_dir():
        continue
    bucket = bucket_dir.name
    print(f"Bucket: {bucket}")

    for file_path in sorted(bucket_dir.rglob("*")):
        if not file_path.is_file():
            continue

        # Relativer Pfad innerhalb des Buckets
        rel_path = file_path.relative_to(bucket_dir)
        object_path = str(rel_path)

        with open(file_path, "rb") as f:
            data = f.read()

        # Content-Type anhand der Endung
        ext = file_path.suffix.lower()
        content_types = {
            ".webp": "image/webp", ".png": "image/png",
            ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
            ".gif": "image/gif", ".svg": "image/svg+xml",
            ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".webm": "audio/webm",
        }
        content_type = content_types.get(ext, "application/octet-stream")

        headers = {
            **headers_base,
            "Content-Type": content_type,
            "x-upsert": "true"
        }

        url = f"{base}/object/{bucket}/{object_path}"
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req) as resp:
                resp.read()
            total += 1
        except urllib.error.HTTPError as e:
            print(f"  FEHLER: {object_path} — {e.code}")

print(f"\nStorage-Import abgeschlossen: {total} Dateien")
PYEOF
```

### Szenario B: Restore in ein neues Supabase-Projekt

1. **Neues Projekt erstellen** auf [supabase.com](https://supabase.com)
2. **`.env.local` aktualisieren** mit der neuen URL und den neuen Keys
3. **Supabase CLI verknüpfen:**
   ```bash
   supabase link --project-ref <neue-project-ref>
   ```
4. **Schema anwenden:**
   ```bash
   supabase db push
   ```
5. **Storage-Buckets anlegen** (im Supabase Dashboard oder per SQL):
   ```sql
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('avatars', 'avatars', true),
          ('npc-avatars', 'npc-avatars', true),
          ('monster-images', 'monster-images', true);
   ```
6. **Daten + Storage importieren** wie in Szenario A (Schritt 2 + 3)
7. **Vercel-Umgebungsvariablen** auf die neuen Werte aktualisieren

---

## Backup-Ordnerstruktur

```
backup-YYYY-MM-DD/
  armor.json
  character_classes.json
  character_equipment.json
  character_fighting_styles.json
  character_inventory.json
  character_languages.json
  character_nonweapon_proficiencies.json
  character_shares.json
  character_spells.json
  character_weapon_proficiencies.json
  characters.json
  chronicle_npcs.json
  chronicle_quote_reactions.json
  chronicle_quotes.json
  classes.json
  epic_items.json
  general_items.json
  monsters.json
  nonweapon_proficiencies.json
  notifications.json
  party_loot_gold.json
  party_loot_items.json
  party_loot_log.json
  profiles.json
  race_class_restrictions.json
  races.json
  rulebook_chunks.json
  session_entries.json
  session_tags.json
  sessions.json
  spells.json
  tags.json
  weapons.json
  xp_history.json
  gm_bookmarks.json
  storage/
    avatars/           # Charakter-Avatare (WebP, nach User-UUID gruppiert)
    npc-avatars/       # NPC-Avatare
    monster-images/    # Monster-Bilder
```

## Hinweise

- **Code-Backup** ist nicht Teil dieser Anleitung — der Code ist vollständig in Git versioniert.
- **Schema-Backup** wird durch die SQL-Migrationen in `supabase/migrations/` abgedeckt.
- **RLS-Policies** werden ebenfalls durch die Migrationen erstellt — kein separater Export nötig.
- **Regelmäßige Backups:** Supabase Free-Tier erstellt automatisch tägliche Backups mit 7 Tagen Retention. Diese Anleitung ist für zusätzliche lokale Sicherungen.
- Backup-Ordner sind in `.gitignore` eingetragen und werden nicht committed.
