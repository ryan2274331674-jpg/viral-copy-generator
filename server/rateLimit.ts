import type { IncomingMessage } from "node:http";
import { getClientIp } from "./httpHelpers";

type RateRecord = {
  count: number;
  resetAt: number;
};

const records = new Map<string, RateRecord>();

const getRateLimitConfig = () => ({
  max: Number(process.env.RATE_LIMIT_MAX || 20),
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000),
});

export const checkRateLimit = (request: IncomingMessage) => {
  const { max, windowMs } = getRateLimitConfig();
  const now = Date.now();
  const key = getClientIp(request);
  const current = records.get(key);

  if (!current || current.resetAt <= now) {
    records.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: Math.max(max - 1, 0), resetAt: now + windowMs };
  }

  if (current.count >= max) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  return { allowed: true, remaining: Math.max(max - current.count, 0), resetAt: current.resetAt };
};
