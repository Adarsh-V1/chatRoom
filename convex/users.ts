import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";

import { requireUserForToken } from "./lib/session";

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

    return await Promise.all(
      users.map(async (u) => {
        const profilePictureUrl = u.profilePictureStorageId
          ? await ctx.storage.getUrl(u.profilePictureStorageId)
          : null;
        return { name: u.name, profilePictureUrl };
      })
    );
  },
});

export const getUserProfile = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const trimmed = args.name.trim();
    if (!trimmed) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_nameLower", (q) => q.eq("nameLower", trimmed.toLowerCase()))
      .first();

    if (!user) return null;

    const profilePictureUrl = user.profilePictureStorageId
      ? await ctx.storage.getUrl(user.profilePictureStorageId)
      : null;

    return { name: user.name, profilePictureUrl };
  },
});

export const getMe = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);

    const profilePictureUrl = user.profilePictureStorageId
      ? await ctx.storage.getUrl(user.profilePictureStorageId)
      : null;

    return { name: user.name, profilePictureUrl };
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

export const getMutedUsers = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const muted = await ctx.db
      .query("mutedUsers")
      .withIndex("by_user_otherNameLower", (q) => q.eq("userId", user._id))
      .collect();
    return muted.map((m) => m.otherNameLower);
  },
});

export const setMutedUser = mutation({
  args: { token: v.string(), otherName: v.string(), muted: v.boolean() },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const otherNameLower = args.otherName.trim().toLowerCase();
    if (!otherNameLower) return;

    const existing = await ctx.db
      .query("mutedUsers")
      .withIndex("by_user_otherNameLower", (q) =>
        q.eq("userId", user._id).eq("otherNameLower", otherNameLower)
      )
      .first();

    if (!args.muted) {
      if (existing) await ctx.db.delete(existing._id);
      return;
    }

    if (existing) return;

    await ctx.db.insert("mutedUsers", {
      userId: user._id,
      otherNameLower,
      createdAt: Date.now(),
    });
  },
});

export const updateMyName = mutation({
  args: { token: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const trimmed = args.name.trim();
    if (!trimmed) throw new ConvexError("Name is required");

    const nameLower = trimmed.toLowerCase();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_nameLower", (q) => q.eq("nameLower", nameLower))
      .first();

    if (existing && existing._id !== user._id) {
      throw new ConvexError("Name already taken");
    }

    await ctx.db.patch(user._id, {
      name: trimmed,
      nameLower,
      updatedAt: Date.now(),
    });

    return { name: trimmed };
  },
});
