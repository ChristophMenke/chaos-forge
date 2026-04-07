---
date: "2026-04-07T12:21:01.524811+00:00"
git_commit: c5ddee70249698f27ae73e71e376a2e3ec31c157
branch: feature/performance-optimization
topic: "Gemini-generierte Bilder für Chaos Forge"
tags: [plan, images, gemini, ui, wizard, spellbook, login, sessions]
status: complete
---

# Gemini-generierte Bilder für Chaos Forge — Implementierungsplan

## Overview

Die Chaos Forge App nutzt aktuell kein einziges illustratives Bild — die gesamte Dark Fantasy Atmosphäre entsteht rein über CSS. Durch gezielten Einsatz von Gemini-generierten Bildern sollen 5 Bereiche visuell aufgewertet werden: Rassen- und Klassen-Illustrationen im Wizard, Magieschule- & Sphären-Icons im Spellbook, ein Login-Hintergrund und On-Demand Session-Stimmungsbilder.

## Current State Analysis

- **Kein illustratives Bildmaterial** in der App — nur Avatare (User-Upload), Logos, Lucide-Icons
- **`@google/genai` v1.48.0** bereits in `package.json`, aber nirgends verwendet
- **`GOOGLE_API_KEY`** jetzt in `.env.local` konfiguriert
- **Supabase Storage** Bucket "monster-images" existiert (Monster-Bilder bereits vorhanden → out of scope)
- **Wizard Cards** (`step-race.tsx`, `step-class.tsx`) zeigen reine Text-Cards ohne Bilder
- **SpellCard** (`spell-card.tsx`) zeigt School/Sphere als Text-Badge, kein Icon
- **Login** (`login/page.tsx`) zeigt Glass-Card auf dunklem CSS-Hintergrund
- **Sessions** (`SessionRow`) hat kein `image_url` Feld → Migration nötig

### Key Discoveries:

- 9 Rassen-IDs: `human`, `elf`, `half_elf`, `dwarf`, `gnome`, `halfling`, `half_orc`, `kobold`, `tiefling`
- 12 Klassen-Bilder nötig: `fighter`, `ranger`, `paladin`, `mage` (für alle Spezialisten), `cleric`, `crusader`, `druid`, `monk`, `shaman`, `thief`, `bard` + 1x generischer "wizard" als Mage-Bild
- 8 Magieschulen: abjuration, alteration, conjuration, divination, enchantment, illusion, invocation, necromancy
- 32 Priestersphären (types.ts:90-120)
- Monster-Bilder existieren bereits → **kein Handlungsbedarf**

## Desired End State

1. **Character Wizard** zeigt bei Rassen- und Klassen-Auswahl jeweils ein atmosphärisches Dark Fantasy Porträt auf jeder Card
2. **Spellbook** zeigt neben dem School/Sphere-Badge ein kleines farbiges Icon (8 Schulen + 32 Sphären)
3. **Login-Seite** hat ein großes, dezentes Hintergrund-Bild (Dark Fantasy Atmosphäre)
4. **Session-Detail** bietet einen "Stimmungsbild generieren"-Button, der aus Titel+Zusammenfassung ein Header-Banner erzeugt

### UI Mockups

#### Wizard Race Card (Vorher → Nachher)

```
VORHER:                              NACHHER:
┌──────────────────────┐             ┌──────────────────────────────┐
│ Zwerg          ✓     │             │ ┌────────┐                   │
│                      │             │ │ ▓▓▓▓▓▓ │ Zwerg          ✓ │
│ CON +1  CHA -1       │             │ │ ▓BILD▓ │                   │
│ Infravision: 18 m    │             │ │ ▓▓▓▓▓▓ │ CON +1  CHA -1   │
│ Zwergennase          │             │ └────────┘ Infravision: 18 m │
│ Resistenz gegen Gift │             │   Zwergennase                │
└──────────────────────┘             │   Resistenz gegen Gift       │
                                     └──────────────────────────────┘
```

#### Spell Card (Vorher → Nachher)

