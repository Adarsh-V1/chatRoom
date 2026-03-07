import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";

import { requireUserForToken } from "./lib/session";

const DAY_MS = 24 * 60 * 60 * 1000;
const DASHBOARD_MESSAGE_SCAN_LIMIT = 3000;

function roomLabel(rawRoom: string): string {
  const room = rawRoom.trim();
  if (!room) return "general";
  if (room === "general") return "general";
  if (room.startsWith("group:")) return `#${room.slice("group:".length)}`;
  return "direct";
}

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
  args: {
    token: v.string(),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUserForToken(ctx, args.token);
    const limit = Math.max(20, Math.min(args.limit ?? 220, 500));
    const search = (args.search ?? "").trim().toLowerCase();

    const users = await ctx.db.query("users").collect();
    users.sort((a, b) => a.name.localeCompare(b.name));

    const filtered = search
      ? users.filter((user) => user.nameLower.includes(search))
      : users;
    const sliced = filtered.slice(0, limit);

    return await Promise.all(
      sliced.map(async (u) => {
        const profilePictureUrl = u.profilePictureStorageId
          ? await ctx.storage.getUrl(u.profilePictureStorageId)
          : null;
        return { name: u.name, profilePictureUrl };
      })
    );
  },
});

export const getUserProfile = query({
  args: { token: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    await requireUserForToken(ctx, args.token);
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

export const getMyDashboardStats = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const now = Date.now();
    const sevenDaysAgo = now - 7 * DAY_MS;
    const thirtyDaysAgo = now - 30 * DAY_MS;

    const weeklyBuckets = [] as Array<{ key: string; label: string; count: number }>;
    for (let i = 6; i >= 0; i -= 1) {
      const ts = now - i * DAY_MS;
      const date = new Date(ts);
      weeklyBuckets.push({
        key: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        count: 0,
      });
    }
    const weeklyBucketMap = new Map(weeklyBuckets.map((b) => [b.key, b]));

    const messages = await ctx.db
      .query("chats")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(DASHBOARD_MESSAGE_SCAN_LIMIT);

    let messages7d = 0;
    let filesShared7d = 0;
    const activeRooms = new Set<string>();
    const activeDays = new Set<string>();
    const roomCounts = new Map<string, number>();

    for (const message of messages) {
      const ts = message._creationTime;
      const room = (message.room ?? "general").trim() || "general";

      if (ts >= thirtyDaysAgo) {
        roomCounts.set(room, (roomCounts.get(room) ?? 0) + 1);
      }

      if (ts < sevenDaysAgo) continue;

      messages7d += 1;
      if (message.kind === "file") filesShared7d += 1;
      activeRooms.add(room);

      const dayKey = new Date(ts).toISOString().slice(0, 10);
      activeDays.add(dayKey);
      const bucket = weeklyBucketMap.get(dayKey);
      if (bucket) bucket.count += 1;
    }

    const groupMemberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const pendingInvites = await ctx.db
      .query("groupInvites")
      .withIndex("by_user", (q) => q.eq("invitedUserId", user._id))
      .collect();

    const priorityRooms = await ctx.db
      .query("chatPriorities")
      .withIndex("by_user_room", (q) => q.eq("userId", user._id))
      .collect();

    const priorityUsers = await ctx.db
      .query("userPriorities")
      .withIndex("by_user_otherNameLower", (q) => q.eq("userId", user._id))
      .collect();

    const topRooms = [...roomCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([room, count]) => ({
        room,
        label: roomLabel(room),
        count,
      }));

    const activityScore = Math.min(
      100,
      Math.round(
        messages7d * 1.8 +
          activeRooms.size * 6 +
          filesShared7d * 3 +
          activeDays.size * 2
      )
    );

    return {
      kpis: {
        messages7d,
        filesShared7d,
        activeRooms7d: activeRooms.size,
        groupsJoined: groupMemberships.length,
        pendingInvites: pendingInvites.length,
        priorityTargets:
          priorityRooms.filter((r) => r.priority).length +
          priorityUsers.filter((u) => u.priority).length,
        activeDays7d: activeDays.size,
      },
      weeklyVolume: weeklyBuckets.map((b) => ({ label: b.label, count: b.count })),
      topRooms,
      activityScore,
      sampledMessages: messages.length,
    };
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
