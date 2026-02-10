import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

import { requireUserForToken } from "./lib/session";

export const getUserPriorities = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const rows = await ctx.db
      .query("userPriorities")
      .withIndex("by_user_otherNameLower", (q) => q.eq("userId", user._id))
      .collect();

    return rows.filter((r) => r.priority).map((r) => r.otherNameLower);
  },
});

export const getUserPriority = query({
  args: { token: v.string(), otherName: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const otherNameLower = args.otherName.trim().toLowerCase();
    if (!otherNameLower) return { priority: false };

    const existing = await ctx.db
      .query("userPriorities")
      .withIndex("by_user_otherNameLower", (q) =>
        q.eq("userId", user._id).eq("otherNameLower", otherNameLower)
      )
      .first();

    return { priority: existing?.priority ?? false };
  },
});

export const setUserPriority = mutation({
  args: { token: v.string(), otherName: v.string(), priority: v.boolean() },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const otherNameLower = args.otherName.trim().toLowerCase();
    if (!otherNameLower) return;

    const existing = await ctx.db
      .query("userPriorities")
      .withIndex("by_user_otherNameLower", (q) =>
        q.eq("userId", user._id).eq("otherNameLower", otherNameLower)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        priority: args.priority,
        updatedAt: Date.now(),
      });
      return;
    }

    await ctx.db.insert("userPriorities", {
      userId: user._id,
      otherNameLower,
      priority: args.priority,
      updatedAt: Date.now(),
    });
  },
});

export const getRoomPriority = query({
  args: { token: v.string(), room: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const room = args.room.trim();
    if (!room) return { priority: false };
    const existing = await ctx.db
      .query("chatPriorities")
      .withIndex("by_user_room", (q) => q.eq("userId", user._id).eq("room", room))
      .first();
    return { priority: existing?.priority ?? false };
  },
});

export const setRoomPriority = mutation({
  args: { token: v.string(), room: v.string(), priority: v.boolean() },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const room = args.room.trim();
    if (!room) return;

    const existing = await ctx.db
      .query("chatPriorities")
      .withIndex("by_user_room", (q) => q.eq("userId", user._id).eq("room", room))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        priority: args.priority,
        updatedAt: Date.now(),
      });
      return;
    }

    await ctx.db.insert("chatPriorities", {
      userId: user._id,
      room,
      priority: args.priority,
      updatedAt: Date.now(),
    });
  },
});