```
VORHER:
★ Fireball                    L3   evocation   PHB   V,S,M

NACHHER:
★ 🔥 Fireball                L3   evocation   PHB   V,S,M
  ^-- kleines Schul-Icon (24x24)
```

#### Login-Seite (Nachher)

```
┌─────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░ Atmosphärisches Hintergrundbild ░░░░░ │
│ ░░░░ (Taverne/Dungeon, 10% Opacity)  ░░░░░ │
│ ░░░░░┌──────────────────────┐░░░░░░░░░░░░░ │
│ ░░░░░│  glass glow-neutral  │░░░░░░░░░░░░░ │
│ ░░░░░│  Chaos Forge Login   │░░░░░░░░░░░░░ │
│ ░░░░░│  [email@...]         │░░░░░░░░░░░░░ │
│ ░░░░░│  [Anmelden]          │░░░░░░░░░░░░░ │
│ ░░░░░└──────────────────────┘░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────────────────┘
```

#### Session Detail mit Stimmungsbild (Nachher)

```
┌────────────────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ ▓▓▓ Generiertes Stimmungsbild (800x300) ▓▓▓▓ │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│                                                │
│ Die Belagerung von Karak Azgal    [✏️] [🗑️]   │
│ 07.04.2026                                     │
│ Tags: [Karak Azgal] [Orks] [Belagerung]       │
│                                                │
│ Zusammenfassung...                              │
│                                                │
│ [🖼️ Stimmungsbild generieren]  ← Button        │
└────────────────────────────────────────────────┘
```

## What We're NOT Doing

- **Monster-Bilder** — existieren bereits, out of scope
- **Epische Ausrüstungs-Bilder** — nicht im Scope dieses Plans
- **Avatar-Generierung** — Spieler laden eigene Avatare hoch
- **Play Mode Bilder** — Performance-kritisch, keine Bilder
- **Party-Inventar / GM Combat Tracker** — funktionale UIs, keine Bilder
- **Print Sheet** — PHB-Stil beibehalten
- **Priestersphären** einzeln im Spellbook-Header — nur Icons in Collapsed Row

## Implementation Approach

1. **Gemini-Client** als zentrale Utility aufsetzen (`src/lib/gemini/`)
2. **Statische Bilder** (Rassen, Klassen, Schulen, Sphären, Login) via Generierungs-Skript erzeugen und in `public/images/` committen
3. **On-Demand-Bilder** (Session-Stimmungsbilder) via API-Route generieren und in Supabase Storage speichern
4. Einheitlicher **Style-Prompt** für visuellen Zusammenhalt

## Architecture and Code Reuse

### Gemini Client

```
src/lib/gemini/
  client.ts          — GoogleGenAI Instanz, gemeinsamer Client
  generate-image.ts  — generateImage(prompt, options) → Buffer
  prompts.ts         — Style-Konstanten, Prompt-Templates pro Bildtyp
```

### Generierungs-Skripte (einmalig)

```
scripts/
  generate-race-images.ts      — 9 Rassen-Bilder → public/images/races/
  generate-class-images.ts     — 12 Klassen-Bilder → public/images/classes/
  generate-school-icons.ts     — 8 Schulen-Icons → public/images/schools/
  generate-sphere-icons.ts     — 32 Sphären-Icons → public/images/spheres/
  generate-login-background.ts — 1 Login-Bild → public/images/
```

### Geänderte Dateien

