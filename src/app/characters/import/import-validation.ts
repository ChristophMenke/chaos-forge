export const MAX_FILE_COUNT = 15;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per file
export const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50 MB total

export interface FileValidationResult {
  valid: boolean;
  errorKey?: string;
  errorParams?: Record<string, string | number>;
}

/**
 * Validates an array of files against the multi-file import constraints.
 * Returns a validation result with an i18n error key if invalid.
 */
export function validateImportFiles(files: { name: string; size: number }[]): FileValidationResult {
  if (files.length === 0) {
    return { valid: false, errorKey: "noFiles" };
  }

  if (files.length > MAX_FILE_COUNT) {
    return { valid: false, errorKey: "tooManyFiles" };
  }

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, errorKey: "fileTooLarge", errorParams: { name: file.name } };
    }
  }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  if (totalSize > MAX_TOTAL_SIZE) {
    return { valid: false, errorKey: "totalTooLarge" };
  }

  return { valid: true };
}
