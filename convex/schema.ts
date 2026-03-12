import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    role: v.union(v.literal("admin"), v.literal("kid")),
    avatar: v.optional(v.string()),
    points: v.number(),
    streak: v.number(),
    lastCompletedDate: v.optional(v.string()),
    level: v.number(),
  }),
  chores: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    order: v.number(),
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
  rewards: defineTable({
    type: v.union(
      v.literal("points"),
      v.literal("badge"),
      v.literal("message"),
      v.literal("image")
    ),
    title: v.string(),
    value: v.string(), // points amount, badge name, message text, or image url
    rarity: v.union(v.literal("common"), v.literal("rare"), v.literal("epic")),
    isActive: v.boolean(),
    createdBy: v.id("users"),
  }),
  treasureOpens: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD
    rewardId: v.id("rewards"),
    openedAt: v.number(),
  }).index("by_user_date", ["userId", "date"]),
  settings: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),
});
