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
  useAnimationFrame,
} from "framer-motion";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import * as LucideIcons from "lucide-react";
import { useLiveClock, getToday, useChoreCountdown } from "@/lib/time";

function ChoreIcon({
  iconName,
  className,
}: {
  iconName: string;
  className?: string;
}) {
  const Icon = (
    LucideIcons as unknown as Record<
      string,
      React.ComponentType<{ className?: string }>
    >
  )[iconName];
  if (!Icon) return null;
  return <Icon className={className} />;
}

interface KidDashboardProps {
  userId: Id<"users">;
  onSwitchUser: () => void;
}

// ── Candy stripe progress bar ─────────────────────────────────────────────────

function CandyStripeBar({ progress }: { progress: number }) {
  const offset = useMotionValue(0);
  const backgroundPosition = useTransform(offset, (v) => `${v}px 0`);

  useAnimationFrame((_, delta) => {
    offset.set(offset.get() + delta * 0.04);
  });

  return (
    <div className="relative h-3.75 rounded-full overflow-hidden bg-neutral-500/25">
      <motion.div
        className="absolute inset-y-0 left-0"
        style={{
          background:
            "repeating-linear-gradient(-45deg, #262626, #262626 10px, #404040 10px, #404040 20px)",
          backgroundPosition,
        }}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ type: "spring", stiffness: 200, damping: 24 }}
      />
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
  const rotate = useTransform(x, [-250, 0, 250], [-18, 0, 18]);
  const dragControls = useDragControls();
  const lastPointerDownRef = useRef<number>(0);

  const doComplete = () => {
    animate(x, -520, { ease: [0.4, 0, 0.9, 1], duration: 0.28 });
    setTimeout(onComplete, 210);
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
      return; // skip drag start on double tap
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
      initial={{ scale: 0.93, opacity: 1, y: -16 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0 } }}
      transition={{ type: "spring", stiffness: 480, damping: 34 }}
      className="absolute inset-0 rounded-4xl border-2 border-neutral-800 overflow-hidden select-none touch-none bg-white"
      onPointerDown={handlePointerDown}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18, delay: 0.06 }}
      >
        {/* Illustration — fills upper portion of card, above bottom content */}
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
              className="w-24 h-24 text-stone-950/40"
            />
          ) : null}
        </div>

        {/* Title + description + buttons — bottom of card */}
        <div className="absolute bottom-0 inset-x-0 px-4 pb-4 flex flex-col gap-3">
          <div className="px-2 pointer-events-none">
            <p className="text-neutral-800 text-xl font-medium leading-tight mb-1">
              {chore.title}
            </p>
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-neutral-500 text-sm font-medium">
                {chore.description ?? ""}
              </p>
              <span className="text-neutral-400 text-sm font-medium tabular-nums shrink-0">
                {countdown}
              </span>
            </div>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={doComplete}
              className="flex-1 flex items-center justify-center rounded-full border border-neutral-300 py-3 text-sm font-medium text-neutral-800"
            >
              Complete
            </button>
            {onSnooze && (
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onSnooze}
                className="flex-1 flex items-center justify-center rounded-full border border-neutral-300 py-3 text-sm font-medium text-neutral-800"
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

export function KidDashboard({ userId, onSwitchUser }: KidDashboardProps) {
  const [frontOffset, setFrontOffset] = useState(0);
  const clockLabel = useLiveClock();

  const today = getToday();
  const snoozeKey = `snoozed-${userId}-${today}`;
  const [snoozedIds, setSnoozedIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(`snoozed-${userId}-${today}`);
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });

  const todayDow = new Date().getDay();
  const isWeekend = todayDow === 0 || todayDow === 6;

  const weekDates = (() => {
    const now = new Date();
    const dow = now.getDay();
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    return [0, 1, 2, 3, 4].map((i) => {
      const d = new Date(now);
      d.setDate(now.getDate() + mondayOffset + i);
      return d.toLocaleDateString("en-CA");
    });
  })();

  const user = useQuery(api.users.get, { id: userId });
  const chores = useQuery(api.chores.listForKid, { userId, todayDow });
  const completions = useQuery(api.completions.getTodayForUser, {
    userId,
    today,
  });
  const complete = useMutation(api.completions.complete);
  const allowanceStatus = useQuery(api.chores.getWeeklyAllowanceStatus, {
    userId,
    today,
    todayDow,
    weekDates,
  });
  const allowanceAmount = useQuery(api.settings.getAllowanceAmount);

  const completedIds = new Set(completions?.map((c) => c.choreId) ?? []);

  const remaining =
    chores?.filter((c) => !completedIds.has(c._id) && !snoozedIds.has(c._id)) ??
    [];
  const completed = chores?.filter((c) => completedIds.has(c._id)) ?? [];

  const totalVisible = completed.length + remaining.length;
  const progress =
    totalVisible > 0
      ? Math.min((completedIds.size / totalVisible) * 100, 100)
      : 0;

  const handleSnooze = (choreId: string) => {
    setSnoozedIds((prev) => {
      const next = new Set(prev);
      next.add(choreId);
      try {
        localStorage.setItem(snoozeKey, JSON.stringify([...next]));
      } catch {}
      return next;
    });
    setFrontOffset(0);
  };

  // Deck cycles through remaining chores; frontOffset wraps around
  const safeOffset = remaining.length > 0 ? frontOffset % remaining.length : 0;
  const deckChores = Array.from(
    { length: Math.min(3, remaining.length) },
    (_, i) => remaining[(safeOffset + i) % remaining.length],
  );
  const [frontChore, midChore, backChore] = deckChores;

  const handleCycle = (direction: 1 | -1) => {
    setFrontOffset((o) => {
      if (remaining.length === 0) return 0;
      return (
        (((o + direction) % remaining.length) + remaining.length) %
        remaining.length
      );
    });
  };

  if (!user || !chores) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-stone-400 animate-pulse text-4xl">✓</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white font-google-sans flex flex-col">
      {/* Dark background extension — only when card deck is visible */}
      {remaining.length > 0 && (
        <div className="absolute top-0 inset-x-0 h-119.75 bg-olive-200 rounded-b-3xl" />
      )}

      {/* ── Header ── */}
      <motion.div
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="relative bg-olive-200 rounded-b-4xl px-4 pt-4 pb-5"
      >
        <div className="max-w-lg mx-auto space-y-4">
          {/* Back */}
          <button
            onClick={onSwitchUser}
            className="active:scale-[0.97] transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-800" />
          </button>

          {/* Avatar + Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-500/25 shrink-0 overflow-hidden flex items-center justify-center">
              {user.avatar && (
                <Image
                  src={user.avatar}
                  alt=""
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <p className="text-3xl leading-10 font-google-sans text-neutral-800">
              {user.name}
            </p>
          </div>

          {/* Progress label + clock, then bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-neutral-800">Progress</p>
              <p className="text-sm font-medium text-neutral-800">
                {clockLabel}
              </p>
            </div>
            <CandyStripeBar progress={progress} />
          </div>

          {/* Allowance status */}
          {allowanceAmount && allowanceStatus && (
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  allowanceStatus === "earned"
                    ? "bg-green-600"
                    : allowanceStatus === "lost"
                      ? "bg-red-600"
                      : "bg-neutral-800"
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  allowanceStatus === "earned"
                    ? "text-green-600"
                    : allowanceStatus === "lost"
                      ? "text-red-600"
                      : "text-neutral-800"
                }`}
              >
                {allowanceStatus === "earned"
                  ? "Allowance earned!"
                  : allowanceStatus === "lost"
                    ? "No allowance this week"
                    : "Allowance on track"}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Body ── */}
      <div className="relative max-w-lg mx-auto flex flex-col flex-1 w-full">
        {/* Card deck */}
        {remaining.length > 0 && (
          <div className="px-4 pt-8">
            <div className="relative h-105">
              {backChore && (
                <div
                  className="absolute -top-8 rounded-4xl border-2 border-neutral-800 bg-white"
                  style={{ insetInline: "2rem", height: 420 }}
                />
              )}
              {midChore && (
                <div
                  className="absolute -top-4 rounded-4xl border-2 border-neutral-800 bg-white"
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
                      frontChore.scheduleType !== "repeating"
                        ? () => handleSnooze(frontChore._id)
                        : undefined
                    }
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Empty state — centered between header and completed list */}
        {remaining.length === 0 && (isWeekend || chores.length > 0) && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xl font-regular text-neutral-400">
              {isWeekend
                ? "No chores today, enjoy the weekend."
                : "All chores done, good job!"}
            </p>
          </div>
        )}

        {/* Completed checklist — pushed to bottom */}
        {completed.length > 0 && (
          <div className="mt-auto px-4 pt-6 pb-8">
            <p className="text-sm font-medium text-neutral-400 mb-1 pointer-events-none">
              Completed
            </p>
            <div className="flex flex-col">
              {completed.map((chore) => (
                <div key={chore._id} className="flex items-center py-1">
                  <span className="text-neutral-800 text-sm font-medium">
                    {chore.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
