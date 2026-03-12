"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { TreasureChest } from "@/components/TreasureChest";
import type { Id } from "../../convex/_generated/dataModel";

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

export function KidDashboard({ userId, onSwitchUser }: KidDashboardProps) {
  const [showChest, setShowChest] = useState(false);

  const user         = useQuery(api.users.get, { id: userId });
  const allUsers     = useQuery(api.users.list);
  const chores       = useQuery(api.chores.listForKid, { userId });
  const completions  = useQuery(api.completions.getTodayForUser, { userId });
  const todayOpen    = useQuery(api.treasureOpens.getTodayForUser, { userId });
  const complete     = useMutation(api.completions.complete);

  const completedIds   = new Set(completions?.map((c) => c.choreId) ?? []);
  const completedCount = completedIds.size;
  const chestUnlocked  = completedCount >= CHORES_REQUIRED;
  const progress       = Math.min((completedCount / CHORES_REQUIRED) * 100, 100);
  const remaining      = chores?.filter((c) => !completedIds.has(c._id)) ?? [];
  const allDone        = chores !== undefined && remaining.length === 0;

  // Match kid's color to their position in the kids list (same order as UserSelector)
  const kids      = allUsers?.filter((u) => u.role === "kid") ?? [];
  const kidIndex  = kids.findIndex((k) => k._id === userId);
  const kidColor  = HEADER_COLORS[Math.max(0, kidIndex) % HEADER_COLORS.length];

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

  const [frontChore, midChore, backChore] = remaining;

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
                {/* Solid fill */}
                <div className="flex-1 bg-stone-950" style={{ minWidth: 0 }} />
                {/* Pixel edge — col 1: 2 dots with top/bottom padding */}
                <div className="w-[3px] shrink-0 flex flex-col gap-[3px] py-[3px]">
                  <div className="w-[3px] h-[3px] bg-stone-950" />
                  <div className="w-[3px] h-[3px] bg-stone-950" />
                </div>
                {/* Pixel edge — col 2: 3 dots, no padding */}
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

      {/* ── Card deck ── */}
      <div className="max-w-lg mx-auto">
        {allDone ? (
          <div className="px-4 pt-16 flex flex-col items-center gap-6">
            <p className="font-knewave text-3xl text-stone-950 text-center">All done! 🎉</p>
            {chestUnlocked && (
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowChest(true)}
                className={`${kidColor.bg} border-4 border-stone-950 shadow-[5px_5px_0px_#0c0c09] rounded-3xl px-10 py-6 font-knewave text-2xl text-stone-950`}
              >
                {todayOpen ? "View reward 🎁" : "Open chest! 🎁"}
              </motion.button>
            )}
          </div>
        ) : (
          <div className="relative pt-8 px-4">
            {/* Back card */}
            {backChore && (
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 h-[420px] rounded-3xl border-4 border-stone-950"
                style={{ width: "calc(100% - 64px)", backgroundColor: getCardColor(backChore._id) }}
              />
            )}
            {/* Middle card */}
            {midChore && (
              <div
                className="absolute top-4 left-1/2 -translate-x-1/2 h-[420px] rounded-3xl border-4 border-stone-950"
                style={{ width: "calc(100% - 48px)", backgroundColor: getCardColor(midChore._id) }}
              />
            )}
            {/* Front card */}
            <AnimatePresence mode="wait">
              {frontChore && (
                <motion.div
                  key={frontChore._id}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.6}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -80 || info.velocity.x < -500) {
                      complete({ choreId: frontChore._id, userId });
                    }
                  }}
                  onTap={() => complete({ choreId: frontChore._id, userId })}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ x: 0, opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ x: -460, opacity: 0, rotate: -12, transition: { duration: 0.32, ease: "easeIn" } }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="relative h-[420px] rounded-3xl border-4 border-stone-950 shadow-[5px_5px_0px_#0c0c09] flex items-center justify-center select-none cursor-grab active:cursor-grabbing"
                  style={{ backgroundColor: getCardColor(frontChore._id) }}
                >
                  <div className="text-center px-6 pointer-events-none">
                    {frontChore.icon && <p className="text-6xl mb-4">{frontChore.icon}</p>}
                    <p className="text-stone-950 text-xl font-medium">{frontChore.title}</p>
                    {frontChore.description && (
                      <p className="text-stone-950/50 text-sm mt-2">{frontChore.description}</p>
                    )}
                  </div>
                  <p className="absolute bottom-5 text-stone-950/30 text-xs tracking-wide">
                    tap or swipe left to complete
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chest CTA once unlocked (chores still remain) */}
            {chestUnlocked && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex justify-center"
              >
                <button
                  onClick={() => setShowChest(true)}
                  className={`${kidColor.bg} border-4 border-stone-950 shadow-[4px_4px_0px_#0c0c09] rounded-2xl px-6 py-3 font-medium text-stone-950 active:scale-[0.97] transition-transform`}
                >
                  {todayOpen ? "View reward 🎁" : "Open chest! 🎁"}
                </button>
              </motion.div>
            )}
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
