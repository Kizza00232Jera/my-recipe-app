import "server-only";

import { currentUser } from "@clerk/nextjs/server";
import { Redis } from "@upstash/redis";
import type { QuotaKind, QuotaStatus } from "@/lib/ai/types";

// ─────────────────────────────────────────────────────────────────────────────
// Owner-funded AI quota.
//
// AI features run on the SITE OWNER'S Anthropic key, so we cap what each signed-in
// user can spend: two independent daily allowances ("ideas" and "generate"), each
// resetting at UTC midnight. The owner account(s) listed in AI_OWNER_EMAILS are
// unlimited. Counters live in Upstash Redis when configured (survives serverless
// cold starts / multiple instances); otherwise an in-memory fallback is used so
// local dev still works (not shared across instances — fine for one dev machine).
// ─────────────────────────────────────────────────────────────────────────────

const DAILY_LIMIT = Math.max(1, Number(process.env.AI_DAILY_LIMIT) || 5);

export class QuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuotaError";
  }
}

export type AiUser = { userId: string; email: string; isOwner: boolean };

function ownerEmails(): string[] {
  return (process.env.AI_OWNER_EMAILS || "antonio.jera10@gmail.com,ivanajerkovic52@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Resolves the current Clerk user and whether they're an unlimited owner. */
export async function requireAiUser(): Promise<AiUser> {
  const user = await currentUser();
  if (!user) throw new Error("Please sign in to use AI features.");
  const email = (
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    ""
  ).toLowerCase();
  return { userId: user.id, email, isOwner: !!email && ownerEmails().includes(email) };
}

// ── storage ──────────────────────────────────────────────────────────────────

let redisClient: Redis | null | undefined;
function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redisClient = url && token ? new Redis({ url, token }) : null;
  return redisClient;
}

const memStore = new Map<string, number>(); // dev fallback only

function utcDay(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

function nextResetIso(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  ).toISOString();
}

function storeKey(userId: string, kind: QuotaKind, day: string): string {
  return `ai:quota:${kind}:${userId}:${day}`;
}

async function readUsed(userId: string, kind: QuotaKind): Promise<number> {
  const key = storeKey(userId, kind, utcDay());
  const redis = getRedis();
  if (redis) return (await redis.get<number>(key)) ?? 0;
  return memStore.get(key) ?? 0;
}

async function incrementUsed(userId: string, kind: QuotaKind): Promise<number> {
  const key = storeKey(userId, kind, utcDay());
  const redis = getRedis();
  if (redis) {
    const used = await redis.incr(key);
    if (used === 1) await redis.expire(key, 60 * 60 * 48); // auto-clean after 48h
    return used;
  }
  const used = (memStore.get(key) ?? 0) + 1;
  memStore.set(key, used);
  return used;
}

function statusFromUsed(kind: QuotaKind, used: number, unlimited: boolean): QuotaStatus {
  return {
    kind,
    limit: DAILY_LIMIT,
    used: unlimited ? 0 : used,
    remaining: unlimited ? DAILY_LIMIT : Math.max(0, DAILY_LIMIT - used),
    unlimited,
    resetsAt: nextResetIso(),
  };
}

// ── public API ───────────────────────────────────────────────────────────────

/** Current allowances for both kinds, without consuming anything. */
export async function getAllQuotas(): Promise<Record<QuotaKind, QuotaStatus>> {
  const { userId, isOwner } = await requireAiUser();
  if (isOwner) {
    return {
      ideas: statusFromUsed("ideas", 0, true),
      generate: statusFromUsed("generate", 0, true),
    };
  }
  const [ideas, generate] = await Promise.all([
    readUsed(userId, "ideas"),
    readUsed(userId, "generate"),
  ]);
  return {
    ideas: statusFromUsed("ideas", ideas, false),
    generate: statusFromUsed("generate", generate, false),
  };
}

/**
 * Throws QuotaError if the user has no allowance left for `kind`. Does NOT
 * consume — call recordUsage() after the AI work succeeds so failed calls
 * don't burn a credit. Returns the resolved user for that follow-up call.
 */
export async function assertQuota(kind: QuotaKind): Promise<AiUser> {
  const user = await requireAiUser();
  if (user.isOwner) return user;
  const used = await readUsed(user.userId, kind);
  if (used >= DAILY_LIMIT) {
    const what = kind === "ideas" ? "AI idea requests" : "AI recipe generations";
    throw new QuotaError(
      `You've used all ${DAILY_LIMIT} free ${what} for today. They reset tomorrow.`
    );
  }
  return user;
}

/** Consumes one credit (no-op for owners) and returns the updated status. */
export async function recordUsage(user: AiUser, kind: QuotaKind): Promise<QuotaStatus> {
  if (user.isOwner) return statusFromUsed(kind, 0, true);
  const used = await incrementUsed(user.userId, kind);
  return statusFromUsed(kind, used, false);
}
