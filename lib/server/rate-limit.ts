// Fixed-window counter kept in module state, which only limits traffic within a single warm serverless instance: under concurrent load, Vercel can spin up several instances at once, each with its own independent Map, and an idle instance loses its counters the moment it's recycled. Good enough to blunt a script hammering this route from one place; not a hard cross-instance cap, that would need a shared store like Redis.
const hits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now >= entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}
