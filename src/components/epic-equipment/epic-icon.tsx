import { Glasses, HeartPulse, Sparkles, type LucideProps } from "lucide-react";

const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  glasses: Glasses,
  "heart-pulse": HeartPulse,
  sparkles: Sparkles,
};

export function EpicIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICON_MAP[name] ?? Sparkles;
  return <Icon {...props} />;
}
