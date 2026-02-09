import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  chats: defineTable({
    message: v.string(),
    username: v.optional(v.string()),
    room: v.optional(v.string()),
  }),
  users: defineTable({
    name: v.string(),
    nameLower: v.string(),
    updatedAt: v.number(),
  }).index("by_nameLower", ["nameLower"]),
});