"use client";
import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useDragControls,
  animate,
} from "framer-motion";
import Image from "next/image";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import * as HugeiconsIcons from "@hugeicons/core-free-icons";
import { useLiveClock, getToday, useChoreCountdown } from "@/lib/time";
import { UserChip } from "@/components/UserChip";

// ── ChoreIcon ─────────────────────────────────────────────────────────────────

function ChoreIcon({
  iconName,
  size,
  className,
}: {
  iconName: string;
  size?: number;
  className?: string;
}) {
  const iconData = (
    HugeiconsIcons as unknown as Record<string, IconSvgElement>
  )[iconName];
  if (!iconData) return null;
  return <HugeiconsIcon icon={iconData} size={size} className={className} />;
}

// ── WeeklyProgressBar ─────────────────────────────────────────────────────────

interface WeeklyProgressBarProps {
  days: Array<{ date: string; total: number; completed: number }> | undefined;
  today: string;
  todaySnoozed: number;
  clockLabel: string;
  allowanceStatus: string | undefined | null;
}

function WeeklyProgressBar({
  days,
  today,
  todaySnoozed,
  clockLabel,
  allowanceStatus,
}: WeeklyProgressBarProps) {
  if (!days) return null;

  const todayIndex = days.findIndex((d) => d.date === today);
  const adjustedDays = days.map((d, i) => ({
    ...d,
    handled:
      i === todayIndex
        ? Math.min(d.completed + todaySnoozed, d.total)
        : d.completed,
  }));

  const totalHandled = adjustedDays.reduce((s, d) => s + d.handled, 0);
  const totalExpected = adjustedDays.reduce((s, d) => s + d.total, 0);
  const weeklyPct =
    totalExpected > 0 ? Math.round((totalHandled / totalExpected) * 100) : 0;

  const statusLabel =
    allowanceStatus === "earned"
      ? "All done!"
      : allowanceStatus === "lost"
        ? "Behind"
        : "On track";

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-sm font-normal text-neutral-400">{clockLabel}</p>
        <div className="flex items-center gap-2">
          <p className="text-sm font-normal text-neutral-400">{statusLabel}</p>
          <p className="text-sm font-semibold text-neutral-900">{weeklyPct}%</p>
        </div>
      </div>
      <div className="flex gap-2">
        {adjustedDays.map((d) => {
          const fillPct =
            d.total > 0 ? Math.min(d.handled / d.total, 1) * 100 : 0;
          const isNoChores = d.total === 0;
          const isFuture = d.date > today;
          return (
            <div
              key={d.date}
              className={`flex-1 h-3.75 rounded-full overflow-hidden ${
                isNoChores
                  ? "outline outline-neutral-900/15"
                  : "bg-neutral-900/15"
              }`}
            >
              {!isNoChores && !isFuture && fillPct > 0 && (
                <motion.div
                  className="h-full bg-neutral-900"
                  initial={{ width: 0 }}
                  animate={{ width: `${fillPct}%` }}
                  transition={{ type: "spring", stiffness: 200, damping: 24 }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── ChoreCard ─────────────────────────────────────────────────────────────────

interface ChoreCardProps {
  chore: Doc<"chores">;
  onComplete: () => void;
  onCycle?: (direction: 1 | -1) => void;
  onSnooze?: () => void;
}

function ChoreCard({ chore, onComplete, onCycle, onSnooze }: ChoreCardProps) {
  const countdown = useChoreCountdown(chore.scheduleType ?? "floating");
  const x = useMotionValue(0);
  const dragRotate = useTransform(x, [-250, 0, 250], [-18, 0, 18]);
  const spinRotate = useMotionValue(0);
  const rotate = useTransform(
    [dragRotate, spinRotate],
    ([drag, spin]) => (drag as number) + (spin as number),
  );
  const dragControls = useDragControls();
  const lastPointerDownRef = useRef<number>(0);

  const doComplete = () => {
    const easing: [number, number, number, number] = [0.3, 0, 0.9, 1];
    animate(x, 480, { ease: easing, duration: 0.44 });
    animate(spinRotate, 210, { ease: easing, duration: 0.44 });
    setTimeout(onComplete, 370);
  };

  const doCycle = (direction: 1 | -1) => {
    if (!onCycle) {
      animate(x, 0, { type: "spring", stiffness: 320, damping: 22 });
      return;
    }
    animate(x, direction * 520, { ease: [0.4, 0, 0.9, 1], duration: 0.28 });
    setTimeout(() => onCycle(direction), 210);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const now = Date.now();
    if (now - lastPointerDownRef.current < 350) {
      lastPointerDownRef.current = 0;
      doComplete();
      return;
    }
    lastPointerDownRef.current = now;
    dragControls.start(e);
  };

  return (
    <motion.div
      drag="x"
      dragControls={dragControls}
      dragListener={false}
      style={{ x, rotate }}
      dragConstraints={{ left: -520, right: 520 }}
      dragElastic={0.04}
      onDragEnd={(_, info) => {
        const isSwipe =
          Math.abs(info.offset.x) > 80 || Math.abs(info.velocity.x) > 600;
        if (isSwipe) {
          doCycle(info.offset.x >= 0 ? 1 : -1);
        } else {
          animate(x, 0, { type: "spring", stiffness: 320, damping: 22 });
        }
      }}
      initial={{ scale: 0.93, y: -16 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0 } }}
      transition={{ type: "spring", stiffness: 480, damping: 34 }}
      className="absolute inset-0 rounded-2xl shadow-lg overflow-hidden select-none touch-none bg-white"
      onPointerDown={handlePointerDown}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18, delay: 0.06 }}
      >
        <div className="absolute inset-x-0 top-0 bottom-35 pointer-events-none">
          {chore.imageUrl ? (
            <div className="relative w-full h-full">
              <Image
                src={chore.imageUrl}
                alt={chore.title}
                fill
                className="object-contain"
                sizes="(max-width: 512px) 100vw, 512px"
              />
            </div>
          ) : chore.icon ? (
            <ChoreIcon
              iconName={chore.icon}
              size={96}
              className="text-stone-950/40"
            />
          ) : null}
        </div>

        <div className="absolute bottom-0 inset-x-0 px-4 pb-4 flex flex-col gap-3">
          <div className="px-2 pointer-events-none">
            <p className="text-neutral-800 text-xl font-medium leading-tight mb-1">
              {chore.title}
            </p>
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-neutral-400 text-sm">
                {chore.description ?? ""}
              </p>
              <span className="text-neutral-400 text-sm tabular-nums shrink-0">
                {countdown}
              </span>
            </div>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={doComplete}
              className="flex-1 flex items-center justify-center rounded-md border-2 border-emerald-500/25 bg-emerald-50 py-3 text-sm font-medium text-emerald-600"
            >
              Complete
            </button>
            {onSnooze && (
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onSnooze}
                className="flex-1 flex items-center justify-center rounded-md border-2 border-neutral-300/25 bg-neutral-50 py-3 text-sm font-medium text-neutral-600"
              >
                Do later
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── KidDashboard ──────────────────────────────────────────────────────────────

interface KidDashboardProps {
  userId: Id<"users">;
  onSwitchUser: () => void;
}

export function KidDashboard({ userId, onSwitchUser }: KidDashboardProps) {
  const [frontOffset, setFrontOffset] = useState(0);
  const clockLabel = useLiveClock();
  const today = getToday();
  const todayDow = new Date().getDay();
  const isWeekend = todayDow === 0 || todayDow === 6;

  const mondayOffset = todayDow === 0 ? -6 : 1 - todayDow;
  const weekDates = [0, 1, 2, 3, 4].map((i) => {
    const d = new Date();
    d.setDate(d.getDate() + mondayOffset + i);
    return d.toLocaleDateString("en-CA");
  });

  const user = useQuery(api.users.get, { id: userId });
  const chores = useQuery(api.chores.listForKid, { userId, todayDow });
  const completions = useQuery(api.completions.getTodayForUser, {
    userId,
    today,
  });
  const snoozedChoreIds = useQuery(api.chores.getSnoozedForUser, {
    userId,
    date: today,
  });
  const allowanceStatus = useQuery(api.chores.getWeeklyAllowanceStatus, {
    userId,
    today,
    todayDow,
    weekDates,
  });
  const weeklyProgress = useQuery(api.chores.getWeeklyProgress, {
    userId,
    weekDates,
    today,
  });
  const complete = useMutation(api.completions.complete);
  const snooze = useMutation(api.chores.snoozeChore);

  const completedIds = new Set(completions?.map((c) => c.choreId) ?? []);
  const snoozedIds = new Set(snoozedChoreIds ?? []);
  const remaining =
    chores?.filter((c) => !completedIds.has(c._id) && !snoozedIds.has(c._id)) ??
    [];
  const completed = chores?.filter((c) => completedIds.has(c._id)) ?? [];
  const todaySnoozedCount =
    chores?.filter((c) => snoozedIds.has(c._id)).length ?? 0;

  const offset = remaining.length > 0 ? frontOffset % remaining.length : 0;
  const [frontChore, midChore, backChore] = Array.from(
    { length: Math.min(3, remaining.length) },
    (_, i) => remaining[(offset + i) % remaining.length],
  );

  const handleCycle = (direction: 1 | -1) => {
    setFrontOffset((o) => {
      if (remaining.length === 0) return 0;
      return (
        (((o + direction) % remaining.length) + remaining.length) %
        remaining.length
      );
    });
  };

  const handleSnooze = (choreId: Id<"chores">) => {
    snooze({ userId, choreId, date: today });
    setFrontOffset(0);
  };

  if (!user || !chores || snoozedChoreIds === undefined) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="text-stone-400 animate-pulse text-2xl">✓</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-neutral-100 font-google-sans flex flex-col">
      <motion.div
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="relative px-4 pt-safe-4 pb-5"
      >
        <div className="max-w-lg mx-auto space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onSwitchUser}
              className="active:scale-[0.97] transition-transform"
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={24}
                strokeWidth={3}
                className="text-neutral-800"
              />
            </button>
            <UserChip user={user} />
          </div>
          <WeeklyProgressBar
            days={weeklyProgress}
            today={today}
            todaySnoozed={todaySnoozedCount}
            clockLabel={clockLabel}
            allowanceStatus={allowanceStatus}
          />
        </div>
      </motion.div>

      <div className="relative max-w-lg mx-auto flex flex-col flex-1 w-full">
        {remaining.length > 0 && (
          <div className="px-4 pt-8">
            <div className="relative h-105">
              {backChore && (
                <div
                  className="absolute top-8 rounded-2xl shadow-lg bg-white"
                  style={{ insetInline: "2rem", height: 420 }}
                />
              )}
              {midChore && (
                <div
                  className="absolute top-4 rounded-2xl shadow-lg bg-white"
                  style={{ insetInline: "1rem", height: 420 }}
                />
              )}
              <AnimatePresence>
                {frontChore && (
                  <ChoreCard
                    key={frontChore._id}
                    chore={frontChore}
                    onComplete={() =>
                      complete({ choreId: frontChore._id, userId, today })
                    }
                    onCycle={remaining.length > 1 ? handleCycle : undefined}
                    onSnooze={
                      frontChore.scheduleType !== "repeating" && todayDow !== 5
                        ? () => handleSnooze(frontChore._id)
                        : undefined
                    }
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {remaining.length === 0 && (isWeekend || chores.length > 0) && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xl text-neutral-500">
              {isWeekend
                ? "No chores today, enjoy the weekend."
                : "All chores done, good job!"}
            </p>
          </div>
        )}

        {completed.length > 0 && (
          <div className="mt-auto px-4 pt-6 pb-8">
            <p className="text-sm text-neutral-400 truncate pointer-events-none">
              <span className="text-neutral-500 pr-1">Completed </span>
              <span className="text-neutral-900">
                {completed.map((c) => c.title).join(", ")}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
