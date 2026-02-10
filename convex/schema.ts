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

    // Developer Context Chat (optional)
    contextType: v.optional(
      v.union(v.literal("file"), v.literal("snippet"), v.literal("task"))
    ),
    contextData: v.optional(v.string()),
  }),

  // Per-user unread tracking per room.
  chatReadStates: defineTable({
    userId: v.id("users"),
    room: v.string(),
    lastReadCreationTime: v.number(),
    updatedAt: v.number(),
  }).index("by_user_room", ["userId", "room"]),

  // Temporary “While you were away” summaries per user per room.
  chatSummaries: defineTable({
    userId: v.id("users"),
    room: v.string(),
    createdAt: v.number(),
    unreadCount: v.number(),
    fromCreationTime: v.number(),
    toCreationTime: v.number(),
    bullets: v.array(v.string()),
    dismissedAt: v.optional(v.number()),
  }).index("by_user_room", ["userId", "room"]),

  // Focus mode state per user.
  userSettings: defineTable({
    userId: v.id("users"),
    focusMode: v.boolean(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  // Priority rooms (chat strings) per user.
  chatPriorities: defineTable({
    userId: v.id("users"),
    room: v.string(),
    priority: v.boolean(),
    updatedAt: v.number(),
  }).index("by_user_room", ["userId", "room"]),

  // Priority users per user (for direct chats).
  userPriorities: defineTable({
    userId: v.id("users"),
    otherNameLower: v.string(),
    priority: v.boolean(),
    updatedAt: v.number(),
  }).index("by_user_otherNameLower", ["userId", "otherNameLower"]),

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

  calls: defineTable({
    roomId: v.string(),
    conversationId: v.string(),
    startedBy: v.id("users"),
    status: v.union(v.literal("active"), v.literal("ended")),
    createdAt: v.number(),
  })
    .index("by_roomId", ["roomId"])
    .index("by_conversationId", ["conversationId"])
    .index("by_conversation_status", ["conversationId", "status"]),

  webrtcSignals: defineTable({
    roomId: v.string(),
    senderId: v.id("users"),
    type: v.string(),
    payload: v.string(),
    createdAt: v.number(),
  })
    .index("by_roomId", ["roomId"])
    .index("by_room_createdAt", ["roomId", "createdAt"]),
});