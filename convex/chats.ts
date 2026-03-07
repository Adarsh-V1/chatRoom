import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";

import { requireUserForToken } from "./lib/session";
import { assertUserCanAccessRoom, parseDirectRoom, parseGroupSlug } from "./lib/rooms";
import { enforceRateLimit } from "./lib/rateLimit";
import { incrementRoomMessageSeq, markRoomRead } from "./lib/unreadCounters";

const CHAT_MESSAGE_MAX_LENGTH = 2000;
const FILE_CAPTION_MAX_LENGTH = 600;
const DUPLICATE_SPAM_WINDOW_MS = 60_000;
const DUPLICATE_SPAM_THRESHOLD = 3;

function normalizeMessage(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

async function assertNotDuplicateMessageSpam(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    room: string;
    message: string;
  }
) {
  const normalized = normalizeMessage(args.message);
  if (!normalized) {
    throw new ConvexError("Message cannot be empty");
  }
  if (normalized.length > CHAT_MESSAGE_MAX_LENGTH) {
    throw new ConvexError(`Message is too long (max ${CHAT_MESSAGE_MAX_LENGTH} chars)`);
  }

  const now = Date.now();
  const recent = await ctx.db
    .query("chats")
    .withIndex("by_userId", (q) => q.eq("userId", args.userId))
    .order("desc")
    .take(18);

  let duplicateCountInWindow = 0;
  for (const chat of recent) {
    if (now - chat._creationTime > DUPLICATE_SPAM_WINDOW_MS) break;
    const room = (chat.room ?? "general").trim() || "general";
    if (room !== args.room) continue;
    if (normalizeMessage(chat.message ?? "") === normalized) {
      duplicateCountInWindow += 1;
    }
  }

  if (duplicateCountInWindow >= DUPLICATE_SPAM_THRESHOLD) {
    throw new ConvexError("Duplicate message detected. Please wait before sending the same text again.");
  }
}

async function enrichChatsForClient(
  ctx: QueryCtx,
  chats: Array<Doc<"chats">>
) {
  const userIds = new Set<Id<"users">>();
  const fallbackNameLowers = new Set<string>();

  for (const chat of chats) {
    if (chat.userId) {
      userIds.add(chat.userId);
      continue;
    }
    const usernameLower = chat.username?.trim().toLowerCase();
    if (usernameLower) fallbackNameLowers.add(usernameLower);
  }

  const usersById = new Map<Id<"users">, Doc<"users">>();
  await Promise.all(
    [...userIds].map(async (userId) => {
      const user = await ctx.db.get(userId);
      if (user) usersById.set(userId, user);
    })
  );

  const usersByNameLower = new Map<string, Doc<"users">>();
  await Promise.all(
    [...fallbackNameLowers].map(async (nameLower) => {
      const user = await ctx.db
        .query("users")
        .withIndex("by_nameLower", (q) => q.eq("nameLower", nameLower))
        .first();
      if (user) usersByNameLower.set(nameLower, user);
    })
  );

  const profileStorageByChatId = new Map<Id<"chats">, Id<"_storage">>();
  const externalAvatarByChatId = new Map<Id<"chats">, string | null>();
  const neededStorageIds = new Set<Id<"_storage">>();

  for (const chat of chats) {
    const resolvedUser = chat.userId
      ? usersById.get(chat.userId)
      : chat.username
        ? usersByNameLower.get(chat.username.trim().toLowerCase())
        : undefined;

    if (resolvedUser?.profilePictureStorageId) {
      profileStorageByChatId.set(chat._id, resolvedUser.profilePictureStorageId);
      neededStorageIds.add(resolvedUser.profilePictureStorageId);
    }
    externalAvatarByChatId.set(chat._id, resolvedUser?.externalAvatarUrl ?? null);

    if (chat.storageId) {
      neededStorageIds.add(chat.storageId);
    }
  }

  const storageUrls = new Map<Id<"_storage">, string | null>();
  await Promise.all(
    [...neededStorageIds].map(async (storageId) => {
      const url = await ctx.storage.getUrl(storageId);
      storageUrls.set(storageId, url);
    })
  );

  return chats.map((chat) => {
    const profileStorageId = profileStorageByChatId.get(chat._id);
    const externalAvatar = externalAvatarByChatId.get(chat._id) ?? null;
    const profilePictureUrl = profileStorageId
      ? (storageUrls.get(profileStorageId) ?? null)
      : externalAvatar;
    const fileUrl = chat.storageId ? (storageUrls.get(chat.storageId) ?? null) : null;

    return {
      ...chat,
      fileUrl,
      profilePictureUrl,
    };
  });
}

