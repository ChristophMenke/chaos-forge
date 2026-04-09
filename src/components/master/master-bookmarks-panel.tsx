"use client";

import { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Star, Swords, ShieldIcon, Package, Sparkles, UserRound, Bug } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { localized } from "@/lib/utils/localize";
import { lbsToKg } from "@/lib/utils/units";
import { MagicEffectBadges } from "@/components/shared/magic-effect-badges";
import { BookmarkToggle } from "./bookmark-toggle";
import type {
  GmBookmarkRow,
  WeaponRow,
  ArmorRow,
  GeneralItemRow,
  MagicItemRow,
  ChronicleNpcRow,
  MonsterRow,
  CharacterRow,
  BookmarkEntityType,
} from "@/lib/supabase/types";

interface MasterBookmarksPanelProps {
  bookmarks: GmBookmarkRow[];
  weapons: WeaponRow[];
  armor: ArmorRow[];
  generalItems: GeneralItemRow[];
  magicItems: MagicItemRow[];
  npcs: ChronicleNpcRow[];
  monsters: MonsterRow[];
  characters: CharacterRow[];
  onBookmarkToggle: (entityType: BookmarkEntityType, entityId: string) => void;
  userId: string;
  onAddToCombat: (monster: MonsterRow, count: number) => void;
}

interface ResolvedBookmark {
  entityType: BookmarkEntityType;
  id: string;
  name: string;
  data: WeaponRow | ArmorRow | GeneralItemRow | MagicItemRow | ChronicleNpcRow | MonsterRow;
}

interface BookmarkSection {
  type: BookmarkEntityType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: ResolvedBookmark[];
}

const SECTION_CONFIG: {
  type: BookmarkEntityType;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { type: "monster", labelKey: "bestiaryTab", icon: Bug },
  { type: "npc", labelKey: "npcsTab", icon: UserRound },
  { type: "magic_item", labelKey: "magicItems", icon: Sparkles },
  { type: "weapon", labelKey: "weapons", icon: Swords },
  { type: "armor", labelKey: "armor", icon: ShieldIcon },
  { type: "general_item", labelKey: "items", icon: Package },
];

export function MasterBookmarksPanel({
  bookmarks,
  weapons,
  armor,
  generalItems,
  magicItems,
  npcs,
  monsters,
  onBookmarkToggle,
  userId,
  onAddToCombat,
}: MasterBookmarksPanelProps) {
  const t = useTranslations("master");
  const locale = useLocale();

  // Build lookup maps
  const lookupMaps = useMemo(() => {
    const toMap = <T extends { id: string }>(arr: T[]) => new Map(arr.map((x) => [x.id, x]));
    return {
      weapon: toMap(weapons),
      armor: toMap(armor),
      general_item: toMap(generalItems),
      magic_item: toMap(magicItems),
      npc: toMap(npcs),
      monster: toMap(monsters),
    };
  }, [weapons, armor, generalItems, magicItems, npcs, monsters]);

  // Group bookmarks by type and resolve entity data — no JSX here
  const sections = useMemo<BookmarkSection[]>(() => {
    const grouped: Record<BookmarkEntityType, GmBookmarkRow[]> = {
      monster: [],
      npc: [],
      weapon: [],
      armor: [],
      general_item: [],
      magic_item: [],
    };
    for (const b of bookmarks) {
      grouped[b.entity_type]?.push(b);
    }

    return SECTION_CONFIG.filter((cfg) => grouped[cfg.type].length > 0).map((cfg) => ({
      type: cfg.type,
      label: t(cfg.labelKey),
      icon: cfg.icon,
      items: grouped[cfg.type]
        .map((b) => {
          const entity = lookupMaps[b.entity_type].get(b.entity_id);
          if (!entity) return null;
          const name =
            "name_en" in entity
              ? localized(entity.name, (entity as { name_en: string | null }).name_en, locale)
              : entity.name;
          return { entityType: b.entity_type, id: entity.id, name, data: entity };
        })
        .filter(Boolean) as ResolvedBookmark[],
    }));
  }, [bookmarks, lookupMaps, locale, t]);

  if (bookmarks.length === 0) {
    return (
      <div className="py-16 text-center" data-testid="gm-bookmarks-empty">
        <Star className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">{t("noBookmarks")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="gm-bookmarks-panel">
      {sections.map((section) => {
        const SectionIcon = section.icon;
        return (
          <div key={section.type}>
            <h3 className="mb-2 flex items-center gap-2 font-heading text-sm text-muted-foreground">
              <SectionIcon className="h-4 w-4" />
              {section.label}
              <Badge variant="secondary" className="text-xs">
                {section.items.length}
              </Badge>
            </h3>
            <div className="space-y-2">
              {section.items.map((item) => (
                <GlassCard
                  key={item.id}
                  hover={false}
                  className="p-3"
                  data-testid={`bookmark-card-${section.type}-${item.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-foreground">{item.name}</span>
                      <div className="mt-1">
                        <BookmarkDetail
                          item={item}
                          t={t}
                          locale={locale}
                          onAddToCombat={onAddToCombat}
                        />
                      </div>
                    </div>
                    <BookmarkToggle
                      entityType={section.type}
                      entityId={item.id}
                      isBookmarked={true}
                      userId={userId}
                      onToggle={onBookmarkToggle}
                    />
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BookmarkDetail({
  item,
  t,
  locale,
  onAddToCombat,
}: {
  item: ResolvedBookmark;
  t: ReturnType<typeof useTranslations<"master">>;
  locale: string;
  onAddToCombat: (monster: MonsterRow, count: number) => void;
}) {
  switch (item.entityType) {
    case "monster": {
      const m = item.data as MonsterRow;
      return (
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>AC {m.ac}</span>
            <span>HD {m.hit_dice}</span>
            <span>THAC0 {m.thac0}</span>
            <span>XP {m.xp_value}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => onAddToCombat(m, 1)}
            data-testid={`bookmark-combat-${m.id}`}
          >
            {t("addToCombat")}
          </Button>
        </div>
      );
    }
    case "npc": {
      const n = item.data as ChronicleNpcRow;
      return (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {n.location && <span>{n.location}</span>}
          {n.level != null && <span>Lvl {n.level}</span>}
          <Badge variant="outline" className="text-[10px]">
            {n.tier ?? "normal"}
          </Badge>
        </div>
      );
    }
    case "magic_item": {
      const mi = item.data as MagicItemRow;
      return (
        <div>
          {mi.category && (
            <Badge variant="outline" className="mb-1 text-xs">
              {mi.category}
            </Badge>
          )}
          <MagicEffectBadges effects={mi.magic_effects} id={mi.id} />
        </div>
      );
    }
    case "weapon": {
      const w = item.data as WeaponRow;
      return (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>
            {w.damage_sm}/{w.damage_l}
          </span>
          <span>Spd {w.speed}</span>
          <span>{lbsToKg(w.weight)}</span>
        </div>
      );
    }
    case "armor": {
      const a = item.data as ArmorRow;
      return (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>AC {a.ac}</span>
          <span>{lbsToKg(a.weight)}</span>
        </div>
      );
    }
    case "general_item": {
      const gi = item.data as GeneralItemRow;
      return <span className="text-xs text-muted-foreground">{lbsToKg(gi.weight)}</span>;
    }
  }
}
