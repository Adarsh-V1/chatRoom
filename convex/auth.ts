import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

import { hashPassword, verifyPassword } from "./lib/password";
import { getSessionByToken } from "./lib/session";

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

async function createSession(ctx: MutationCtx, userId: Id<"users">) {
  const token = randomTokenHex(24);
  const now = Date.now();
  await ctx.db.insert("sessions", {
    userId,
    token,
    createdAt: now,
    lastSeenAt: now,
  });
  return token;
}

function sanitizeBaseName(input: string, fallback = "user"): string {
  const cleaned = input
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^a-zA-Z0-9 _.-]/g, "")
    .trim();
  return cleaned.slice(0, 32) || fallback;
}

async function resolveUniqueName(ctx: MutationCtx, preferred: string): Promise<string> {
  const base = sanitizeBaseName(preferred, "user");
  const baseLower = base.toLowerCase();

  const exact = await ctx.db
    .query("users")
    .withIndex("by_nameLower", (q) => q.eq("nameLower", baseLower))
    .first();
  if (!exact) return base;

  for (let i = 1; i <= 12; i += 1) {
    const candidate = `${base}-${i}`;
    const candidateLower = candidate.toLowerCase();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_nameLower", (q) => q.eq("nameLower", candidateLower))
      .first();
    if (!existing) return candidate;
  }

  const randomSuffix = randomTokenHex(3);
  return `${base}-${randomSuffix}`;
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
    let isNewUser = false;

    if (existing) {
      const hasPassword = Boolean(existing.passwordSaltHex && existing.passwordHashHex);

      if (hasPassword) {
        const ok = await verifyPassword({
          password: args.password,
          saltHex: existing.passwordSaltHex!,
          expectedHashHex: existing.passwordHashHex!,
        });
        if (!ok) throw new ConvexError("Invalid password");
      } else {
        const { saltHex, hashHex } = await hashPassword(args.password);
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
      const { saltHex, hashHex } = await hashPassword(args.password);
      userId = await ctx.db.insert("users", {
        name: trimmed,
        nameLower: lower,
        updatedAt: Date.now(),
        passwordSaltHex: saltHex,
        passwordHashHex: hashHex,
      });
      isNewUser = true;
    }

    const token = await createSession(ctx, userId);

    return { token, name: trimmed, isNewUser };
  },
});

export const loginWithGoogle = mutation({
  args: {
    googleSub: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    picture: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const googleSub = args.googleSub.trim();
    if (!googleSub) throw new ConvexError("Invalid Google account");

    const email = (args.email ?? "").trim();
    const emailLower = email ? email.toLowerCase() : undefined;
    const preferredName = sanitizeBaseName(args.name ?? email.split("@")[0] ?? "user");

    const byGoogleSub = await ctx.db
      .query("users")
      .withIndex("by_googleSub", (q) => q.eq("googleSub", googleSub))
      .first();

    let userId: Id<"users">;
    let finalName: string;
    let isNewUser = false;

    if (byGoogleSub) {
      finalName = byGoogleSub.name;
      userId = byGoogleSub._id;
      await ctx.db.patch(byGoogleSub._id, {
        updatedAt: Date.now(),
        email: email || byGoogleSub.email,
        emailLower: emailLower ?? byGoogleSub.emailLower,
        externalAvatarUrl: (args.picture ?? "").trim() || byGoogleSub.externalAvatarUrl,
      });
    } else {
      let existing: Doc<"users"> | null = null;
      if (emailLower) {
        existing = await ctx.db
          .query("users")
          .withIndex("by_emailLower", (q) => q.eq("emailLower", emailLower))
          .first();
      }

      if (existing) {
        userId = existing._id;
        finalName = existing.name;
        await ctx.db.patch(existing._id, {
          googleSub,
          email,
          emailLower,
          externalAvatarUrl: (args.picture ?? "").trim() || existing.externalAvatarUrl,
          updatedAt: Date.now(),
        });
      } else {
        const uniqueName = await resolveUniqueName(ctx, preferredName);
        const uniqueNameLower = uniqueName.toLowerCase();

        userId = await ctx.db.insert("users", {
          name: uniqueName,
          nameLower: uniqueNameLower,
          email: email || undefined,
          emailLower,
          googleSub,
          externalAvatarUrl: (args.picture ?? "").trim() || undefined,
          updatedAt: Date.now(),
        });
        finalName = uniqueName;
        isNewUser = true;
      }
    }

    const token = await createSession(ctx, userId);
    return { token, name: finalName, isNewUser };
  },
});

export const getSessionUser = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await getSessionByToken(ctx, args.token);
    if (!session) return null;

    const user = await ctx.db.get(session.userId);
    if (!user) return null;

    const profilePictureUrl = user.profilePictureStorageId
      ? await ctx.storage.getUrl(user.profilePictureStorageId)
      : (user.externalAvatarUrl ?? null);

    return { name: user.name, profilePictureUrl };
  },
});

export const touchSession = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await getSessionByToken(ctx, args.token);
    if (!session) return;

    await ctx.db.patch(session._id, { lastSeenAt: Date.now() });
  },
});

export const revokeSession = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await getSessionByToken(ctx, args.token);
    if (!session) return { revoked: false };
    await ctx.db.delete(session._id);
    return { revoked: true };
  },
});