```
src/
  lib/gemini/client.ts              — NEU: Gemini Client
  lib/gemini/generate-image.ts      — NEU: Bildgenerierungs-Utility
  lib/gemini/prompts.ts             — NEU: Style-Prompts
  components/wizard/step-race.tsx   — ÄNDERUNG: Rassen-Bild in Card
  components/wizard/step-class.tsx  — ÄNDERUNG: Klassen-Bild in Card
  components/spellbook/spell-card.tsx — ÄNDERUNG: School/Sphere Icon
  components/spellbook/school-icon.tsx — NEU: Icon-Mapping-Komponente
  app/login/page.tsx                — ÄNDERUNG: Hintergrundbild
  app/api/generate-session-image/route.ts — NEU: API-Route
  components/session/session-detail.tsx — ÄNDERUNG: Stimmungsbild + Button
  lib/supabase/types.ts             — ÄNDERUNG: image_url in SessionRow
public/
  images/races/*.webp               — NEU: 9 Rassen-Bilder
  images/classes/*.webp             — NEU: 12 Klassen-Bilder
  images/schools/*.webp             — NEU: 8 Schulen-Icons
  images/spheres/*.webp             — NEU: 32 Sphären-Icons
  images/login-bg.webp              — NEU: Login-Hintergrund
supabase/
  migrations/XXXXX_session_image.sql — NEU: image_url auf sessions
```

### Third-Party Libraries

- **`@google/genai`** (bereits installiert, v1.48.0) — Google Generative AI SDK
- **`sharp`** (bereits installiert) — Bildverarbeitung/Resize der generierten Bilder zu WebP

---

## Phase 1: Gemini-Infrastruktur

### Overview

Gemini Client, Bildgenerierungs-Utility und Style-Prompts aufsetzen. Kein sichtbares Feature, aber Grundlage für alle folgenden Phasen.

### Changes Required:

#### [x] 1. Gemini Client

**File**: `src/lib/gemini/client.ts` (NEU)
**Changes**: Singleton GoogleGenAI Instanz

```typescript
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) throw new Error("GOOGLE_API_KEY not set");

export const genai = new GoogleGenAI({ apiKey });
```

#### [x] 2. Bildgenerierungs-Utility

**File**: `src/lib/gemini/generate-image.ts` (NEU)
**Changes**: Wrapper-Funktion für Bildgenerierung

```typescript
import { genai } from "./client";
import sharp from "sharp";

export interface GenerateImageOptions {
  width: number;
  height: number;
  quality?: number; // WebP quality, default 85
}

export async function generateImage(
  prompt: string,
  options: GenerateImageOptions
): Promise<Buffer> {
  const response = await genai.models.generateImages({
    model: "imagen-3.0-generate-002",
    prompt,
    config: { numberOfImages: 1 },
  });

  const base64 = response.generatedImages?.[0]?.image?.imageBytes;
  if (!base64) throw new Error("No image generated");

  const buffer = Buffer.from(base64, "base64");

  // Resize + convert to WebP
  return sharp(buffer)
    .resize(options.width, options.height, { fit: "cover" })
    .webp({ quality: options.quality ?? 85 })
    .toBuffer();
}
```

#### [x] 3. Style-Prompts

**File**: `src/lib/gemini/prompts.ts` (NEU)
**Changes**: Zentrale Style-Konstanten und Prompt-Templates

