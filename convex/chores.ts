import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("chores")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const listForKid = query({
  args: { userId: v.id("users"), todayDow: v.number() },
  handler: async (ctx, { userId, todayDow }) => {
    const allActive = await ctx.db
      .query("chores")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    return allActive.filter((chore) => {
      if (chore.assignedTo && chore.assignedTo.length > 0) {
        if (!chore.assignedTo.includes(userId)) return false;
      }
      const type = chore.scheduleType ?? "floating";
      if (type === "repeating") {
        if (!chore.daysOfWeek || chore.daysOfWeek.length === 0) return true;
        return chore.daysOfWeek.includes(todayDow);
      }
      return true;
    });
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("chores").collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    createdBy: v.id("users"),
    scheduleType: v.optional(v.union(v.literal("repeating"), v.literal("floating"))),
    daysOfWeek:   v.optional(v.array(v.number())),
    assignedTo:   v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("chores").collect();
    return await ctx.db.insert("chores", {
      ...args,
      isActive: true,
      order: existing.length,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("chores"),
    title:        v.optional(v.string()),
    description:  v.optional(v.string()),
    icon:         v.optional(v.string()),
    isActive:     v.optional(v.boolean()),
    scheduleType: v.optional(v.union(v.literal("repeating"), v.literal("floating"))),
    daysOfWeek:   v.optional(v.array(v.number())),
    assignedTo:   v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, { id, ...updates }) => {
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("chores") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
