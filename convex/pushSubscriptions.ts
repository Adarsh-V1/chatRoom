import { ConvexError, v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { requireUserForToken } from "./lib/session";

const pushSubscriptionValidator = v.object({
  endpoint: v.string(),
  expirationTime: v.optional(v.union(v.number(), v.null())),
  keys: v.object({
    p256dh: v.string(),
    auth: v.string(),
  }),
});

function getPushConfig() {
  const publicKey = process.env.PUSH_NOTIFICATIONS_VAPID_PUBLIC_KEY?.trim() ?? "";
  const privateKey = process.env.PUSH_NOTIFICATIONS_VAPID_PRIVATE_KEY?.trim() ?? "";
  const subject = process.env.PUSH_NOTIFICATIONS_SUBJECT?.trim() ?? "";

  return {
    configured: Boolean(publicKey && privateKey && subject),
    publicKey,
    privateKey,
    subject,
  };
}

export const getPushConfiguration = query({
  args: {},
  handler: async () => {
    const { configured, publicKey } = getPushConfig();
    return {
      configured,
      publicKey: configured ? publicKey : null,
    };
  },
});

export const upsertPushSubscription = mutation({
  args: {
    token: v.string(),
    subscription: pushSubscriptionValidator,
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { configured } = getPushConfig();
    if (!configured) {
      throw new ConvexError("Push notifications are not configured on the server.");
    }

    const { user } = await requireUserForToken(ctx, args.token);
    const now = Date.now();
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.subscription.endpoint))
      .first();

    const payload = {
      userId: user._id,
      endpoint: args.subscription.endpoint,
      expirationTime: args.subscription.expirationTime ?? undefined,
      p256dh: args.subscription.keys.p256dh,
      auth: args.subscription.keys.auth,
      userAgent: args.userAgent?.trim() || undefined,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return { enabled: true };
    }

    await ctx.db.insert("pushSubscriptions", {
      ...payload,
      createdAt: now,
    });

    return { enabled: true };
  },
});

export const removePushSubscription = mutation({
  args: {
    token: v.string(),
    endpoint: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (!existing || existing.userId !== user._id) {
      return { removed: false };
    }

    await ctx.db.delete(existing._id);
    return { removed: true };
  },
});

export const listDeliveryTargets = internalQuery({
  args: {
    recipientUserIds: v.array(v.id("users")),
    senderNameLower: v.string(),
  },
  handler: async (ctx, args) => {
    const { configured } = getPushConfig();
    if (!configured || args.recipientUserIds.length === 0) {
      return [];
    }

    const endpoints = new Map<
      string,
      {
        endpoint: string;
        expirationTime?: number;
        p256dh: string;
        auth: string;
      }
    >();

    for (const userId of args.recipientUserIds) {
      const settings = await ctx.db
        .query("userSettings")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();

      if (!settings?.desktopNotifications) {
        continue;
      }

      const isMuted = await ctx.db
        .query("mutedUsers")
        .withIndex("by_user_otherNameLower", (q) =>
          q.eq("userId", userId).eq("otherNameLower", args.senderNameLower)
        )
        .first();

      if (isMuted) {
        continue;
      }

      const subscriptions = await ctx.db
        .query("pushSubscriptions")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();

      for (const subscription of subscriptions) {
        endpoints.set(subscription.endpoint, {
          endpoint: subscription.endpoint,
          expirationTime: subscription.expirationTime,
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        });
      }
    }

    return [...endpoints.values()];
  },
});

export const removeInvalidSubscription = internalMutation({
  args: {
    endpoint: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (!existing) {
      return { removed: false };
    }

    await ctx.db.delete(existing._id);
    return { removed: true };
  },
});
