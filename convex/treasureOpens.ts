import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getTodayForUser = query({
  args: { userId: v.id("users"), today: v.string() },
  handler: async (ctx, { userId, today }) => {
    return await ctx.db
      .query("treasureOpens")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).eq("date", today)
      )
      .first();
  },
});

export const openChest = mutation({
  args: {
    userId: v.id("users"),
    rewardId: v.id("rewards"),
    today: v.string(),
  },
  handler: async (ctx, { userId, rewardId, today }) => {
    // Check already opened
    const existing = await ctx.db
      .query("treasureOpens")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).eq("date", today)
      )
      .first();
    if (existing) return existing._id;

    return await ctx.db.insert("treasureOpens", {
      userId,
      rewardId,
      date: today,
      openedAt: Date.now(),
    });
  },
});
