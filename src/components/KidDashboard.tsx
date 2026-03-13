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
import { ArrowLeft, HandCoins, Flame, Star } from "lucide-react";
import { TreasureChest } from "@/components/TreasureChest";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { getPresetByFile, DEFAULT_CARD_COLOR } from "@/lib/chorePresets";
import * as LucideIcons from "lucide-react";

const CHORES_REQUIRED = 2;

// Matches CARD_COLORS order in UserSelector
const HEADER_COLORS = [
  { bg: "bg-amber-400", text: "text-olive-950" },
  { bg: "bg-emerald-700", text: "text-white" },
  { bg: "bg-rose-400", text: "text-olive-950" },
  { bg: "bg-sky-500", text: "text-white" },
];

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

function getTimeLeft(): { label: string; urgent: boolean } {
  const now = new Date();
  const end = new Date();
  end.setHours(23, 59, 59, 0);
  const ms = end.getTime() - now.getTime();
  if (ms <= 0) return { label: "Missed", urgent: true };
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
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
  onCycle: (direction: 1 | -1) => void;
}

function ChoreCard({ chore, color, onComplete, onCycle }: ChoreCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 0, 250], [-18, 0, 18]);
  const dragControls = useDragControls();
  const lastPointerDownRef = useRef<number>(0);
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);
  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 60_000);
    return () => clearInterval(id);
  }, []);

  const doComplete = () => {
    animate(x, -520, { ease: [0.4, 0, 0.9, 1], duration: 0.28 });
    setTimeout(onComplete, 210);
  };

  const doCycle = (direction: 1 | -1) => {
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
      {/* Illustration — centered, slightly smaller than card */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {chore.imageUrl ? (
          <img
            src={chore.imageUrl}
            alt={chore.title}
            className="w-3/4 h-3/4 object-contain"
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

      {/* Title + description + timer — bottom of card */}
      <div className="absolute bottom-0 inset-x-0 px-6 pb-6 pointer-events-none">
        <p className="text-olive-950 text-xl font-medium leading-tight mb-2">
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
    </motion.div>
  );
}

// ── KidDashboard ──────────────────────────────────────────────────────────────

export function KidDashboard({ userId, onSwitchUser }: KidDashboardProps) {
  const [showChest, setShowChest] = useState(false);
  const [frontOffset, setFrontOffset] = useState(0);
  const clockLabel = useLiveClock();

  const today = new Date().toLocaleDateString("en-CA");
  const user = useQuery(api.users.get, { id: userId });
  const allUsers = useQuery(api.users.list);
  const chores = useQuery(api.chores.listForKid, {
    userId,
    todayDow: new Date().getDay(),
  });
  const completions = useQuery(api.completions.getTodayForUser, {
    userId,
    today,
  });
  const todayOpen = useQuery(api.treasureOpens.getTodayForUser, {
    userId,
    today,
  });
  const complete = useMutation(api.completions.complete);

  const completedIds = new Set(completions?.map((c) => c.choreId) ?? []);
  const completedCount = completedIds.size;
  const chestUnlocked = completedCount >= CHORES_REQUIRED;
  const progress = Math.min((completedCount / CHORES_REQUIRED) * 100, 100);

  const remaining = chores?.filter((c) => !completedIds.has(c._id)) ?? [];
  const completed = chores?.filter((c) => completedIds.has(c._id)) ?? [];

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

  // Match kid's color to their position in the kids list (same order as UserSelector)
  const kids = allUsers?.filter((u) => u.role === "kid") ?? [];
  const kidIndex = kids.findIndex((k) => k._id === userId);
  const kidColor = HEADER_COLORS[Math.max(0, kidIndex) % HEADER_COLORS.length];

  if (!user || !chores) {
    return (
      <div className="min-h-screen bg-olive-100 flex items-center justify-center">
        <div className="text-olive-400 animate-pulse text-4xl">⭐</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-olive-100 font-funnel">
      {/* ── Header ── */}
      <div className={`${kidColor.bg} rounded-b-3xl px-4 pt-4 pb-5`}>
        <div className="max-w-lg mx-auto space-y-4">
          {/* Back */}
          <button
            onClick={onSwitchUser}
            className="active:scale-[0.97] transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Avatar + Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-olive-950/25 shrink-0" />
            <p
              className={`text-[28px] leading-[34px] font-medium ${kidColor.text}`}
            >
              {user.name}
            </p>
          </div>

          {/* Progress label + clock, then bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className={`text-sm font-medium ${kidColor.text}`}>Progress</p>
              <p className={`text-sm font-medium ${kidColor.text}`}>
                {clockLabel}
              </p>
            </div>
            <div className="relative h-[15px] rounded-full overflow-hidden bg-olive-950/25">
              <motion.div
                className="absolute inset-y-0 left-0 flex flex-row overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", stiffness: 200, damping: 24 }}
              >
                <div className="flex-1 bg-olive-950" style={{ minWidth: 0 }} />
                <div className="w-[3px] shrink-0 flex flex-col gap-[3px] py-[3px]">
                  <div className="w-[3px] h-[3px] bg-olive-950" />
                  <div className="w-[3px] h-[3px] bg-olive-950" />
                </div>
                <div className="w-[3px] shrink-0 flex flex-col gap-[3px]">
                  <div className="w-[3px] h-[3px] bg-olive-950" />
                  <div className="w-[3px] h-[3px] bg-olive-950" />
                  <div className="w-[3px] h-[3px] bg-olive-950" />
                </div>
              </motion.div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <HandCoins className={`w-4 h-4 opacity-25`} />
              <span className={`text-lg font-medium ${kidColor.text}`}>
                {user.points}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className={`w-4 h-4 opacity-25`} />
              <span className={`text-lg font-medium ${kidColor.text}`}>
                {user.streak} days
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Star className={`w-4 h-4 opacity-25`} />
              <span className={`text-lg font-medium ${kidColor.text}`}>
                {user.level}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-lg mx-auto">
        {/* Card deck */}
        {remaining.length > 0 && (
          <div className="px-4 pt-16">
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
                    onCycle={handleCycle}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Chest button */}
        <AnimatePresence>
          {chestUnlocked && (
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="px-4 mt-8 flex justify-center"
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={() => setShowChest(true)}
                className={`${kidColor.bg} border-4 border-olive-950 shadow-[5px_5px_0px_#0c0c09] rounded-3xl px-10 py-6 font-knewave text-2xl text-olive-950`}
              >
                {todayOpen ? "View reward 🎁" : "Open chest! 🎁"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Completed checklist */}
        {completed.length > 0 && (
          <div className="px-4 mt-8 pb-12">
            <p className="text-sm font-medium text-olive-500 pointer-events-none">
              Completed today
            </p>
            <div className="space-y-2">
              {completed.map((chore) => (
                <div key={chore._id} className="flex items-center gap-3 py-1">
                  <span className="text-olive-300 line-through text-sm font-medium">
                    {chore.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
    </div>
  );
}
