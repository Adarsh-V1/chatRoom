"use node";

import webpush from "web-push";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

function getPushConfig() {
  return {
    publicKey: process.env.PUSH_NOTIFICATIONS_VAPID_PUBLIC_KEY?.trim() ?? "",
    privateKey: process.env.PUSH_NOTIFICATIONS_VAPID_PRIVATE_KEY?.trim() ?? "",
    subject: process.env.PUSH_NOTIFICATIONS_SUBJECT?.trim() ?? "",
  };
}

function getNotificationTitle(room: string, senderName: string) {
  if (room === "general") {
    return `${senderName} in general`;
  }

  if (room.startsWith("group:")) {
    return `${senderName} in #${room.slice("group:".length)}`;
  }

  return senderName;
}

export const sendChatMessageNotification = internalAction({
  args: {
    senderName: v.string(),
    senderNameLower: v.string(),
    room: v.string(),
    href: v.string(),
    preview: v.string(),
    recipientUserIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { publicKey, privateKey, subject } = getPushConfig();
    if (!publicKey || !privateKey || !subject || args.recipientUserIds.length === 0) {
      return { sent: 0, removed: 0 };
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);

    const targets = await ctx.runQuery(internal.pushSubscriptions.listDeliveryTargets, {
      recipientUserIds: args.recipientUserIds,
      senderNameLower: args.senderNameLower,
    });

    if (targets.length === 0) {
      return { sent: 0, removed: 0 };
    }

    const payload = JSON.stringify({
      title: getNotificationTitle(args.room, args.senderName),
      body: args.preview,
      href: args.href,
      tag: `chat:${args.room}`,
      icon: "/convolink-mark.svg",
      badge: "/convolink-mark.svg",
    });

    let sent = 0;
    const invalidEndpoints = new Set<string>();

    await Promise.all(
      targets.map(async (target) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: target.endpoint,
              expirationTime: target.expirationTime,
              keys: {
                p256dh: target.p256dh,
                auth: target.auth,
              },
            },
            payload
          );
          sent += 1;
        } catch (error) {
          const statusCode =
            typeof error === "object" && error !== null && "statusCode" in error
              ? Number((error as { statusCode?: number }).statusCode)
              : null;

          if (statusCode === 404 || statusCode === 410) {
            invalidEndpoints.add(target.endpoint);
          }
        }
      })
    );

    await Promise.all(
      [...invalidEndpoints].map((endpoint) =>
        ctx.runMutation(internal.pushSubscriptions.removeInvalidSubscription, { endpoint })
      )
    );

    return { sent, removed: invalidEndpoints.size };
  },
});
