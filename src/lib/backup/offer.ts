/** Session ids for which the backup dialog was already shown (this device). */
export const BACKUP_OFFERED_STORAGE_KEY = "chaos-forge-backup-offered";
const MAX_REMEMBERED = 50;

function readOffered(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(BACKUP_OFFERED_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function shouldOfferBackup(sessionId: string): boolean {
  return !readOffered().includes(sessionId);
}

export function markBackupOffered(sessionId: string): void {
  const offered = [...readOffered().filter((id) => id !== sessionId), sessionId];
  try {
    localStorage.setItem(
      BACKUP_OFFERED_STORAGE_KEY,
      JSON.stringify(offered.slice(-MAX_REMEMBERED))
    );
  } catch {
    // Without storage the dialog may show again — harmless.
  }
}
