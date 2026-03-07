import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

import { requireUserForToken } from "./lib/session";
import { assertUserCanAccessRoom } from "./lib/rooms";
import {
  getReadSeqForRoom,
  getRoomMessageSeq,
  getUnreadCountForRoom,
  markRoomRead,
} from "./lib/unreadCounters";

export const getUnreadInfo = query({
  args: { token: v.string(), room: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const room = args.room.trim();
    if (!room) return { unreadCount: 0, fromCreationTime: 0, toCreationTime: 0 };
    await assertUserCanAccessRoom(ctx, user, room);

    const readSeq = await getReadSeqForRoom(ctx, user._id, room);
    const unreadCount = await getUnreadCountForRoom(ctx, user._id, room);
    if (unreadCount <= 0) {
      return { unreadCount: 0, fromCreationTime: 0, toCreationTime: 0 };
    }

    const firstUnread = await ctx.db
      .query("chats")
      .withIndex("by_room_seq", (q) => q.eq("room", room).gt("seq", readSeq))
      .order("asc")
      .first();
    const lastUnread = await ctx.db
      .query("chats")
      .withIndex("by_room_seq", (q) => q.eq("room", room).gt("seq", readSeq))
      .order("desc")
      .first();

    return {
      unreadCount,
      fromCreationTime: firstUnread?._creationTime ?? 0,
      toCreationTime: lastUnread?._creationTime ?? 0,
    };
  },
});

export const getUnreadMessages = query({
  args: { token: v.string(), room: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const room = args.room.trim();
    if (!room) return [];
    await assertUserCanAccessRoom(ctx, user, room);

    const lastReadSeq = await getReadSeqForRoom(ctx, user._id, room);
    const limit = Math.max(1, Math.min(args.limit ?? 200, 500));

    const unread = await ctx.db
      .query("chats")
      .withIndex("by_room_seq", (q) => q.eq("room", room).gt("seq", lastReadSeq))
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
    const myReadStates = await ctx.db
      .query("chatReadStates")
      .withIndex("by_user_room", (q) => q.eq("userId", user._id))
      .collect();
    const myReadSeqMap = new Map(
      myReadStates.map((state) => [state.room, state.lastReadSeq ?? -1] as const)
    );

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
      const roomMessageSeq = await getRoomMessageSeq(ctx, room);
      const knownReadSeq = myReadSeqMap.get(room);
      const lastReadSeq =
        knownReadSeq === undefined
          ? 0
          : knownReadSeq >= 0
            ? knownReadSeq
            : await getReadSeqForRoom(ctx, user._id, room);
      results.push({ name: otherName, unreadCount: Math.max(0, roomMessageSeq - lastReadSeq) });
    }

    return results;
  },
});

export const markRead = mutation({
  args: {
    token: v.string(),
    room: v.string(),
    lastReadCreationTime: v.number(),
    lastReadSeq: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const room = args.room.trim();
    if (!room) return;
    await assertUserCanAccessRoom(ctx, user, room);

    const roomMessageSeq = await getRoomMessageSeq(ctx, room);
    const lastReadSeq = Math.max(0, args.lastReadSeq ?? roomMessageSeq);

    await markRoomRead(ctx, {
      userId: user._id,
      room,
      lastReadSeq,
      lastReadCreationTime: Math.max(0, args.lastReadCreationTime),
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
    await assertUserCanAccessRoom(ctx, user, room);

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
    await assertUserCanAccessRoom(ctx, user, room);

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
