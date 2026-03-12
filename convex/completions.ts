import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getTodayForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const today = new Date().toISOString().split("T")[0];
    return await ctx.db
      .query("completions")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).eq("date", today)
      )
      .collect();
  },
});

export const getTodayAll = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    return await ctx.db
      .query("completions")
      .withIndex("by_date", (q) => q.eq("date", today))
      .collect();
  },
});

export const complete = mutation({
  args: {
    choreId: v.id("chores"),
    userId: v.id("users"),
  },
  handler: async (ctx, { choreId, userId }) => {
    const today = new Date().toISOString().split("T")[0];
    // Check if already completed today
    const existing = await ctx.db
      .query("completions")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).eq("date", today)
      )
      .filter((q) => q.eq(q.field("choreId"), choreId))
      .first();
    if (existing) return existing._id;

    return await ctx.db.insert("completions", {
      choreId,
      userId,
      date: today,
      completedAt: Date.now(),
    });
  },
});

export const uncomplete = mutation({
  args: {
    choreId: v.id("chores"),
    userId: v.id("users"),
  },
  handler: async (ctx, { choreId, userId }) => {
    const today = new Date().toISOString().split("T")[0];
    const existing = await ctx.db
      .query("completions")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).eq("date", today)
      )
      .filter((q) => q.eq(q.field("choreId"), choreId))
      .first();
    if (existing) await ctx.db.delete(existing._id);
  },
});

export const resetDay = mutation({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    const todayCompletions = await ctx.db
      .query("completions")
      .withIndex("by_date", (q) => q.eq("date", today))
      .collect();
    for (const c of todayCompletions) {
      await ctx.db.delete(c._id);
    }
  },
});
