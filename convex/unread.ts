import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

import { requireUserForToken } from "./lib/session";

import type { QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

async function getLastReadCreationTime(
  ctx: QueryCtx,
  userId: Id<"users">,
  room: string
) {
  const existing = await ctx.db
    .query("chatReadStates")
    .withIndex("by_user_room", (q) => q.eq("userId", userId).eq("room", room))
    .first();
  return existing?.lastReadCreationTime ?? 0;
}

export const getUnreadInfo = query({
  args: { token: v.string(), room: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const room = args.room.trim();
    if (!room) return { unreadCount: 0, fromCreationTime: 0, toCreationTime: 0 };

    const lastReadCreationTime = await getLastReadCreationTime(ctx, user._id, room);

    const unread = await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("room"), room))
      .filter((q) => q.gt(q.field("_creationTime"), lastReadCreationTime))
      .order("asc")
      .collect();

    // Count unread messages that are not authored by the current user.
    const unreadFromOthers = unread.filter((m) => !m.userId || m.userId !== user._id);

    const first = unreadFromOthers[0];
    const last = unreadFromOthers[unreadFromOthers.length - 1];

    return {
      unreadCount: unreadFromOthers.length,
      fromCreationTime: first?._creationTime ?? 0,
      toCreationTime: last?._creationTime ?? 0,
    };
  },
});

export const getUnreadMessages = query({
  args: { token: v.string(), room: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const room = args.room.trim();
    if (!room) return [];

    const lastReadCreationTime = await getLastReadCreationTime(ctx, user._id, room);
    const limit = Math.max(1, Math.min(args.limit ?? 200, 500));

    const unread = await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("room"), room))
      .filter((q) => q.gt(q.field("_creationTime"), lastReadCreationTime))
      .order("asc")
      .take(limit);

    return unread.filter((m) => !m.userId || m.userId !== user._id);
  },
});

export const getUnreadCountsForUsers = query({
  args: { token: v.string(), otherNames: v.array(v.string()) },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const meLower = user.nameLower ?? user.name.trim().toLowerCase();

    const otherNames = args.otherNames
      .map((n) => n.trim())
      .filter(Boolean)
      .slice(0, 80);

    const results = [] as Array<{ name: string; unreadCount: number }>;

    for (const otherName of otherNames) {
      const otherLower = otherName.toLowerCase();
      if (!otherLower || otherLower === meLower) {
        results.push({ name: otherName, unreadCount: 0 });
        continue;
      }

      const room = [meLower, otherLower].sort().join("-");
      const lastReadCreationTime = await getLastReadCreationTime(ctx, user._id, room);

      const unread = await ctx.db
        .query("chats")
        .filter((q) => q.eq(q.field("room"), room))
        .filter((q) => q.gt(q.field("_creationTime"), lastReadCreationTime))
        .order("asc")
        .collect();

      const unreadFromOthers = unread.filter((m) => !m.userId || m.userId !== user._id);
      results.push({ name: otherName, unreadCount: unreadFromOthers.length });
    }

    return results;
  },
});

export const markRead = mutation({
  args: { token: v.string(), room: v.string(), lastReadCreationTime: v.number() },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const room = args.room.trim();
    if (!room) return;

    const existing = await ctx.db
      .query("chatReadStates")
      .withIndex("by_user_room", (q) => q.eq("userId", user._id).eq("room", room))
      .first();

    const next = Math.max(0, args.lastReadCreationTime);

    if (existing) {
      if (existing.lastReadCreationTime >= next) return;
      await ctx.db.patch(existing._id, {
        lastReadCreationTime: next,
        updatedAt: Date.now(),
      });
      return;
    }

    await ctx.db.insert("chatReadStates", {
      userId: user._id,
      room,
      lastReadCreationTime: next,
      updatedAt: Date.now(),
    });
  },
});

export const storeSummary = mutation({
  args: {
    token: v.string(),
    room: v.string(),
    unreadCount: v.number(),
    fromCreationTime: v.number(),
    toCreationTime: v.number(),
    bullets: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const room = args.room.trim();
    if (!room) return null;

    const bullets = (args.bullets ?? []).map((b) => b.trim()).filter(Boolean).slice(0, 12);
    const now = Date.now();

    const id = await ctx.db.insert("chatSummaries", {
      userId: user._id,
      room,
      createdAt: now,
      unreadCount: Math.max(0, args.unreadCount),
      fromCreationTime: Math.max(0, args.fromCreationTime),
      toCreationTime: Math.max(0, args.toCreationTime),
      bullets,
    });

    return id;
  },
});

export const getLatestSummary = query({
  args: { token: v.string(), room: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const room = args.room.trim();
    if (!room) return null;

    const summary = await ctx.db
      .query("chatSummaries")
      .withIndex("by_user_room", (q) => q.eq("userId", user._id).eq("room", room))
      .order("desc")
      .first();

    if (!summary) return null;
    if (summary.dismissedAt) return null;

    // Treat as temporary: hide after 7 days.
    if (summary.createdAt < Date.now() - 7 * 24 * 60 * 60 * 1000) return null;

    return summary;
  },
});

export const dismissSummary = mutation({
  args: { token: v.string(), summaryId: v.id("chatSummaries") },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const summary = await ctx.db.get(args.summaryId);
    if (!summary) return;
    if (summary.userId !== user._id) return;
    if (summary.dismissedAt) return;
    await ctx.db.patch(summary._id, { dismissedAt: Date.now() });
  },
});