function roomToNotificationHref(room: string): string {
  if (room === "general") {
    return "/chat";
  }

  const groupSlug = parseGroupSlug(room);
  if (groupSlug) {
    return `/groups/${groupSlug}`;
  }

  return `/chat/${room}`;
}

function buildNotificationPreview(args: {
  kind: "text" | "file";
  message?: string;
  fileName?: string;
}) {
  const trimmedMessage = args.message?.trim() ?? "";

  if (args.kind === "file") {
    if (trimmedMessage) {
      return trimmedMessage.slice(0, 140);
    }
    if (args.fileName?.trim()) {
      return `Sent ${args.fileName.trim()}`;
    }
    return "Sent an attachment";
  }

  return trimmedMessage.slice(0, 140) || "Sent a new message";
}

async function listNotificationRecipientIds(
  ctx: MutationCtx,
  user: Doc<"users">,
  room: string
): Promise<Array<Id<"users">>> {
  if (room === "general") {
    const users = await ctx.db.query("users").collect();
    return users.filter((candidate) => candidate._id !== user._id).map((candidate) => candidate._id);
  }

  const groupSlug = parseGroupSlug(room);
  if (groupSlug) {
    const group = await ctx.db
      .query("groups")
      .withIndex("by_slug", (q) => q.eq("slug", groupSlug))
      .first();

    if (!group) {
      return [];
    }

    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", group._id))
      .collect();

    return members.filter((member) => member.userId !== user._id).map((member) => member.userId);
  }

  const directRoom = parseDirectRoom(room);
  if (!directRoom) {
    return [];
  }

  const otherParticipant = directRoom.participants.find((participant) => participant !== user.nameLower);
  if (!otherParticipant) {
    return [];
  }

  const otherUser = await ctx.db
    .query("users")
    .withIndex("by_nameLower", (q) => q.eq("nameLower", otherParticipant))
    .first();

  return otherUser ? [otherUser._id] : [];
}

export const generateUploadUrl = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireUserForToken(ctx, args.token);
    return await ctx.storage.generateUploadUrl();
  },
});

export const upsertUser = mutation({
  args: { token: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    await requireUserForToken(ctx, args.token);
    const trimmed = args.name.trim();
    if (!trimmed) return;

    const nameLower = trimmed.toLowerCase();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_nameLower", (q) => q.eq("nameLower", nameLower))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: trimmed,
        updatedAt: Date.now(),
      });
      return;
    }

    await ctx.db.insert("users", {
      name: trimmed,
      nameLower,
      updatedAt: Date.now(),
    });
  },
});

export const listUsers = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireUserForToken(ctx, args.token);
    const users = await ctx.db.query("users").collect();
    users.sort((a, b) => a.name.localeCompare(b.name));
    return users.map((u) => u.name);
  },
});

export const listUsersWithProfiles = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireUserForToken(ctx, args.token);
    const users = await ctx.db.query("users").collect();
    users.sort((a, b) => a.name.localeCompare(b.name));

    const enriched = await Promise.all(
      users.map(async (u) => {
        const profilePictureUrl = u.profilePictureStorageId
          ? await ctx.storage.getUrl(u.profilePictureStorageId)
          : (u.externalAvatarUrl ?? null);
        return { name: u.name, profilePictureUrl };
      })
    );

    return enriched;
  },
});

export const getUserProfile = query({
  args: { token: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    await requireUserForToken(ctx, args.token);
    const trimmed = args.name.trim();
    if (!trimmed) return null;

    const nameLower = trimmed.toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("by_nameLower", (q) => q.eq("nameLower", nameLower))
      .first();

    if (!user) return null;

    const profilePictureUrl = user.profilePictureStorageId
      ? await ctx.storage.getUrl(user.profilePictureStorageId)
      : (user.externalAvatarUrl ?? null);

    return { name: user.name, profilePictureUrl };
  },
});

export const getUsernames = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireUserForToken(ctx, args.token);
    const users = await ctx.db.query("users").collect();
    users.sort((a, b) => a.name.localeCompare(b.name));
    return users.map((u) => u.name);
  },
});

