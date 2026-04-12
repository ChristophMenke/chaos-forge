"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewSessionPage() {
  const t = useTranslations("sessions");
  const tc = useTranslations("common");
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError(tc("notLoggedIn"));
        setSaving(false);
        return;
      }

      const { data, error: insertError } = await supabase
        .from("sessions")
        .insert({
          title: title.trim(),
          session_date: sessionDate,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }

      router.push(`/sessions/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("createFailed"));
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-1 items-start justify-center p-6" data-testid="new-session-page">
      <div className="glass glow-neutral rounded-xl p-6 w-full max-w-md">
        <h2 className="font-heading text-2xl text-primary mb-4">{t("newSession")}</h2>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="session-title">{t("sessionTitle")}</Label>
            <Input
              id="session-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("sessionTitlePlaceholder")}
              required
              data-testid="session-title-input"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="session-date">{t("sessionDate")}</Label>
            <Input
              id="session-date"
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              required
              data-testid="session-date-input"
            />
          </div>
          <Button
            type="submit"
            disabled={saving || !title.trim()}
            data-testid="session-create-button"
          >
            {saving ? t("creating") : t("createSession")}
          </Button>
          {error && (
            <p className="text-sm text-destructive" data-testid="session-create-error">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
