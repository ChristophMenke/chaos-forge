---
date: "2026-04-06T08:51:09.189894+00:00"
git_commit: fe9add3848dc0ea37479cfc5add0f77ec05bbb4e
branch: feature/magic-items-extended
topic: "Dualclass-Implementierung — aktueller Stand"
tags: [research, dualclass, rules-engine, multiclass]
status: complete
---

# Research: Dualclass-Implementierung — aktueller Stand

## Research Question

Was existiert bereits für CLASS-012 (Dualclass Benefits) und CLASS-013 (Dualclass Restrictions)? Was fehlt, um beide Regeln als "implemented" markieren zu können?

## Summary

**Die Dualclass-Logik ist vollständig implementiert und getestet.** Der Spec-Status in `character-creation-rules.ts` ist veraltet — die Notes sagen "keine Logik implementiert", aber tatsächlich existieren 5 Funktionen mit 12 Tests.

## Detailed Findings

### 1. Implementierte Funktionen (multiclass.ts:130-225)

| Funktion                                                     | Zeile | PHB-Regel                                     | Tests   |
| ------------------------------------------------------------ | ----- | --------------------------------------------- | ------- |
| `meetsDualclassRequirements(origClass, newClass, abilities)` | 143   | 17+ in alte Prime Reqs, 15+ in neue           | 5 Tests |
| `isDualclassDormant(dualclass, newClassLevel)`               | 179   | Dormant bis newLevel > switchLevel            | 3 Tests |
| `getDualclassThac0(dualclass, newClassLevel)`                | 187   | Nur new wenn dormant, best of both wenn aktiv | 2 Tests |
| `getDualclassSaves(dualclass, newClassLevel)`                | 205   | Nur new wenn dormant, best of both wenn aktiv | 2 Tests |
| `DualclassRequirementResult` Interface                       | 134   | allowed + failures[]                          | —       |

### 2. DualclassInfo Interface (types.ts:213-217)

```typescript
export interface DualclassInfo {
  originalClass: ClassId;
  newClass: ClassId;
  switchLevel: number;
}
```

### 3. DB-Schema

- `character_classes.switch_level: number | null` existiert (types.ts:369)
- Erlaubt die Speicherung des Dual-Class-Wechsel-Levels pro Klasse

### 4. Spec-Status (veraltet)

- CLASS-012: `status: "partial"`, Notes: "DualclassInfo Interface definiert, aber keine Logik implementiert"
- CLASS-013: `status: "partial"`, Notes: "Keine Implementierung vorhanden, nur Typ-Definition"
- **Beide Notes sind falsch** — die Logik existiert seit dem Multiclass-Update

### 5. Was existiert vs. was die Spec fordert

**CLASS-012 (Dualclass Benefits):**

- Spec: "Voraussetzungen, Original-Klasse muss ≥15 in Prime Req der neuen Klasse"
- ✅ `meetsDualclassRequirements()` prüft exakt das
- Spec-Scenario: "Fighter→Mage braucht STR 15+ und INT 17+"
- ✅ Test deckt genau dieses Szenario ab (multiclass.test.ts:286-295)

**CLASS-013 (Dualclass Restrictions):**

- Spec: "keine Fähigkeiten der alten Klasse während Transition"
- ✅ `isDualclassDormant()` prüft ob dormant
- ✅ `getDualclassThac0()` und `getDualclassSaves()` benutzen nur new-Class wenn dormant
- Spec-Scenario: "XP wird nur für neue Klasse gezählt"
- ✅ Abgebildet durch `character_classes` mit separaten Level/XP-Einträgen
- Spec-Scenario: "Wenn neue Klasse höheres Level erreicht: alte Fähigkeiten kommen zurück"
- ✅ `isDualclassDormant()` gibt false zurück wenn newLevel > switchLevel

## Aktion erforderlich

1. CLASS-012: Status → `"implemented"`, implementationFiles/Functions/testFiles aktualisieren
2. CLASS-013: Status → `"implemented"`, implementationFiles/Functions/testFiles aktualisieren
3. Notes entfernen (veraltet)
