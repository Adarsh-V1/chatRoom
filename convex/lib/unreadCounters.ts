import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = MutationCtx | QueryCtx;

type ReadStateDoc = Doc<"chatReadStates">;

export async function getRoomMessageSeq(
  ctx: Ctx,
  room: string
): Promise<number> {
  const counter = await ctx.db
    .query("roomCounters")
    .withIndex("by_room", (q) => q.eq("room", room))
    .first();

  if (counter) {
    return Math.max(0, counter.messageSeq);
  }

  const latest = await ctx.db
    .query("chats")
    .withIndex("by_room", (q) => q.eq("room", room))
    .order("desc")
    .first();

  return Math.max(0, latest?.seq ?? 0);
}

async function resolveReadSeqFallback(
  ctx: Ctx,
  room: string,
  readState: ReadStateDoc
): Promise<number> {
  if (typeof readState.lastReadSeq === "number") {
    return Math.max(0, readState.lastReadSeq);
  }

  const lastReadCreationTime = Math.max(0, readState.lastReadCreationTime ?? 0);
  if (lastReadCreationTime === 0) {
    return 0;
  }

  const lastReadMessage = await ctx.db
    .query("chats")
    .withIndex("by_room", (q) => q.eq("room", room).lte("_creationTime", lastReadCreationTime))
    .order("desc")
    .first();

  return Math.max(0, lastReadMessage?.seq ?? 0);
}

export async function getReadStateForRoom(
  ctx: Ctx,
  userId: Id<"users">,
  room: string
): Promise<ReadStateDoc | null> {
  return await ctx.db
    .query("chatReadStates")
    .withIndex("by_user_room", (q) => q.eq("userId", userId).eq("room", room))
    .first();
}

export async function getReadSeqForRoom(
  ctx: Ctx,
  userId: Id<"users">,
  room: string
): Promise<number> {
  const readState = await getReadStateForRoom(ctx, userId, room);
  if (!readState) return 0;
  return await resolveReadSeqFallback(ctx, room, readState);
}

export async function incrementRoomMessageSeq(
  ctx: MutationCtx,
  room: string
): Promise<number> {
  const now = Date.now();
  const existing = await ctx.db
    .query("roomCounters")
    .withIndex("by_room", (q) => q.eq("room", room))
    .first();

  if (!existing) {
    await ctx.db.insert("roomCounters", {
      room,
      messageSeq: 1,
      updatedAt: now,
    });
    return 1;
  }

  const nextSeq = existing.messageSeq + 1;
  await ctx.db.patch(existing._id, {
    messageSeq: nextSeq,
    updatedAt: now,
  });
  return nextSeq;
}

export async function markRoomRead(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    room: string;
    lastReadSeq?: number;
    lastReadCreationTime?: number;
  }
): Promise<void> {
  const now = Date.now();
  const nextReadSeq = Math.max(0, args.lastReadSeq ?? 0);
  const nextReadCreationTime = Math.max(0, args.lastReadCreationTime ?? 0);

  const existing = await ctx.db
    .query("chatReadStates")
    .withIndex("by_user_room", (q) => q.eq("userId", args.userId).eq("room", args.room))
    .first();

  if (!existing) {
    await ctx.db.insert("chatReadStates", {
      userId: args.userId,
      room: args.room,
      lastReadCreationTime: nextReadCreationTime,
      lastReadSeq: nextReadSeq,
      updatedAt: now,
    });
    return;
  }

  const previousSeq = typeof existing.lastReadSeq === "number"
    ? existing.lastReadSeq
    : await resolveReadSeqFallback(ctx, args.room, existing);

  if (previousSeq >= nextReadSeq && existing.lastReadCreationTime >= nextReadCreationTime) {
    return;
  }

  await ctx.db.patch(existing._id, {
    lastReadSeq: Math.max(previousSeq, nextReadSeq),
    lastReadCreationTime: Math.max(existing.lastReadCreationTime, nextReadCreationTime),
    updatedAt: now,
  });
}

export async function getUnreadCountForRoom(
  ctx: Ctx,
  userId: Id<"users">,
  room: string
): Promise<number> {
  const [roomSeq, readSeq] = await Promise.all([
    getRoomMessageSeq(ctx, room),
    getReadSeqForRoom(ctx, userId, room),
  ]);
  return Math.max(0, roomSeq - readSeq);
}
