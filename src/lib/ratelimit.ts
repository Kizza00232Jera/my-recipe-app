import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 10 uploads per hour per user
export const uploadRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  prefix: "ratelimit:upload",
});

// 20 deletes per hour per user
export const deleteRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 h"),
  prefix: "ratelimit:delete",
});
