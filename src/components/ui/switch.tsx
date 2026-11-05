import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Shows a spinner in the knob while the change is being saved. */
  busy?: boolean;
  "aria-labelledby"?: string;
  "aria-label"?: string;
  className?: string;
  "data-testid"?: string;
}

/**
 * The only on/off switch of the app (src/test/switch-guard.test.ts).
 *
 * Off must be recognisable as a control on the dark theme too: --muted and
 * --background are nearly the same colour there, so the off state uses a
 * visible outline and a muted-foreground knob instead of track = background.
 */
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  busy,
  className,
  ...aria
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-busy={busy || undefined}
      disabled={disabled || busy}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "border-primary bg-primary" : "border-muted-foreground/70 bg-input",
        className
      )}
      {...aria}
    >
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full shadow transition-transform",
          checked
            ? "translate-x-[1.375rem] bg-primary-foreground"
            : "translate-x-0.5 bg-muted-foreground"
        )}
      >
        {busy && (
          <Loader2
            className={cn("h-3.5 w-3.5 animate-spin", checked ? "text-primary" : "text-background")}
          />
        )}
      </span>
    </button>
  );
}
