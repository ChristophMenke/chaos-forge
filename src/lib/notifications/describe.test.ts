import { describe, it, expect } from "vitest";
import { describeNotification, type Translate } from "./describe";
import type { NotificationRow } from "@/lib/supabase/types";

/** Echoes key and values, so the tests see exactly what goes into the translation. */
const t: Translate = (key, values) => (values ? `${key}:${JSON.stringify(values)}` : key);

function n(
  type: string,
  details: Record<string, unknown> = {},
  extra: Partial<NotificationRow> = {}
): NotificationRow {
  return {
    id: "n1",
    user_id: "u1",
    character_id: null,
    type: type as NotificationRow["type"],
    details,
    is_read: false,
    created_at: "2026-11-04T10:00:00Z",
    ...extra,
  };
}

describe("describeNotification — existing types (characterisation)", () => {
  it("items from the GM name character and item, with quantity as subtitle", () => {
    const d = describeNotification(
      n("gm_item_received", { character_name: "Thorin", item_name: "Seil", quantity: 3 }),
      t,
      "de"
    );
    expect(d).toEqual({
      message: 'gmItemReceived:{"character":"Thorin","item":"Seil"}',
      subtitle: 'quantityDetail:{"count":3}',
      href: null,
    });
  });

  it.each([
    ["party_item_received", "partyItemReceived"],
    ["trade_item_received", "tradeItemReceived"],
  ])("%s uses %s", (type, key) => {
    const d = describeNotification(
      n(type, { character_name: "A", item_name: "B", from_character: "C" }),
      t,
      "de"
    );
    expect(d.message.startsWith(`${key}:`)).toBe(true);
    expect(d.subtitle).toBe("");
  });

  it("gold lists PP, GP, SP and CP that are above zero", () => {
    const d = describeNotification(
      n("trade_gold_received", { character_name: "A", from_character: "B", pp: 1, gp: 0, sp: 2 }),
      t,
      "de"
    );
    expect(d.message).toBe('tradeGoldReceived:{"character":"A","from":"B"}');
    expect(d.subtitle).toBe("1 PP, 2 SP");
    expect(d.href).toBeNull();
  });

  it("session XP links to the XP dialog and formats the number for the locale", () => {
    const notification = n(
      "session_xp_awarded",
      { character_name: "A", xp_amount: 1200, session_id: "s1", session_title: "Grauzahn" },
      { character_id: "c1" }
    );

    expect(describeNotification(notification, t, "de")).toEqual({
      message: 'sessionXpAwarded:{"character":"A","xp":"1.200","sessionTitle":"Grauzahn"}',
      subtitle: "",
      href: "/characters/c1/manage?openXp=1&sessionId=s1&xpAmount=1200",
    });
    expect(describeNotification(notification, t, "en").message).toContain('"xp":"1,200"');
  });

  it("session XP without character has no link", () => {
    expect(describeNotification(n("session_xp_awarded", {}), t, "de").href).toBeNull();
  });

  it("game dates show the date, title and previous date and link to the settings", () => {
    const d = describeNotification(
      n("game_date_changed", {
        event_date: "2026-11-14",
        previous_event_date: "2026-11-07",
        title: "Finale",
      }),
      t,
      "de"
    );
    expect(d.message).toBe('gameDateChanged:{"date":"Sa., 14.11.2026"}');
    expect(d.subtitle).toBe('Finale · gameDatePrevious:{"date":"Sa., 07.11.2026"}');
    expect(d.href).toBe("/settings");
  });

  it("registrations and approvals keep their texts", () => {
    expect(
      describeNotification(n("new_user_registered", { user_email: "a@b.c" }), t, "de").message
    ).toBe('newUserRegistered:{"email":"a@b.c"}');
    expect(describeNotification(n("user_approved"), t, "de").message).toBe("userApproved");
  });

  it("unknown types fall back to the raw type", () => {
    expect(describeNotification(n("something_new"), t, "de")).toEqual({
      message: "something_new",
      subtitle: "",
      href: null,
    });
  });
});

describe("describeNotification — gallery", () => {
  it("announces new scenes and links to the gallery", () => {
    expect(describeNotification(n("gallery_images_added", { count: 3 }), t, "de")).toEqual({
      message: 'galleryImagesAdded:{"count":3}',
      subtitle: "",
      href: "/gallery",
    });
  });
});

describe("describeNotification — push test", () => {
  it("confirms push and links to the settings", () => {
    expect(describeNotification(n("push_test"), t, "de")).toEqual({
      message: "pushTest",
      subtitle: "",
      href: "/settings",
    });
  });
});
