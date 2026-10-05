/**
 * Guards the keep-alive endpoint against being called by anyone but Vercel Cron.
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET` on every cron invocation as
 * soon as the `CRON_SECRET` env var exists. The secret is optional on purpose:
 * without it the cron still works and the endpoint stays open — it only reads a
 * single row of public seed data, so the worst case is a wasted query.
 */
export function isAuthorizedCronRequest(
  authorizationHeader: string | null,
  configuredSecret: string | undefined
): boolean {
  const secret = configuredSecret?.trim();
  if (!secret) return true;

  return authorizationHeader === `Bearer ${secret}`;
}
