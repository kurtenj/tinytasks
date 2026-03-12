"use client";
import { useState } from "react";
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
import { TreasureChest } from "@/components/TreasureChest";
import type { Doc, Id } from "../../convex/_generated/dataModel";

const CHORES_REQUIRED = 2;

// Matches CARD_COLORS order in UserSelector
const HEADER_COLORS = [
  { bg: "bg-amber-400",   stroke: "#0c0c09", text: "text-stone-950" },
  { bg: "bg-emerald-700", stroke: "#ffffff", text: "text-white"      },
  { bg: "bg-rose-400",    stroke: "#0c0c09", text: "text-stone-950"  },
  { bg: "bg-sky-500",     stroke: "#ffffff", text: "text-white"      },
];

// Deck card colors — cycles per chore index
const DECK_COLORS = ["#38BDF8", "#059669", "#F87171", "#FBBF24", "#A78BFA", "#FB923C"];

interface KidDashboardProps {
  userId: Id<"users">;
  onSwitchUser: () => void;
}

function BackArrowIcon({ stroke }: { stroke: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M7.01 12H7"   stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M9.01 10H9"   stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M9.01 14H9"   stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M11.01 16H11" stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M11.01 8H11"  stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M13.01 6H13"  stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M13.01 18H13" stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M15.01 20H15" stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M15.01 4H15"  stroke={stroke} strokeWidth="2" strokeLinecap="square" />
    </svg>
  );
}

function CoinIcon({ stroke }: { stroke: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M18 18L16 18"     stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M6 18L10 18"      stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M20 16.01L20 16"  stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M12 16.01L12 16"  stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M4 16.01L4 16"    stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M22 14L22 10"     stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M14 10L14 14"     stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M2 10L2 14"       stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M20 8.01L20 8"    stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M12 8.01L12 8"    stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M4 8.01L4 8"      stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M18 6L16 6"       stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M6 6L10 6"        stroke={stroke} strokeWidth="2" strokeLinecap="square" />
    </svg>
  );
}

function LevelIcon({ stroke }: { stroke: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2.01L12 2"   stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M9 19.01L9 19"   stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M15 19.01L15 19" stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M4 12.01L4 12"   stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M20 12.01L20 12" stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M4 17V21H7"      stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M20 17V21H17"    stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M11 17H13"       stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M8 8H2V10"       stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M16 8L22 8V10"   stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M18 14V15"       stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M6 14V15"        stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M14 4V6"         stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M10 4V6"         stroke={stroke} strokeWidth="2" strokeLinecap="square" />
    </svg>
  );
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
  // Swipe-left overlay: fully visible at -120px
  const swipeOpacity = useTransform(x, [0, -60, -120], [0, 0.35, 1]);

  const dragControls = useDragControls();

  const doComplete = () => {
    // Fly the card off to the left, then fire the mutation
    animate(x, -520, { ease: [0.4, 0, 0.9, 1], duration: 0.28 });
    setTimeout(onComplete, 210);
  };

  return (
    <motion.div
      drag="x"
      dragControls={dragControls}
      dragListener={false}          // drag starts only via dragControls.start()
      style={{ x, rotate, backgroundColor: color }}
      dragConstraints={{ left: -520, right: 20 }}
      dragElastic={0.04}            // near 1:1 finger tracking within constraints
      onDragEnd={(_, info) => {
        const isTap   = Math.abs(info.offset.x) < 6 && Math.abs(info.velocity.x) < 80;
        const isSwipe = info.offset.x < -280 || info.velocity.x < -800;
        if (isTap || isSwipe) {
          doComplete();
        } else {
          // Spring back to resting position with a bit of overshoot
          animate(x, 0, { type: "spring", stiffness: 320, damping: 22 });
        }
      }}
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0 } }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="absolute inset-0 rounded-3xl border-4 border-stone-950 shadow-[5px_5px_0px_#0c0c09] flex items-center justify-center select-none touch-none"
      onPointerDown={(e) => dragControls.start(e)}
    >
      {/* Swipe-to-complete indicator */}
      <motion.div
        style={{ opacity: swipeOpacity }}
        className="absolute inset-0 rounded-[calc(1.5rem-2px)] bg-emerald-400/25 flex items-center justify-end pr-10 pointer-events-none"
      >
        <span className="text-5xl">✓</span>
      </motion.div>

      <div className="text-center px-6 pointer-events-none">
        {chore.icon && <p className="text-6xl mb-4">{chore.icon}</p>}
        <p className="text-stone-950 text-xl font-medium">{chore.title}</p>
        {chore.description && (
          <p className="text-stone-950/60 text-sm mt-2">{chore.description}</p>
        )}
      </div>

      <p className="absolute bottom-5 text-stone-950/25 text-xs tracking-wide pointer-events-none">
        tap or swipe left to complete
      </p>
    </motion.div>
  );
}

