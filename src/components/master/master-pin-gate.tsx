"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
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
    <div className="flex h-[100dvh] flex-col sm:relative sm:items-center" data-testid="gm-pin-gate">
      <div className="relative flex-1 overflow-hidden bg-[#0b0810] sm:absolute sm:inset-0 sm:-z-10">
        <picture>
          <source
            media="(min-aspect-ratio: 4/3)"
            srcSet="/images/gm-panels/master-pin-landscape.webp"
          />
          <img
            src="/images/gm-panels/master-pin-portrait.webp"
            alt=""
            className="h-full w-full object-cover"
          />
        </picture>
      </div>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t-2 border-amber-900/70 bg-[#f4e9d1] px-6 pb-[max(env(safe-area-inset-bottom,0px),12px)] pt-4 sm:absolute sm:bottom-[10%] sm:left-1/2 sm:w-full sm:max-w-[180px] sm:-translate-x-1/2 sm:border-0 sm:bg-transparent sm:px-1 sm:pb-0 sm:pt-0"
      >
        <fieldset>
          <legend className="sr-only">{t("pinPrompt")}</legend>
          <div
            className={`mb-3 flex justify-center gap-1.5 sm:mb-1.5 sm:gap-px ${shake ? "animate-shake" : ""}`}
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
                className={`size-12 rounded-md border-2 bg-[#e8dab4] text-center font-mono text-xl text-amber-950 shadow-inner shadow-amber-900/20 focus:outline-none focus:ring-2 focus:ring-amber-600 sm:size-6 sm:rounded sm:border sm:bg-[#e8dab4]/80 sm:text-xs sm:shadow-amber-900/10 sm:focus:ring-1 ${
                  error || lockedOut
                    ? "border-red-700"
                    : "border-amber-900/60 sm:border-amber-900/40"
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
          <p
            role="alert"
            aria-live="assertive"
            className="mb-2 text-center text-sm font-medium text-red-800 sm:mb-0.5 sm:text-[9px]"
            data-testid="gm-pin-error"
          >
            {t("wrongPin")}
          </p>
        )}

        {lockedOut && (
          <p
            role="alert"
            aria-live="assertive"
            className="mb-2 text-center text-sm font-medium text-red-800 sm:mb-0.5 sm:text-[9px]"
            data-testid="gm-pin-locked"
          >
            {t("tooManyAttempts")}
          </p>
        )}

        <button
          type="submit"
          className="h-11 w-full rounded-md border-2 border-amber-900/70 bg-gradient-to-b from-amber-400 to-amber-600 px-4 font-heading text-base font-semibold tracking-wide text-amber-950 shadow-md transition-all hover:from-amber-300 hover:to-amber-500 disabled:cursor-not-allowed disabled:opacity-50 sm:h-5 sm:rounded sm:border sm:border-amber-900/50 sm:px-2 sm:text-[9px] sm:shadow-sm"
          disabled={isPending || lockedOut || digits.some((d) => d === "")}
          data-testid="gm-pin-submit"
        >
          {isPending ? t("unlocking") : t("unlock")}
        </button>
      </form>
    </div>
  );
}
