import Link from "next/link";
import { AvatarDisplay } from "@/components/avatar-display";
import { HpBar } from "@/components/hp-bar";
import { LevelBadge } from "@/components/level-badge";
import { getClassGroupColors } from "@/lib/utils/class-colors";
import { CLASSES } from "@/lib/rules/classes";
import { RACES } from "@/lib/rules/races";
import { localized } from "@/lib/utils/localize";
import { Lock, Eye } from "lucide-react";
import type { ClassGroup, ClassId } from "@/lib/rules/types";
import type { CharacterRow, CharacterClassRow } from "@/lib/supabase/types";

interface CharacterCardProps {
  character: CharacterRow;
  classes: CharacterClassRow[];
  isOwner: boolean;
  isSharedWithMe: boolean;
  sharedByLabel?: string;
  badgePrivateLabel: string;
  badgeSharedLabel: string;
  badgePublicLabel: string;
  locale: string;
}

/**
 * Determine the primary class group by highest XP among active classes.
 */
function getPrimaryClassGroup(classes: CharacterClassRow[]): ClassGroup {
  if (classes.length === 0) return "warrior";
  const sorted = [...classes].sort((a, b) => b.xp_current - a.xp_current);
  const topClassId = sorted[0].class_id as ClassId;
  return CLASSES[topClassId]?.group ?? "warrior";
}

export function CharacterCard({
  character,
  classes,
  isOwner,
  isSharedWithMe,
  sharedByLabel,
  badgePrivateLabel,
  badgeSharedLabel,
  badgePublicLabel,
  locale,
}: CharacterCardProps) {
  const activeClasses = classes.filter((cc) => cc.is_active);
  const classGroup = getPrimaryClassGroup(activeClasses);
  const colors = getClassGroupColors(classGroup);

  const race = character.race_id ? RACES[character.race_id as keyof typeof RACES] : null;
  const classNames =
    activeClasses.length > 0
      ? activeClasses
          .map((cc) => {
            const cls = CLASSES[cc.class_id as keyof typeof CLASSES];
            return cls ? localized(cls.name, cls.name_en, locale) : cc.class_id;
          })
          .join("/")
      : character.class_id
        ? (() => {
            const cls = CLASSES[character.class_id as keyof typeof CLASSES];
            return cls ? localized(cls.name, cls.name_en, locale) : null;
          })()
        : null;
  const levelDisplay =
    activeClasses.length > 0
      ? activeClasses.map((cc) => cc.level).join("/")
      : String(character.level);

  // Visibility badge
  const visibilityBadge = (() => {
    if (!isOwner && isSharedWithMe) {
      return { icon: Eye, label: badgeSharedLabel };
    }
    if (isOwner && character.is_public) {
      return { icon: Eye, label: badgePublicLabel };
    }
    if (isOwner && !character.is_public) {
      return { icon: Lock, label: badgePrivateLabel };
    }
    if (!isOwner && character.is_public) {
      return { icon: Eye, label: badgePublicLabel };
    }
    return null;
  })();

  return (
    <Link href={`/characters/${character.id}`} className="min-w-0">
      <div
        className={`glass glass-hover tilt-card touch-press relative overflow-hidden rounded-xl p-4 ${colors.glow}`}
        data-testid={`character-card-${character.id}`}
      >
        {/* Level Badge — top right */}
        <div className="absolute right-3 top-3 z-10">
          <LevelBadge level={levelDisplay} badgeClass={colors.badge} />
        </div>

        {/* Main layout: Avatar left + Content right */}
        <div className="flex gap-4">
          {/* Avatar with breakout effect */}
          <div className="relative -mb-4 -ml-4 -mt-4 flex-shrink-0">
            <div className="relative h-[130px] w-[110px] overflow-hidden rounded-l-xl">
              {character.avatar_url ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={character.avatar_url}
                    alt={character.name}
                    className="h-full w-full object-cover"
                    data-testid="character-card-avatar"
                  />
                  {/* Inner shadow overlay */}
                  <div className="absolute inset-0 shadow-[inset_-20px_0_30px_-10px_rgba(0,0,0,0.5)]" />
                </>
              ) : (
                <AvatarDisplay
                  name={character.name}
                  avatarUrl={null}
                  size={110}
                  className="h-full w-full rounded-none text-2xl"
                />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5 pr-2 sm:pr-8">
            {/* Name */}
            <h3
              className="truncate font-heading text-lg leading-tight tracking-wide text-foreground"
              data-testid="character-card-name"
            >
              {character.name}
            </h3>

            {/* Race + Class */}
            <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
              {race && <span>{localized(race.name, race.name_en, locale)}</span>}
              {classNames && <span>{classNames}</span>}
            </div>

            {/* Visibility badge */}
            {visibilityBadge && (
              <div className="mt-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2 py-0.5 text-xs text-muted-foreground dark:bg-white/5">
                  <visibilityBadge.icon className="h-3 w-3" />
                  {visibilityBadge.label}
                </span>
              </div>
            )}

            {/* HP Bar */}
            <div className="mt-2">
              <HpBar
                current={character.hp_current}
                max={character.hp_max}
                barClass={colors.hpBar}
              />
            </div>

            {/* Shared by */}
            {!isOwner && sharedByLabel && (
              <div className="mt-1 text-[10px] text-muted-foreground/60">{sharedByLabel}</div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
