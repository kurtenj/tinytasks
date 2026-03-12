import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getPin = query({
  args: {},
  handler: async (ctx) => {
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "adminPin"))
      .first();
    return setting?.value ?? null;
  },
});

export const setPin = mutation({
  args: { pin: v.string() },
  handler: async (ctx, { pin }) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "adminPin"))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { value: pin });
    } else {
      await ctx.db.insert("settings", { key: "adminPin", value: pin });
    }
  },
});
