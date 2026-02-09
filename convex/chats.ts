import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsertUser = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const trimmed = args.name.trim();
    if (!trimmed) return;

    const nameLower = trimmed.toLowerCase();
    const existing = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("nameLower"), nameLower))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: trimmed,
        updatedAt: Date.now(),
      });
      return;
    }

    await ctx.db.insert("users", {
      name: trimmed,
      nameLower,
      updatedAt: Date.now(),
    });
  },
});

export const listUsers = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    users.sort((a, b) => a.name.localeCompare(b.name));
    return users.map((u) => u.name);
  },
});

// Back-compat for existing client code (sidebar)
export const getUsernames = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    users.sort((a, b) => a.name.localeCompare(b.name));
    return users.map((u) => u.name);
  },
});

export const addChat = mutation({
  args: { message: v.string(), username: v.string(), room: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("chats", {
      message: args.message,
      username: args.username,
      room: args.room,
    });
  },
});

export const getChats = query({
  args: { room: v.string() },
  handler: async (ctx, args) => {
    const chats = await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("room"), args.room))
      .order("asc")
      .collect();
    return chats;
  },
});

// One-time migration helper: fill missing fields on legacy docs
export const backfillLegacyChats = mutation({
  args: {},
  handler: async (ctx) => {
    const chats = await ctx.db.query("chats").collect();
    let patched = 0;
    for (const chat of chats) {
      const patch: { room?: string; username?: string } = {};
      if (!chat.room) patch.room = "general";
      if (!chat.username) patch.username = "anonymous";
      if (patch.room || patch.username) {
        await ctx.db.patch(chat._id, patch);
        patched += 1;
      }
    }
    return { patched };
  },
});