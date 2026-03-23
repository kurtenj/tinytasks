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

const isWeekend = (dow: number) => dow === 0 || dow === 6;

type ChoreDoc = { assignedTo?: string[]; scheduleType?: string; daysOfWeek?: number[] };
function isChoreForKid(chore: ChoreDoc, userId: string, dow: number): boolean {
  if (chore.assignedTo && chore.assignedTo.length > 0) {
    if (!chore.assignedTo.includes(userId)) return false;
  }
  const type = chore.scheduleType ?? "floating";
  if (type === "repeating") {
    if (!chore.daysOfWeek || chore.daysOfWeek.length === 0) return true;
    return chore.daysOfWeek.includes(dow);
  }
  return true;
}

export const listForKid = query({
  args: { userId: v.id("users"), todayDow: v.number() },
  handler: async (ctx, { userId, todayDow }) => {
    if (isWeekend(todayDow)) return [];
    const allActive = await ctx.db
      .query("chores")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    return allActive.filter((chore) => isChoreForKid(chore, userId, todayDow));
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
    imageUrl: v.optional(v.string()),
    cardColor: v.optional(v.string()),
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
    imageUrl:     v.optional(v.string()),
    cardColor:    v.optional(v.string()),
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

export const getKidsSummary = query({
  args: { today: v.string(), todayDow: v.number() },
  handler: async (ctx, { today, todayDow }) => {
    const kids = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "kid"))
      .collect();
    const allActive = await ctx.db
      .query("chores")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    if (isWeekend(todayDow)) {
      return kids.map((kid) => ({ userId: kid._id, remaining: 0 }));
    }

    const todayCompletions = await ctx.db
      .query("completions")
      .withIndex("by_date", (q) => q.eq("date", today))
      .collect();
    const todaySnoozed = await ctx.db
      .query("snoozed")
      .withIndex("by_date", (q) => q.eq("date", today))
      .collect();

    return kids.map((kid) => {
      const kidChores = allActive.filter((chore) => isChoreForKid(chore, kid._id, todayDow));
      const completedIds = new Set(
        todayCompletions.filter((c) => c.userId === kid._id).map((c) => c.choreId)
      );
      const snoozedIds = new Set(
        todaySnoozed.filter((s) => s.userId === kid._id).map((s) => s.choreId)
      );
      const remaining = kidChores.filter((c) => !completedIds.has(c._id) && !snoozedIds.has(c._id)).length;
      return { userId: kid._id, remaining };
    });
  },
});

export const getSnoozedForUser = query({
  args: { userId: v.id("users"), date: v.string() },
  handler: async (ctx, { userId, date }) => {
    const rows = await ctx.db
      .query("snoozed")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
      .collect();
    return rows.map((r) => r.choreId);
  },
});

export const snoozeChore = mutation({
  args: { userId: v.id("users"), choreId: v.id("chores"), date: v.string() },
  handler: async (ctx, { userId, choreId, date }) => {
    const existing = await ctx.db
      .query("snoozed")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
      .filter((q) => q.eq(q.field("choreId"), choreId))
      .first();
    if (!existing) {
      await ctx.db.insert("snoozed", { userId, choreId, date });
    }
  },
});

// Returns per-day progress for the current week (Mon–Fri)
export const getWeeklyProgress = query({
  args: {
    userId: v.id("users"),
    weekDates: v.array(v.string()), // [Mon, Tue, Wed, Thu, Fri]
    today: v.optional(v.string()),
  },
  handler: async (ctx, { userId, weekDates, today }) => {
    const weekDow = [1, 2, 3, 4, 5]; // Mon=1 … Fri=5

    const allActive = await ctx.db
      .query("chores")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const allCompletions = (
      await Promise.all(
        weekDates.map((date) =>
          ctx.db
            .query("completions")
            .withIndex("by_user_date", (q) =>
              q.eq("userId", userId).eq("date", date),
            )
            .collect(),
        ),
      )
    ).flat();

    return weekDates.map((date, i) => {
      const dow = weekDow[i];
      const dayChores = allActive.filter((c) => isChoreForKid(c, userId, dow));
      const completedOnDay = new Set(
        allCompletions.filter((c) => c.date === date).map((c) => c.choreId),
      );
      // For past days, floating chores that weren't completed that day are excluded
      // from the total — snoozing a floating chore doesn't penalize the past day.
      const isPastDay = today !== undefined && date < today;
      const countableChores = isPastDay
        ? dayChores.filter(
            (c) =>
              (c.scheduleType ?? "floating") !== "floating" ||
              completedOnDay.has(c._id),
          )
        : dayChores;
      return {
        date,
        total: countableChores.length,
        completed: countableChores.filter((c) => completedOnDay.has(c._id)).length,
      };
    });
  },
});

// weekDates: [Mon, Tue, Wed, Thu, Fri] as YYYY-MM-DD strings for the current week
export const getWeeklyAllowanceStatus = query({
  args: {
    userId: v.id("users"),
    today: v.string(),
    todayDow: v.number(),
    weekDates: v.array(v.string()),
  },
  handler: async (ctx, { userId, today, todayDow, weekDates }) => {
    const weekDow = [1, 2, 3, 4, 5]; // Mon=1 … Fri=5

    const allActive = await ctx.db
      .query("chores")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const kidChores = allActive.filter((chore) => {
      if (chore.assignedTo && chore.assignedTo.length > 0) {
        if (!chore.assignedTo.includes(userId)) return false;
      }
      return true;
    });

    const floatingChores = kidChores.filter(
      (c) => (c.scheduleType ?? "floating") === "floating",
    );
    const scheduledChores = kidChores.filter(
      (c) => c.scheduleType === "repeating",
    );

    // Gather all completions for this user during Mon–Fri
    const weekCompletions = (
      await Promise.all(
        weekDates.map((date) =>
          ctx.db
            .query("completions")
            .withIndex("by_user_date", (q) =>
              q.eq("userId", userId).eq("date", date),
            )
            .collect(),
        ),
      )
    ).flat();

    // Check scheduled chores for each past weekday
    for (let i = 0; i < weekDates.length; i++) {
      const date = weekDates[i];
      const dow = weekDow[i];
      // Only evaluate days that have already passed
      if (!isWeekend(todayDow) && date >= today) continue;
      for (const chore of scheduledChores) {
        const days = chore.daysOfWeek;
        if (!days || days.length === 0 || days.includes(dow)) {
          const done = weekCompletions.some(
            (c) => c.choreId === chore._id && c.date === date,
          );
          if (!done) return "lost";
        }
      }
    }

    // Check floating chores — each must be completed at least once this week
    for (const chore of floatingChores) {
      const done = weekCompletions.some((c) => c.choreId === chore._id);
      if (!done) {
        return isWeekend(todayDow) ? "lost" : "on_track";
      }
    }

    return isWeekend(todayDow) ? "earned" : "on_track";
  },
});
