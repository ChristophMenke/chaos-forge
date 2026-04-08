"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AvatarDisplay } from "@/components/avatar-display";
import type { CharacterRow } from "@/lib/supabase/types";

type ParticipantCharacter = Pick<
  CharacterRow,
  "id" | "name" | "avatar_url" | "race_id" | "class_id"
>;

interface SessionParticipantsProps {
  sessionId: string;
  participants: ParticipantCharacter[];
  externalParticipants: string[];
  allActiveCharacters: ParticipantCharacter[];
  isCreator: boolean;
  onParticipantsChange: (participants: ParticipantCharacter[]) => void;
  onExternalChange: (external: string[]) => void;
}

export function SessionParticipants({
  sessionId,
  participants,
  externalParticipants,
  allActiveCharacters,
  isCreator,
  onParticipantsChange,
  onExternalChange,
}: SessionParticipantsProps) {
  const t = useTranslations("sessions");
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [externalInput, setExternalInput] = useState("");
  const [mutating, setMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const participantIds = useMemo(() => new Set(participants.map((p) => p.id)), [participants]);

  const filteredCharacters = useMemo(
    () =>
      allActiveCharacters.filter(
        (c) => !participantIds.has(c.id) && c.name.toLowerCase().includes(search.toLowerCase())
      ),
    [allActiveCharacters, participantIds, search]
  );

  // Close dropdown on click outside
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  async function handleAddParticipant(character: ParticipantCharacter) {
    setMutating(true);
    setMutationError(null);
    const supabase = createClient();
    const { error } = await supabase.from("session_participants").insert({
      session_id: sessionId,
      character_id: character.id,
    });
    setMutating(false);
    if (error) {
      setMutationError(error.message);
      return;
    }
    onParticipantsChange([...participants, character]);
    setSearch("");
    setDropdownOpen(false);
  }

  async function handleRemoveParticipant(characterId: string) {
    setMutating(true);
    setMutationError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("session_participants")
      .delete()
      .eq("session_id", sessionId)
      .eq("character_id", characterId);
    setMutating(false);
    if (error) {
      setMutationError(error.message);
      return;
    }
    onParticipantsChange(participants.filter((p) => p.id !== characterId));
  }

  async function handleAddExternal(name: string) {
    const trimmed = name.trim();
    if (!trimmed || externalParticipants.includes(trimmed)) return;
    const updated = [...externalParticipants, trimmed];
    setMutating(true);
    setMutationError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("sessions")
      .update({ external_participants: updated })
      .eq("id", sessionId);
    setMutating(false);
    if (error) {
      setMutationError(error.message);
      return;
    }
    onExternalChange(updated);
    setExternalInput("");
  }

  async function handleRemoveExternal(name: string) {
    const updated = externalParticipants.filter((n) => n !== name);
    setMutating(true);
    setMutationError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("sessions")
      .update({ external_participants: updated })
      .eq("id", sessionId);
    setMutating(false);
    if (error) {
      setMutationError(error.message);
      return;
    }
    onExternalChange(updated);
  }

  const hasParticipants = participants.length > 0 || externalParticipants.length > 0;

  return (
    <div className="flex flex-col gap-3" data-testid="session-participants-section">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl">{t("participants")}</h2>
        {isCreator && (
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="outline"
              size="sm"
              aria-expanded={dropdownOpen}
              aria-haspopup="listbox"
              disabled={mutating}
              onClick={() => {
                setDropdownOpen(!dropdownOpen);
                if (!dropdownOpen) {
                  setTimeout(() => searchRef.current?.focus(), 50);
                }
              }}
              data-testid="add-participant-button"
            >
              <Plus className="mr-1 h-4 w-4" />
              {t("addParticipant")}
            </Button>
            {dropdownOpen && (
              <div
                role="listbox"
                aria-label={t("searchCharacters")}
                className="glass absolute right-0 z-50 mt-1 w-72 rounded-lg border border-border p-2 shadow-lg"
              >
                <Input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("searchCharacters")}
                  className="mb-2"
                  data-testid="participant-search-input"
                />
                <div className="max-h-48 overflow-y-auto">
                  {filteredCharacters.length === 0 ? (
                    <p className="px-2 py-3 text-center text-sm text-muted-foreground">
                      {t("noParticipants")}
                    </p>
                  ) : (
                    filteredCharacters.map((char) => (
                      <button
                        key={char.id}
                        role="option"
                        aria-selected={false}
                        onClick={() => handleAddParticipant(char)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                        data-testid={`participant-option-${char.id}`}
                      >
                        <AvatarDisplay name={char.name} avatarUrl={char.avatar_url} size={24} />
                        <span>{char.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {mutationError && (
        <p className="text-sm text-destructive" role="alert" data-testid="participant-error">
          {mutationError}
        </p>
      )}

      {/* Character participants */}
      {hasParticipants ? (
        <div className="flex flex-wrap gap-2">
          {participants.map((char) => (
            <div
              key={char.id}
              className="glass flex items-center gap-2 rounded-full py-1 pl-1 pr-3"
              data-testid={`participant-chip-${char.id}`}
            >
              <AvatarDisplay name={char.name} avatarUrl={char.avatar_url} size={28} />
              <span className="text-sm">{char.name}</span>
              {isCreator && (
                <button
                  onClick={() => handleRemoveParticipant(char.id)}
                  disabled={mutating}
                  className="ml-1 rounded-full p-0.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                  aria-label={`${t("removeParticipant")} ${char.name}`}
                  data-testid={`remove-participant-${char.id}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          {/* External participants */}
          {externalParticipants.map((name) => (
            <div
              key={name}
              className="glass flex items-center gap-2 rounded-full px-3 py-1"
              data-testid={`external-participant-${name}`}
            >
              <span className="text-sm italic text-muted-foreground">{name}</span>
              {isCreator && (
                <button
                  onClick={() => handleRemoveExternal(name)}
                  disabled={mutating}
                  className="ml-1 rounded-full p-0.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                  aria-label={`${t("removeParticipant")} ${name}`}
                  data-testid={`remove-external-${name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("noParticipants")}</p>
      )}

      {/* External participants input */}
      {isCreator && (
        <div className="flex items-center gap-2">
          <Input
            value={externalInput}
            onChange={(e) => setExternalInput(e.target.value)}
            placeholder={t("externalParticipantsPlaceholder")}
            className="max-w-xs text-sm"
            disabled={mutating}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddExternal(externalInput);
              }
            }}
            data-testid="external-participants-input"
          />
          <span className="text-xs text-muted-foreground">{t("externalParticipants")}</span>
        </div>
      )}
    </div>
  );
}
