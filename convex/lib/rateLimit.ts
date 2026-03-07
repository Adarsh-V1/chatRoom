import { ConvexError } from "convex/values";

import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

type EnforceRateLimitArgs = {
  userId: Id<"users">;
  action: string;
  limit: number;
  windowMs: number;
  cooldownMs: number;
  minIntervalMs?: number;
};

function formatRetryAfterMs(ms: number) {
  return Math.max(1, Math.ceil(ms / 1000));
}

export async function enforceRateLimit(
  ctx: MutationCtx,
  args: EnforceRateLimitArgs
): Promise<void> {
  const now = Date.now();
  const key = `${args.userId}:${args.action}`;

  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_key", (q) => q.eq("key", key))
    .first();

  if (!existing) {
    await ctx.db.insert("rateLimits", {
      key,
      action: args.action,
      userId: args.userId,
      windowStart: now,
      count: 1,
      lastActionAt: now,
      updatedAt: now,
    });
    return;
  }

  if (existing.blockedUntil && existing.blockedUntil > now) {
    const retryAfterSec = formatRetryAfterMs(existing.blockedUntil - now);
    throw new ConvexError(`Too many requests. Try again in ${retryAfterSec}s`);
  }

  if (args.minIntervalMs && now - existing.lastActionAt < args.minIntervalMs) {
    const blockedUntil = now + args.cooldownMs;
    await ctx.db.patch(existing._id, {
      blockedUntil,
      updatedAt: now,
      lastActionAt: now,
    });
    const retryAfterSec = formatRetryAfterMs(blockedUntil - now);
    throw new ConvexError(`You're sending too fast. Try again in ${retryAfterSec}s`);
  }

  const inWindow = now - existing.windowStart <= args.windowMs;
  const nextCount = inWindow ? existing.count + 1 : 1;
  const nextWindowStart = inWindow ? existing.windowStart : now;

  if (nextCount > args.limit) {
    const blockedUntil = now + args.cooldownMs;
    await ctx.db.patch(existing._id, {
      windowStart: nextWindowStart,
      count: nextCount,
      blockedUntil,
      lastActionAt: now,
      updatedAt: now,
    });

    const retryAfterSec = formatRetryAfterMs(blockedUntil - now);
    throw new ConvexError(`Rate limit exceeded. Try again in ${retryAfterSec}s`);
  }

  await ctx.db.patch(existing._id, {
    windowStart: nextWindowStart,
    count: nextCount,
    blockedUntil: undefined,
    lastActionAt: now,
    updatedAt: now,
  });
}
