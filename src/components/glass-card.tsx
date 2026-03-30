import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: "neutral" | "warrior" | "priest" | "rogue" | "wizard";
  "data-testid"?: string;
}

export function GlassCard({
  children,
  className,
  hover = true,
  glow = "neutral",
  "data-testid": testId,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass rounded-xl p-4",
        hover && "glass-hover",
        glow && `glow-${glow}`,
        className
      )}
      {...(testId ? { "data-testid": testId } : {})}
    >
      {children}
    </div>
  );
}
