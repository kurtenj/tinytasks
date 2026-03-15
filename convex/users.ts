import { internalMutation, mutation, query } from "./_generated/server";
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

export const getKids = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "kid"))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    role: v.union(v.literal("admin"), v.literal("kid")),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", args);
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
    const completions = await ctx.db
      .query("completions")
      .withIndex("by_user_date", (q) => q.eq("userId", id))
      .collect();
    await Promise.all(completions.map((c) => ctx.db.delete(c._id)));
    await ctx.db.delete(id);
  },
});

export const stripLegacyFields = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    await Promise.all(
      users.map((u) => {
        const { points, level, streak, equippedTheme, ..._ } = u as typeof u & {
          points?: unknown; level?: unknown; streak?: unknown; equippedTheme?: unknown;
        };
        if (points === undefined && level === undefined && streak === undefined && equippedTheme === undefined) return;
        return ctx.db.patch(u._id, { points: undefined, level: undefined, streak: undefined, equippedTheme: undefined });
      })
    );
  },
});
