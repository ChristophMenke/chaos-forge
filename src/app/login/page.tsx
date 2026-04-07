"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      setError(err instanceof Error ? err.message : "Unknown error");
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
        window.location.href = "/characters";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }

    setLoading(false);
  }

  async function handleResend() {
    setLoading(true);
    setError(null);
    setMessage(null);
    setCode("");

    const supabase = createClient();
    const { error: resendError } = await supabase.auth.signInWithOtp({ email });

    if (resendError) {
      setError(resendError.message);
    } else {
      setMessage(t("success"));
    }

    setLoading(false);
  }

  return (
    <div className="relative flex flex-1 items-center justify-center px-6" data-testid="login-page">
      <Image
        src="/images/login-bg.webp"
        alt=""
        fill
        className="object-cover opacity-[0.12]"
        priority
      />
      <div
        className="glass glow-neutral relative z-10 rounded-xl p-6 w-full max-w-md"
        data-testid="login-card"
      >
        <div className="text-center mb-4">
          <h2 className="font-heading text-2xl text-primary">{t("title")}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {step === "email" ? t("description") : t("enterCode", { email })}
          </p>
        </div>
        {step === "email" ? (
          <form onSubmit={handleSendCode} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{t("emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="login-email-input"
              />
            </div>
            <Button type="submit" disabled={loading} data-testid="login-submit-button">
              {loading ? (
                <>
                  <Spinner className="mr-2" />
                  {t("submitting")}
                </>
              ) : (
                t("submit")
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="code">{t("codeLabel")}</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                placeholder={t("codePlaceholder")}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                className="text-center font-mono text-2xl tracking-[0.3em]"
                autoFocus
                required
                data-testid="login-code-input"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || code.length < 6}
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
            </Button>
            <div className="flex justify-between text-sm">
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="text-primary hover:underline"
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
                className="text-muted-foreground hover:underline"
              >
                {t("changeEmail")}
              </button>
            </div>
          </form>
        )}

        {message && (
          <p className="mt-4 text-sm text-green-500" data-testid="login-success-message">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-4 text-sm text-destructive" data-testid="login-error-message">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
