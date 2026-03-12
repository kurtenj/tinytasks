import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const get = query({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    role: v.union(v.literal("admin"), v.literal("kid")),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      ...args,
      points: 0,
      streak: 0,
      level: 1,
    });
  },
});

export const getKids = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "kid"))
      .collect();
  },
});

export const updatePoints = mutation({
  args: { userId: v.id("users"), points: v.number() },
  handler: async (ctx, { userId, points }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    const newPoints = user.points + points;
    const newLevel = Math.floor(newPoints / 100) + 1;
    await ctx.db.patch(userId, { points: newPoints, level: newLevel });
  },
});

export const rename = mutation({
  args: { id: v.id("users"), name: v.string() },
  handler: async (ctx, { id, name }) => {
    await ctx.db.patch(id, { name });
  },
});

export const remove = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    const completions = await ctx.db.query("completions").collect();
    for (const c of completions.filter((c) => c.userId === id)) {
      await ctx.db.delete(c._id);
    }
    const opens = await ctx.db.query("treasureOpens").collect();
    for (const o of opens.filter((o) => o.userId === id)) {
      await ctx.db.delete(o._id);
    }
    await ctx.db.delete(id);
  },
});

export const updateStreak = mutation({
  args: {
    userId: v.id("users"),
    streak: v.number(),
    lastCompletedDate: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      streak: args.streak,
      lastCompletedDate: args.lastCompletedDate,
    });
  },
});
