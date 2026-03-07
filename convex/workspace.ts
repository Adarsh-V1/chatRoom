import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

import { requireUserForToken } from "./lib/session";
import { getUnreadCountForRoom } from "./lib/unreadCounters";
import { parseDirectRoom, parseGroupSlug } from "./lib/rooms";
import { toGroupRoomSlug } from "./groups";

const conversationKindValidator = v.union(
  v.literal("general"),
  v.literal("direct"),
  v.literal("group")
);

const conversationRefValidator = v.object({
  kind: conversationKindValidator,
  key: v.string(),
  title: v.string(),
  route: v.string(),
  room: v.string(),
});

type UserSettingsDoc = Doc<"userSettings">;
type ActiveCallSummary = { roomId: string; createdAt: number } | null;
type GeneralConversationSummary = ReturnType<typeof buildGeneralConversation> & {
  unreadCount: number;
  priority: boolean;
  activeCall: ActiveCallSummary;
};
type DirectConversationSummary = ReturnType<typeof buildDirectConversation> & {
  unreadCount: number;
  priority: boolean;
  activeCall: ActiveCallSummary;
  avatarUrl: string | null;
};
type GroupConversationSummary = ReturnType<typeof buildGroupConversation> & {
  unreadCount: number;
  priority: boolean;
  activeCall: ActiveCallSummary;
  memberRole: "owner" | "member";
};
type ConversationSummary = {
  kind: "general" | "direct" | "group";
  key: string;
  title: string;
  route: string;
  room: string;
  subtitle: string;
  unreadCount: number;
  priority: boolean;
  activeCall: ActiveCallSummary;
  avatarUrl?: string | null;
  memberRole?: "owner" | "member";
};

function isDefined<T>(value: T | null | undefined): value is T {
  return value != null;
}

function encodeRouteSegment(value: string) {
  return encodeURIComponent(value);
}

function buildGeneralConversation() {
  return {
    kind: "general" as const,
    key: "general",
    title: "General room",
    route: "/chat/general",
    room: "general",
    subtitle: "Workspace-wide updates and open discussion",
  };
}

function buildDirectConversation(name: string, nameLower: string, meLower: string) {
  return {
    kind: "direct" as const,
    key: nameLower,
    title: name,
    route: `/chat/direct/${encodeRouteSegment(name)}`,
    room: [meLower, nameLower].sort().join("-"),
    subtitle: "Direct thread",
  };
}

function buildGroupConversation(name: string, slug: string, description?: string) {
  return {
    kind: "group" as const,
    key: slug,
    title: name,
    route: `/groups/${encodeRouteSegment(slug)}`,
    room: toGroupRoomSlug(slug),
    subtitle: description?.trim() || `Group room · #${slug}`,
  };
}

async function ensureUserSettingsDoc(
  ctx: MutationCtx,
  userId: Id<"users">
): Promise<UserSettingsDoc> {
  const existing = await ctx.db
    .query("userSettings")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .first();

  if (existing) return existing;

  const now = Date.now();
  const insertedId = await ctx.db.insert("userSettings", {
    userId,
    focusMode: false,
    updatedAt: now,
  });

  const inserted = await ctx.db.get(insertedId);
  if (!inserted) {
    throw new Error("Failed to create user settings");
  }
  return inserted;
}

