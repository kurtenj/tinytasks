"use client";
import { useState, useEffect, useRef } from "react";
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
import { ArrowLeft, HandCoins, Flame, Star, Trophy, ShoppingBag } from "lucide-react";
import { TreasureChest } from "@/components/TreasureChest";
import { Store } from "@/components/Store";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { getPresetByFile, DEFAULT_CARD_COLOR } from "@/lib/chorePresets";
import * as LucideIcons from "lucide-react";


function choreColor(chore: Doc<"chores">): string {
  return (
    chore.cardColor ??
    getPresetByFile(chore.imageUrl)?.color ??
    DEFAULT_CARD_COLOR
  );
}

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

function getTimeLeft(skippable: boolean): { label: string; urgent: boolean } {
  const now = new Date();
  const end = new Date();
  if (skippable) {
    // Count down to end of Friday for the current week
    const dow = now.getDay(); // 0=Sun, 5=Fri, 6=Sat
    const daysUntilFriday = dow <= 5 ? 5 - dow : 0; // if Sat, treat as 0
    end.setDate(end.getDate() + daysUntilFriday);
  }
  end.setHours(23, 59, 59, 0);
  const ms = end.getTime() - now.getTime();
  if (ms <= 0) return { label: "Missed", urgent: true };
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (skippable && h >= 24) {
    const d = Math.floor(h / 24);
    return { label: `${d} ${d === 1 ? "day" : "days"} left`, urgent: d < 2 };
  }
  if (h >= 1)
    return { label: `${h} ${h === 1 ? "hour" : "hours"} left`, urgent: h < 2 };
  if (m >= 1) return { label: `${m} min left`, urgent: true };
  return { label: "Due soon", urgent: true };
}

function useLiveClock() {
  const [label, setLabel] = useState(() => formatClock());
  useEffect(() => {
    const id = setInterval(() => setLabel(formatClock()), 10000);
    return () => clearInterval(id);
  }, []);
  return label;
}

