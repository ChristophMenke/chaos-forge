/**
 * Simple in-memory rate limiter (sufficient for ~10 users), shared by the
 * SvenBot chat and its summary endpoint so both count against one budget.
 */
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 20;
const RATE_WINDOW = 60_000;

export function checkRateLimit(userId: string, now = Date.now()): boolean {
  const timestamps = rateLimitMap.get(userId) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_WINDOW);
  if (recent.length >= RATE_LIMIT) return false;
  recent.push(now);
  rateLimitMap.set(userId, recent);
  return true;
}