```typescript
export const STYLE_BASE =
  "Dark fantasy illustration, muted earth tones with jewel accents, " +
  "painterly digital art style, medieval fantasy setting, " +
  "no modern elements, dark moody atmospheric lighting, " +
  "detailed but not photorealistic";

export const STYLE_PORTRAIT = `${STYLE_BASE}, portrait composition, dramatic lighting from above`;
export const STYLE_ICON = `${STYLE_BASE}, iconic symbol, centered, simple background, glowing magical effect`;
export const STYLE_LANDSCAPE = `${STYLE_BASE}, wide landscape composition, atmospheric perspective, cinematic`;

export function racePrompt(raceNameEn: string): string {
  const descriptions: Record<string, string> = {
    human: "a seasoned human adventurer, weathered face, leather armor, torch in hand",
    elf: "an elegant high elf, pointed ears, flowing robes, ethereal glow, ancient wisdom",
    half_elf: "a half-elf ranger, blend of human ruggedness and elven grace, forest background",
    dwarf: "a stout dwarf warrior, braided beard, heavy plate armor, warhammer, mine entrance",
    gnome: "a clever gnome tinker, wild hair, goggles on forehead, gadgets and tools",
    halfling: "a cheerful halfling rogue, curly hair, bare feet, dagger and lockpicks, tavern",
    half_orc: "a fierce half-orc barbarian, tusks, scarred face, massive greataxe, tribal tattoos",
    kobold: "a scrappy kobold scout, reptilian features, oversized cloak, cunning eyes, cave",
    tiefling: "a mysterious tiefling warlock, small horns, tail, glowing eyes, arcane symbols",
  };
  return `${STYLE_PORTRAIT}. Portrait of ${descriptions[raceNameEn] ?? raceNameEn}`;
}

export function classPrompt(classId: string): string {
  const descriptions: Record<string, string> = {
    fighter: "a battle-hardened fighter in full plate armor, sword and shield, battlefield",
    ranger: "a wilderness ranger with longbow, hooded cloak, forest, animal companion",
    paladin: "a holy paladin in gleaming armor, radiant aura, holy symbol, divine light",
    mage: "a powerful wizard casting a spell, arcane energy swirling, spellbook, robes, staff",
    cleric: "a devout cleric in chainmail, holy symbol glowing, healing light, temple",
    crusader: "a zealous crusader in heavy armor, flaming sword, righteous fury, battlefield",
    druid: "a nature druid with staff, leaves in hair, shapeshifting aura, sacred grove",
    monk: "a disciplined monk in simple robes, martial arts stance, monastery, inner peace",
    shaman: "a tribal shaman with spirit mask, bone fetishes, ghostly spirits, ritual fire",
    thief: "a shadow thief in dark leather, daggers, lockpicks, moonlit rooftop, city skyline",
    bard: "a charismatic bard with lute, colorful cloak, tavern stage, captivated audience",
  };
  return `${STYLE_PORTRAIT}. Portrait of ${descriptions[classId] ?? classId}`;
}

export function schoolPrompt(school: string): string {
  const descriptions: Record<string, string> = {
    abjuration: "a glowing protective magical shield ward, blue energy barrier",
    alteration: "swirling transformation magic, object morphing into another form",
    conjuration: "a glowing summoning circle with portal energy, creature emerging",
    divination: "a crystal ball with swirling mist, all-seeing eye, prophetic visions",
    enchantment: "hypnotic swirling magical charm energy, glowing runes, mind magic",
    illusion: "a shimmering mirage, reality bending, phantom images overlapping",
    invocation: "explosive elemental energy burst, fire and lightning, raw arcane power",
    necromancy: "a skull with green ghostly energy, death magic, spectral hands rising",
  };
  return `${STYLE_ICON}. Magical icon representing ${descriptions[school] ?? school}`;
}

export function spherePrompt(sphere: string): string {
  const descriptions: Record<string, string> = {
    all: "a radiant divine light, universal holy symbol",
    animal: "a majestic wolf silhouette with divine glow",
    astral: "swirling astral plane portal with stars",
    charm: "a glowing heart-shaped divine rune",
    combat: "a holy flaming sword and shield",
    creation: "divine hands shaping matter from light",
    divination: "a divine eye surrounded by holy light",
    elemental: "four elements swirling together",
    "elemental air": "swirling wind vortex with divine light",
    "elemental earth": "glowing crystal emerging from stone",
    "elemental fire": "sacred divine flame",
    "elemental water": "holy water wave with divine glow",
    "elemental magma": "molten divine lava flow",
    guardian: "a divine shield with holy runes of protection",
    healing: "gentle golden healing light, hands",
    necromantic: "a holy ankh with spectral energy, life and death",
    plant: "a sacred tree with glowing leaves",
    protection: "a divine barrier of light",
    summoning: "a holy summoning circle, divine creature",
    sun: "a radiant sun disc with holy rays",
    weather: "divine storm clouds with holy lightning",
    chaos: "swirling chaotic divine energy",
    cosmos: "celestial stars and divine galaxy",
    law: "perfectly ordered divine runes, balance scales",
    learning: "a divine tome with glowing pages",
    numbers: "sacred geometric patterns with divine light",
    thought: "a glowing divine brain or mind symbol",
    time: "a divine hourglass with golden sand",
    travelers: "a divine compass rose with holy light",
    war: "divine crossed weapons with holy fire",
    wards: "layered divine protection glyphs",
    special: "a unique divine symbol with arcane sparkles",
  };
  return `${STYLE_ICON}. Small divine icon: ${descriptions[sphere] ?? sphere}`;
}

export function sessionPrompt(title: string, summary: string): string {
  const excerpt = summary.slice(0, 500);
  return `${STYLE_LANDSCAPE}. A scene depicting: "${title}". Context: ${excerpt}. Wide cinematic banner image, no text or letters in the image.`;
}
```

