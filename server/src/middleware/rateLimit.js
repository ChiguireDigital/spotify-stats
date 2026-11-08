const buckets = new Map();

function prune(now) {
  if (buckets.size < 5000) return;
  for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
}

export function rateLimit({ windowMs = 60_000, max = 60, keyPrefix = 'rl' } = {}) {
  return (req, res, next) => {
    const now = Date.now();
    prune(now);
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const key = `${keyPrefix}:${ip}`;
    const entry = buckets.get(key);
    if (!entry || entry.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({ error: 'Demasiadas solicitudes. Inténtalo en un momento.' });
    }
    return next();
  };
}

export function checkSocketRate(userId, { windowMs = 60_000, max = 20, keyPrefix = 'chat' } = {}) {
  const now = Date.now();
  prune(now);
  const key = `${keyPrefix}:${userId}`;
  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  entry.count += 1;
  if (entry.count > max) return { ok: false, retryAfterMs: entry.resetAt - now };
  return { ok: true };
}
