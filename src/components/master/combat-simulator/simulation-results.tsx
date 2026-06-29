"use client";

import { useTranslations } from "next-intl";
import { Trophy, Clock, Users, Swords } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import type { SimulationResult } from "@/lib/combat-simulator";

interface SimulationResultsProps {
  result: SimulationResult;
}

const DIFFICULTY_COLORS: Record<SimulationResult["difficulty"], string> = {
  trivial: "text-green-400 bg-green-900/20",
  easy: "text-emerald-400 bg-emerald-900/20",
  moderate: "text-yellow-400 bg-yellow-900/20",
  hard: "text-orange-400 bg-orange-900/20",
  deadly: "text-red-400 bg-red-900/20",
};

const WIN_COLORS = {
  high: "text-green-400",
  medium: "text-yellow-400",
  low: "text-red-400",
};

export function SimulationResults({ result }: SimulationResultsProps) {
  const t = useTranslations("master");
  const winColor =
    result.pWin >= 0.7 ? WIN_COLORS.high : result.pWin >= 0.4 ? WIN_COLORS.medium : WIN_COLORS.low;

  const difficultyKey =
    `combat${result.difficulty.charAt(0).toUpperCase() + result.difficulty.slice(1)}` as
      "combatTrivial" | "combatEasy" | "combatModerate" | "combatHard" | "combatDeadly";

  return (
    <div className="space-y-3" data-testid="gm-combat-results">
      {/* Main gauge */}
      <GlassCard
        className="relative overflow-hidden p-6 text-center"
        data-testid="gm-combat-win-gauge"
      >
        {/* Background glow based on win chance */}
        <div
          className={`pointer-events-none absolute inset-0 ${
            result.pWin >= 0.7
              ? "bg-gradient-to-b from-green-500/5 to-transparent"
              : result.pWin >= 0.4
                ? "bg-gradient-to-b from-yellow-500/5 to-transparent"
                : "bg-gradient-to-b from-red-500/5 to-transparent"
          }`}
        />
        <div className="relative">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("combatWinChance")}
          </p>
          <p className={`font-heading text-5xl font-bold ${winColor}`} data-testid="gm-combat-pwin">
            {Math.round(result.pWin * 100)}%
          </p>
          <span
            className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${DIFFICULTY_COLORS[result.difficulty]}`}
            data-testid="gm-combat-difficulty"
          >
            {t(difficultyKey)}
          </span>
        </div>
      </GlassCard>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard
          icon={<Clock className="h-4 w-4 text-blue-400" />}
          label={t("combatAvgRounds")}
          value={result.avgRounds.toString()}
          testId="gm-combat-avg-rounds"
        />
        <StatCard
          icon={<Users className="h-4 w-4 text-green-400" />}
          label={t("combatAvgSurvivors")}
          value={result.avgPartySurvivors.toString()}
          testId="gm-combat-avg-survivors"
        />
        <StatCard
          icon={<Swords className="h-4 w-4 text-amber-400" />}
          label={t("combatPartyDPR")}
          value={result.avgPartyDPR.toString()}
          testId="gm-combat-party-dpr"
        />
        <StatCard
          icon={<Trophy className="h-4 w-4 text-red-400" />}
          label={t("combatOppositionDPR")}
          value={result.avgOppositionDPR.toString()}
          testId="gm-combat-opp-dpr"
        />
      </div>

      {/* Win/Loss breakdown */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          {result.partyWins}W / {result.oppositionWins}L ({result.iterations}{" "}
          {t("combatIterations")})
        </span>
      </div>

      {/* Narrative summary */}
      <GlassCard className="p-4" data-testid="gm-combat-summary">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {generateSummary(result, t)}
        </p>
      </GlassCard>
    </div>
  );
}

function generateSummary(result: SimulationResult, t: ReturnType<typeof useTranslations>): string {
  const pct = Math.round(result.pWin * 100);
  const parts: string[] = [];

  // Outcome description
  if (pct >= 90) {
    parts.push(t("combatSummaryTrivial"));
  } else if (pct >= 70) {
    parts.push(t("combatSummaryEasy"));
  } else if (pct >= 40) {
    parts.push(t("combatSummaryModerate"));
  } else if (pct >= 20) {
    parts.push(t("combatSummaryHard"));
  } else {
    parts.push(t("combatSummaryDeadly"));
  }

  // Duration analysis
  if (result.avgRounds <= 3) {
    parts.push(t("combatSummaryQuick", { rounds: result.avgRounds }));
  } else if (result.avgRounds >= 10) {
    parts.push(t("combatSummaryLong", { rounds: result.avgRounds }));
  }

  // DPR comparison
  if (result.avgPartyDPR > result.avgOppositionDPR * 2) {
    parts.push(t("combatSummaryPartyDominates"));
  } else if (result.avgOppositionDPR > result.avgPartyDPR * 2) {
    parts.push(t("combatSummaryOppositionDominates"));
  }

  // Survivors (only mention if party wins at least sometimes)
  if (result.pWin > 0) {
    parts.push(t("combatSummarySurvivors", { count: result.avgPartySurvivors }));
  }

  return parts.join(" ");
}

function StatCard({
  icon,
  label,
  value,
  testId,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  testId: string;
}) {
  return (
    <GlassCard className="p-3 text-center" data-testid={testId}>
      <div className="mb-1 flex justify-center">{icon}</div>
      <p className="font-heading text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </GlassCard>
  );
}
