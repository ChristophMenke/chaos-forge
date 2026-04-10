"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { AudioRecorder } from "@/lib/utils/audio-recorder";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AvatarDisplay } from "@/components/avatar-display";
import type { CharacterRow } from "@/lib/supabase/types";

interface SessionEntryFormProps {
  sessionId: string;
  userId: string;
  userCharacters: Pick<CharacterRow, "id" | "name" | "avatar_url">[];
  onEntryCreated?: (entry: {
    id: string;
    session_id: string;
    character_id: string;
    user_id: string;
    content: string;
    audio_url?: string;
  }) => void;
}

export function SessionEntryForm({
  sessionId,
  userId,
  userCharacters,
  onEntryCreated,
}: SessionEntryFormProps) {
  const t = useTranslations("sessions");
  const tc = useTranslations("common");
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(
    userCharacters.length === 1 ? userCharacters[0].id : null
  );
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);

  // Memoized object URL for the audio blob — recreated only when blob changes.
  const audioUrl = useMemo(() => (audioBlob ? URL.createObjectURL(audioBlob) : null), [audioBlob]);
  // Cleanup effect: revoke previous URL when it changes or on unmount.
  useEffect(() => {
    if (!audioUrl) return;
    return () => URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  async function startRecording() {
    const recorder = new AudioRecorder();
    recorderRef.current = recorder;
    await recorder.start();
    setIsRecording(true);
  }

  async function stopRecording() {
    if (!recorderRef.current) return;
    const blob = await recorderRef.current.stop();
    setAudioBlob(blob);
    setIsRecording(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCharacterId || !content.trim()) return;

    setSaving(true);
    setError(null);

    const supabase = createClient();

    let audioUrl: string | undefined;
    if (audioBlob) {
      const filename = `voice-${crypto.randomUUID()}.webm`;
      const { data } = await supabase.storage.from("voice-notes").upload(filename, audioBlob);
      if (data) {
        const { data: urlData } = supabase.storage.from("voice-notes").getPublicUrl(filename);
        audioUrl = urlData.publicUrl;
      }
    }

    const { data: insertedEntry, error: insertError } = await supabase
      .from("session_entries")
      .insert({
        session_id: sessionId,
        character_id: selectedCharacterId,
        user_id: userId,
        content: content.trim(),
        ...(audioUrl && { audio_url: audioUrl }),
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    // Fire-and-forget: trigger transcription if audio was uploaded
    if (audioUrl && insertedEntry) {
      fetch("/api/transcribe-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioUrl, entryId: insertedEntry.id }),
      }).catch(() => {
        // Transcription failure is non-blocking
      });
    }

    if (insertedEntry) {
      onEntryCreated?.({
        id: insertedEntry.id,
        session_id: sessionId,
        character_id: selectedCharacterId!,
        user_id: userId,
        content: content.trim(),
        ...(audioUrl && { audio_url: audioUrl }),
      });
    }
    setContent("");
    setAudioBlob(null);
    setSaving(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-md border border-dashed border-border p-4"
      data-testid="session-entry-form"
    >
      <h3 className="font-heading text-lg">{t("writeEntry")}</h3>

      {/* Character selection */}
      {userCharacters.length > 1 && (
        <div className="flex flex-col gap-2">
          <Label>{t("whichCharacter")}</Label>
          <div className="flex flex-wrap gap-2">
            {userCharacters.map((char) => (
              <button
                key={char.id}
                type="button"
                onClick={() => setSelectedCharacterId(char.id)}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 transition-colors ${
                  selectedCharacterId === char.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/30"
                }`}
                data-testid={`entry-character-${char.id}`}
              >
                <AvatarDisplay name={char.name} avatarUrl={char.avatar_url} size={24} />
                <span className="text-sm">{char.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedCharacterId && (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="entry-content">
              {t("entryLabel")} <span className="text-muted-foreground">{t("entryHint")}</span>
            </Label>
            <textarea
              id="entry-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] w-full rounded-md border border-input bg-input p-3 text-sm"
              placeholder={t("entryPlaceholder")}
              data-testid="entry-content-textarea"
            />
          </div>

          {/* Voice note recording */}
          <div className="flex items-center gap-3">
            {!isRecording && !audioBlob && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={startRecording}
                data-testid="record-btn"
              >
                {t("record")}
              </Button>
            )}
            {isRecording && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={stopRecording}
                data-testid="stop-record-btn"
              >
                <span className="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
                {t("stopRecording")}
              </Button>
            )}
            {audioBlob && audioUrl && !isRecording && (
              <div className="flex items-center gap-2" data-testid="audio-preview">
                <audio controls src={audioUrl} className="h-8" />
                <Button type="button" variant="ghost" size="sm" onClick={() => setAudioBlob(null)}>
                  {t("removeRecording")}
                </Button>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saving || !content.trim()}
              data-testid="entry-submit-button"
            >
              {saving ? tc("saving") : t("publishEntry")}
            </Button>
          </div>
        </>
      )}

      {error && (
        <p className="text-sm text-destructive" data-testid="entry-error">
          {error}
        </p>
      )}
    </form>
  );
}
