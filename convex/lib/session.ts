import { ConvexError } from "convex/values";

import type { Doc } from "../_generated/dataModel";
import { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = MutationCtx | QueryCtx;
const SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const SESSION_IDLE_TIMEOUT_MS = 24 * 60 * 60 * 1000;

function isSessionExpired(session: Doc<"sessions">, now = Date.now()): boolean {
  const maxAgeExpired = now - session.createdAt > SESSION_MAX_AGE_MS;
  const idleExpired = now - session.lastSeenAt > SESSION_IDLE_TIMEOUT_MS;
  return maxAgeExpired || idleExpired;
}

export async function getSessionByToken(ctx: Ctx, token: string) {
  const trimmed = token.trim();
  if (!trimmed) return null;

  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", trimmed))
    .first();
  if (!session) return null;
  if (isSessionExpired(session)) return null;
  return session;
}

export async function requireUserForToken(ctx: Ctx, token: string) {
  const session = await getSessionByToken(ctx, token);
  if (!session) throw new ConvexError("Not logged in");

  const user = await ctx.db.get(session.userId);
  if (!user) throw new ConvexError("User not found");

  return { session, user };
}
