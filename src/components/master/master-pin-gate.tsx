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
    <div
      className="relative -mb-16 flex flex-1 flex-col items-center sm:mb-0"
      data-testid="gm-pin-gate"
    >
      {/* Full-bleed artwork background.
          Portrait variant covers mobile / tall screens, landscape variant
          kicks in once the viewport aspect ratio hits ~4:3. */}
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

      {/* Parchment PIN panel — absolutely positioned to sit precisely on the
          open book page in the artwork. Percentages are tuned to both the
          portrait and landscape background variants so the card lands on
          the parchment rather than floating over the magician's torso or
          sliding off the bottom of the viewport. */}
      <form
        onSubmit={handleSubmit}
        className="absolute left-1/2 w-full max-w-xs -translate-x-1/2 px-3 sm:max-w-sm"
        style={{ bottom: "max(env(safe-area-inset-bottom, 0px), 4%)" }}
      >
        <div
          className="rounded-md border-2 border-amber-900/70 bg-[#f4e9d1]/95 px-2 py-3 shadow-2xl shadow-black/60 backdrop-blur-sm sm:px-3"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at top, rgba(120,70,20,0.1) 0%, transparent 70%)",
          }}
        >
          <h1 className="font-heading mb-0.5 text-center text-lg tracking-wide text-amber-950 sm:text-xl">
            {t("title")}
          </h1>
          <p className="mb-2 text-center text-[11px] leading-tight text-amber-950/70 sm:text-xs">
            {t("pinPrompt")}
          </p>

          <fieldset>
            <legend className="sr-only">{t("pinPrompt")}</legend>
            <div
              className={`mb-2 flex justify-center gap-0.5 ${shake ? "animate-shake" : ""}`}
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
                  style={{ minHeight: 44, minWidth: 44 }}
                  className={`rounded border-2 bg-[#e8dab4] text-center font-mono text-lg text-amber-950 shadow-inner shadow-amber-900/20 focus:outline-none focus:ring-2 focus:ring-amber-600 sm:text-xl ${
                    error || lockedOut ? "border-red-700" : "border-amber-900/60"
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
              className="mb-1 text-center text-[11px] font-medium text-red-800"
              data-testid="gm-pin-error"
            >
              {t("wrongPin")}
            </p>
          )}

          {lockedOut && (
            <p
              className="mb-1 text-center text-[11px] font-medium text-red-800"
              data-testid="gm-pin-locked"
            >
              {t("tooManyAttempts")}
            </p>
          )}

          <button
            type="submit"
            className="h-9 w-full rounded border-2 border-amber-900/70 bg-gradient-to-b from-amber-400 to-amber-600 px-3 font-heading text-sm font-semibold tracking-wide text-amber-950 shadow-md transition-all hover:from-amber-300 hover:to-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
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
