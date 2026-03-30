interface LevelBadgeProps {
  level: string;
  /** CSS class for the badge background (e.g. "bg-red-500/80 text-white") */
  badgeClass: string;
}

export function LevelBadge({ level, badgeClass }: LevelBadgeProps) {
  return (
    <div
      className={`hex-badge flex h-8 w-8 items-center justify-center shadow-inner dark:drop-shadow-[0_0_6px_rgba(255,255,255,0.15)] sm:h-10 sm:w-10 ${badgeClass}`}
      data-testid="level-badge"
    >
      <div className="flex flex-col items-center leading-none">
        <span className="text-[8px] font-bold uppercase tracking-wider">Lv</span>
        <span className="text-xs font-bold">{level}</span>
      </div>
    </div>
  );
}