### Success Criteria:

#### Automated Verification:

- [x] TypeScript kompiliert: `npx tsc --noEmit`
- [x] Lint: `npm run lint`
- [x] `src/lib/gemini/` Dateien existieren

---

## Phase 2: Rassen-Illustrationen (9 Bilder)

### Overview

Generierungs-Skript für 9 Rassen-Porträts ausführen, Bilder in `public/images/races/` ablegen, `step-race.tsx` um Bilder erweitern.

### Changes Required:

#### [x] 1. Generierungs-Skript

**File**: `scripts/generate-race-images.ts` (NEU)
**Changes**: Skript das alle 9 Rassen-Bilder generiert

```typescript
// Iteriert über alle 9 Rassen-IDs
// Ruft generateImage() mit racePrompt() auf
// Speichert als public/images/races/{raceId}.webp (400x520px)
```

#### [x] 2. Skript ausführen

Skript via `npx tsx scripts/generate-race-images.ts` ausführen. 9 WebP-Dateien landen in `public/images/races/`.

#### [x] 3. Wizard Step Race anpassen

**File**: `src/components/wizard/step-race.tsx`
**Changes**: Bild links in jeder Race Card anzeigen

```
Aktuell (Zeile 36-78): Card mit CardHeader + CardContent (Name, Badges, Abilities)
Nachher: Card bekommt ein Image links (ähnlich character-card.tsx Avatar-Breakout)
```

Layout-Änderung in der Card:

```tsx
<Card ...>
  <div className="flex gap-3">
    {/* Race illustration */}
    <div className="relative h-[120px] w-[90px] shrink-0 overflow-hidden rounded-l-xl">
      <Image
        src={`/images/races/${race.id}.webp`}
        alt={localized(race.name, race.name_en, locale)}
        width={90}
        height={120}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 shadow-[inset_-12px_0_20px_-8px_rgba(0,0,0,0.4)]" />
    </div>
    {/* Existing content */}
    <div className="flex-1 py-2 pr-3">
      <CardHeader>...</CardHeader>
      <CardContent>...</CardContent>
    </div>
  </div>
</Card>
```

### Success Criteria:

#### Automated Verification:

- [x] 9 Bilder existieren in `public/images/races/` (human.webp, elf.webp, etc.)
- [x] TypeScript kompiliert: `npx tsc --noEmit`
- [x] Lint: `npm run lint`
- [x] Unit-Tests: `npm test`

#### Manual Verification:

- [x] Character Wizard → Race Step: Alle 9 Rassen zeigen ihr Bild
- [x] Bilder passen visuell zum Dark Fantasy Stil
- [x] Mobile: Cards sind nicht zu breit, Bilder skalieren korrekt
- [x] Selected-State: Bild bleibt sichtbar bei Auswahl (border-primary Ring)

---

## Phase 3: Klassen-Illustrationen (12 Bilder)

### Overview

Generierungs-Skript für 12 Klassen-Porträts (Spezialisten nutzen "mage"-Bild), in Wizard einbinden.

### Changes Required:

#### [x] 1. Generierungs-Skript

**File**: `scripts/generate-class-images.ts` (NEU)
**Changes**: 12 Klassen-Bilder generieren (fighter, ranger, paladin, mage, cleric, crusader, druid, monk, shaman, thief, bard). Alle 8 Specialist Wizards (abjurer, conjurer, diviner, enchanter, illusionist, invoker, necromancer, transmuter) nutzen das `mage.webp`.

#### [x] 2. Skript ausführen

