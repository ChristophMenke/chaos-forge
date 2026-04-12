"use client";

import { useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { Spinner } from "@/components/ui/spinner";

export default function LoginPage() {
  const t = useTranslations("login");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      if (!isSupabaseConfigured()) {
        setError(t("supabaseNotConfigured"));
        setLoading(false);
        return;
      }

      // Test-User Bypass: try auto-login, API checks if email matches
      const testRes = await fetch("/api/test-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (testRes.ok) {
        const testData = await testRes.json();
        const supabase = createClient();
        await supabase.auth.setSession({
          access_token: testData.access_token,
          refresh_token: testData.refresh_token,
        });
        window.location.href = "/characters";
        return;
      }

      // Send OTP code (no emailRedirectTo = sends 6-digit code instead of magic link)
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({ email });

      if (otpError) {
        setError(otpError.message);
      } else {
        setMessage(t("success"));
        setStep("code");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("unknownError"));
    }

    setLoading(false);
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });

      if (verifyError) {
        setError(t("invalidCode"));
      } else {
        // Ping admin via Discord webhook if this user is still unapproved.
        // Fire-and-forget — don't block the redirect on it.
        fetch("/api/notify-new-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newRegistration: true }),
        }).catch(() => {});
        window.location.href = "/characters";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("unknownError"));
    }

    setLoading(false);
  }

  async function handleResend() {
    setLoading(true);
    setError(null);
    setMessage(null);
    setCode("");

    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.signInWithOtp({ email });

      if (resendError) {
        setError(resendError.message);
      } else {
        setMessage(t("success"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("unknownError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="relative -mb-16 flex h-[100dvh] flex-col items-center justify-end pb-6 sm:mb-0 sm:items-end sm:pb-10 sm:pr-8 md:pr-16 lg:pr-24"
      data-testid="login-page"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden bg-[#1a1408]">
        <picture>
          <source
            media="(min-aspect-ratio: 4/3)"
            srcSet="/images/login/login-party-landscape.webp"
          />
          <img
            src="/images/login/login-party-portrait.webp"
            alt=""
            className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500 ${
              step === "email" ? "opacity-100" : "opacity-0"
            }`}
          />
        </picture>
        <picture>
          <source
            media="(min-aspect-ratio: 4/3)"
            srcSet="/images/login/login-party-grimace-landscape.webp"
          />
          <img
            src="/images/login/login-party-grimace-portrait.webp"
            alt=""
            fetchPriority="high"
            className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500 ${
              step === "code" ? "opacity-100" : "opacity-0"
            }`}
          />
        </picture>
      </div>

      <div className="w-full max-w-md px-4">
        <div
          className="rounded-lg border-2 border-amber-900/70 bg-[#f4e9d1]/95 px-5 py-5 shadow-2xl shadow-black/50 backdrop-blur-sm sm:px-7 sm:py-6"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at top, rgba(120,70,20,0.08) 0%, transparent 70%)",
          }}
          data-testid="login-card"
        >
          <h1 className="font-heading mb-1 text-center text-2xl tracking-wide text-amber-950 sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mb-5 text-center text-sm text-amber-950/70">
            {step === "email" ? t("description") : t("enterCode", { email })}
          </p>

          {step === "email" ? (
            <form onSubmit={handleSendCode} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email"
                  className="font-heading text-xs uppercase tracking-wider text-amber-950/80"
                >
                  {t("emailLabel")}
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="h-11 rounded-md border-2 border-amber-900/60 bg-[#e8dab4] px-3 text-base text-amber-950 shadow-inner shadow-amber-900/20 placeholder:text-amber-950/40 focus:outline-none focus:ring-2 focus:ring-amber-600"
                  data-testid="login-email-input"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex h-11 w-full items-center justify-center rounded-md border-2 border-amber-900/70 bg-gradient-to-b from-amber-400 to-amber-600 px-4 font-heading text-base font-semibold tracking-wide text-amber-950 shadow-md transition-all hover:from-amber-300 hover:to-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                data-testid="login-submit-button"
              >
                {loading ? (
                  <>
                    <Spinner className="mr-2" />
                    {t("submitting")}
                  </>
                ) : (
                  t("submit")
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="code"
                  className="font-heading text-xs uppercase tracking-wider text-amber-950/80"
                >
                  {t("codeLabel")}
                </label>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  placeholder={t("codePlaceholder")}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  autoFocus
                  required
                  className="h-12 rounded-md border-2 border-amber-900/60 bg-[#e8dab4] px-3 text-center font-mono text-2xl tracking-[0.3em] text-amber-950 shadow-inner shadow-amber-900/20 placeholder:text-amber-950/40 focus:outline-none focus:ring-2 focus:ring-amber-600"
                  data-testid="login-code-input"
                />
              </div>
              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="flex h-11 w-full items-center justify-center rounded-md border-2 border-amber-900/70 bg-gradient-to-b from-amber-400 to-amber-600 px-4 font-heading text-base font-semibold tracking-wide text-amber-950 shadow-md transition-all hover:from-amber-300 hover:to-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                data-testid="login-verify-button"
              >
                {loading ? (
                  <>
                    <Spinner className="mr-2" />
                    {t("verifyingCode")}
                  </>
                ) : (
                  t("verifyCode")
                )}
              </button>
              <div className="flex justify-between text-xs">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="font-medium text-amber-900 hover:underline"
                  data-testid="login-resend-button"
                >
                  {t("resendCode")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setCode("");
                    setError(null);
                    setMessage(null);
                  }}
                  className="text-amber-950/70 hover:underline"
                  data-testid="login-change-email-button"
                >
                  {t("changeEmail")}
                </button>
              </div>
            </form>
          )}

          {message && (
            <p
              role="status"
              aria-live="polite"
              className="mt-4 text-center text-sm font-medium text-green-800"
              data-testid="login-success-message"
            >
              {message}
            </p>
          )}
          {error && (
            <p
              role="alert"
              aria-live="assertive"
              className="mt-4 text-center text-sm font-medium text-red-800"
              data-testid="login-error-message"
            >
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
