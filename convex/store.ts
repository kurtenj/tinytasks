import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const ITEM_TYPE = v.union(
  v.literal("avatar"),
  v.literal("theme"),
  v.literal("effect"),
);

export const listItems = query({
  args: { type: ITEM_TYPE },
  handler: async (ctx, { type }) => {
    return await ctx.db
      .query("storeItems")
      .withIndex("by_type", (q) => q.eq("type", type))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const listAllItems = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("storeItems").collect();
  },
});

export const getUserPurchases = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("purchases")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

/** Purchase if not already owned, then equip. */
export const purchaseOrEquip = mutation({
  args: { userId: v.id("users"), itemId: v.id("storeItems") },
  handler: async (ctx, { userId, itemId }) => {
    const user = await ctx.db.get(userId);
    const item = await ctx.db.get(itemId);
    if (!user || !item) throw new Error("Not found");

    const alreadyOwned = await ctx.db
      .query("purchases")
      .withIndex("by_user_item", (q) =>
        q.eq("userId", userId).eq("itemId", itemId),
      )
      .first();

    if (!alreadyOwned) {
      if (user.points < item.cost) throw new Error("Not enough points");
      await ctx.db.patch(userId, { points: user.points - item.cost });
      await ctx.db.insert("purchases", {
        userId,
        itemId,
        purchasedAt: Date.now(),
      });
    }

    // Equip: denormalize imageUrl/value onto user for zero-cost reads
    if (item.type === "avatar") {
      await ctx.db.patch(userId, {
        equippedAvatar: itemId,
        avatar: item.imageUrl,
      });
    } else if (item.type === "theme") {
      await ctx.db.patch(userId, { equippedTheme: itemId });
    }
  },
});

export const createItem = mutation({
  args: {
    type: ITEM_TYPE,
    name: v.string(),
    cost: v.number(),
    imageUrl: v.optional(v.string()),
    value: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("storeItems").collect();
    return await ctx.db.insert("storeItems", {
      ...args,
      isActive: true,
      order: existing.length,
    });
  },
});

export const removeItem = mutation({
  args: { id: v.id("storeItems") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