12 WebP-Dateien in `public/images/classes/`.

#### [x] 3. Class-Image-Mapping

**File**: `src/components/wizard/step-class.tsx`
**Changes**: Image-Mapping + Bild in Card

```typescript
// Specialist Wizards → mage.webp
const CLASS_IMAGE_MAP: Record<string, string> = {
  abjurer: "mage",
  conjurer: "mage",
  diviner: "mage",
  enchanter: "mage",
  illusionist: "mage",
  invoker: "mage",
  necromancer: "mage",
  transmuter: "mage",
};
function classImage(classId: string): string {
  return `/images/classes/${CLASS_IMAGE_MAP[classId] ?? classId}.webp`;
}
```

Layout analog zu Race Cards: Bild links, Content rechts.

### Success Criteria:

#### Automated Verification:

- [x] 12 Bilder in `public/images/classes/` (fighter.webp, mage.webp, etc.)
- [x] TypeScript kompiliert
- [x] Lint + Tests bestehen

#### Manual Verification:

- [x] Wizard → Class Step: Alle 19 Klassen zeigen ein Bild (Spezialisten das Mage-Bild)
- [x] Multiclass-Auswahl: Bilder bleiben stabil bei Mehrfachauswahl
- [x] Mobile: Responsive Layout korrekt

---

## Phase 4: Magieschule- & Sphären-Icons (40 Icons)

### Overview

8 Schulen-Icons + 32 Sphären-Icons generieren. Neue `SchoolSphereIcon`-Komponente. Im SpellCard Collapsed-Row als kleines Icon neben dem Namen anzeigen.

### Changes Required:

#### [x] 1. Generierungs-Skripte

**File**: `scripts/generate-school-icons.ts` (NEU) — 8 Icons à 96×96px
**File**: `scripts/generate-sphere-icons.ts` (NEU) — 32 Icons à 96×96px

#### [x] 2. Skripte ausführen

8 + 32 WebP-Dateien in `public/images/schools/` und `public/images/spheres/`.

#### [x] 3. Icon-Komponente

**File**: `src/components/spellbook/school-sphere-icon.tsx` (NEU)
**Changes**: Mapping von school/sphere auf Bildpfad

```tsx
import Image from "next/image";

interface SchoolSphereIconProps {
  school?: string | null;
  sphere?: string | null;
  size?: number; // default 20
  className?: string;
}

export function SchoolSphereIcon({ school, sphere, size = 20, className }: SchoolSphereIconProps) {
  const key = school ?? sphere;
  if (!key) return null;

  const folder = school ? "schools" : "spheres";
  // Normalize: "elemental air" → "elemental-air"
  const filename = key.replace(/\s+/g, "-");

  return (
    <Image
      src={`/images/${folder}/${filename}.webp`}
      alt={key}
      width={size}
      height={size}
      className={`inline-block rounded-sm ${className ?? ""}`}
    />
  );
}
```

#### [x] 4. SpellCard Integration

**File**: `src/components/spellbook/spell-card.tsx`
**Changes**: Icon in der Collapsed-Row einfügen, zwischen Prepared-Star und Spell-Name

```tsx
// Zeile 52-56, nach dem prepared ★ und vor dem spell name
<SchoolSphereIcon school={spell.school} sphere={spell.sphere} size={20} className="shrink-0" />
```

### Success Criteria:

#### Automated Verification:

- [x] 8 Dateien in `public/images/schools/`
- [x] 32 Dateien in `public/images/spheres/`
- [x] TypeScript kompiliert
- [x] Lint + Tests bestehen

#### Manual Verification:

- [ ] Spellbook: Jeder Zauber zeigt ein kleines Icon links vom Namen
- [ ] Icons sind visuell unterscheidbar und passen zum Dark Fantasy Stil
- [ ] Mobile: Icons überladen die kompakte Darstellung nicht
- [ ] Play Mode Spellbook: Icons werden dort ebenfalls korrekt angezeigt

---

## Phase 5: Login-Hintergrund

### Overview

