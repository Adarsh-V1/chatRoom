import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
