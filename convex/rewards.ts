import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("rewards")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("rewards").collect();
  },
});

export const create = mutation({
  args: {
    type: v.union(
      v.literal("points"),
      v.literal("badge"),
      v.literal("message"),
      v.literal("image")
    ),
    title: v.string(),
    value: v.string(),
    rarity: v.union(v.literal("common"), v.literal("rare"), v.literal("epic")),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("rewards", { ...args, isActive: true });
  },
});

export const update = mutation({
  args: {
    id: v.id("rewards"),
    title: v.optional(v.string()),
    value: v.optional(v.string()),
    rarity: v.optional(
      v.union(v.literal("common"), v.literal("rare"), v.literal("epic"))
    ),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...updates }) => {
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("rewards") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

export const getRandomActive = query({
  args: {},
  handler: async (ctx) => {
    const rewards = await ctx.db
      .query("rewards")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    if (rewards.length === 0) return null;
    // Weighted by rarity: common=5x, rare=3x, epic=2x
    const weighted = rewards.flatMap((r) => {
      if (r.rarity === "epic") return [r, r];
      if (r.rarity === "rare") return [r, r, r];
      return [r, r, r, r, r];
    });
    return weighted[Math.floor(Math.random() * weighted.length)];
  },
});
