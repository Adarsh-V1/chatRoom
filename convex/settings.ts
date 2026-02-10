import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

import { requireUserForToken } from "./lib/session";

export const getMySettings = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    return {
      focusMode: existing?.focusMode ?? false,
      notificationSound: existing?.notificationSound ?? true,
      desktopNotifications: existing?.desktopNotifications ?? false,
      messageDensity: existing?.messageDensity ?? "comfortable",
      fontScale: existing?.fontScale ?? 1,
      readReceipts: existing?.readReceipts ?? true,
      typingIndicator: existing?.typingIndicator ?? true,
      reducedMotion: existing?.reducedMotion ?? false,
      highContrast: existing?.highContrast ?? false,
      autoPlayGifs: existing?.autoPlayGifs ?? true,
      autoDownloadFiles: existing?.autoDownloadFiles ?? false,
    };
  },
});

export const setFocusMode = mutation({
  args: { token: v.string(), focusMode: v.boolean() },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        focusMode: args.focusMode,
        updatedAt: Date.now(),
      });
      return;
    }

    await ctx.db.insert("userSettings", {
      userId: user._id,
      focusMode: args.focusMode,
      updatedAt: Date.now(),
    });
  },
});

export const updateMySettings = mutation({
  args: {
    token: v.string(),
    notificationSound: v.optional(v.boolean()),
    desktopNotifications: v.optional(v.boolean()),
    messageDensity: v.optional(v.union(v.literal("comfortable"), v.literal("compact"))),
    fontScale: v.optional(v.number()),
    readReceipts: v.optional(v.boolean()),
    typingIndicator: v.optional(v.boolean()),
    reducedMotion: v.optional(v.boolean()),
    highContrast: v.optional(v.boolean()),
    autoPlayGifs: v.optional(v.boolean()),
    autoDownloadFiles: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    const patch = {
      notificationSound: args.notificationSound,
      desktopNotifications: args.desktopNotifications,
      messageDensity: args.messageDensity,
      fontScale: args.fontScale,
      readReceipts: args.readReceipts,
      typingIndicator: args.typingIndicator,
      reducedMotion: args.reducedMotion,
      highContrast: args.highContrast,
      autoPlayGifs: args.autoPlayGifs,
      autoDownloadFiles: args.autoDownloadFiles,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return;
    }

    await ctx.db.insert("userSettings", {
      userId: user._id,
      focusMode: false,
      ...patch,
    });
  },
});
