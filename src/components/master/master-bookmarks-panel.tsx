"use client";

import { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import {
  Star,
  Swords,
  ShieldIcon,
  Package,
  Sparkles,
  UserRound,
  Bug,
  Shield,
  Heart,
  Crosshair,
  Plus,
} from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { Badge } from "@/components/ui/badge";
import { localized } from "@/lib/utils/localize";
import { lbsToKg } from "@/lib/utils/units";
import { monsterAvatar } from "@/lib/utils/svg-avatar";
import { npcAvatar } from "@/lib/utils/svg-avatar";
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
            <h3 className="mb-3 flex items-center gap-2 font-heading text-sm uppercase tracking-wider text-muted-foreground">
              <SectionIcon className="h-4 w-4" />
              {section.label}
              <Badge variant="secondary" className="text-xs">
                {section.items.length}
              </Badge>
            </h3>
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {section.items.map((item) => (
                <BookmarkCard
                  key={item.id}
                  item={item}
                  sectionType={section.type}
                  userId={userId}
                  onBookmarkToggle={onBookmarkToggle}
                  onAddToCombat={onAddToCombat}
                  t={t}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Bookmark Grid Card ─────────────────────────────────────────────

function BookmarkCard({
  item,
  sectionType,
  userId,
  onBookmarkToggle,
  onAddToCombat,
  t,
  locale,
}: {
  item: ResolvedBookmark;
  sectionType: BookmarkEntityType;
  userId: string;
  onBookmarkToggle: (entityType: BookmarkEntityType, entityId: string) => void;
  onAddToCombat: (monster: MonsterRow, count: number) => void;
  t: ReturnType<typeof useTranslations<"master">>;
  locale: string;
}) {
  return (
    <GlassCard
      className="relative overflow-hidden p-0 transition-all hover:scale-[1.01]"
      data-testid={`bookmark-card-${sectionType}-${item.id}`}
    >
      {/* Top-right actions */}
      <div className="absolute right-1.5 top-1.5 z-10 flex gap-1">
        <div className="rounded-full bg-black/60 hover:bg-black/80">
          <BookmarkToggle
            entityType={sectionType}
            entityId={item.id}
            isBookmarked={true}
            userId={userId}
            onToggle={onBookmarkToggle}
          />
        </div>
        {sectionType === "monster" && (
          <button
            onClick={() => onAddToCombat(item.data as MonsterRow, 1)}
            className="rounded-full bg-black/60 p-1.5 text-primary hover:bg-black/80"
            title={t("addToCombat")}
            data-testid={`bookmark-combat-${item.id}`}
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Image / Avatar area */}
      <div className="relative aspect-square w-full bg-black/40">
        <CardImage item={item} locale={locale} />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent" />
        <div className="absolute bottom-1.5 left-2 right-2">
          <h4 className="font-heading text-sm font-semibold leading-tight text-foreground drop-shadow-lg">
            {item.name}
          </h4>
        </div>
      </div>

      {/* Stats area */}
      <div className="p-2">
        <CardStats item={item} t={t} locale={locale} />
      </div>
    </GlassCard>
  );
}

// ─── Card Image (type-specific) ─────────────────────────────────────

function CardImage({ item, locale: _locale }: { item: ResolvedBookmark; locale: string }) {
  switch (item.entityType) {
    case "monster": {
      const m = item.data as MonsterRow;
      if (m.image_url) {
        return (
          <Image
            src={m.image_url}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
            className="object-cover"
          />
        );
      }
      return (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={monsterAvatar(item.name, m.size)}
          alt={item.name}
          className="h-full w-full object-contain"
        />
      );
    }
    case "npc": {
      const n = item.data as ChronicleNpcRow;
      if (n.avatar_url) {
        return (
          <Image
            src={n.avatar_url}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
            className="object-cover"
          />
        );
      }
      return (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={npcAvatar(item.name, (n.tier as "normal" | "advanced" | "character") ?? "normal")}
          alt={item.name}
          className="h-full w-full object-contain"
        />
      );
    }
    default: {
      // Items use a centered icon
      const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
        magic_item: Sparkles,
        weapon: Swords,
        armor: ShieldIcon,
        general_item: Package,
      };
      const Icon = IconMap[item.entityType] ?? Package;
      return (
        <div className="flex h-full w-full items-center justify-center">
          <Icon className="h-16 w-16 text-muted-foreground/20" />
        </div>
      );
    }
  }
}

// ─── Card Stats (type-specific) ─────────────────────────────────────

function CardStats({
  item,
  t,
}: {
  item: ResolvedBookmark;
  t: ReturnType<typeof useTranslations<"master">>;
  locale: string;
}) {
  switch (item.entityType) {
    case "monster": {
      const m = item.data as MonsterRow;
      return (
        <>
          <div className="flex justify-between gap-1 text-center text-[10px]">
            <div>
              <div className="flex items-center justify-center gap-0.5 text-muted-foreground">
                <Shield className="h-2.5 w-2.5 text-amber-400" />
                {t("ac")}
              </div>
              <div className="font-mono text-sm font-bold text-amber-300">{m.ac}</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-0.5 text-muted-foreground">
                <Heart className="h-2.5 w-2.5 text-red-400" />
                {t("monsterHD")}
              </div>
              <div className="font-mono text-sm font-bold text-red-300">{m.hit_dice}</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-0.5 text-muted-foreground">
                <Crosshair className="h-2.5 w-2.5 text-sky-400" />
                {t("thac0")}
              </div>
              <div className="font-mono text-sm font-bold text-sky-300">{m.thac0}</div>
            </div>
          </div>
          <div className="mt-1 text-center text-[10px] text-muted-foreground">
            XP {m.xp_value?.toLocaleString()}
          </div>
        </>
      );
    }
    case "npc": {
      const n = item.data as ChronicleNpcRow;
      return (
        <div className="flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
          {n.location && <span className="truncate">{n.location}</span>}
          {n.level != null && <span>Lvl {n.level}</span>}
          <Badge variant="outline" className="text-[9px]">
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
            <Badge variant="outline" className="mb-1 text-[10px]">
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
        <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
          <span>
            {w.damage_sm}/{w.damage_l}
          </span>
          <span>Spd {w.speed}</span>
          <span>{lbsToKg(w.weight)}</span>
          <Badge variant="outline" className="text-[9px]">
            {w.weapon_type}
          </Badge>
        </div>
      );
    }
    case "armor": {
      const a = item.data as ArmorRow;
      return (
        <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
          <span>AC {a.ac}</span>
          <span>{lbsToKg(a.weight)}</span>
          {a.is_shield && (
            <Badge variant="outline" className="text-[9px]">
              {a.shield_type ?? "shield"}
            </Badge>
          )}
        </div>
      );
    }
    case "general_item": {
      const gi = item.data as GeneralItemRow;
      return <span className="text-[10px] text-muted-foreground">{lbsToKg(gi.weight)}</span>;
    }
  }
}
