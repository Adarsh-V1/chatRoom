import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

import { requireUserForToken } from "./lib/session";

export const getMySettings = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    return { focusMode: existing?.focusMode ?? false };
  },
});

export const setFocusMode = mutation({
  args: { token: v.string(), focusMode: v.boolean() },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        focusMode: args.focusMode,
        updatedAt: Date.now(),
      });
      return;
    }

    await ctx.db.insert("userSettings", {
      userId: user._id,
      focusMode: args.focusMode,
      updatedAt: Date.now(),
    });
  },
});
