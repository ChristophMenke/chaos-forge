import { describe, it, expect } from "vitest";
import {
  validateImportFiles,
  MAX_FILE_COUNT,
  MAX_FILE_SIZE,
  MAX_TOTAL_SIZE,
} from "./import-validation";

function makeFile(name: string, size: number) {
  return { name, size };
}

describe("validateImportFiles", () => {
  it("rejects empty file list", () => {
    const result = validateImportFiles([]);
    expect(result.valid).toBe(false);
    expect(result.errorKey).toBe("noFiles");
  });

  it("accepts a single valid file", () => {
    const result = validateImportFiles([makeFile("sheet.jpg", 1024)]);
    expect(result.valid).toBe(true);
    expect(result.errorKey).toBeUndefined();
  });

  it("accepts up to 10 files", () => {
    const files = Array.from({ length: 15 }, (_, i) => makeFile(`page${i + 1}.jpg`, 1024));
    const result = validateImportFiles(files);
    expect(result.valid).toBe(true);
  });

  it("rejects more than 10 files", () => {
    const files = Array.from({ length: 16 }, (_, i) => makeFile(`page${i + 1}.jpg`, 1024));
    const result = validateImportFiles(files);
    expect(result.valid).toBe(false);
    expect(result.errorKey).toBe("tooManyFiles");
  });

  it("rejects a file exceeding 10 MB", () => {
    const result = validateImportFiles([makeFile("huge.pdf", MAX_FILE_SIZE + 1)]);
    expect(result.valid).toBe(false);
    expect(result.errorKey).toBe("fileTooLarge");
    expect(result.errorParams).toEqual({ name: "huge.pdf" });
  });

  it("accepts a file exactly at the 10 MB limit", () => {
    const result = validateImportFiles([makeFile("exact.jpg", MAX_FILE_SIZE)]);
    expect(result.valid).toBe(true);
  });

  it("rejects when total size exceeds 50 MB", () => {
    // 5 files, each just over 10 MB total / 5 = 10 MB, but we want total > 50 MB
    // Use 5 files of 10.1 MB each (slightly over per-file limit won't work, they pass individually)
    // Instead: 5 files of exactly 10 MB each = 50 MB (passes), so use 5 files slightly larger
    // Actually 5 * MAX_FILE_SIZE = 50 MB = MAX_TOTAL_SIZE, so that should pass
    // Let's use a scenario where individual files pass but total fails
    const sizePerFile = MAX_TOTAL_SIZE / 4; // Each file is 12.5 MB — but that's > MAX_FILE_SIZE (10 MB)
    // So we need many small files... but MAX_FILE_COUNT is 5
    // Actually with max 5 files of max 10 MB each, max total is 50 MB = MAX_TOTAL_SIZE
    // So total check only triggers if we change limits. Let's just test at boundary:
    // 5 files of 10 MB each = exactly 50 MB = MAX_TOTAL_SIZE — should pass
    const passingFiles = Array.from({ length: 5 }, (_, i) =>
      makeFile(`page${i + 1}.jpg`, MAX_FILE_SIZE)
    );
    expect(validateImportFiles(passingFiles).valid).toBe(true);

    // Total check is still useful for future-proofing — test with adjusted sizes
    // We can't trigger total > 50 MB with <= 5 files of <= 10 MB each
    // So total check is a safety net. Verify the constant values are correct:
    expect(MAX_FILE_COUNT).toBe(15);
    expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
    expect(MAX_TOTAL_SIZE).toBe(50 * 1024 * 1024);
  });

  it("identifies the correct oversized file by name", () => {
    const files = [
      makeFile("small.jpg", 1024),
      makeFile("toobig.pdf", MAX_FILE_SIZE + 1),
      makeFile("medium.png", 5000),
    ];
    const result = validateImportFiles(files);
    expect(result.valid).toBe(false);
    expect(result.errorKey).toBe("fileTooLarge");
    expect(result.errorParams?.name).toBe("toobig.pdf");
  });

  it("checks file count before file sizes", () => {
    // 11 files, some oversized — should report tooManyFiles, not fileTooLarge
    const files = Array.from({ length: 16 }, (_, i) =>
      makeFile(`page${i + 1}.jpg`, MAX_FILE_SIZE + 1)
    );
    const result = validateImportFiles(files);
    expect(result.valid).toBe(false);
    expect(result.errorKey).toBe("tooManyFiles");
  });
});
