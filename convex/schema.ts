import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    role: v.union(v.literal("admin"), v.literal("kid")),
    avatar: v.optional(v.string()),
    // Legacy fields kept optional for existing documents
    points: v.optional(v.number()),
    level: v.optional(v.number()),
    streak: v.optional(v.number()),
    equippedTheme: v.optional(v.string()),
  }),
  chores: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    cardColor: v.optional(v.string()),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    order: v.number(),
    scheduleType: v.optional(v.union(v.literal("repeating"), v.literal("floating"))),
    daysOfWeek:   v.optional(v.array(v.number())),
    assignedTo:   v.optional(v.array(v.id("users"))),
  }),
  completions: defineTable({
    choreId: v.id("chores"),
    userId: v.id("users"),
    date: v.string(), // ISO date string YYYY-MM-DD
    completedAt: v.number(), // timestamp
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_date", ["date"])
    .index("by_chore_date", ["choreId", "date"]),
  settings: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),
});