export const addChat = mutation({
  args: {
    message: v.string(),
    token: v.string(),
    room: v.string(),
    contextType: v.optional(
      v.union(v.literal("file"), v.literal("snippet"), v.literal("task"))
    ),
    contextData: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const room = args.room.trim() || "general";
    await assertUserCanAccessRoom(ctx, user, room);
    await enforceRateLimit(ctx, {
      userId: user._id,
      action: "chat:message",
      limit: 14,
      windowMs: 10_000,
      cooldownMs: 8_000,
      minIntervalMs: 220,
    });
    await assertNotDuplicateMessageSpam(ctx, {
      userId: user._id,
      room,
      message: args.message,
    });

    const seq = await incrementRoomMessageSeq(ctx, room);
    const now = Date.now();

    await ctx.db.insert("chats", {
      message: args.message,
      userId: user._id,
      username: user.name,
      room,
      seq,
      kind: "text",
      contextType: args.contextType,
      contextData: args.contextData,
    });

    await markRoomRead(ctx, {
      userId: user._id,
      room,
      lastReadSeq: seq,
      lastReadCreationTime: now,
    });

    const recipientUserIds = await listNotificationRecipientIds(ctx, user, room);
    if (recipientUserIds.length > 0) {
      await ctx.scheduler.runAfter(0, internal.pushDelivery.sendChatMessageNotification, {
        senderName: user.name,
        senderNameLower: user.nameLower,
        room,
        href: roomToNotificationHref(room),
        preview: buildNotificationPreview({ kind: "text", message: args.message }),
        recipientUserIds,
      });
    }
  },
});

export const addFileChat = mutation({
  args: {
    token: v.string(),
    storageId: v.id("_storage"),
    room: v.string(),
    fileName: v.string(),
    fileType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    message: v.optional(v.string()),
    contextType: v.optional(
      v.union(v.literal("file"), v.literal("snippet"), v.literal("task"))
    ),
    contextData: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const room = args.room.trim() || "general";
    await assertUserCanAccessRoom(ctx, user, room);
    await enforceRateLimit(ctx, {
      userId: user._id,
      action: "chat:file",
      limit: 6,
      windowMs: 30_000,
      cooldownMs: 12_000,
      minIntervalMs: 900,
    });

    const caption = (args.message ?? "").trim();
    if (caption.length > FILE_CAPTION_MAX_LENGTH) {
      throw new ConvexError(`File caption is too long (max ${FILE_CAPTION_MAX_LENGTH} chars)`);
    }
    if (caption) {
      await assertNotDuplicateMessageSpam(ctx, {
        userId: user._id,
        room,
        message: caption,
      });
    }

    const seq = await incrementRoomMessageSeq(ctx, room);
    const now = Date.now();

    await ctx.db.insert("chats", {
      message: caption,
      userId: user._id,
      username: user.name,
      room,
      seq,
      kind: "file",
      storageId: args.storageId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      contextType: args.contextType,
      contextData: args.contextData,
    });

    await markRoomRead(ctx, {
      userId: user._id,
      room,
      lastReadSeq: seq,
      lastReadCreationTime: now,
    });

    const recipientUserIds = await listNotificationRecipientIds(ctx, user, room);
    if (recipientUserIds.length > 0) {
      await ctx.scheduler.runAfter(0, internal.pushDelivery.sendChatMessageNotification, {
        senderName: user.name,
        senderNameLower: user.nameLower,
        room,
        href: roomToNotificationHref(room),
        preview: buildNotificationPreview({
          kind: "file",
          message: caption,
          fileName: args.fileName,
        }),
        recipientUserIds,
      });
    }
  },
});

export const softDeleteChat = mutation({
  args: { token: v.string(), chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const chat = await ctx.db.get(args.chatId);
    if (!chat) return;
    if (!chat.userId || chat.userId !== user._id) return;
    if (chat.deletedAt) return;

    await ctx.db.patch(chat._id, {
      deletedAt: Date.now(),
      deletedBy: user._id,
    });
  },
});

export const getChats = query({
  args: { room: v.string(), token: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const room = args.room.trim() || "general";
    await assertUserCanAccessRoom(ctx, user, room);

    const limit = Math.max(20, Math.min(args.limit ?? 220, 500));
    const recentDesc = await ctx.db
      .query("chats")
      .withIndex("by_room", (q) => q.eq("room", room))
      .order("desc")
      .take(limit);

    return await enrichChatsForClient(ctx, [...recentDesc].reverse());
  },
});

export const getChatsPage = query({
  args: { room: v.string(), token: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const room = args.room.trim() || "general";
    await assertUserCanAccessRoom(ctx, user, room);

    const page = await ctx.db
      .query("chats")
      .withIndex("by_room", (q) => q.eq("room", room))
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      ...page,
      page: await enrichChatsForClient(ctx, page.page),
    };
  },
});

