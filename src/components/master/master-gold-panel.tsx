"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Coins, Sparkles, Users, ArrowRight, CircleDollarSign } from "lucide-react";
import { AvatarDisplay } from "@/components/avatar-display";
import { distributeGold } from "@/app/master/actions";
import { getClassGroupColors } from "@/lib/utils/class-colors";
import { CLASSES } from "@/lib/rules/classes";
import { localized } from "@/lib/utils/localize";
import type { CharacterRow } from "@/lib/supabase/types";
import type { ClassId, ClassGroup } from "@/lib/rules/types";

interface MasterGoldPanelProps {
  characters: CharacterRow[];
}

type CoinType = "pp" | "gp" | "sp" | "cp";

const COIN_META: Record<
  CoinType,
  {
    label: string;
    color: string;
    bgGradient: string;
    ringColor: string;
    glowColor: string;
    shineColor: string;
    relativeToGp: number;
  }
> = {
  pp: {
    label: "PP",
    color: "text-sky-200",
    bgGradient: "from-sky-400/30 via-slate-300/20 to-sky-600/30",
    ringColor: "ring-sky-300/50",
    glowColor: "shadow-sky-400/30",
    shineColor: "bg-sky-200",
    relativeToGp: 5,
  },
  gp: {
    label: "GP",
    color: "text-amber-200",
    bgGradient: "from-amber-300/40 via-yellow-400/30 to-amber-600/40",
    ringColor: "ring-amber-400/60",
    glowColor: "shadow-amber-500/40",
    shineColor: "bg-amber-100",
    relativeToGp: 1,
  },
  sp: {
    label: "SP",
    color: "text-slate-100",
    bgGradient: "from-slate-300/30 via-zinc-200/20 to-slate-500/30",
    ringColor: "ring-slate-300/50",
    glowColor: "shadow-slate-300/30",
    shineColor: "bg-slate-100",
    relativeToGp: 0.1,
  },
  cp: {
    label: "CP",
    color: "text-orange-200",
    bgGradient: "from-orange-400/30 via-amber-700/20 to-orange-800/40",
    ringColor: "ring-orange-500/50",
    glowColor: "shadow-orange-500/30",
    shineColor: "bg-orange-200",
    relativeToGp: 0.01,
  },
};

const COIN_ORDER: CoinType[] = ["pp", "gp", "sp", "cp"];
const QUICK_PRESETS = [10, 50, 100, 500, 1000] as const;

function getPrimaryGroup(char: CharacterRow): ClassGroup {
  if (!char.class_id) return "warrior";
  return (CLASSES[char.class_id as ClassId]?.group ?? "warrior") as ClassGroup;
}

