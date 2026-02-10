import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  chats: defineTable({
    message: v.string(),
    userId: v.optional(v.id("users")),
    username: v.optional(v.string()),
    room: v.optional(v.string()),
    kind: v.optional(v.union(v.literal("text"), v.literal("file"))),
    storageId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
  }),
  users: defineTable({
    name: v.string(),
    nameLower: v.string(),
    updatedAt: v.number(),
    profilePictureStorageId: v.optional(v.id("_storage")),
    passwordSaltHex: v.optional(v.string()),
    passwordHashHex: v.optional(v.string()),
  }).index("by_nameLower", ["nameLower"]),
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    createdAt: v.number(),
    lastSeenAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_userId", ["userId"]),
});