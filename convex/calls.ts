import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";

import { requireUserForToken } from "./lib/session";

function randomHex(byteLength = 8): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  let hex = "";
  for (let i = 0; i < bytes.length; i += 1) {
    hex += bytes[i]!.toString(16).padStart(2, "0");
  }
  return hex;
}

function slugRoomPart(input: string, maxLen = 48): string {
  const trimmed = input.trim();
  if (!trimmed) return "conversation";
  // LiveKit room names should be URL/identifier friendly.
  const safe = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return (safe || "conversation").slice(0, maxLen);
}

function makeRoomId(conversationId: string): string {
  const base = slugRoomPart(conversationId);
  return `call-${base}-${Date.now()}-${randomHex(6)}`;
}

export const startCall = mutation({
  args: { token: v.string(), conversationId: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);

    const conversationId = args.conversationId.trim();
    if (!conversationId) throw new ConvexError("conversationId is required");

    const existing = await ctx.db
      .query("calls")
      .withIndex("by_conversation_status", (q) =>
        q.eq("conversationId", conversationId).eq("status", "active")
      )
      .order("desc")
      .first();

    if (existing) return { roomId: existing.roomId };

    const roomId = makeRoomId(conversationId);

    await ctx.db.insert("calls", {
      roomId,
      conversationId,
      startedBy: user._id,
      status: "active",
      createdAt: Date.now(),
    });

    return { roomId };
  },
});

export const getActiveCall = query({
  args: { conversationId: v.string() },
  handler: async (ctx, args) => {
    const conversationId = args.conversationId.trim();
    if (!conversationId) return null;

    const call = await ctx.db
      .query("calls")
      .withIndex("by_conversation_status", (q) =>
        q.eq("conversationId", conversationId).eq("status", "active")
      )
      .order("desc")
      .first();

    if (!call) return null;

    const starter = await ctx.db.get(call.startedBy);

    return {
      roomId: call.roomId,
      conversationId: call.conversationId,
      startedBy: call.startedBy,
      startedByName: starter?.name ?? null,
      createdAt: call.createdAt,
    };
  },
});

export const getCallByRoomId = query({
  args: { roomId: v.string() },
  handler: async (ctx, args) => {
    const roomId = args.roomId.trim();
    if (!roomId) return null;

    const call = await ctx.db
      .query("calls")
      .withIndex("by_roomId", (q) => q.eq("roomId", roomId))
      .order("desc")
      .first();

    if (!call) return null;

    const starter = await ctx.db.get(call.startedBy);

    return {
      roomId: call.roomId,
      conversationId: call.conversationId,
      startedBy: call.startedBy,
      startedByName: starter?.name ?? null,
      status: call.status,
      createdAt: call.createdAt,
    };
  },
});

export const endCall = mutation({
  args: { token: v.string(), roomId: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);

    const roomId = args.roomId.trim();
    if (!roomId) throw new ConvexError("roomId is required");

    const call = await ctx.db
      .query("calls")
      .withIndex("by_roomId", (q) => q.eq("roomId", roomId))
      .order("desc")
      .first();

    if (!call) return;
    if (call.status !== "active") return;

    // Only the user who started the call can end it.
    if (call.startedBy !== user._id) throw new ConvexError("Only the call starter can end it");

    await ctx.db.patch(call._id, {
      status: "ended",
    });
  },
});
