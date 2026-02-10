import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

import { requireUserForToken } from "./lib/session";

const ONLINE_WINDOW_MS = 60_000;

export const ping = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const existing = await ctx.db
      .query("userPresence")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, { lastPingAt: now });
      return;
    }

    await ctx.db.insert("userPresence", {
      userId: user._id,
      lastPingAt: now,
    });
  },
});

export const getUserStatuses = query({
  args: { token: v.string(), names: v.array(v.string()) },
  handler: async (ctx, args) => {
    await requireUserForToken(ctx, args.token);

    const names = args.names.map((n) => n.trim()).filter(Boolean).slice(0, 80);
    if (names.length === 0) return [] as Array<{
      name: string;
      online: boolean;
      lastSeenAt: number | null;
    }>;

    const users = await Promise.all(
      names.map(async (name) => {
        const nameLower = name.toLowerCase();
        const user = await ctx.db
          .query("users")
          .withIndex("by_nameLower", (q) => q.eq("nameLower", nameLower))
          .first();
        return user ? { name: user.name, userId: user._id } : null;
      })
    );

    const now = Date.now();

    const statuses = await Promise.all(
      users.map(async (u) => {
        if (!u) return null;

        const presence = await ctx.db
          .query("userPresence")
          .withIndex("by_userId", (q) => q.eq("userId", u.userId))
          .first();

        const session = await ctx.db
          .query("sessions")
          .withIndex("by_userId", (q) => q.eq("userId", u.userId))
          .order("desc")
          .first();

        const lastSeenAt = session?.lastSeenAt ?? null;
        const online = Boolean(presence && presence.lastPingAt > now - ONLINE_WINDOW_MS);

        return { name: u.name, online, lastSeenAt };
      })
    );

    return statuses.filter((s) => s !== null);
  },
});
