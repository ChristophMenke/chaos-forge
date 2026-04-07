import { getHpStatus } from "@/lib/rules/hitpoints";

interface HpBarProps {
  current: number;
  max: number;
  /** CSS class for the bar gradient (e.g. "hp-bar-warrior") */
  barClass: string;
  /** Optional label for unconscious state */
  unconsciousLabel?: string;
  /** Optional label for dead state */
  deadLabel?: string;
}

export function HpBar({ current, max, barClass, unconsciousLabel, deadLabel }: HpBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((current / max) * 100))) : 0;
  const status = getHpStatus(current, max);

  return (
    <div className="flex items-center gap-2" data-testid="hp-bar">
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={-max}
        aria-valuemax={max}
        aria-label={`HP: ${current}/${max}`}
        className={`h-2.5 flex-1 overflow-hidden rounded-full ${status === "dead" ? "bg-red-900/50" : "bg-black/30 dark:bg-black/50"}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${status !== "alive" ? "bg-red-800/60" : barClass}${pct < 25 && pct > 0 ? " hp-bar-pulse" : ""}`}
          style={{ width: status !== "alive" ? "100%" : `${pct}%` }}
          data-testid="hp-bar-fill"
        />
      </div>
      <span
        className="flex-shrink-0 whitespace-nowrap text-right font-mono text-sm text-foreground/80"
        data-testid="hp-bar-text"
      >
        HP: {current}/{max}
      </span>
      {status === "unconscious" && unconsciousLabel && (
        <span
          className="flex-shrink-0 rounded-full border border-amber-500/50 bg-amber-500/10 px-1.5 py-0.5 text-[10px] md:text-xs font-medium text-amber-400"
          data-testid="hp-status-unconscious"
        >
          {unconsciousLabel}
        </span>
      )}
      {status === "dead" && deadLabel && (
        <span
          className="flex-shrink-0 rounded-full border border-red-500/50 bg-red-500/10 px-1.5 py-0.5 text-[10px] md:text-xs font-medium text-red-400"
          data-testid="hp-status-dead"
        >
          💀 {deadLabel}
        </span>
      )}
    </div>
  );
}
