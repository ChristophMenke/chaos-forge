interface HpBarProps {
  current: number;
  max: number;
  /** CSS class for the bar gradient (e.g. "hp-bar-warrior") */
  barClass: string;
}

export function HpBar({ current, max, barClass }: HpBarProps) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;

  return (
    <div className="flex items-center gap-2" data-testid="hp-bar">
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/30 dark:bg-black/50">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barClass}${pct < 25 && pct > 0 ? " hp-bar-pulse" : ""}`}
          style={{ width: `${pct}%` }}
          data-testid="hp-bar-fill"
        />
      </div>
      <span
        className="flex-shrink-0 whitespace-nowrap text-right font-mono text-sm text-foreground/80"
        data-testid="hp-bar-text"
      >
        HP: {current}/{max}
      </span>
    </div>
  );
}
