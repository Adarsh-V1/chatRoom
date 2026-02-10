import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

import { requireUserForToken } from "./lib/session";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const upsertUser = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
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
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    users.sort((a, b) => a.name.localeCompare(b.name));
    return users.map((u) => u.name);
  },
});

export const listUsersWithProfiles = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    users.sort((a, b) => a.name.localeCompare(b.name));

    const enriched = await Promise.all(
      users.map(async (u) => {
        const profilePictureUrl = u.profilePictureStorageId
          ? await ctx.storage.getUrl(u.profilePictureStorageId)
          : null;
        return { name: u.name, profilePictureUrl };
      })
    );

    return enriched;
  },
});

export const getUserProfile = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
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
      : null;

    return { name: user.name, profilePictureUrl };
  },
});

export const getUsernames = query({
  handler: async (ctx) => {
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

    await ctx.db.insert("chats", {
      message: args.message,
      userId: user._id,
      username: user.name,
      room: args.room,
      kind: "text",
      contextType: args.contextType,
      contextData: args.contextData,
    });
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

    await ctx.db.insert("chats", {
      message: (args.message ?? "").toString(),
      userId: user._id,
      username: user.name,
      room: args.room,
      kind: "file",
      storageId: args.storageId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      contextType: args.contextType,
      contextData: args.contextData,
    });
  },
});

export const getChats = query({
  args: { room: v.string() },
  handler: async (ctx, args) => {
    const chats = await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("room"), args.room))
      .order("asc")
      .collect();

    const users = await ctx.db.query("users").collect();
    const byNameLower = new Map(users.map((u) => [u.nameLower, u] as const));
    const byUserId = new Map(users.map((u) => [u._id, u] as const));
    const storageUrlCache = new Map<string, string | null>();

    const enriched = await Promise.all(
      chats.map(async (chat) => {
        const user = chat.userId ? byUserId.get(chat.userId) : null;
        const usernameLower = !user && chat.username ? chat.username.trim().toLowerCase() : null;
        const fallbackUser = usernameLower ? byNameLower.get(usernameLower) : null;
        const resolvedUser = user ?? fallbackUser;

        const getCachedUrl = async (storageId: string) => {
          const cached = storageUrlCache.get(storageId);
          if (cached !== undefined) return cached;
          const url = await ctx.storage.getUrl(storageId);
          storageUrlCache.set(storageId, url);
          return url;
        };

        const profilePictureUrl = resolvedUser?.profilePictureStorageId
          ? await getCachedUrl(resolvedUser.profilePictureStorageId)
          : null;

        if (chat.storageId) {
          const fileUrl = await getCachedUrl(chat.storageId);
          return { ...chat, fileUrl, profilePictureUrl };
        }

        return { ...chat, fileUrl: null, profilePictureUrl };
      })
    );

    return enriched;
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

// Legacy API: keep for now (used by older UI code).
export const setUserProfilePicture = mutation({
  args: { name: v.string(), storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const trimmed = args.name.trim();
    if (!trimmed) return;

    const nameLower = trimmed.toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("by_nameLower", (q) => q.eq("nameLower", nameLower))
      .first();

    if (!user) return;

    await ctx.db.patch(user._id, {
      profilePictureStorageId: args.storageId,
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
      updatedAt: Date.now(),
    });
  },
});
