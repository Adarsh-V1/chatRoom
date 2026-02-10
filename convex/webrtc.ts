import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireUserForToken } from "./lib/session";

export const sendSignal = mutation({
  args: {
    token: v.string(),
    roomId: v.string(),
    type: v.string(),
    payload: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const roomId = args.roomId.trim();
    if (!roomId) throw new ConvexError("roomId is required");

    await ctx.db.insert("webrtcSignals", {
      roomId,
      senderId: user._id,
      type: args.type,
      payload: args.payload,
      createdAt: Date.now(),
    });
  },
});

export const listSignals = query({
  args: {
    token: v.string(),
    roomId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const roomId = args.roomId.trim();
    if (!roomId) return [];

    const limit = Math.min(Math.max(args.limit ?? 120, 20), 300);

    const signals = await ctx.db
      .query("webrtcSignals")
      .withIndex("by_roomId", (q) => q.eq("roomId", roomId))
      .order("asc")
      .take(limit);

    return signals
      .filter((signal) => signal.senderId !== user._id)
      .map((signal) => ({
        _id: signal._id,
        type: signal.type,
        payload: signal.payload,
        createdAt: signal.createdAt,
      }));
  },
});
