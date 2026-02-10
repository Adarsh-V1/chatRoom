import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

import { requireUserForToken } from "./lib/session";

const TYPING_TTL_MS = 8_000;

export const setTyping = mutation({
  args: {
    token: v.string(),
    room: v.string(),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const room = args.room.trim();
    if (!room) return;

    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_room_user", (q) => q.eq("room", room).eq("userId", user._id))
      .first();

    if (!args.isTyping) {
      if (existing) {
        await ctx.db.delete(existing._id);
      }
      return;
    }

    if (existing) {
      await ctx.db.patch(existing._id, { updatedAt: Date.now() });
      return;
    }

    await ctx.db.insert("typingIndicators", {
      room,
      userId: user._id,
      userName: user.name,
      updatedAt: Date.now(),
    });
  },
});

export const getTypingUsers = query({
  args: { token: v.string(), room: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const room = args.room.trim();
    if (!room) return [] as Array<{ name: string }>;

    const cutoff = Date.now() - TYPING_TTL_MS;
    const items = await ctx.db
      .query("typingIndicators")
      .withIndex("by_room_updatedAt", (q) => q.eq("room", room).gt("updatedAt", cutoff))
      .collect();

    return items
      .filter((item) => item.userId !== user._id)
      .map((item) => ({ name: item.userName }));
  },
});
