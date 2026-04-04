"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { verifyPin } from "@/app/master/actions";

export function MasterPinGate() {
  const t = useTranslations("master");
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState(false);
  const [lockedOut, setLockedOut] = useState(false);
  const [shake, setShake] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    };
  }, []);

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError(false);
    setLockedOut(false);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (digit && index === 5 && next.every((d) => d !== "")) {
      submitPin(next.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 0) return;

    const next = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);

    if (pasted.length === 6) {
      submitPin(next.join(""));
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  }

  function submitPin(pin: string) {
    startTransition(async () => {
      const result = await verifyPin(pin);
      if (result.success) {
        router.refresh();
      } else if (result.lockedOut) {
        setLockedOut(true);
        setDigits(Array(6).fill(""));
      } else {
        setError(true);
        setShake(true);
        setDigits(Array(6).fill(""));
        if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
        shakeTimerRef.current = setTimeout(() => setShake(false), 500);
        inputRefs.current[0]?.focus();
      }
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pin = digits.join("");
    if (pin.length === 6) {
      submitPin(pin);
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <GlassCard
        className="w-full max-w-sm p-6 text-center"
        hover={false}
        data-testid="gm-pin-gate"
      >
        <Shield className="mx-auto mb-4 h-12 w-12 text-amber-400" />
        <h1 className="font-heading mb-2 text-2xl text-foreground">{t("title")}</h1>
        <p className="mb-6 text-sm text-muted-foreground">{t("pinPrompt")}</p>

        <form onSubmit={handleSubmit}>
          <fieldset>
            <legend className="sr-only">{t("pinPrompt")}</legend>
            <div
              className={`mb-4 flex justify-center gap-2 ${shake ? "animate-shake" : ""}`}
              data-testid="gm-pin-inputs"
            >
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  className={`h-14 w-12 rounded-lg border bg-background/50 text-center text-2xl font-mono focus:outline-none focus:ring-2 ${
                    error || lockedOut
                      ? "border-destructive focus:ring-destructive"
                      : "border-border focus:ring-primary"
                  }`}
                  aria-label={`${t("pinDigit")} ${i + 1} ${t("pinOf")} 6`}
                  data-testid={`gm-pin-digit-${i}`}
                  autoFocus={i === 0}
                  disabled={isPending || lockedOut}
                />
              ))}
            </div>
          </fieldset>

          {error && (
            <p className="mb-4 text-sm text-destructive" data-testid="gm-pin-error">
              {t("wrongPin")}
            </p>
          )}

          {lockedOut && (
            <p className="mb-4 text-sm text-destructive" data-testid="gm-pin-locked">
              {t("tooManyAttempts")}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isPending || lockedOut || digits.some((d) => d === "")}
            data-testid="gm-pin-submit"
          >
            {isPending ? t("unlocking") : t("unlock")}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
