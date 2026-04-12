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
    <div className="relative flex h-[100dvh] flex-col items-center" data-testid="gm-pin-gate">
      <div className="absolute inset-0 -z-10 overflow-hidden bg-[#0b0810]">
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
        className="absolute left-1/2 w-full max-w-[160px] -translate-x-1/2 sm:max-w-[180px]"
        style={{ bottom: "max(env(safe-area-inset-bottom, 0px), 10%)" }}
      >
        <div className="px-1 py-1.5">
          <fieldset>
            <legend className="sr-only">{t("pinPrompt")}</legend>
            <div
              className={`mb-1.5 flex justify-center gap-px ${shake ? "animate-shake" : ""}`}
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
                  className={`size-6 rounded border bg-[#e8dab4]/80 text-center font-mono text-xs text-amber-950 shadow-inner shadow-amber-900/10 focus:outline-none focus:ring-1 focus:ring-amber-600 sm:size-7 sm:text-sm ${
                    error || lockedOut ? "border-red-700" : "border-amber-900/40"
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
              className="mb-0.5 text-center text-[9px] font-medium text-red-800"
              data-testid="gm-pin-error"
            >
              {t("wrongPin")}
            </p>
          )}

          {lockedOut && (
            <p
              role="alert"
              aria-live="assertive"
              className="mb-0.5 text-center text-[9px] font-medium text-red-800"
              data-testid="gm-pin-locked"
            >
              {t("tooManyAttempts")}
            </p>
          )}

          <button
            type="submit"
            className="h-5 w-full rounded border border-amber-900/50 bg-gradient-to-b from-amber-400 to-amber-600 px-2 font-heading text-[9px] font-semibold tracking-wide text-amber-950 shadow-sm transition-all hover:from-amber-300 hover:to-amber-500 disabled:cursor-not-allowed disabled:opacity-50 sm:h-6 sm:text-[10px]"
            disabled={isPending || lockedOut || digits.some((d) => d === "")}
            data-testid="gm-pin-submit"
          >
            {isPending ? t("unlocking") : t("unlock")}
          </button>
        </div>
      </form>
    </div>
  );
}