export const getHome = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const meLower = user.nameLower ?? user.name.trim().toLowerCase();
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    const [
      allUsers,
      chats,
      memberships,
      invites,
      userPriorities,
      roomPriorities,
      activeCalls,
    ] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("chats").collect(),
      ctx.db
        .query("groupMembers")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect(),
      ctx.db
        .query("groupInvites")
        .withIndex("by_user", (q) => q.eq("invitedUserId", user._id))
        .collect(),
      ctx.db
        .query("userPriorities")
        .withIndex("by_user_otherNameLower", (q) => q.eq("userId", user._id))
        .collect(),
      ctx.db
        .query("chatPriorities")
        .withIndex("by_user_room", (q) => q.eq("userId", user._id))
        .collect(),
      ctx.db.query("calls").collect(),
    ]);

    const userByLower = new Map(
      allUsers.map((entry) => [entry.nameLower ?? entry.name.trim().toLowerCase(), entry] as const)
    );

    const groups = (
      await Promise.all(
        memberships.map(async (membership) => {
          const group = await ctx.db.get(membership.groupId);
          if (!group) return null;
          return { ...group, role: membership.role };
        })
      )
    ).filter(Boolean);

    const directRooms = new Set<string>();
    for (const message of chats) {
      const room = (message.room ?? "").trim();
      const direct = parseDirectRoom(room);
      if (!direct) continue;
      if (direct.participants.includes(meLower)) {
        directRooms.add(direct.canonical);
      }
    }

    for (const priority of userPriorities) {
      if (!priority.priority) continue;
      directRooms.add([meLower, priority.otherNameLower].sort().join("-"));
    }

    for (const priority of roomPriorities) {
      const direct = parseDirectRoom(priority.room);
      if (direct?.participants.includes(meLower)) {
        directRooms.add(direct.canonical);
      }
    }

    const activeCallsByConversation = new Map(
      activeCalls
        .filter((call) => call.status === "active")
        .map((call) => [call.conversationId, call] as const)
    );

    const generalBase = buildGeneralConversation();
    const generalUnread = await getUnreadCountForRoom(ctx, user._id, generalBase.room);
    const generalActiveCall = activeCallsByConversation.get(generalBase.room);
    const general: GeneralConversationSummary = {
      ...generalBase,
      unreadCount: generalUnread,
      priority:
        roomPriorities.find((priority) => priority.room === generalBase.room)?.priority ?? false,
      activeCall: generalActiveCall
        ? {
            roomId: generalActiveCall.roomId,
            createdAt: generalActiveCall.createdAt,
          }
        : null,
    };

    const directThreads: Array<DirectConversationSummary | null> = await Promise.all(
      [...directRooms].map(async (room) => {
        const direct = parseDirectRoom(room);
        if (!direct) return null;
        const peerLower = direct.participants.find((participant) => participant !== meLower);
        if (!peerLower) return null;

        const peer = userByLower.get(peerLower);
        if (!peer) return null;

        const unreadCount = await getUnreadCountForRoom(ctx, user._id, room);
        const activeCall = activeCallsByConversation.get(room);
        const priority =
          roomPriorities.find((entry) => entry.room === room)?.priority ??
          userPriorities.find((entry) => entry.otherNameLower === peerLower)?.priority ??
          false;

        const profilePictureUrl = peer.profilePictureStorageId
          ? await ctx.storage.getUrl(peer.profilePictureStorageId)
          : (peer.externalAvatarUrl ?? null);

        return {
          ...buildDirectConversation(peer.name, peerLower, meLower),
          unreadCount,
          priority,
          activeCall: activeCall
            ? {
                roomId: activeCall.roomId,
                createdAt: activeCall.createdAt,
              }
            : null,
          avatarUrl: profilePictureUrl,
        };
      })
    );

    const groupConversations: Array<GroupConversationSummary | null> = await Promise.all(
      groups.map(async (group) => {
        if (!group) return null;
        const unreadCount = await getUnreadCountForRoom(ctx, user._id, toGroupRoomSlug(group.slug));
        const activeCall = activeCallsByConversation.get(toGroupRoomSlug(group.slug));
        return {
          ...buildGroupConversation(group.name, group.slug, group.description),
          unreadCount,
          priority:
            roomPriorities.find((entry) => entry.room === toGroupRoomSlug(group.slug))?.priority ??
            false,
          memberRole: group.role,
          activeCall: activeCall
            ? {
                roomId: activeCall.roomId,
                createdAt: activeCall.createdAt,
              }
            : null,
        };
      })
    );

    const pendingInvites = (
      await Promise.all(
        invites.map(async (invite) => {
          const group = await ctx.db.get(invite.groupId);
          if (!group) return null;
          return {
            groupId: invite.groupId,
            groupName: group.name,
            groupSlug: group.slug,
            route: `/groups/${encodeRouteSegment(group.slug)}`,
            createdAt: invite.createdAt,
          };
        })
      )
    ).filter(isDefined);

    const directConversationList = directThreads.filter(isDefined);
    const groupConversationList = groupConversations.filter(isDefined);

    const activeCallSummaries = await Promise.all(
      [...activeCallsByConversation.values()]
        .filter((call) => {
          if (call.conversationId === "general") return true;
          const groupSlug = parseGroupSlug(call.conversationId);
          if (groupSlug) {
            return groups.some((group) => group?.slug === groupSlug);
          }
          const direct = parseDirectRoom(call.conversationId);
          return Boolean(direct?.participants.includes(meLower));
        })
        .map(async (call) => {
          const starter = await ctx.db.get(call.startedBy);
          const groupSlug = parseGroupSlug(call.conversationId);
          const direct = parseDirectRoom(call.conversationId);

          let conversation: ConversationSummary = general;
          if (groupSlug) {
            const group = groups.find((entry) => entry?.slug === groupSlug);
            if (group) {
              conversation = {
                ...buildGroupConversation(group.name, group.slug, group.description),
                unreadCount: 0,
                priority: false,
                activeCall: null,
              };
            }
          } else if (direct) {
            const peerLower = direct.participants.find((participant) => participant !== meLower);
            const peer = peerLower ? userByLower.get(peerLower) : null;
            if (peer && peerLower) {
              conversation = {
                ...buildDirectConversation(peer.name, peerLower, meLower),
                unreadCount: 0,
                priority: false,
                activeCall: null,
              };
            }
          }

          return {
            roomId: call.roomId,
            createdAt: call.createdAt,
            startedByName: starter?.name ?? "Someone",
            conversation,
          };
        })
    );

    const priorityConversations: ConversationSummary[] = [
      general,
      ...directConversationList,
      ...groupConversationList,
    ]
      .filter((conversation) => conversation.priority)
      .sort((a, b) => {
        if ((b.unreadCount ?? 0) !== (a.unreadCount ?? 0)) {
          return (b.unreadCount ?? 0) - (a.unreadCount ?? 0);
        }
        return a.title.localeCompare(b.title);
      });

    const suggestedContacts = await Promise.all(
      allUsers
        .filter((entry) => entry._id !== user._id)
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 6)
        .map(async (entry) => ({
          name: entry.name,
          route: `/chat/direct/${encodeRouteSegment(entry.name)}`,
          avatarUrl: entry.profilePictureStorageId
            ? await ctx.storage.getUrl(entry.profilePictureStorageId)
            : (entry.externalAvatarUrl ?? null),
        }))
    );

    let lastVisited = null;
    if (settings?.lastVisitedKind && settings.lastVisitedKey) {
      const lastVisitedKey = settings.lastVisitedKey.toLowerCase();
      if (settings.lastVisitedKind === "general") {
        lastVisited = general;
      } else if (settings.lastVisitedKind === "direct") {
        const peer = userByLower.get(lastVisitedKey);
        if (peer) {
          const room = [meLower, lastVisitedKey].sort().join("-");
          const unreadCount = await getUnreadCountForRoom(ctx, user._id, room);
          lastVisited = {
            ...buildDirectConversation(peer.name, lastVisitedKey, meLower),
            unreadCount,
            priority:
              roomPriorities.find((entry) => entry.room === room)?.priority ??
              userPriorities.find((entry) => entry.otherNameLower === lastVisitedKey)?.priority ??
              false,
            activeCall: null,
          };
        }
      } else if (settings.lastVisitedKind === "group") {
        const group = groups.find((entry) => entry?.slug === settings.lastVisitedKey);
        if (group) {
          lastVisited = {
            ...buildGroupConversation(group.name, group.slug, group.description),
            unreadCount: await getUnreadCountForRoom(
              ctx,
              user._id,
              toGroupRoomSlug(group.slug)
            ),
            priority:
              roomPriorities.find((entry) => entry.room === toGroupRoomSlug(group.slug))?.priority ??
              false,
            activeCall: null,
          };
        }
      }
    }

    return {
      me: { name: user.name },
      onboardingSeenAt: settings?.onboardingSeenAt ?? null,
      onboardingCompletedAt: settings?.onboardingCompletedAt ?? null,
      lastVisited,
      general,
      directThreads: directConversationList.sort((a, b) => {
        if (b.unreadCount !== a.unreadCount) return b.unreadCount - a.unreadCount;
        return a.title.localeCompare(b.title);
      }),
      groups: groupConversationList.sort((a, b) => a.title.localeCompare(b.title)),
      priorityConversations,
      pendingInvites,
      activeCalls: activeCallSummaries.sort((a, b) => b.createdAt - a.createdAt),
      suggestedContacts,
      stats: {
        unreadTotal:
          general.unreadCount +
          directConversationList.reduce((sum, thread) => sum + thread.unreadCount, 0) +
          groupConversationList.reduce((sum, group) => sum + group.unreadCount, 0),
        joinedGroups: groups.length,
        directThreadCount: directConversationList.length,
      },
    };
  },
});

