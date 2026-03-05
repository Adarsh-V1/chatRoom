import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { requireUserForToken } from "./lib/session";
import { assertUserCanAccessRoom } from "./lib/rooms";

type Ctx = MutationCtx | QueryCtx;

async function requireCallAccessByRoomId(
  ctx: Ctx,
  token: string,
  roomId: string
) {
  const { user } = await requireUserForToken(ctx, token);
  const call = await ctx.db
    .query("calls")
    .withIndex("by_roomId", (q) => q.eq("roomId", roomId))
    .order("desc")
    .first();

  if (!call || call.status !== "active") {
    throw new ConvexError("Call not found or inactive");
  }

  await assertUserCanAccessRoom(ctx, user, call.conversationId);
  return { user };
}

export const sendSignal = mutation({
  args: {
    token: v.string(),
    roomId: v.string(),
    type: v.string(),
    payload: v.string(),
  },
  handler: async (ctx, args) => {
    const roomId = args.roomId.trim();
    if (!roomId) throw new ConvexError("roomId is required");
    const { user } = await requireCallAccessByRoomId(ctx, args.token, roomId);

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
    const roomId = args.roomId.trim();
    if (!roomId) return [];
    const { user } = await requireCallAccessByRoomId(ctx, args.token, roomId);

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
