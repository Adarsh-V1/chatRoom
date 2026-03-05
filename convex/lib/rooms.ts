import { ConvexError } from "convex/values";

import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = MutationCtx | QueryCtx;

export const GROUP_ROOM_PREFIX = "group:";

export function parseGroupSlug(room: string): string | null {
  const trimmed = room.trim();
  if (!trimmed.startsWith(GROUP_ROOM_PREFIX)) return null;
  const slug = trimmed.slice(GROUP_ROOM_PREFIX.length).trim().toLowerCase();
  return slug || null;
}

function parseDirectRoom(room: string): { canonical: string; participants: [string, string] } | null {
  const parts = room
    .trim()
    .toLowerCase()
    .split("-")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length !== 2) return null;
  const sorted = [...parts].sort() as [string, string];
  return {
    canonical: sorted.join("-"),
    participants: sorted,
  };
}

export async function assertUserCanAccessRoom(
  ctx: Ctx,
  user: Doc<"users">,
  room: string
): Promise<void> {
  const trimmedRoom = room.trim();
  if (!trimmedRoom) throw new ConvexError("Room is required");

  const groupSlug = parseGroupSlug(trimmedRoom);
  if (groupSlug) {
    const group = await ctx.db
      .query("groups")
      .withIndex("by_slug", (q) => q.eq("slug", groupSlug))
      .first();

    if (!group) throw new ConvexError("Group not found");

    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) =>
        q.eq("groupId", group._id).eq("userId", user._id)
      )
      .first();

    if (!membership) throw new ConvexError("Join the group to view messages");
    return;
  }

  if (trimmedRoom === "general") return;

  const directRoom = parseDirectRoom(trimmedRoom);
  if (!directRoom) throw new ConvexError("Invalid room");
  if (trimmedRoom.toLowerCase() !== directRoom.canonical) {
    throw new ConvexError("Invalid direct room id");
  }

  const myNameLower = user.nameLower ?? user.name.trim().toLowerCase();
  if (!directRoom.participants.includes(myNameLower)) {
    throw new ConvexError("Not authorized for this direct room");
  }
}
