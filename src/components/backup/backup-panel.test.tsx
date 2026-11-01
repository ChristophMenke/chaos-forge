import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { BuiltBackup, BackupPhase } from "@/lib/backup/build-backup";

vi.mock("next-intl", () => ({
  useLocale: () => "de",
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
}));

const saveAs = vi.fn();
vi.mock("file-saver", () => ({ saveAs, default: { saveAs } }));

let resolveBuild: (value: BuiltBackup) => void;
let rejectBuild: (error: Error) => void;
let reportProgress: (phase: BackupPhase, done: number, total: number) => void;
const buildBackup = vi.fn(
  (options: { onProgress?: (phase: BackupPhase, done: number, total: number) => void }) => {
    reportProgress = options.onProgress ?? (() => {});
    return new Promise<BuiltBackup>((resolve, reject) => {
      resolveBuild = resolve;
      rejectBuild = reject;
    });
  }
);
vi.mock("@/lib/backup/build-backup", () => ({ buildBackup }));

const { BackupPanel } = await import("./backup-panel");

const BUILT: BuiltBackup = {
  zip: new Uint8Array(2 * 1024 * 1024),
  fileName: "chaos-forge-backup-2026-11-01.zip",
  imageCount: 58,
  failedImages: [],
};

function setShareSupport(supported: boolean, share = vi.fn(async () => {})) {
  Object.defineProperty(navigator, "canShare", {
    configurable: true,
    value: supported ? () => true : undefined,
  });
  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: supported ? share : undefined,
  });
  return share;
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  cleanup();
  setShareSupport(false);
});

async function buildTo(result: BuiltBackup) {
  render(<BackupPanel />);
  fireEvent.click(screen.getByRole("button", { name: "create" }));
  await act(async () => resolveBuild(result));
}

describe("BackupPanel", () => {
  it("shows progress while the backup is built", async () => {
    render(<BackupPanel />);
    fireEvent.click(screen.getByRole("button", { name: "create" }));

    act(() => reportProgress("images", 34, 58));

    expect(screen.getByText('loadingImages {"done":34,"total":58}')).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "create" })).not.toBeInTheDocument();
  });

  it("names the finished file with its size", async () => {
    await buildTo(BUILT);

    expect(
      screen.getByText('ready {"name":"chaos-forge-backup-2026-11-01.zip","size":"2,0 MB"}')
    ).toBeInTheDocument();
  });

  it("offers the share sheet only where files can be shared, and shares just the file", async () => {
    const share = setShareSupport(true);
    await buildTo(BUILT);

    fireEvent.click(screen.getByRole("button", { name: "share" }));

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    const [data] = share.mock.calls[0] as unknown as [ShareData];
    expect(Object.keys(data)).toEqual(["files"]);
    expect(data.files?.[0].name).toBe("chaos-forge-backup-2026-11-01.zip");
    expect(data.files?.[0].type).toBe("application/zip");
  });

  it("hides the share button where sharing files is not possible", async () => {
    setShareSupport(false);
    await buildTo(BUILT);

    expect(screen.queryByRole("button", { name: "share" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "download" })).toBeInTheDocument();
  });

  it("treats a cancelled share sheet as no error", async () => {
    setShareSupport(
      true,
      vi.fn(async () => {
        throw new DOMException("cancelled", "AbortError");
      })
    );
    await buildTo(BUILT);

    fireEvent.click(screen.getByRole("button", { name: "share" }));

    await waitFor(() => expect(navigator.share).toHaveBeenCalled());
    expect(screen.queryByText("error")).not.toBeInTheDocument();
  });

  it("downloads the zip", async () => {
    await buildTo(BUILT);

    fireEvent.click(screen.getByRole("button", { name: "download" }));

    await waitFor(() => expect(saveAs).toHaveBeenCalledTimes(1));
    expect(saveAs.mock.calls[0][1]).toBe("chaos-forge-backup-2026-11-01.zip");
  });

  it("mentions images that could not be loaded", async () => {
    await buildTo({
      ...BUILT,
      failedImages: [{ bucket: "avatars", path: "x.webp", reason: "HTTP 404" }],
    });

    expect(screen.getByText('failedImages {"count":1}')).toBeInTheDocument();
  });

  it("offers a retry after a failure", async () => {
    render(<BackupPanel />);
    fireEvent.click(screen.getByRole("button", { name: "create" }));
    await act(async () => rejectBuild(new Error("HTTP 500")));

    expect(screen.getByText("error")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "retry" }));
    expect(buildBackup).toHaveBeenCalledTimes(2);
  });
});
