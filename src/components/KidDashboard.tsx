"use client";
import { useState, useEffect } from "react";
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
  { bg: "bg-amber-400",   text: "text-stone-950" },
  { bg: "bg-emerald-700", text: "text-white"      },
  { bg: "bg-rose-400",    text: "text-stone-950"  },
  { bg: "bg-sky-500",     text: "text-white"      },
];

function choreColor(chore: Doc<"chores">): string {
  return chore.cardColor ?? getPresetByFile(chore.imageUrl)?.color ?? DEFAULT_CARD_COLOR;
}

function ChoreIcon({ iconName, className }: { iconName: string; className?: string }) {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
  if (!Icon) return null;
  return <Icon className={className} />;
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
  const time = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
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
}

function ChoreCard({ chore, color, onComplete }: ChoreCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 0, 250], [-18, 0, 18]);
  const swipeOpacity = useTransform(x, [0, -60, -120], [0, 0.35, 1]);

  const dragControls = useDragControls();

  const doComplete = () => {
    animate(x, -520, { ease: [0.4, 0, 0.9, 1], duration: 0.28 });
    setTimeout(onComplete, 210);
  };

  return (
    <motion.div
      drag="x"
      dragControls={dragControls}
      dragListener={false}
      style={{ x, rotate, backgroundColor: color }}
      dragConstraints={{ left: -520, right: 20 }}
      dragElastic={0.04}
      onDragEnd={(_, info) => {
        const isTap   = Math.abs(info.offset.x) < 6 && Math.abs(info.velocity.x) < 80;
        const isSwipe = info.offset.x < -280 || info.velocity.x < -800;
        if (isTap || isSwipe) {
          doComplete();
        } else {
          animate(x, 0, { type: "spring", stiffness: 320, damping: 22 });
        }
      }}
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0 } }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="absolute inset-0 rounded-3xl border-4 border-stone-950 shadow-[5px_5px_0px_#0c0c09] overflow-hidden select-none touch-none"
      onPointerDown={(e) => dragControls.start(e)}
    >
      {/* Illustration — fills the card */}
      {chore.imageUrl ? (
        <img
          src={chore.imageUrl}
          alt={chore.title}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {chore.icon ? (
            <ChoreIcon iconName={chore.icon} className="w-24 h-24 text-stone-950/40" />
          ) : null}
        </div>
      )}

      {/* Swipe-to-complete overlay */}
      <motion.div
        style={{ opacity: swipeOpacity }}
        className="absolute inset-0 bg-emerald-400/30 flex items-center justify-end pr-10 pointer-events-none"
      >
        <span className="text-6xl font-bold text-emerald-800">✓</span>
      </motion.div>

      {/* Hint — top of card */}
      <p className="absolute top-6 left-6 text-sm font-semibold text-stone-950/50 pointer-events-none">
        Tap or swipe to complete
      </p>

      {/* Title + description — bottom of card */}
      <div className="absolute bottom-0 inset-x-0 px-6 pb-6 pointer-events-none">
        <p className="text-stone-950 text-xl font-medium leading-tight">{chore.title}</p>
        {chore.description && (
          <p className="text-stone-950/50 text-sm font-semibold mt-1">{chore.description}</p>
        )}
      </div>
    </motion.div>
  );
}

// ── KidDashboard ──────────────────────────────────────────────────────────────

