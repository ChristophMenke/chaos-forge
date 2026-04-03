"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MarkdownRenderer as ReactMarkdown } from "@/components/markdown-renderer";
import remarkBreaks from "remark-breaks";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AvatarDisplay } from "@/components/avatar-display";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { SessionEntryRow } from "@/lib/supabase/types";

interface SessionEntryCardProps {
  entry: SessionEntryRow;
  characterName: string;
  characterAvatarUrl: string | null;
  isOwner: boolean;
  onEntryUpdate?: (entry: SessionEntryRow) => void;
  onEntryDelete?: (entryId: string) => void;
}

export function SessionEntryCard({
  entry,
  characterName,
  characterAvatarUrl,
  isOwner,
  onEntryUpdate,
  onEntryDelete,
}: SessionEntryCardProps) {
  const t = useTranslations("sessions");
  const tc = useTranslations("common");
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(entry.content);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("session_entries").update({ content }).eq("id", entry.id);
    onEntryUpdate?.({ ...entry, content });
    setSaving(false);
    setEditing(false);
  }

  async function handleDelete() {
    const supabase = createClient();
    await supabase.from("session_entries").delete().eq("id", entry.id);
    onEntryDelete?.(entry.id);
  }

  return (
    <>
      <Card data-testid={`session-entry-${entry.id}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AvatarDisplay name={characterName} avatarUrl={characterAvatarUrl} size={36} />
              <CardTitle className="text-lg">{characterName}</CardTitle>
            </div>
            {isOwner && !editing && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(true)}
                  data-testid={`entry-edit-${entry.id}`}
                >
                  {tc("edit")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-destructive hover:text-destructive"
                  data-testid={`entry-delete-${entry.id}`}
                >
                  {tc("delete")}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="flex flex-col gap-3">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px] w-full rounded-md border border-input bg-input p-3 text-sm"
                data-testid={`entry-edit-textarea-${entry.id}`}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setContent(entry.content);
                    setEditing(false);
                  }}
                >
                  {tc("cancel")}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  data-testid={`entry-save-${entry.id}`}
                >
                  {saving ? tc("saving") : tc("save")}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="prose prose-sm prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkBreaks]}>{entry.content}</ReactMarkdown>
              </div>
              {entry.audio_url && (
                <div className="mt-2" data-testid="voice-note-player">
                  <audio
                    controls
                    src={entry.audio_url}
                    className="h-8 w-full"
                    aria-label={`${t("voiceNote")} — ${characterName}`}
                  />
                  {entry.audio_transcription ? (
                    <p
                      className="mt-2 text-sm italic text-muted-foreground"
                      data-testid="voice-transcription"
                    >
                      {entry.audio_transcription}
                    </p>
                  ) : (
                    <p
                      className="mt-1 text-xs text-muted-foreground"
                      data-testid="transcription-pending"
                    >
                      {t("transcribing")}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDeleteConfirm}
        title={t("deleteEntry")}
        message={t("deleteEntryMessage")}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
