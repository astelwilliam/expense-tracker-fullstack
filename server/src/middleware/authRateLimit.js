// Basic single-process protection for a small demo. Use a shared store when scaling.
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const LIMIT = 20;
let seen = 0;

export default function authRateLimit(req, res, next) {
  const now = Date.now();
  if (++seen % 500 === 0) {
    for (const [key, entry] of attempts) {
      if (entry.resetAt < now) attempts.delete(key);
    }
  }
  const key = req.ip;
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }
  entry.count++;
  if (entry.count > LIMIT) {
    res.set("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
    return res.status(429).json({ message: "Too many attempts. Try again later." });
  }
  return next();
}
