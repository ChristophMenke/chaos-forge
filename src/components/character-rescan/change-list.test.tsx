import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import type { ScanChange, SelectedChange } from "@/lib/scan/character-diff-types";

afterEach(() => {
  cleanup();
});

// next-intl wird gemockt — wir wollen den rohen Key als Text zurück, damit
// wir dagegen assertieren können.
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "de",
}));

import { ChangeList } from "./change-list";

function makeChange(overrides: Partial<ScanChange> = {}): ScanChange {
  return {
    id: "core:hp_max",
    category: "core",
    kind: "scalar",
    labelKey: "field.hp_max",
    currentValue: 24,
    proposedValue: 29,
    source: "printed",
    defaultSelected: true,
    valueType: "number",
    target: { writes: [{ table: "characters", field: "hp_max" }] },
    ...overrides,
  };
}

const removal = makeChange({
  id: "lists:item:remove:fackel",
  category: "lists",
  kind: "list-remove",
  labelKey: "change.itemRemoved",
  labelText: "Fackel",
  currentValue: 3,
  proposedValue: null,
  defaultSelected: false,
  valueType: "none",
  noteKey: "removeHint",
  target: { writes: [{ table: "character_inventory", rowId: "inv-1" }] },
});

function renderList(changes: ScanChange[], onApply = vi.fn()) {
  render(<ChangeList changes={changes} onApply={onApply} />);
  return onApply;
}

/**
 * Klappt alle zugeklappten Gruppen auf. Gruppen ohne vorausgewählte Änderung
 * starten zu — Tests, die deren Zeilen brauchen, öffnen sie zuerst.
 */
function expandAllGroups() {
  for (const toggle of screen.queryAllByRole("button", { expanded: false })) {
    fireEvent.click(toggle);
  }
}

/** Liest die zuletzt an onApply übergebene Auswahl. */
function lastSelection(onApply: ReturnType<typeof vi.fn>): SelectedChange[] {
  return onApply.mock.calls.at(-1)![0] as SelectedChange[];
}

describe("ChangeList — empty state", () => {
  it("shows the no-changes message and no apply button", () => {
    renderList([]);
    expect(screen.getByTestId("rescan-no-changes")).toBeInTheDocument();
    expect(screen.queryByTestId("rescan-apply-button")).not.toBeInTheDocument();
  });
});

describe("ChangeList — rendering", () => {
  it("groups changes by category and counts them", () => {
    renderList([makeChange(), removal]);
    expect(screen.getByTestId("rescan-group-core")).toBeInTheDocument();
    expect(screen.getByTestId("rescan-group-lists")).toBeInTheDocument();
    expect(screen.getByTestId("rescan-group-count-core")).toHaveTextContent("1");
    expect(screen.getByTestId("rescan-group-count-lists")).toHaveTextContent("1");
  });

  it("does not render a group without changes", () => {
    renderList([makeChange()]);
    expect(screen.queryByTestId("rescan-group-identity")).not.toBeInTheDocument();
  });

  it("opens a group that has preselected changes and keeps a fully deselected one closed", () => {
    renderList([makeChange(), removal]);
    expect(screen.getByTestId("rescan-change-core:hp_max")).toBeInTheDocument();
    expect(screen.queryByTestId("rescan-change-lists:item:remove:fackel")).not.toBeInTheDocument();
    // Der Zähler verrät trotzdem, dass dort etwas liegt.
    expect(screen.getByTestId("rescan-group-count-lists")).toHaveTextContent("1");
  });

  it("reveals a closed group when its toggle is used", () => {
    renderList([makeChange(), removal]);
    fireEvent.click(screen.getByTestId("rescan-group-toggle-lists"));
    expect(screen.getByTestId("rescan-change-lists:item:remove:fackel")).toBeInTheDocument();
  });

  it("shows current and proposed value", () => {
    renderList([makeChange()]);
    const row = screen.getByTestId("rescan-change-core:hp_max");
    expect(within(row).getByTestId("rescan-change-core:hp_max-current")).toHaveTextContent("24");
    expect(within(row).getByTestId("rescan-change-core:hp_max-input")).toHaveValue(29);
  });

  it("renders the source badge", () => {
    renderList([makeChange({ source: "handwritten" })]);
    expect(screen.getByTestId("rescan-change-core:hp_max-source")).toHaveTextContent(
      "sourceHandwritten"
    );
  });

  it("renders a note when the change carries one", () => {
    renderList([removal]);
    expandAllGroups();
    expect(screen.getByTestId("rescan-change-lists:item:remove:fackel-note")).toHaveTextContent(
      "removeHint"
    );
  });

  it("renders no editor for changes without an editable value", () => {
    renderList([removal]);
    expandAllGroups();
    expect(
      screen.queryByTestId("rescan-change-lists:item:remove:fackel-input")
    ).not.toBeInTheDocument();
  });
});

