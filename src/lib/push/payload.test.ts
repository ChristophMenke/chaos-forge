// @vitest-environment node
import { describe, it, expect } from "vitest";
import { buildPushPayload } from "./payload";
import type { NotificationRow } from "@/lib/supabase/types";

function n(type: NotificationRow["type"], details: Record<string, unknown> = {}): NotificationRow {
  return {
    id: "n42",
    user_id: "u1",
    character_id: null,
    type,
    details,
    is_read: false,
    created_at: "2026-11-04T10:00:00Z",
  };
}

describe("buildPushPayload", () => {
  it("uses the bell text in German and links to the gallery", () => {
    expect(buildPushPayload(n("gallery_images_added", { count: 3 }), "de")).toEqual({
      title: "Chaos Forge",
      body: "Der Meister hat 3 neue Szenen in die Galerie gehängt",
      url: "/gallery",
      tag: "n42",
    });
  });

  it("uses the bell text in English", () => {
    expect(buildPushPayload(n("gallery_images_added", { count: 1 }), "en").body).toBe(
      "The master hung a new scene in the gallery"
    );
  });

  it("appends the subtitle and falls back to the dashboard without a target", () => {
    const game = buildPushPayload(
      n("game_date_created", { event_date: "2026-11-14", title: "Finale" }),
      "de"
    );
    expect(game.body).toBe("Neuer Spieltermin: Sa., 14.11.2026 – Finale");
    expect(game.url).toBe("/settings");

    const gold = buildPushPayload(n("gm_gold_received", { character_name: "Thorin", gp: 5 }), "de");
    expect(gold.body).toBe("Thorin hat Gold erhalten (GM) – 5 GP");
    expect(gold.url).toBe("/dashboard");
  });

  it("has a friendly text for the test notification", () => {
    expect(buildPushPayload(n("push_test"), "de").body).toBe("Push funktioniert! Sven hört mit.");
  });
});
