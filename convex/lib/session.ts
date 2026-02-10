import { ConvexError } from "convex/values";

import { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = MutationCtx | QueryCtx;

export async function getSessionByToken(ctx: Ctx, token: string) {
  const trimmed = token.trim();
  if (!trimmed) return null;

  return await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", trimmed))
    .first();
}

export async function requireUserForToken(ctx: Ctx, token: string) {
  const session = await getSessionByToken(ctx, token);
  if (!session) throw new ConvexError("Not logged in");

  const user = await ctx.db.get(session.userId);
  if (!user) throw new ConvexError("User not found");

  return { session, user };
}