export const getConversationMeta = query({
  args: {
    token: v.string(),
    conversationRef: conversationRefValidator,
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const meLower = user.nameLower ?? user.name.trim().toLowerCase();
    const kind = args.conversationRef.kind;
    const key = args.conversationRef.key.trim().toLowerCase();

    if (kind === "general") {
      const conversation = buildGeneralConversation();
      const activeCall = await ctx.db
        .query("calls")
        .withIndex("by_conversation_status", (q) =>
          q.eq("conversationId", conversation.room).eq("status", "active")
        )
        .first();
      return {
        conversation,
        access: "allowed" as const,
        activeCall: activeCall
          ? {
              roomId: activeCall.roomId,
              createdAt: activeCall.createdAt,
            }
          : null,
        memberSummary: null,
        peer: null,
      };
    }

    if (kind === "direct") {
      const peer = await ctx.db
        .query("users")
        .withIndex("by_nameLower", (q) => q.eq("nameLower", key))
        .first();
      if (!peer) return null;

      const room = [meLower, key].sort().join("-");
      const activeCall = await ctx.db
        .query("calls")
        .withIndex("by_conversation_status", (q) =>
          q.eq("conversationId", room).eq("status", "active")
        )
        .first();

      return {
        conversation: buildDirectConversation(peer.name, key, meLower),
        access: "allowed" as const,
        activeCall: activeCall
          ? {
              roomId: activeCall.roomId,
              createdAt: activeCall.createdAt,
            }
          : null,
        memberSummary: null,
        peer: {
          name: peer.name,
          avatarUrl: peer.profilePictureStorageId
            ? await ctx.storage.getUrl(peer.profilePictureStorageId)
            : (peer.externalAvatarUrl ?? null),
        },
      };
    }

    const group = await ctx.db
      .query("groups")
      .withIndex("by_slug", (q) => q.eq("slug", key))
      .first();
    if (!group) return null;

    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) => q.eq("groupId", group._id).eq("userId", user._id))
      .first();
    const invite = await ctx.db
      .query("groupInvites")
      .withIndex("by_group_user", (q) => q.eq("groupId", group._id).eq("invitedUserId", user._id))
      .first();

    let access: "allowed" | "inviteRequired" | "joinable" = "allowed";
    if (!membership) {
      access = group.isPublic ? "joinable" : invite ? "allowed" : "inviteRequired";
    }

    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", group._id))
      .collect();

    const activeCall = await ctx.db
      .query("calls")
      .withIndex("by_conversation_status", (q) =>
        q.eq("conversationId", toGroupRoomSlug(group.slug)).eq("status", "active")
      )
      .first();

    return {
      conversation: buildGroupConversation(group.name, group.slug, group.description),
      access,
      activeCall: activeCall
        ? {
            roomId: activeCall.roomId,
            createdAt: activeCall.createdAt,
          }
        : null,
      memberSummary: {
        count: members.length,
        role: membership?.role ?? null,
      },
      peer: null,
    };
  },
});

export const saveLastVisited = mutation({
  args: {
    token: v.string(),
    conversationRef: v.union(conversationRefValidator, v.null()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const settings = await ensureUserSettingsDoc(ctx, user._id);
    const next = args.conversationRef;

    await ctx.db.patch(settings!._id, {
      lastVisitedKind: next?.kind,
      lastVisitedKey: next?.key.trim().toLowerCase(),
      updatedAt: Date.now(),
    });

    return { saved: true };
  },
});

export const markOnboardingSeen = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const settings = await ensureUserSettingsDoc(ctx, user._id);
    if (settings?.onboardingSeenAt) {
      return { seenAt: settings.onboardingSeenAt };
    }

    const now = Date.now();
    await ctx.db.patch(settings!._id, {
      onboardingSeenAt: now,
      updatedAt: now,
    });

    return { seenAt: now };
  },
});

export const completeOnboarding = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const { user } = await requireUserForToken(ctx, args.token);
    const settings = await ensureUserSettingsDoc(ctx, user._id);
    const now = Date.now();

    await ctx.db.patch(settings!._id, {
      onboardingSeenAt: settings?.onboardingSeenAt ?? now,
      onboardingCompletedAt: now,
      updatedAt: now,
    });

    return { completedAt: now };
  },
});