export function KidDashboard({ userId, onSwitchUser }: KidDashboardProps) {
  const [showChest, setShowChest] = useState(false);
  const clockLabel = useLiveClock();

  const today       = new Date().toLocaleDateString("en-CA");
  const user        = useQuery(api.users.get, { id: userId });
  const allUsers    = useQuery(api.users.list);
  const chores      = useQuery(api.chores.listForKid, { userId, todayDow: new Date().getDay() });
  const completions = useQuery(api.completions.getTodayForUser, { userId, today });
  const todayOpen   = useQuery(api.treasureOpens.getTodayForUser, { userId, today });
  const complete    = useMutation(api.completions.complete);

  const completedIds   = new Set(completions?.map((c) => c.choreId) ?? []);
  const completedCount = completedIds.size;
  const chestUnlocked  = completedCount >= CHORES_REQUIRED;
  const progress       = Math.min((completedCount / CHORES_REQUIRED) * 100, 100);

  const remaining  = chores?.filter((c) => !completedIds.has(c._id)) ?? [];
  const completed  = chores?.filter((c) =>  completedIds.has(c._id)) ?? [];

  // Cap the visible deck at 3 cards
  const deckChores = remaining.slice(0, 3);
  const [frontChore, midChore, backChore] = deckChores;

  // Match kid's color to their position in the kids list (same order as UserSelector)
  const kids     = allUsers?.filter((u) => u.role === "kid") ?? [];
  const kidIndex = kids.findIndex((k) => k._id === userId);
  const kidColor = HEADER_COLORS[Math.max(0, kidIndex) % HEADER_COLORS.length];

  if (!user || !chores) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="text-stone-400 animate-pulse text-4xl">⭐</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 font-funnel">

      {/* ── Header ── */}
      <div className={`${kidColor.bg} rounded-b-3xl px-4 pt-4 pb-5`}>
        <div className="max-w-lg mx-auto space-y-4">

          {/* Back */}
          <button onClick={onSwitchUser} className="active:scale-[0.97] transition-transform">
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Avatar + Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-black/25 shrink-0" />
            <p className={`text-[28px] leading-[34px] font-medium ${kidColor.text}`}>{user.name}</p>
          </div>

          {/* Progress label + clock, then bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className={`text-sm font-semibold ${kidColor.text}`}>Progress</p>
              <p className={`text-sm font-semibold ${kidColor.text}`}>{clockLabel}</p>
            </div>
            <div className="relative h-[15px] rounded-full overflow-hidden bg-black/25">
              <motion.div
                className="absolute inset-y-0 left-0 flex flex-row overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", stiffness: 200, damping: 24 }}
              >
                <div className="flex-1 bg-stone-950" style={{ minWidth: 0 }} />
                <div className="w-[3px] shrink-0 flex flex-col gap-[3px] py-[3px]">
                  <div className="w-[3px] h-[3px] bg-stone-950" />
                  <div className="w-[3px] h-[3px] bg-stone-950" />
                </div>
                <div className="w-[3px] shrink-0 flex flex-col gap-[3px]">
                  <div className="w-[3px] h-[3px] bg-stone-950" />
                  <div className="w-[3px] h-[3px] bg-stone-950" />
                  <div className="w-[3px] h-[3px] bg-stone-950" />
                </div>
              </motion.div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <HandCoins className={`w-5 h-5 opacity-25`} />
              <span className={`text-xl font-medium ${kidColor.text}`}>{user.points}</span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className={`w-5 h-5 opacity-25`} />
              <span className={`text-xl font-medium ${kidColor.text}`}>{user.streak} days</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className={`w-5 h-5 opacity-25`} />
              <span className={`text-xl font-medium ${kidColor.text}`}>{user.level}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-lg mx-auto">

        {/* Card deck */}
        {remaining.length > 0 && (
          <div className="px-4 pt-10">
            <div className="relative h-[420px]">
              {backChore && (
                <div
                  className="absolute -top-8 rounded-3xl border-4 border-stone-950"
                  style={{
                    insetInline: "2rem",
                    height: 420,
                    backgroundColor: choreColor(backChore),
                  }}
                />
              )}
              {midChore && (
                <div
                  className="absolute -top-4 rounded-3xl border-4 border-stone-950"
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
                    onComplete={() => complete({ choreId: frontChore._id, userId, today })}
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
                className={`${kidColor.bg} border-4 border-stone-950 shadow-[5px_5px_0px_#0c0c09] rounded-3xl px-10 py-6 font-knewave text-2xl text-stone-950`}
              >
                {todayOpen ? "View reward 🎁" : "Open chest! 🎁"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Completed checklist */}
        {completed.length > 0 && (
          <div className="px-4 mt-8 pb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">
              Completed today
            </p>
            <div className="space-y-2">
              {completed.map((chore) => (
                <div key={chore._id} className="flex items-center gap-3 py-1">
                  <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center shrink-0">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="square" strokeLinejoin="miter" />
                    </svg>
                  </div>
                  <span className="text-stone-400 line-through text-sm">{chore.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <AnimatePresence>
        {showChest && (
          <TreasureChest userId={userId} today={today} existingOpen={todayOpen ?? null} onClose={() => setShowChest(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