Ein atmosphärisches Dark Fantasy Bild generieren und als dezenten Hintergrund auf der Login-Seite einbinden.

### Changes Required:

#### [x] 1. Generierungs-Skript

**File**: `scripts/generate-login-background.ts` (NEU)
**Changes**: 1 Bild (1920×1080px) generieren

```typescript
// Prompt: "Dark medieval tavern interior, warm firelight, wooden beams,
// mysterious shadows, adventurers' gear on walls, no people visible,
// atmospheric and inviting, wide angle"
// → public/images/login-bg.webp
```

#### [x] 2. Login-Seite anpassen

**File**: `src/app/login/page.tsx`
**Changes**: Hintergrundbild mit starker Abdunkelung hinter der Glass-Card

```tsx
// Wrapper-div bekommt Hintergrundbild:
<div className="relative flex flex-1 items-center justify-center px-6">
  {/* Background image */}
  <Image src="/images/login-bg.webp" alt="" fill className="object-cover opacity-[0.12]" priority />
  {/* Existing glass card — z-10 for stacking */}
  <div className="glass glow-neutral relative z-10 ...">...</div>
</div>
```

### Success Criteria:

#### Automated Verification:

- [x] `public/images/login-bg.webp` existiert
- [x] TypeScript kompiliert
- [x] Lint bestehen

#### Manual Verification:

- [x] Login-Seite zeigt dezentes Hintergrundbild (nicht ablenkend)
- [x] Glass-Card Glassmorphism-Effekt bleibt lesbar und klar
- [x] Mobile: Bild skaliert korrekt, kein Layout-Bruch

---

## Phase 6: Session-Stimmungsbilder (On-Demand)

### Overview

DB-Migration für `image_url` auf `sessions`, API-Route zur Bildgenerierung via Gemini, Button in Session-Detail-Ansicht. Generiertes Bild wird in Supabase Storage gespeichert.

### Changes Required:

#### [x] 1. Supabase Storage Bucket

Neuen Bucket `session-images` erstellen (oder vorhandenen nutzen). Check ob ein passender Bucket existiert, sonst via Migration erstellen.

#### [x] 2. DB-Migration

**File**: `supabase/migrations/00188_session_image.sql` (NEU)
**Changes**: `image_url` Spalte + `image_generated_at` Timestamp auf `sessions`

```sql
alter table public.sessions add column image_url text;
alter table public.sessions add column image_generated_at timestamptz;
```

`image_generated_at` speichert den Zeitpunkt der letzten Bildgenerierung. Wird mit `updated_at` verglichen: Button ist nur aktiv, wenn `image_generated_at IS NULL` (noch nie generiert) ODER `updated_at > image_generated_at` (Session wurde nach der letzten Generierung bearbeitet).

#### [x] 3. Migration ausführen

`supabase db push` ausführen.

#### [x] 4. TypeScript-Typ aktualisieren

**File**: `src/lib/supabase/types.ts`
**Changes**: `image_url: string | null` und `image_generated_at: string | null` zu `SessionRow` hinzufügen

#### [x] 5. API-Route für Bildgenerierung

**File**: `src/app/api/generate-session-image/route.ts` (NEU)
**Changes**: POST-Endpunkt der Gemini aufruft und Bild in Supabase speichert

```typescript
// 1. Auth prüfen
// 2. Session laden (title + summary)
// 3. generateImage(sessionPrompt(title, summary), { width: 1200, height: 450 })
// 4. Upload nach Supabase Storage "session-images/{sessionId}.webp" (upsert)
// 5. sessions.update({ image_url, image_generated_at: now() })
// 6. Return { imageUrl }
```

#### [x] 6. Session-Detail anpassen

**File**: `src/components/session/session-detail.tsx`
**Changes**: Header-Bild anzeigen + "Stimmungsbild generieren"-Button