export const exportChats = query({
  args: { token: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireUserForToken(ctx, args.token);
    const limit = Math.max(1, Math.min(args.limit ?? 2000, 5000));

    const chats = await ctx.db
      .query("chats")
      .order("asc")
      .take(limit);

    return chats.map((chat) => ({
      _id: chat._id,
      _creationTime: chat._creationTime,
      room: chat.room ?? "",
      username: chat.username ?? "",
      message: chat.message ?? "",
      kind: chat.kind ?? "text",
      fileName: chat.fileName ?? null,
      fileType: chat.fileType ?? null,
      fileSize: chat.fileSize ?? null,
    }));
  },
});

export const backfillLegacyChats = mutation({
  args: {},
  handler: async (ctx) => {
    const chats = await ctx.db.query("chats").collect();
    let patched = 0;
    for (const chat of chats) {
      const patch: { room?: string; username?: string; kind?: "text" | "file" } = {};
      if (!chat.room) patch.room = "general";
      if (!chat.username) patch.username = "anonymous";
      if (!chat.kind) patch.kind = chat.storageId ? "file" : "text";
      if (patch.room || patch.username || patch.kind) {
        await ctx.db.patch(chat._id, patch);
        patched += 1;
      }
    }
    return { patched };
  },
});

export const rebuildRoomSequences = mutation({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const dryRun = Boolean(args.dryRun);
    const chats = await ctx.db.query("chats").order("asc").collect();

    const seqByRoom = new Map<string, number>();
    let patchedChats = 0;

    for (const chat of chats) {
      const room = (chat.room ?? "general").trim() || "general";
      const nextSeq = (seqByRoom.get(room) ?? 0) + 1;
      seqByRoom.set(room, nextSeq);

      if (dryRun) continue;
      if (chat.room !== room || chat.seq !== nextSeq) {
        await ctx.db.patch(chat._id, { room, seq: nextSeq });
        patchedChats += 1;
      }
    }

    if (dryRun) {
      return {
        dryRun: true,
        rooms: seqByRoom.size,
        chats: chats.length,
        patchedChats: 0,
        updatedRoomCounters: 0,
        updatedReadStates: 0,
      };
    }

    let updatedRoomCounters = 0;
    for (const [room, messageSeq] of seqByRoom.entries()) {
      const existing = await ctx.db
        .query("roomCounters")
        .withIndex("by_room", (q) => q.eq("room", room))
        .first();

      if (existing) {
        if (existing.messageSeq !== messageSeq) {
          await ctx.db.patch(existing._id, { messageSeq, updatedAt: Date.now() });
          updatedRoomCounters += 1;
        }
      } else {
        await ctx.db.insert("roomCounters", {
          room,
          messageSeq,
          updatedAt: Date.now(),
        });
        updatedRoomCounters += 1;
      }
    }

    const readStates = await ctx.db.query("chatReadStates").collect();
    let updatedReadStates = 0;
    for (const state of readStates) {
      if (typeof state.lastReadSeq === "number") continue;
      const room = state.room.trim();
      let nextReadSeq = 0;
      if (state.lastReadCreationTime > 0 && room) {
        const lastReadMessage = await ctx.db
          .query("chats")
          .withIndex("by_room", (q) =>
            q.eq("room", room).lte("_creationTime", state.lastReadCreationTime)
          )
          .order("desc")
          .first();
        nextReadSeq = Math.max(0, lastReadMessage?.seq ?? 0);
      }
      await ctx.db.patch(state._id, { lastReadSeq: nextReadSeq, updatedAt: Date.now() });
      updatedReadStates += 1;
    }

    return {
      dryRun: false,
      rooms: seqByRoom.size,
      chats: chats.length,
      patchedChats,
      updatedRoomCounters,
      updatedReadStates,
    };
  },
});

// Legacy API: keep for now (used by older UI code).
export const setUserProfilePicture = mutation({
  args: { token: v.string(), storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);

    await ctx.db.patch(user._id, {
      profilePictureStorageId: args.storageId,
      externalAvatarUrl: undefined,
      updatedAt: Date.now(),
    });
  },
});

export const setMyProfilePicture = mutation({
  args: { token: v.string(), storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    await ctx.db.patch(user._id, {
      profilePictureStorageId: args.storageId,
      externalAvatarUrl: undefined,
      updatedAt: Date.now(),
    });
  },
});
