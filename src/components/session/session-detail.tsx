"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { MarkdownRenderer as ReactMarkdown } from "@/components/markdown-renderer";
import remarkBreaks from "remark-breaks";
import { Pencil, Check, X, ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { SessionEntryForm } from "./session-entry-form";
import { SessionEntryCard } from "./session-entry-card";
import { TagManager } from "./tag-manager";
import { SessionParticipants } from "./session-participants";
import { SessionXpDistribute } from "./session-xp-distribute";
import type {
  SessionRow,
  SessionEntryRow,
  TagRow,
  CharacterRow,
  XpHistoryRow,
} from "@/lib/supabase/types";

const TAG_COLORS: Record<string, string> = {
  npc: "bg-red-900/50 text-red-200",
  location: "bg-green-900/50 text-green-200",
  item: "bg-blue-900/50 text-blue-200",
  quest: "bg-purple-900/50 text-purple-200",
};

type ParticipantCharacter = Pick<
  CharacterRow,
  "id" | "name" | "avatar_url" | "race_id" | "class_id"
>;

interface SessionDetailProps {
  session: SessionRow;
  entries: SessionEntryRow[];
  entryCharacters: Pick<CharacterRow, "id" | "name" | "avatar_url" | "race_id" | "class_id">[];
  userCharacters: Pick<CharacterRow, "id" | "name" | "avatar_url">[];
  tags: TagRow[];
  allTags: TagRow[];
  userId: string;
  isCreator: boolean;
  xpHistory: XpHistoryRow[];
  entryCharacterMap: Record<
    string,
    Pick<CharacterRow, "id" | "name" | "avatar_url" | "race_id" | "class_id">
  >;
  participants: ParticipantCharacter[];
  externalParticipants: string[];
  allActiveCharacters: ParticipantCharacter[];
}

export function SessionDetail({
  session,
  entries,
  entryCharacters,
  userCharacters,
  tags,
  allTags,
  userId,
  isCreator,
  xpHistory,
  entryCharacterMap,
  participants: initialParticipants,
  externalParticipants: initialExternal,
  allActiveCharacters,
}: SessionDetailProps) {
  const router = useRouter();
  const t = useTranslations("sessions");
  const tc = useTranslations("common");
  const [summary, setSummary] = useState(session.summary);
  const [savingSummary, setSavingSummary] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [summaryDirty, setSummaryDirty] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entriesState, setEntries] = useState(entries);
  const [tagsState, setTags] = useState(tags);
  const [allTagsState, setAllTags] = useState(allTags);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(session.title);
  const [savingTitle, setSavingTitle] = useState(false);
  const [imageUrl, setImageUrl] = useState(session.image_url);
  const [imageGeneratedAt, setImageGeneratedAt] = useState(session.image_generated_at);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [localUpdatedAt, setLocalUpdatedAt] = useState(session.updated_at);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [participantsState, setParticipantsState] = useState(initialParticipants);
  const [externalState, setExternalState] = useState(initialExternal);

  async function handleSaveTitle() {
    if (!titleValue.trim()) return;
    setSavingTitle(true);
    const supabase = createClient();
    await supabase.from("sessions").update({ title: titleValue.trim() }).eq("id", session.id);
    setLocalUpdatedAt(new Date().toISOString());
    setSavingTitle(false);
    setEditingTitle(false);
  }

  async function handleDeleteSession() {
    const supabase = createClient();
    await supabase.from("sessions").delete().eq("id", session.id);
    router.push("/sessions");
  }

  const dateStr = new Date(session.session_date).toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const characterMap = Object.fromEntries(entryCharacters.map((c) => [c.id, c]));

  // Check if user already has an entry
  const userEntry = entriesState.find((e) => e.user_id === userId);
  const userHasCharacters = userCharacters.length > 0;

  async function handleSaveSummary() {
    setSavingSummary(true);
    const supabase = createClient();
    await supabase.from("sessions").update({ summary }).eq("id", session.id);
    setLocalUpdatedAt(new Date().toISOString());
    setSavingSummary(false);
    setSummaryDirty(false);
  }

  async function handleGenerateSummary() {
    if (entriesState.length === 0) return;
    setGeneratingSummary(true);

    try {
      const formattedEntries = entriesState.map((e) => ({
        characterName: characterMap[e.character_id]?.name ?? tc("unknown"),
        content:
          e.content + (e.audio_transcription ? `\n\n[Sprachnotiz]: ${e.audio_transcription}` : ""),
      }));

      const res = await fetch("/api/summarize-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: formattedEntries }),
      });

      const data = await res.json();

      if (data.error) {
        setErrorMessage(data.error);
      } else {
        setSummary(data.summary);
        setSummaryDirty(true);
        setErrorMessage(null);
      }
    } catch {
      setErrorMessage("Zusammenfassung fehlgeschlagen.");
    }

    setGeneratingSummary(false);
  }

  const canRegenerate = !imageGeneratedAt || new Date(localUpdatedAt) > new Date(imageGeneratedAt);

  async function handleGenerateImage() {
    setGeneratingImage(true);
    try {
      const res = await fetch("/api/generate-session-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id }),
      });
      const data = await res.json();
      if (data.error) {
        setErrorMessage(data.error);
      } else {
        setImageUrl(data.imageUrl);
        setImageGeneratedAt(new Date().toISOString());
        setErrorMessage(null);
      }
    } catch {
      setErrorMessage("Bildgenerierung fehlgeschlagen.");
    }
    setGeneratingImage(false);
  }

  return (
    <div className="w-full p-6" data-testid="session-detail">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex-1">
          {editingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                className="font-heading text-2xl text-primary"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") {
                    setTitleValue(session.title);
                    setEditingTitle(false);
                  }
                }}
                data-testid="title-input"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSaveTitle}
                disabled={savingTitle || !titleValue.trim()}
                data-testid="save-title-button"
                aria-label={t("saveTitle")}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setTitleValue(session.title);
                  setEditingTitle(false);
                }}
                aria-label={tc("cancel")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-3xl text-primary" data-testid="session-title">
                {session.title}
              </h1>
              {isCreator && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingTitle(true)}
                  data-testid="edit-title-button"
                  aria-label={t("editTitle")}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          <p className="mt-1 text-sm text-muted-foreground">{dateStr}</p>
        </div>
        {isCreator && (
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            data-testid="session-delete-button"
          >
            {t("deleteTitle")}
          </Button>
        )}
      </div>

      {/* Mood image */}
      {imageUrl && (
        <div className="relative mb-4 h-48 w-full overflow-hidden rounded-xl">
          <Image
            src={imageUrl}
            alt={session.title}
            fill
            className="object-cover"
            data-testid="session-mood-image"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      )}

      {/* Generate mood image button */}
      <div className="mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateImage}
          disabled={generatingImage || !canRegenerate}
          data-testid="session-generate-image"
        >
          {generatingImage ? <Spinner className="mr-2" /> : <ImageIcon className="mr-2 h-4 w-4" />}
          {imageUrl ? t("regenerateMoodImage") : t("generateMoodImage")}
        </Button>
      </div>

      {errorMessage && (
        <div
          className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive"
          role="alert"
          data-testid="session-error-message"
        >
          {errorMessage}
          <button className="ml-2 text-xs underline" onClick={() => setErrorMessage(null)}>
            {tc("close")}
          </button>
        </div>
      )}

      <div className="mb-6">
        {tagsState.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tagsState.map((tag) => (
              <Badge key={tag.id} className={TAG_COLORS[tag.type] ?? ""} variant="secondary">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Tags Manager (for session creator) */}
      {isCreator && (
        <div className="mb-6">
          <TagManager
            sessionId={session.id}
            currentTags={tagsState}
            allTags={allTagsState}
            onTagsChange={setTags}
            onAllTagsChange={setAllTags}
          />
        </div>
      )}

      {/* Participants */}
      <div className="mb-6">
        <SessionParticipants
          sessionId={session.id}
          participants={participantsState}
          externalParticipants={externalState}
          allActiveCharacters={allActiveCharacters}
          isCreator={isCreator}
          onParticipantsChange={setParticipantsState}
          onExternalChange={setExternalState}
        />
      </div>

      {/* XP Distribution (creator only) */}
      {isCreator && (
        <div className="mb-6">
          <SessionXpDistribute
            sessionId={session.id}
            currentXpAwarded={session.xp_awarded}
            participantCount={participantsState.length}
          />
        </div>
      )}

      <Separator />

      {/* Entries */}
      <div className="my-6 flex flex-col gap-4">
        <h2 className="font-heading text-xl">{t("entries")}</h2>

        {entriesState.length === 0 && (
          <p className="text-sm text-muted-foreground" data-testid="no-entries">
            {t("noEntries")}
          </p>
        )}

        {entriesState.map((entry) => {
          const char = characterMap[entry.character_id];
          return (
            <SessionEntryCard
              key={entry.id}
              entry={entry}
              characterName={char?.name ?? tc("unknown")}
              characterAvatarUrl={char?.avatar_url ?? null}
              isOwner={entry.user_id === userId}
              onEntryUpdate={(updated) =>
                setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
              }
              onEntryDelete={(id) => setEntries((prev) => prev.filter((e) => e.id !== id))}
            />
          );
        })}

        {/* Entry Form (if user hasn't written one yet and has characters) */}
        {!userEntry && userHasCharacters && (
          <SessionEntryForm
            sessionId={session.id}
            userId={userId}
            userCharacters={userCharacters}
            onEntryCreated={(newEntry) => {
              setEntries((prev) => [
                ...prev,
                {
                  ...newEntry,
                  audio_url: newEntry.audio_url ?? null,
                  audio_transcription: null,
                  created_at: new Date().toISOString(),
                } as SessionEntryRow,
              ]);
              setLocalUpdatedAt(new Date().toISOString());
            }}
          />
        )}

        {!userHasCharacters && (
          <p className="text-sm text-muted-foreground">{t("noCharactersHint")}</p>
        )}
      </div>

      {/* XP earned in this session */}
      {xpHistory.length > 0 && (
        <>
          <Separator />
          <div className="my-6 flex flex-col gap-3" data-testid="session-xp-section">
            <h2 className="font-heading text-xl">{t("xpEarned")}</h2>
            <div className="flex flex-col gap-2">
              {xpHistory.map((xh) => {
                const char = entryCharacterMap[xh.character_id];
                return (
                  <div
                    key={xh.id}
                    className="flex items-center justify-between rounded-md border border-border px-4 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{char?.name ?? "?"}</span>
                      {xh.note && (
                        <span className="text-sm text-muted-foreground">— {xh.note}</span>
                      )}
                    </div>
                    <span className="font-mono text-sm text-green-400">
                      +{xh.xp_amount.toLocaleString()} XP
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Summary */}
      <div className="my-6 flex flex-col gap-3" data-testid="session-summary-section">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl">{t("summary")}</h2>
          <div className="flex gap-2">
            {entriesState.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateSummary}
                disabled={generatingSummary}
                data-testid="generate-summary-button"
              >
                {generatingSummary ? t("generating") : t("generateSummary")}
              </Button>
            )}
            {summaryDirty && (
              <Button
                size="sm"
                onClick={handleSaveSummary}
                disabled={savingSummary}
                data-testid="save-summary-button"
              >
                {savingSummary ? tc("saving") : tc("save")}
              </Button>
            )}
          </div>
        </div>

        {isCreator ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="summary-editor" className="sr-only">
              {t("summary")}
            </Label>
            <textarea
              id="summary-editor"
              value={summary}
              onChange={(e) => {
                setSummary(e.target.value);
                setSummaryDirty(true);
              }}
              className="min-h-[150px] w-full rounded-md border border-input bg-input p-3 text-sm"
              placeholder={t("summaryPlaceholder")}
              data-testid="summary-editor"
            />
            {summary && (
              <div className="rounded-md border border-border p-4">
                <p className="mb-2 text-xs text-muted-foreground">{t("preview")}</p>
                <div className="prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkBreaks]}>{summary}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        ) : summary ? (
          <div className="prose prose-sm prose-invert max-w-none rounded-md border border-border p-4">
            <ReactMarkdown remarkPlugins={[remarkBreaks]}>{summary}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("noSummary")}</p>
        )}
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title={t("deleteTitle")}
        message={t("deleteMessage", { title: session.title })}
        onConfirm={handleDeleteSession}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