```tsx
// Nach dem Titel-Bereich, vor der Zusammenfassung:
{
  session.image_url && (
    <div className="relative mb-4 h-48 w-full overflow-hidden rounded-xl">
      <Image src={session.image_url} alt={session.title} fill className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
    </div>
  );
}

// Button für ALLE authentifizierten User sichtbar (nicht nur Ersteller).
// Disabled wenn: (a) gerade generiert wird, ODER (b) Bild existiert UND
// Session seit der letzten Generierung nicht bearbeitet wurde.
const canRegenerate =
  !session.image_generated_at ||
  new Date(session.updated_at) > new Date(session.image_generated_at);

<Button
  variant="outline"
  size="sm"
  onClick={handleGenerateImage}
  disabled={generatingImage || !canRegenerate}
  data-testid="session-generate-image"
>
  {generatingImage ? <Spinner /> : <ImageIcon />}
  {session.image_url ? t("regenerateMoodImage") : t("generateMoodImage")}
</Button>;
```

#### [x] 7. i18n-Keys

**File**: `messages/de.json` + `messages/en.json`
**Changes**:

- `sessions.generateMoodImage` — "Stimmungsbild generieren" / "Generate mood image"
- `sessions.regenerateMoodImage` — "Stimmungsbild neu generieren" / "Regenerate mood image"

### Success Criteria:

#### Automated Verification:

- [x] Migration erfolgreich: `supabase db push`
- [x] TypeScript kompiliert
- [x] Lint + Tests bestehen

#### Manual Verification:

- [x] Session-Detail: "Stimmungsbild generieren"-Button sichtbar für alle authentifizierten User
- [x] Klick generiert ein Bild (Loading-State sichtbar)
- [x] Generiertes Bild erscheint als Header-Banner
- [x] Bild bleibt nach Reload erhalten (Supabase Storage)
- [x] Nach Generierung: Button disabled (ausgegraut), da Session nicht geändert wurde
- [x] Session bearbeiten (Titel, Zusammenfassung, neuer Eintrag) → Button wird wieder aktiv
- [x] Erneuter Klick nach Änderung ersetzt das bestehende Bild
- [x] Button-Text wechselt: "Stimmungsbild generieren" → "Stimmungsbild neu generieren"

---

## Testing Strategy

### Unit Tests:

- `src/lib/gemini/prompts.test.ts` — Prompt-Funktionen erzeugen valide Strings, kein leerer Output
- `src/components/spellbook/school-sphere-icon.test.tsx` — Icon rendert mit school, sphere, und null
- Class-Image-Mapping: Alle 19 Klassen-IDs liefern einen gültigen Bildpfad

### Integration Tests:

- API-Route `generate-session-image`: Mockt Gemini-Response, prüft Supabase-Upload und DB-Update

### Manual Testing Steps:

1. Character Wizard durchspielen: Bei Race + Class Auswahl prüfen ob alle Bilder laden
2. Spellbook öffnen: Icons neben Zaubernamen sichtbar
3. Login-Seite: Hintergrundbild sichtbar, Glass-Card lesbar
4. Session öffnen → Button klicken → Stimmungsbild erscheint

## Performance Considerations

- **Statische Bilder:** `next/image` optimiert automatisch (Lazy Loading, WebP, Responsive)
- **Login-Hintergrund:** `priority` Flag für Above-the-Fold Bild
- **Session-Bilder:** On-Demand, einmalige Generierung, dann gecacht in Supabase
- **Gesamtes Bildbudget:** ~62 statische Dateien (9+12+8+32+1), je 5-50 KB = ca. 1-3 MB total
- **Gemini API-Calls:** Nur bei Session-Bild-Generierung (On-Demand), nicht bei Page-Loads

## Migration Notes

- `sessions.image_url` ist nullable, keine Datenänderung für bestehende Sessions
- Statische Bilder in `public/` werden via Git committed und von Vercel CDN ausgeliefert
- Supabase Storage Bucket "session-images" muss public sein (wie "monster-images")

## References

- Research: `docs/agents/research/2026-04-07-image-enhancement-analysis.md`
- Monster-Upload Pattern: `src/app/master/actions.ts:580-612`
- Avatar-Breakout Layout: `src/components/character-card.tsx:107-131`
- Google GenAI SDK: `@google/genai` v1.48.0