export function MasterGoldPanel({ characters }: MasterGoldPanelProps) {
  const t = useTranslations("master");
  const locale = useLocale();

  const activeCharacters = characters.filter((c) => c.is_active && !c.is_npc);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(activeCharacters[0] ? [activeCharacters[0].id] : [])
  );
  const [coins, setCoins] = useState<Record<CoinType, number>>({ pp: 0, gp: 0, sp: 0, cp: 0 });
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [splitMode, setSplitMode] = useState(false);

  const hasCoins = COIN_ORDER.some((c) => coins[c] > 0);
  const selectedCount = selectedIds.size;

  // Value of one "share" (what a single character receives) in GP
  const perCharacterGpValue = COIN_ORDER.reduce(
    (sum, c) => sum + coins[c] * COIN_META[c].relativeToGp,
    0
  );

  // Actual total leaving the treasury:
  // - split mode: the entered amount is split — treasury loses exactly the entered amount
  // - normal mode: each selected hero receives the full amount — treasury loses amount × heroes
  const multiplier = splitMode ? 1 : Math.max(1, selectedCount);
  const totalGoldValue = perCharacterGpValue * multiplier;

  // Per-character values when split mode is active
  const splitValues =
    splitMode && selectedCount >= 2
      ? {
          pp: Math.floor(coins.pp / selectedCount),
          gp: Math.floor(coins.gp / selectedCount),
          sp: Math.floor(coins.sp / selectedCount),
          cp: Math.floor(coins.cp / selectedCount),
        }
      : coins;

  function toggleCharacter(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function applyPreset(amount: number) {
    setCoins((prev) => ({ ...prev, gp: prev.gp + amount }));
  }

  function clearAll() {
    setCoins({ pp: 0, gp: 0, sp: 0, cp: 0 });
  }

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSend() {
    if (selectedIds.size === 0 || !hasCoins) return;
    setSending(true);

    const targets = Array.from(selectedIds);
    const perCharacter = splitMode && selectedCount > 1 ? splitValues : coins;

    let successCount = 0;
    for (const charId of targets) {
      const result = await distributeGold(charId, { ...perCharacter, ep: 0 });
      if (result.success) successCount++;
    }

    setSending(false);
    if (successCount === targets.length) {
      setCoins({ pp: 0, gp: 0, sp: 0, cp: 0 });
      showToast(t("goldSent"), "success");
    } else {
      showToast(t("goldFailed"), "error");
    }
  }

  return (
    <div className="relative" data-testid="gm-gold-panel">
      {/* Dramatic Header Banner */}
      <div className="relative mb-6 overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/60 via-yellow-950/40 to-amber-950/60 px-5 py-5 shadow-2xl shadow-amber-950/30">
        {/* Decorative radial glows */}
        <div className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-yellow-500/20 blur-3xl" />
        {/* Filigree pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(251, 191, 36, 0.4) 0 1px, transparent 1px 12px)",
          }}
        />
        {/* Top + bottom gold filigree */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400/40 to-amber-700/30 ring-1 ring-amber-400/50 shadow-lg shadow-amber-500/30">
              <Coins className="h-7 w-7 text-amber-200" />
              <div className="pointer-events-none absolute inset-0 animate-pulse rounded-lg bg-amber-400/10 blur-lg" />
            </div>
            <div>
              <h2 className="font-heading text-2xl leading-tight tracking-wide text-amber-100 sm:text-3xl">
                {t("goldTreasuryTitle")}
              </h2>
              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.2em] text-amber-400/70">
                {t("goldTreasurySubtitle")}
              </p>
            </div>
          </div>
          {/* Live total — shows real amount leaving the treasury */}
          <div
            className="hidden items-center gap-2 rounded-full border border-amber-400/40 bg-amber-950/40 px-4 py-2 backdrop-blur-sm sm:flex"
            data-testid="gm-gold-total"
          >
            <CircleDollarSign className="h-4 w-4 text-amber-300" />
            <div className="flex flex-col items-end leading-tight">
              <span className="font-mono text-sm font-semibold text-amber-200">
                {totalGoldValue.toLocaleString(locale, { maximumFractionDigits: 2 })} GP
              </span>
              <span className="text-[9px] uppercase tracking-wider text-amber-400/70">
                {selectedCount > 1 && !splitMode && perCharacterGpValue > 0
                  ? t("goldTotalPerHero", {
                      per: perCharacterGpValue.toLocaleString(locale, {
                        maximumFractionDigits: 2,
                      }),
                      count: selectedCount,
                    })
                  : t("goldTotalValue")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content — Split Layout */}
      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        {/* ═══ LEFT: Hero Roster ═══ */}
        <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-b from-background/40 to-background/20 p-4 backdrop-blur-sm">
          <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-amber-500/5 blur-3xl" />

          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-400/80" />
              <h3 className="font-heading text-sm uppercase tracking-[0.15em] text-amber-200/90">
                {t("goldRecipients")}
              </h3>
            </div>
            <span className="rounded-full border border-amber-500/30 bg-amber-950/30 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
              {selectedCount} / {activeCharacters.length}
            </span>
          </div>

          {/* Multi-select hint */}
          <p className="mb-3 text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("goldMultiSelectHint")}
          </p>

          {activeCharacters.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("noCharactersFound")}
            </p>
          ) : (
            <div className="space-y-2">
              {activeCharacters.map((char) => {
                const isSelected = selectedIds.has(char.id);
                const group = getPrimaryGroup(char);
                const colors = getClassGroupColors(group);
                return (
                  <button
                    key={char.id}
                    onClick={() => toggleCharacter(char.id)}
                    className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-lg border px-3 py-2.5 text-left transition-all ${
                      isSelected
                        ? `border-amber-500/60 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-transparent shadow-lg shadow-amber-500/10`
                        : "border-border/40 bg-background/20 hover:border-border hover:bg-background/40"
                    }`}
                    data-testid={`gm-gold-char-${char.id}`}
                  >
                    {/* Selected indicator glow */}
                    {isSelected && (
                      <div className="pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-300 shadow-lg shadow-amber-400/50" />
                    )}

                    <div
                      className={`relative shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-background transition-all ${
                        isSelected
                          ? `${colors.text.replace("text-", "ring-")} scale-105`
                          : "ring-border/30"
                      }`}
                    >
                      <AvatarDisplay
                        name={char.name}
                        avatarUrl={char.avatar_url}
                        size={40}
                        raceId={char.race_id ?? undefined}
                        classGroup={group}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div
                        className={`truncate font-heading text-sm ${isSelected ? "text-amber-100" : "text-foreground/90"}`}
                      >
                        {char.name}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className={colors.text}>
                          {CLASSES[char.class_id as ClassId]
                            ? localized(
                                CLASSES[char.class_id as ClassId].name,
                                CLASSES[char.class_id as ClassId].name_en,
                                locale
                              )
                            : char.class_id}
                        </span>
                        <span className="opacity-40">·</span>
                        <span className="font-mono text-amber-400/60">
                          {(char.gold_gp ?? 0).toLocaleString()} GP
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <Sparkles
                        className="h-4 w-4 shrink-0 text-amber-300"
                        data-testid={`gm-gold-char-${char.id}-selected`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ═══ RIGHT: The Mint / Coin Distribution ═══ */}
        <div className="space-y-4">
          {/* Coin Piles */}
          <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-b from-background/50 to-background/30 p-4 backdrop-blur-sm">
            <div className="pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-full bg-amber-500/5 blur-3xl" />

            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400/80" />
                <h3 className="font-heading text-sm uppercase tracking-[0.15em] text-amber-200/90">
                  {t("goldMintTitle")}
                </h3>
              </div>
              {hasCoins && (
                <button
                  onClick={clearAll}
                  className="text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-red-400"
                  data-testid="gm-gold-clear"
                >
                  {t("goldClear")}
                </button>
              )}
            </div>

            {/* 4 Coin Tiles */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {COIN_ORDER.map((coin) => {
                const meta = COIN_META[coin];
                const value = coins[coin];
                const hasValue = value > 0;
                return (
                  <div
                    key={coin}
                    className={`group relative overflow-hidden rounded-lg border p-3 transition-all ${
                      hasValue
                        ? `border-amber-500/40 shadow-lg ${meta.glowColor}`
                        : "border-border/40"
                    }`}
                    data-testid={`gm-gold-tile-${coin}`}
                  >
                    {/* Animated background gradient */}
                    <div
                      className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${meta.bgGradient} transition-opacity ${
                        hasValue ? "opacity-100" : "opacity-30"
                      }`}
                    />
                    {/* Shimmer on value change */}
                    {hasValue && (
                      <div
                        className={`pointer-events-none absolute -inset-x-full top-0 h-full w-1/3 rotate-12 ${meta.shineColor} opacity-20 blur-md`}
                      />
                    )}

                    <div className="relative">
                      {/* Coin Label */}
                      <div className="mb-1 text-center">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold tracking-widest ring-1 ${meta.ringColor} ${meta.color} bg-black/30`}
                        >
                          {meta.label}
                        </span>
                      </div>

                      {/* Input */}
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={value || ""}
                        onChange={(e) =>
                          setCoins((prev) => ({
                            ...prev,
                            [coin]: Math.max(0, Number(e.target.value) || 0),
                          }))
                        }
                        className={`w-full appearance-none bg-transparent text-center font-heading text-2xl font-bold tracking-tight outline-none transition-colors [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none ${
                          hasValue ? meta.color : "text-foreground/40"
                        } placeholder:text-foreground/20`}
                        placeholder="0"
                        data-testid={`gm-gold-${coin}`}
                      />

                      {/* Split preview */}
                      {splitMode && selectedCount > 1 && hasValue && (
                        <div className="mt-1 text-center text-[9px] uppercase tracking-wider text-amber-300/70">
                          {splitValues[coin]} / {t("goldHero")}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Presets */}
            <div className="mt-4">
              <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                {t("goldQuickPresets")}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PRESETS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => applyPreset(amount)}
                    className="rounded-md border border-amber-500/20 bg-amber-950/20 px-2.5 py-1 font-mono text-xs text-amber-300 transition-all hover:border-amber-400/50 hover:bg-amber-900/30 hover:text-amber-100"
                    data-testid={`gm-gold-preset-${amount}`}
                  >
                    +{amount} GP
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Split Party Toggle + Send Action */}
          <div className="space-y-3">
            {/* Split Toggle — only shown if multi-selected */}
            {selectedCount > 1 && (
              <button
                onClick={() => setSplitMode(!splitMode)}
                className={`flex w-full items-center justify-between rounded-lg border px-4 py-2.5 transition-all ${
                  splitMode
                    ? "border-amber-500/50 bg-amber-950/30 text-amber-200 shadow-inner shadow-amber-500/10"
                    : "border-border/40 bg-background/20 text-muted-foreground hover:border-border hover:text-foreground"
                }`}
                data-testid="gm-gold-split-toggle"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {t("goldSplitParty", { count: selectedCount })}
                  </span>
                </div>
                <div
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    splitMode ? "bg-amber-500/80" : "bg-muted"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-background shadow-md transition-all ${
                      splitMode ? "left-[18px]" : "left-0.5"
                    }`}
                  />
                </div>
              </button>
            )}

            {/* SEAL & SEND Button — Wax Seal Style */}
            <button
              onClick={handleSend}
              disabled={sending || !hasCoins || selectedCount === 0}
              className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-amber-400/40 bg-gradient-to-r from-amber-600/30 via-yellow-500/30 to-amber-600/30 px-6 py-4 shadow-xl shadow-amber-500/20 transition-all hover:border-amber-300/60 hover:shadow-2xl hover:shadow-amber-500/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              data-testid="gm-gold-send"
            >
              {/* Animated shimmer */}
              <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-amber-200/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
              {/* Inner glow */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-300/0 via-amber-300/5 to-transparent" />

              <Sparkles className="relative h-5 w-5 text-amber-100" />
              <span className="relative font-heading text-base font-bold uppercase tracking-[0.2em] text-amber-50">
                {sending ? t("goldSending") : t("goldSealAndSend")}
              </span>
              <ArrowRight className="relative h-5 w-5 text-amber-100 transition-transform group-hover:translate-x-1" />
            </button>

            {/* Status line */}
            {(!hasCoins || selectedCount === 0) && (
              <p
                className="text-center text-[11px] italic text-muted-foreground/70"
                data-testid="gm-gold-status"
              >
                {selectedCount === 0
                  ? t("goldStatusNoHeroes")
                  : !hasCoins
                    ? t("goldStatusNoCoins")
                    : ""}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-lg border px-4 py-2 text-sm font-medium shadow-2xl backdrop-blur-sm sm:bottom-4 ${
            toast.type === "success"
              ? "border-amber-500/40 bg-amber-950/80 text-amber-100 shadow-amber-500/20"
              : "border-red-500/40 bg-red-950/80 text-red-200 shadow-red-500/20"
          }`}
          data-testid="gm-gold-toast"
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" && <Sparkles className="h-4 w-4" />}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
