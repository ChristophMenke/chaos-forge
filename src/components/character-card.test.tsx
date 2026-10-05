import { describe, it, expect, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { CharacterCard } from "./character-card";
import type { CharacterRow } from "@/lib/supabase/types";

afterEach(cleanup);

const character = {
  id: "c1",
  name: "Larry",
  avatar_url: "https://example.supabase.co/storage/v1/object/public/avatars/larry.webp",
  race_id: "human",
  class_id: "fighter",
  level: 3,
  hp_current: 20,
  hp_max: 24,
  alignment: "neutral_good",
  is_public: false,
} as unknown as CharacterRow;

function renderCard(priority?: boolean) {
  render(
    <CharacterCard
      character={character}
      classes={[]}
      isOwner
      isSharedWithMe={false}
      badgePrivateLabel="privat"
      badgeSharedLabel="geteilt"
      badgePublicLabel="öffentlich"
      locale="de"
      priority={priority}
    />
  );
  return screen.getByTestId("character-card-avatar");
}

describe("CharacterCard avatar loading", () => {
  // Every card used to be marked priority, so a list of characters preloaded
  // all avatars with high priority and competed with the visible ones.
  it("lazy-loads the avatar by default", () => {
    expect(renderCard()).toHaveAttribute("loading", "lazy");
  });

  it("loads the avatar eagerly when asked to", () => {
    expect(renderCard(true)).not.toHaveAttribute("loading", "lazy");
  });
});
