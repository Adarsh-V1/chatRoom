import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";

import { requireUserForToken } from "./lib/session";

const GROUP_ROOM_PREFIX = "group:";

function slugify(input: string, maxLen = 48): string {
  const trimmed = input.trim();
  if (!trimmed) return "group";
  const safe = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return (safe || "group").slice(0, maxLen);
}

function normalizeSlug(slug: string): string {
  return slugify(slug, 48);
}

export function toGroupRoomSlug(slug: string): string {
  return `${GROUP_ROOM_PREFIX}${normalizeSlug(slug)}`;
}

export const createGroup = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const name = args.name.trim();
    if (!name) throw new ConvexError("Group name is required");

    const rawSlug = (args.slug ?? name).trim();
    const slug = normalizeSlug(rawSlug);
    if (!slug) throw new ConvexError("Group slug is required");

    const existing = await ctx.db
      .query("groups")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (existing) throw new ConvexError("Group slug already exists");

    const groupId = await ctx.db.insert("groups", {
      name,
      slug,
      description: args.description?.trim() || undefined,
      createdBy: user._id,
      isPublic: args.isPublic,
      createdAt: Date.now(),
    });

    await ctx.db.insert("groupMembers", {
      groupId,
      userId: user._id,
      role: "owner",
      joinedAt: Date.now(),
    });

    return { groupId, slug, room: toGroupRoomSlug(slug) };
  },
});

export const getGroupBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const slug = normalizeSlug(args.slug);
    if (!slug) return null;

    const group = await ctx.db
      .query("groups")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!group) return null;

    const owner = await ctx.db.get(group.createdBy);

    return {
      ...group,
      ownerName: owner?.name ?? "Unknown",
      room: toGroupRoomSlug(group.slug),
    };
  },
});

export const listPublicGroups = query({
  handler: async (ctx) => {
    const groups = await ctx.db.query("groups").collect();
    const publicGroups = groups.filter((g) => g.isPublic);
    publicGroups.sort((a, b) => a.name.localeCompare(b.name));

    return publicGroups.map((g) => ({
      ...g,
      room: toGroupRoomSlug(g.slug),
    }));
  },
});

export const listMyGroups = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);

    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const groups = await Promise.all(
      memberships.map(async (member) => {
        const group = await ctx.db.get(member.groupId);
        if (!group) return null;
        return {
          ...group,
          role: member.role,
          room: toGroupRoomSlug(group.slug),
        };
      })
    );

    const filtered = groups.filter(Boolean) as Array<
      (typeof groups)[number] & { role: "owner" | "member" }
    >;
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    return filtered;
  },
});

export const getMyMembership = query({
  args: { token: v.string(), groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);

    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", user._id)
      )
      .first();

    return membership ?? null;
  },
});

export const listGroupMembers = query({
  args: { token: v.string(), groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);

    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", user._id)
      )
      .first();

    if (!membership) return [];

    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const users = await Promise.all(
      members.map(async (m) => {
        const profile = await ctx.db.get(m.userId);
        return {
          userId: m.userId,
          name: profile?.name ?? "Unknown",
          role: m.role,
          joinedAt: m.joinedAt,
        };
      })
    );

    users.sort((a, b) => a.name.localeCompare(b.name));

    return users;
  },
});

export const getMyInviteForGroup = query({
  args: { token: v.string(), groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);

    const invite = await ctx.db
      .query("groupInvites")
      .withIndex("by_group_user", (q) =>
        q.eq("groupId", args.groupId).eq("invitedUserId", user._id)
      )
      .first();

    return invite ?? null;
  },
});

export const inviteMember = mutation({
  args: {
    token: v.string(),
    groupId: v.id("groups"),
    userName: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const nameLower = args.userName.trim().toLowerCase();
    if (!nameLower) throw new ConvexError("Username is required");

    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", user._id)
      )
      .first();

    if (!membership || membership.role !== "owner") {
      throw new ConvexError("Only group owners can invite members");
    }

    const invitee = await ctx.db
      .query("users")
      .withIndex("by_nameLower", (q) => q.eq("nameLower", nameLower))
      .first();

    if (!invitee) throw new ConvexError("User not found");

    const existingMember = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", invitee._id)
      )
      .first();

    if (existingMember) return { invited: false };

    const existingInvite = await ctx.db
      .query("groupInvites")
      .withIndex("by_group_user", (q) =>
        q.eq("groupId", args.groupId).eq("invitedUserId", invitee._id)
      )
      .first();

    if (existingInvite) return { invited: false };

    await ctx.db.insert("groupInvites", {
      groupId: args.groupId,
      invitedUserId: invitee._id,
      invitedBy: user._id,
      createdAt: Date.now(),
    });

    return { invited: true };
  },
});

export const joinGroup = mutation({
  args: { token: v.string(), groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new ConvexError("Group not found");

    const existingMember = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", user._id)
      )
      .first();

    if (existingMember) return { joined: true };

    if (!group.isPublic) {
      const invite = await ctx.db
        .query("groupInvites")
        .withIndex("by_group_user", (q) =>
          q.eq("groupId", args.groupId).eq("invitedUserId", user._id)
        )
        .first();

      if (!invite) throw new ConvexError("Invite required");
      await ctx.db.delete(invite._id);
    }

    await ctx.db.insert("groupMembers", {
      groupId: args.groupId,
      userId: user._id,
      role: "member",
      joinedAt: Date.now(),
    });

    return { joined: true };
  },
});

export const leaveGroup = mutation({
  args: { token: v.string(), groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);

    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", user._id)
      )
      .first();

    if (!membership) return { left: true };
    if (membership.role === "owner") {
      throw new ConvexError("Owners must transfer ownership before leaving");
    }

    await ctx.db.delete(membership._id);
    return { left: true };
  },
});

export const listMyInvites = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const invites = await ctx.db
      .query("groupInvites")
      .withIndex("by_user", (q) => q.eq("invitedUserId", user._id))
      .collect();

    const enriched = await Promise.all(
      invites.map(async (invite) => {
        const group = await ctx.db.get(invite.groupId);
        if (!group) return null;
        return {
          ...invite,
          groupName: group.name,
          groupSlug: group.slug,
        };
      })
    );

    return enriched.filter(Boolean);
  },
});
