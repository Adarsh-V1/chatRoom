import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";

import { hashShortPassword, verifyShortPassword } from "./lib/password";

function normalizeName(name: string): { trimmed: string; lower: string } {
  const trimmed = name.trim();
  if (!trimmed) throw new ConvexError("Username is required");
  return { trimmed, lower: trimmed.toLowerCase() };
}

function randomTokenHex(byteLength = 24): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  let hex = "";
  for (let i = 0; i < bytes.length; i += 1) {
    hex += bytes[i]!.toString(16).padStart(2, "0");
  }
  return hex;
}

export const loginOrRegister = mutation({
  args: {
    name: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const { trimmed, lower } = normalizeName(args.name);

    const existing = await ctx.db
      .query("users")
      .withIndex("by_nameLower", (q) => q.eq("nameLower", lower))
      .first();

    let userId;

    if (existing) {
      const hasPassword = Boolean(existing.passwordSaltHex && existing.passwordHashHex);

      if (hasPassword) {
        const ok = await verifyShortPassword({
          password: args.password,
          saltHex: existing.passwordSaltHex!,
          expectedHashHex: existing.passwordHashHex!,
        });
        if (!ok) throw new ConvexError("Invalid password");
      } else {
        const { saltHex, hashHex } = await hashShortPassword(args.password);
        await ctx.db.patch(existing._id, {
          passwordSaltHex: saltHex,
          passwordHashHex: hashHex,
        });
      }

      await ctx.db.patch(existing._id, {
        name: trimmed,
        updatedAt: Date.now(),
      });

      userId = existing._id;
    } else {
      const { saltHex, hashHex } = await hashShortPassword(args.password);
      userId = await ctx.db.insert("users", {
        name: trimmed,
        nameLower: lower,
        updatedAt: Date.now(),
        passwordSaltHex: saltHex,
        passwordHashHex: hashHex,
      });
    }

    const token = randomTokenHex(24);
    const now = Date.now();
    await ctx.db.insert("sessions", {
      userId,
      token,
      createdAt: now,
      lastSeenAt: now,
    });

    return { token, name: trimmed };
  },
});

export const getSessionUser = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const token = args.token.trim();
    if (!token) return null;

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    if (!session) return null;

    const user = await ctx.db.get(session.userId);
    if (!user) return null;

    const profilePictureUrl = user.profilePictureStorageId
      ? await ctx.storage.getUrl(user.profilePictureStorageId)
      : null;

    return { name: user.name, profilePictureUrl };
  },
});

export const touchSession = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const token = args.token.trim();
    if (!token) return;

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    if (!session) return;

    await ctx.db.patch(session._id, { lastSeenAt: Date.now() });
  },
});