// ── KidDashboard ──────────────────────────────────────────────────────────────

export function KidDashboard({ userId, onSwitchUser }: KidDashboardProps) {
  const [showChest, setShowChest] = useState(false);

  const user        = useQuery(api.users.get, { id: userId });
  const allUsers    = useQuery(api.users.list);
  const chores      = useQuery(api.chores.listForKid, { userId, todayDow: new Date().getDay() });
  const completions = useQuery(api.completions.getTodayForUser, { userId });
  const todayOpen   = useQuery(api.treasureOpens.getTodayForUser, { userId });
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

  const getCardColor = (choreId: Id<"chores">) => {
    const idx = chores?.findIndex((c) => c._id === choreId) ?? 0;
    return DECK_COLORS[idx % DECK_COLORS.length];
  };

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
      <div className={`${kidColor.bg} shadow-[0px_5px_0px_#0c0c09] px-4 pt-4 pb-5`}>
        <div className="max-w-lg mx-auto space-y-4">
          {/* Back */}
          <button onClick={onSwitchUser} className="active:scale-[0.97] transition-transform">
            <BackArrowIcon stroke={kidColor.stroke} />
          </button>

          {/* Name */}
          <p className={`text-xl font-medium ${kidColor.text}`}>{user.name}</p>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <p className={`text-sm font-medium ${kidColor.text}`}>Today&apos;s progress</p>
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
              <CoinIcon stroke={kidColor.stroke} />
              <span className={`text-xl font-medium ${kidColor.text}`}>{user.points}</span>
            </div>
            <div className="flex items-center gap-2">
              <CoinIcon stroke={kidColor.stroke} />
              <span className={`text-xl font-medium ${kidColor.text}`}>{user.streak} days</span>
            </div>
            <div className="flex items-center gap-2">
              <LevelIcon stroke={kidColor.stroke} />
              <span className={`text-xl font-medium ${kidColor.text}`}>{user.level}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-lg mx-auto">

        {/* Card deck
            Outer padding pt-10 (40px) ensures the -top-8 back card (32px above container)
            is always 8px below the header — never overlapping it. */}
        {remaining.length > 0 && (
          <div className="px-4 pt-10">
            <div className="relative h-[420px]">
              {/* Back card — peeks 32px above the front */}
              {backChore && (
                <div
                  className="absolute -top-8 rounded-3xl border-4 border-stone-950"
                  style={{
                    insetInline: "2rem",          // 32px each side → narrower than front
                    height: 420,
                    backgroundColor: getCardColor(backChore._id),
                  }}
                />
              )}
              {/* Mid card — peeks 16px above the front */}
              {midChore && (
                <div
                  className="absolute -top-4 rounded-3xl border-4 border-stone-950"
                  style={{
                    insetInline: "1rem",          // 16px each side
                    height: 420,
                    backgroundColor: getCardColor(midChore._id),
                  }}
                />
              )}
              {/* Front card — draggable, fills container */}
              <AnimatePresence>
                {frontChore && (
                  <ChoreCard
                    key={frontChore._id}
                    chore={frontChore}
                    color={getCardColor(frontChore._id)}
                    onComplete={() => complete({ choreId: frontChore._id, userId })}
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
                  <span className="text-stone-400 line-through text-sm">
                    {chore.icon && <span className="mr-1.5">{chore.icon}</span>}
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
          <TreasureChest userId={userId} existingOpen={todayOpen ?? null} onClose={() => setShowChest(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
