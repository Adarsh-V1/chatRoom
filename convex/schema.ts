import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  chats: defineTable({
    message: v.string(),
    username: v.string(),
    room: v.string(),
  }),
});