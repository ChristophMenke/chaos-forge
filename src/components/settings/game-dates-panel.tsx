"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import {
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/glass-card";
import { createClient } from "@/lib/supabase/client";
import {
  splitUpcomingPast,
  formatGameDate,
  resolveGameDateTitle,
  validateGameDate,
  daysUntil,
  MAX_GAME_DATE_TITLE_LENGTH,
  type GameDateValidationError,
} from "@/lib/game-dates";
import { createGameDate, updateGameDate, deleteGameDate } from "@/lib/game-dates/api";
import type { GameDateRow } from "@/lib/supabase/types";

interface GameDatesPanelProps {
  initialDates: GameDateRow[];
  userId: string;
  /** Nicht freigegebene Nutzer sehen die Termine, dürfen sie aber nicht ändern. */
  canEdit: boolean;
}

type FormMode = { type: "create" } | { type: "edit"; id: string } | null;

const ERROR_MESSAGE_KEYS: Record<GameDateValidationError, string> = {
  dateRequired: "dates.errorDateRequired",
  dateInvalid: "dates.errorDateInvalid",
  titleTooLong: "dates.errorTitleTooLong",
};

export function GameDatesPanel({ initialDates, userId, canEdit }: GameDatesPanelProps) {
  const t = useTranslations("settings");
  const locale = useLocale();
  const router = useRouter();

  const [dates, setDates] = useState<GameDateRow[]>(initialDates);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [eventDate, setEventDate] = useState("");
  const [title, setTitle] = useState("");
  const [errorKey, setErrorKey] = useState<GameDateValidationError | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);

  const { upcoming, past } = splitUpcomingPast(dates);
  // Warnung (z. B. Datum in der Vergangenheit) erscheint sofort beim Tippen,
  // die blockierende Fehlermeldung erst beim Speicherversuch.
  const warning = eventDate ? validateGameDate({ eventDate, title }).warning : null;

  function openCreateForm() {
    setFormMode({ type: "create" });
    setEventDate("");
    setTitle("");
    setErrorKey(null);
  }

  function openEditForm(date: GameDateRow) {
    setFormMode({ type: "edit", id: date.id });
    setEventDate(date.event_date);
    setTitle(date.title ?? "");
    setErrorKey(null);
    setConfirmDeleteId(null);
  }

  function closeForm() {
    setFormMode(null);
    setEventDate("");
    setTitle("");
    setErrorKey(null);
  }

  async function handleSave() {
    if (!formMode || saving) return;

    const validation = validateGameDate({ eventDate, title });
    if (validation.error) {
      setErrorKey(validation.error);
      return;
    }
    setErrorKey(null);
    setSaving(true);

    try {
      const supabase = createClient();

      if (formMode.type === "create") {
        const { data, error } = await createGameDate(supabase, { eventDate, title, userId });
        if (error || !data) {
          toast.error(t("dates.saveError"));
          return;
        }
        setDates((prev) => [...prev, data]);
        toast.success(t("dates.created"));
      } else {
        const { data, error } = await updateGameDate(supabase, formMode.id, { eventDate, title });
        if (error || !data) {
          toast.error(t("dates.saveError"));
          return;
        }
        setDates((prev) => prev.map((d) => (d.id === data.id ? data : d)));
        toast.success(t("dates.updated"));
      }

      closeForm();
      // Der Dashboard-Banner rendert serverseitig — ohne Refresh zeigt er den alten Termin.
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (deletingId) return;
    setDeletingId(id);
    try {
      const { error } = await deleteGameDate(createClient(), id);
      if (error) {
        toast.error(t("dates.deleteError"));
        return;
      }
      setDates((prev) => prev.filter((d) => d.id !== id));
      setConfirmDeleteId(null);
      if (formMode?.type === "edit" && formMode.id === id) closeForm();
      toast.success(t("dates.deleted"));
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  function countdownLabel(iso: string): string {
    const days = daysUntil(iso);
    if (days === 0) return t("dates.today");
    if (days === 1) return t("dates.tomorrow");
    return t("dates.inDays", { count: days });
  }

  function renderRow(date: GameDateRow, isPast: boolean) {
    const confirming = confirmDeleteId === date.id;

    return (
      <div
        key={date.id}
        className={`rounded-md border border-border/60 bg-background/30 p-3 ${
          isPast ? "opacity-60" : ""
        }`}
        data-testid={`game-date-row-${date.id}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate font-medium" title={date.title ?? undefined}>
              {resolveGameDateTitle(date.title, t("dates.fallbackTitle"))}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatGameDate(date.event_date, locale)}
              {!isPast && <> · {countdownLabel(date.event_date)}</>}
            </p>
          </div>

          {canEdit && (
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => openEditForm(date)}
                className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
                aria-label={t("dates.edit")}
                data-testid={`game-date-edit-${date.id}`}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(confirming ? null : date.id)}
                className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label={t("dates.delete")}
                data-testid={`game-date-delete-${date.id}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {confirming && canEdit && (
          <div className="mt-2 flex flex-col gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 sm:flex-row sm:items-center">
            <p
              role="status"
              className="flex-1 text-sm text-destructive"
              data-testid={`game-date-delete-confirm-${date.id}`}
            >
              {t("dates.deleteConfirm")}
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(date.id)}
                disabled={deletingId === date.id}
                data-testid={`game-date-delete-submit-${date.id}`}
              >
                {deletingId === date.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("dates.deleteYes")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDeleteId(null)}
                disabled={deletingId === date.id}
                data-testid={`game-date-delete-cancel-${date.id}`}
              >
                {t("cancel")}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <GlassCard hover={false} data-testid="settings-section-dates">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <h2 className="font-heading text-lg text-primary">{t("dates.section")}</h2>
        </div>
        {canEdit && !formMode && (
          <Button size="sm" onClick={openCreateForm} data-testid="game-dates-add">
            <Plus className="mr-2 h-4 w-4" />
            {t("dates.add")}
          </Button>
        )}
      </div>

      <p className="mb-3 text-sm text-muted-foreground">
        {canEdit ? t("dates.hint") : t("dates.readOnlyHint")}
      </p>

      {formMode && canEdit && (
        <div
          className="mb-3 flex flex-col gap-3 rounded-md border border-primary/30 bg-primary/5 p-3"
          data-testid="game-date-form"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="sm:w-48">
              <label htmlFor="game-date-date" className="mb-1 block text-xs text-muted-foreground">
                {t("dates.dateLabel")}
              </label>
              <Input
                id="game-date-date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                data-testid="game-date-date-input"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="game-date-title" className="mb-1 block text-xs text-muted-foreground">
                {t("dates.titleLabel")}
              </label>
              <Input
                id="game-date-title"
                value={title}
                maxLength={MAX_GAME_DATE_TITLE_LENGTH}
                placeholder={t("dates.titlePlaceholder")}
                onChange={(e) => setTitle(e.target.value)}
                data-testid="game-date-title-input"
              />
            </div>
          </div>

          {errorKey && (
            <p role="alert" className="text-sm text-destructive" data-testid="game-date-error">
              {t(ERROR_MESSAGE_KEYS[errorKey])}
            </p>
          )}
          {!errorKey && warning === "datePast" && (
            <p
              role="status"
              className="flex items-center gap-2 text-sm text-amber-500"
              data-testid="game-date-warning"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t("dates.warningDatePast")}
            </p>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} data-testid="game-date-save">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("save")}
            </Button>
            <Button
              variant="ghost"
              onClick={closeForm}
              disabled={saving}
              data-testid="game-date-cancel"
            >
              {t("cancel")}
            </Button>
          </div>
        </div>
      )}

      {upcoming.length === 0 ? (
        <p className="text-sm text-muted-foreground" data-testid="game-dates-empty">
          {t("dates.empty")}
        </p>
      ) : (
        <div className="flex flex-col gap-2" data-testid="game-dates-upcoming">
          {upcoming.map((date) => renderRow(date, false))}
        </div>
      )}

      {past.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowPast((v) => !v)}
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            aria-expanded={showPast}
            data-testid="game-dates-past-toggle"
          >
            {showPast ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {t("dates.pastToggle", { count: past.length })}
          </button>
          {showPast && (
            <div className="mt-2 flex flex-col gap-2" data-testid="game-dates-past">
              {past.map((date) => renderRow(date, true))}
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}