describe("ChangeList — selection", () => {
  it("preselects exactly the changes marked as default", () => {
    renderList([makeChange(), removal]);
    expandAllGroups();
    expect(screen.getByTestId("rescan-change-core:hp_max-checkbox")).toBeChecked();
    expect(screen.getByTestId("rescan-change-lists:item:remove:fackel-checkbox")).not.toBeChecked();
    expect(screen.getByTestId("rescan-selected-count")).toHaveTextContent("1");
  });

  it("updates the counter when a row is toggled", () => {
    renderList([makeChange(), removal]);
    expandAllGroups();
    fireEvent.click(screen.getByTestId("rescan-change-lists:item:remove:fackel-checkbox"));
    expect(screen.getByTestId("rescan-selected-count")).toHaveTextContent("2");
    fireEvent.click(screen.getByTestId("rescan-change-core:hp_max-checkbox"));
    expect(screen.getByTestId("rescan-selected-count")).toHaveTextContent("1");
  });

  it("selects everything with the select-all action", () => {
    renderList([makeChange(), removal]);
    fireEvent.click(screen.getByTestId("rescan-select-all"));
    expect(screen.getByTestId("rescan-selected-count")).toHaveTextContent("2");
  });

  it("clears the selection with the select-none action", () => {
    renderList([makeChange(), removal]);
    fireEvent.click(screen.getByTestId("rescan-select-none"));
    expect(screen.getByTestId("rescan-selected-count")).toHaveTextContent("0");
  });

  it("shows the total regardless of selection", () => {
    renderList([makeChange(), removal]);
    expect(screen.getByTestId("rescan-total-count")).toHaveTextContent("2");
  });
});

describe("ChangeList — apply", () => {
  it("disables the apply button when nothing is selected", () => {
    renderList([makeChange()]);
    fireEvent.click(screen.getByTestId("rescan-select-none"));
    expect(screen.getByTestId("rescan-apply-button")).toBeDisabled();
  });

  it("hands over only the selected changes", () => {
    const onApply = renderList([makeChange(), removal]);
    fireEvent.click(screen.getByTestId("rescan-apply-button"));
    const selected = lastSelection(onApply).filter((c) => c.selected);
    expect(selected).toHaveLength(1);
    expect(selected[0].id).toBe("core:hp_max");
  });

  it("marks every change with its selection state", () => {
    const onApply = renderList([makeChange(), removal]);
    fireEvent.click(screen.getByTestId("rescan-apply-button"));
    expect(lastSelection(onApply)).toHaveLength(2);
  });

  it("disables the button while applying", () => {
    render(<ChangeList changes={[makeChange()]} onApply={vi.fn()} applying />);
    expect(screen.getByTestId("rescan-apply-button")).toBeDisabled();
  });
});

describe("ChangeList — editing", () => {
  it("passes an edited number through to the selection", () => {
    const onApply = renderList([makeChange()]);
    fireEvent.change(screen.getByTestId("rescan-change-core:hp_max-input"), {
      target: { value: "31" },
    });
    fireEvent.click(screen.getByTestId("rescan-apply-button"));
    expect(lastSelection(onApply)[0].editedValue).toBe(31);
  });

  it("passes an edited text through to the selection", () => {
    const onApply = renderList([
      makeChange({
        id: "identity:name",
        category: "identity",
        labelKey: "field.name",
        currentValue: "Thalia",
        proposedValue: "Thalia Sturmwind",
        valueType: "text",
        defaultSelected: false,
      }),
    ]);
    // Rein abgewählte Gruppen starten zugeklappt.
    fireEvent.click(screen.getByTestId("rescan-group-toggle-identity"));
    fireEvent.click(screen.getByTestId("rescan-change-identity:name-checkbox"));
    fireEvent.change(screen.getByTestId("rescan-change-identity:name-input"), {
      target: { value: "Thalia die Schnelle" },
    });
    fireEvent.click(screen.getByTestId("rescan-apply-button"));
    expect(lastSelection(onApply)[0].editedValue).toBe("Thalia die Schnelle");
  });

  it("leaves editedValue undefined when the user did not touch the field", () => {
    const onApply = renderList([makeChange()]);
    fireEvent.click(screen.getByTestId("rescan-apply-button"));
    expect(lastSelection(onApply)[0].editedValue).toBeUndefined();
  });

  it("selects a row automatically when its value is edited", () => {
    renderList([
      makeChange({ defaultSelected: false, id: "core:hp_current", labelKey: "field.hp_current" }),
    ]);
    expandAllGroups();
    fireEvent.change(screen.getByTestId("rescan-change-core:hp_current-input"), {
      target: { value: "20" },
    });
    expect(screen.getByTestId("rescan-change-core:hp_current-checkbox")).toBeChecked();
  });
});

describe("ChangeList — conflicts", () => {
  const conflicted = makeChange({
    source: "handwritten",
    proposedValue: 29,
    conflict: { printed: 25, handwritten: 29 },
  });

  it("shows both values of a conflict", () => {
    renderList([conflicted]);
    expect(screen.getByTestId("rescan-change-core:hp_max-conflict")).toBeInTheDocument();
  });

  it("switches the proposal to the printed value and back", () => {
    renderList([conflicted]);
    const input = screen.getByTestId("rescan-change-core:hp_max-input");
    expect(input).toHaveValue(29);

    fireEvent.click(screen.getByTestId("rescan-change-core:hp_max-conflict-toggle"));
    expect(input).toHaveValue(25);

    fireEvent.click(screen.getByTestId("rescan-change-core:hp_max-conflict-toggle"));
    expect(input).toHaveValue(29);
  });

  it("applies the switched value", () => {
    const onApply = renderList([conflicted]);
    fireEvent.click(screen.getByTestId("rescan-change-core:hp_max-conflict-toggle"));
    fireEvent.click(screen.getByTestId("rescan-apply-button"));
    expect(lastSelection(onApply)[0].editedValue).toBe(25);
  });

  it("renders no conflict row for an unambiguous change", () => {
    renderList([makeChange()]);
    expect(screen.queryByTestId("rescan-change-core:hp_max-conflict")).not.toBeInTheDocument();
  });
});
