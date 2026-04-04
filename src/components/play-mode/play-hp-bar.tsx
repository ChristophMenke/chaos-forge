"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ClassGroup } from "@/lib/rules/types";
import { getClassGroupColors } from "@/lib/utils/class-colors";

interface PlayHpBarProps {
  characterId: string;
  name: string;
  avatarUrl: string | null;
  hpCurrent: number;
  hpMax: number;
  ac: number;
  thac0: number;
  classGroup: ClassGroup;
  kitName?: string | null;
  deity?: string | null;
  priesthoodName?: string | null;
  readOnly?: boolean;
  onHpChange: (newHp: number) => void;
}

export function PlayHpBar({
  characterId,
  name,
  avatarUrl,
  hpCurrent,
  hpMax,
  ac,
  thac0,
  classGroup,
  kitName,
  deity,
  priesthoodName,
  readOnly = false,
  onHpChange,
}: PlayHpBarProps) {
  const t = useTranslations("playMode");
  const [showDamageInput, setShowDamageInput] = useState(false);
  const [showHealInput, setShowHealInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const pct = hpMax > 0 ? Math.min(100, Math.round((hpCurrent / hpMax) * 100)) : 0;
  const colors = getClassGroupColors(classGroup);

  function applyDamage() {
    const amount = parseInt(inputValue, 10);
    if (!isNaN(amount) && amount > 0) {
      onHpChange(Math.max(0, hpCurrent - amount));
    }
    setShowDamageInput(false);
    setInputValue("");
  }

  function applyHeal() {
    const amount = parseInt(inputValue, 10);
    if (!isNaN(amount) && amount > 0) {
      onHpChange(Math.min(hpMax, hpCurrent + amount));
    }
    setShowHealInput(false);
    setInputValue("");
  }

  function openInput(type: "damage" | "heal") {
    if (type === "damage") {
      setShowHealInput(false);
      setShowDamageInput(true);
    } else {
      setShowDamageInput(false);
      setShowHealInput(true);
    }
    setInputValue("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <div
      className="glass sticky top-0 z-30 rounded-b-xl border-b border-border/50 px-3 py-2 sm:px-4 sm:py-3"
      data-testid="play-hp-bar"
    >
      {/* Row 1: Avatar, Name, HP Buttons, AC, THAC0, Manage Link */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Avatar */}
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-border sm:h-12 sm:w-12">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={name}
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center ${colors.badge} text-sm font-bold`}
            >
              {name.charAt(0)}
            </div>
          )}
        </div>

        {/* Name + HP controls */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="truncate font-heading text-sm font-semibold sm:text-base"
              data-testid="play-character-name"
            >
              {name}
            </span>
            {kitName && (
              <Badge
                variant="outline"
                className="shrink-0 text-[10px]"
                data-testid="play-kit-badge"
              >
                {kitName}
              </Badge>
            )}
            {deity && (
              <Badge
                variant="secondary"
                className="shrink-0 text-[10px]"
                data-testid="play-deity-badge"
              >
                {t("priestOfDeity", { deity })}
              </Badge>
            )}
            {priesthoodName && (
              <Badge
                variant="secondary"
                className="shrink-0 text-[10px]"
                data-testid="play-priesthood-badge"
              >
                {priesthoodName}
              </Badge>
            )}
            <div className="flex items-center gap-1">
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                  onClick={() => openInput("damage")}
                  data-testid="play-damage-btn"
                  aria-label={t("takeDamage")}
                >
                  −
                </Button>
              )}
              <span className="font-mono text-sm font-bold" data-testid="play-hp-text">
                {hpCurrent}/{hpMax}
              </span>
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-green-500 hover:bg-green-500/10"
                  onClick={() => openInput("heal")}
                  data-testid="play-heal-btn"
                  aria-label={t("heal")}
                >
                  +
                </Button>
              )}
            </div>
          </div>

          {/* HP Bar */}
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/30 dark:bg-black/50">
            <div
              className={`h-full rounded-full transition-all duration-500 ${colors.hpBar}${pct < 25 && pct > 0 ? " hp-bar-pulse" : ""}`}
              style={{ width: `${pct}%` }}
              data-testid="play-hp-bar-fill"
            />
          </div>
        </div>

        {/* AC + THAC0 */}
        <div className="flex shrink-0 gap-2 text-center sm:gap-3">
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">AC</div>
            <div className="font-heading text-lg font-bold" data-testid="play-ac">
              {ac}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">THAC0</div>
            <div className="font-heading text-lg font-bold" data-testid="play-thac0">
              {thac0}
            </div>
          </div>
        </div>

        {/* Manage Link */}
        <Link
          href={`/characters/${characterId}/manage`}
          className="shrink-0 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          data-testid="play-manage-link"
        >
          {t("manage")}
        </Link>
      </div>

      {/* Damage/Heal input row (conditionally shown) */}
      {(showDamageInput || showHealInput) && (
        <div className="mt-2 flex items-center gap-2" data-testid="play-hp-input">
          <span className="text-xs text-muted-foreground">
            {showDamageInput ? t("takeDamage") : t("heal")}:
          </span>
          <input
            ref={inputRef}
            type="number"
            min="1"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") showDamageInput ? applyDamage() : applyHeal();
              if (e.key === "Escape") {
                setShowDamageInput(false);
                setShowHealInput(false);
              }
            }}
            className="w-20 rounded-md border border-border bg-background px-2 py-1 text-sm"
            placeholder={t("amount")}
            data-testid="play-hp-input-field"
          />
          <Button
            size="sm"
            className="h-7"
            onClick={() => (showDamageInput ? applyDamage() : applyHeal())}
            data-testid="play-hp-apply"
          >
            {t("apply")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7"
            onClick={() => {
              setShowDamageInput(false);
              setShowHealInput(false);
            }}
            data-testid="play-hp-cancel"
          >
            {t("cancel")}
          </Button>
        </div>
      )}
    </div>
  );
}