function formatClock(): string {
  const now = new Date();
  const day = now.toLocaleDateString("en-US", { weekday: "long" });
  const time = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${day}, ${time}`;
}

interface KidDashboardProps {
  userId: Id<"users">;
  onSwitchUser: () => void;
}

// ── ChoreCard ─────────────────────────────────────────────────────────────────

interface ChoreCardProps {
  chore: Doc<"chores">;
  color: string;
  onComplete: () => void;
  onCycle?: (direction: 1 | -1) => void;
  onSnooze?: () => void;
}

function ChoreCard({
  chore,
  color,
  onComplete,
  onCycle,
  onSnooze,
}: ChoreCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 0, 250], [-18, 0, 18]);
  const dragControls = useDragControls();
  const lastPointerDownRef = useRef<number>(0);
  const skippable = chore.scheduleType !== "repeating";
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(skippable));
  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(skippable)), 60_000);
    return () => clearInterval(id);
  }, [skippable]);

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
      style={{ x, rotate, backgroundColor: color }}
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
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0 } }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="absolute inset-0 rounded-3xl border-4 border-olive-950 shadow-[5px_5px_0px_#0c0c09] overflow-hidden select-none touch-none"
      onPointerDown={handlePointerDown}
    >
      {/* Illustration — fills upper portion of card, above bottom content */}
      <div className="absolute inset-x-0 top-0 bottom-[140px] flex items-center justify-center pointer-events-none px-6 pt-14">
        {chore.imageUrl ? (
          <img
            src={chore.imageUrl}
            alt={chore.title}
            className="w-full h-full object-contain"
            draggable={false}
          />
        ) : chore.icon ? (
          <ChoreIcon
            iconName={chore.icon}
            className="w-24 h-24 text-stone-950/40"
          />
        ) : null}
      </div>

      {/* Hint — top of card */}
      <p className="absolute top-6 left-6 text-sm font-semibold text-olive-950/50 pointer-events-none">
        Double tap to complete
      </p>

      {/* Title + description + timer + buttons — bottom of card */}
      <div className="absolute bottom-0 inset-x-0 px-4 pb-4 flex flex-col gap-3">
        <div className="px-2 pointer-events-none">
          <p className="text-olive-950 text-xl font-medium leading-tight mb-1">
            {chore.title}
          </p>
          <div className="flex items-center gap-2 w-full">
            <p className="text-olive-950/50 text-sm font-semibold flex-1">
              {chore.description ?? ""}
            </p>
            <span
              className={`text-sm font-semibold shrink-0 ${timeLeft.urgent ? "text-red-700/70" : "text-olive-950"}`}
            >
              {timeLeft.label}
            </span>
          </div>
        </div>
        <div className="flex gap-3 w-full">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={doComplete}
            className="flex-1 flex items-center justify-center rounded-3xl bg-white/25 py-3 text-sm font-semibold text-olive-950"
          >
            Complete
          </button>
          {onSnooze && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onSnooze}
              className="flex-1 flex items-center justify-center rounded-3xl bg-white/25 py-3 text-sm font-semibold text-olive-950"
            >
              Do later
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── KidDashboard ──────────────────────────────────────────────────────────────

export function KidDashboard({ userId, onSwitchUser }: KidDashboardProps) {
  const [showChest, setShowChest] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [frontOffset, setFrontOffset] = useState(0);
  const clockLabel = useLiveClock();

  const today = new Date().toLocaleDateString("en-CA");
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
  const todayOpen = useQuery(api.treasureOpens.getTodayForUser, {
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
  const completedCount = completedIds.size;

  const remaining =
    chores?.filter((c) => !completedIds.has(c._id) && !snoozedIds.has(c._id)) ??
    [];
  const completed = chores?.filter((c) => completedIds.has(c._id)) ?? [];

  const totalVisible = completed.length + remaining.length;
  const progress = totalVisible > 0 ? Math.min((completedCount / totalVisible) * 100, 100) : 0;
  const chestUnlocked = remaining.length === 0 && completed.length > 0;

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
      <div className="min-h-screen bg-olive-300 flex items-center justify-center">
        <div className="text-olive-400 animate-pulse text-4xl">⭐</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-olive-300 font-funnel flex flex-col">
      {/* Dark background extension — only when card deck is visible */}
      {remaining.length > 0 && (
        <div className="absolute top-0 inset-x-0 h-[479px] bg-olive-950 rounded-b-3xl" />
      )}

      {/* ── Header ── */}
      <motion.div
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="relative bg-olive-950 rounded-b-3xl px-4 pt-4 pb-5"
      >
        <div className="max-w-lg mx-auto space-y-4">
          {/* Back + Store */}
          <div className="flex items-center justify-between">
            <button
              onClick={onSwitchUser}
              className="active:scale-[0.97] transition-transform"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => setShowStore(true)}
              className="active:scale-[0.97] transition-transform"
            >
              <ShoppingBag className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Avatar + Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/25 shrink-0 overflow-hidden flex items-center justify-center">
              {user.avatar && (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <p className="text-[32px] leading-10 font-knewave text-white">
              {user.name}
            </p>
          </div>

          {/* Progress label + clock, then bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold text-white">Progress</p>
              <p className="text-sm font-semibold text-white">{clockLabel}</p>
            </div>
            <div className="relative h-[15px] rounded-full overflow-hidden bg-white/25">
              <motion.div
                className="absolute inset-y-0 left-0 flex flex-row overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", stiffness: 200, damping: 24 }}
              >
                <div className="flex-1 bg-white" style={{ minWidth: 0 }} />
                {progress < 100 && (
                  <>
                    <div className="w-[3px] shrink-0 flex flex-col gap-[3px] py-[3px]">
                      <div className="w-[3px] h-[3px] bg-white" />
                      <div className="w-[3px] h-[3px] bg-white" />
                    </div>
                    <div className="w-[3px] shrink-0 flex flex-col gap-[3px]">
                      <div className="w-[3px] h-[3px] bg-white" />
                      <div className="w-[3px] h-[3px] bg-white" />
                      <div className="w-[3px] h-[3px] bg-white" />
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-white">
            <div className="flex items-center gap-2">
              <HandCoins className="w-5 h-5 opacity-25" />
              <span className="text-xl font-medium">{user.points}</span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 opacity-25" />
              <span className="text-xl font-medium">{user.streak} days</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 opacity-25" />
              <span className="text-xl font-medium">{user.level}</span>
            </div>
          </div>

          {/* Allowance status */}
          {allowanceAmount && allowanceStatus && (
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  allowanceStatus === "earned"
                    ? "bg-green-400"
                    : allowanceStatus === "lost"
                      ? "bg-red-400"
                      : "bg-white/30"
                }`}
              />
              <span
                className={`text-sm font-semibold ${
                  allowanceStatus === "earned"
                    ? "text-green-400"
                    : allowanceStatus === "lost"
                      ? "text-red-400"
                      : "text-white/50"
                }`}
              >
                {allowanceStatus === "earned"
                  ? `$${allowanceAmount} allowance earned!`
                  : allowanceStatus === "lost"
                    ? "No allowance this week"
                    : `$${allowanceAmount} allowance on track`}
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
            <div className="relative h-[420px]">
              {backChore && (
                <div
                  className="absolute -top-8 rounded-3xl border-4 border-olive-950"
                  style={{
                    insetInline: "2rem",
                    height: 420,
                    backgroundColor: choreColor(backChore),
                  }}
                />
              )}
              {midChore && (
                <div
                  className="absolute -top-4 rounded-3xl border-4 border-olive-950"
                  style={{
                    insetInline: "1rem",
                    height: 420,
                    backgroundColor: choreColor(midChore),
                  }}
                />
              )}
              <AnimatePresence>
                {frontChore && (
                  <ChoreCard
                    key={frontChore._id}
                    chore={frontChore}
                    color={choreColor(frontChore)}
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
            <p className="text-xl font-medium text-olive-950/50">
              {isWeekend
                ? "No chores today, enjoy the weekend."
                : "All chores done, good job!"}
            </p>
          </div>
        )}

        {/* Completed checklist — pushed to bottom */}
        {completed.length > 0 && (
          <div className="mt-auto px-4 pt-6 pb-24">
            <p className="text-sm font-medium text-olive-950/40 mb-1 pointer-events-none">
              Completed today
            </p>
            <div className="flex flex-col">
              {completed.map((chore) => (
                <div key={chore._id} className="flex items-center py-1">
                  <span className="text-olive-950/40 line-through text-sm font-medium">
                    {chore.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chest button — fixed to bottom */}
      <AnimatePresence>
        {chestUnlocked && (
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="fixed bottom-0 inset-x-0 p-4"
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={() => setShowChest(true)}
              className="w-full flex items-center justify-center gap-3 bg-white border-4 border-stone-950 shadow-[5px_5px_0px_#0c0c09] rounded-3xl py-4 text-stone-950"
            >
              <Trophy className="w-5 h-5 shrink-0" />
              <span className="text-xl font-medium">
                {todayOpen ? "View reward" : "Open reward"}
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showChest && (
          <TreasureChest
            userId={userId}
            today={today}
            existingOpen={todayOpen ?? null}
            onClose={() => setShowChest(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStore && (
          <Store userId={userId} onClose={() => setShowStore(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
