"use client";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { ChoreItem } from "@/components/ChoreItem";
import { TreasureChest } from "@/components/TreasureChest";
import type { Id } from "../../convex/_generated/dataModel";
import { Flame, LogOut, Trophy } from "lucide-react";

const CHORES_REQUIRED = 2;

interface KidDashboardProps {
  userId: Id<"users">;
  onSwitchUser: () => void;
}

function CoinIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M18 18L16 18" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      <path d="M6 18L10 18"  stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      <path d="M20 16.01L20 16" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      <path d="M12 16.01L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      <path d="M4 16.01L4 16"   stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      <path d="M22 14L22 10"    stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      <path d="M14 10L14 14"    stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      <path d="M2 10L2 14"      stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      <path d="M20 8.01L20 8"   stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      <path d="M12 8.01L12 8"   stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      <path d="M4 8.01L4 8"     stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      <path d="M18 6L16 6"      stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      <path d="M6 6L10 6"       stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    </svg>
  );
}

export function KidDashboard({ userId, onSwitchUser }: KidDashboardProps) {
  const [showChest, setShowChest] = useState(false);

  const user = useQuery(api.users.get, { id: userId });
  const chores = useQuery(api.chores.list);
  const todayCompletions = useQuery(api.completions.getTodayForUser, { userId });
  const todayOpen = useQuery(api.treasureOpens.getTodayForUser, { userId });

  const completedIds = new Set(todayCompletions?.map((c) => c.choreId) ?? []);
  const completedCount = completedIds.size;
  const chestUnlocked = completedCount >= CHORES_REQUIRED;
  const progress = Math.min((completedCount / CHORES_REQUIRED) * 100, 100);

  if (!user || !chores) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="text-stone-400 animate-pulse text-4xl">⭐</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 font-funnel">
      {/* Header */}
      <div className="bg-stone-950 text-white px-4 pb-5">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between pt-5 mb-5">
            <div>
              <h1 className="font-knewave text-3xl leading-tight">{user.name}</h1>
              <div className="flex items-center gap-3 text-stone-400 text-sm mt-0.5">
                <span className="flex items-center gap-1">
                  <CoinIcon />
                  {user.points} pts
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  {user.streak} day streak
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-stone-800 rounded-full px-3 py-1 text-sm flex items-center gap-1 text-stone-300">
                <Trophy className="w-3 h-3" />
                Lv {user.level}
              </div>
              <button onClick={onSwitchUser} className="text-stone-500 hover:text-white p-2">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-stone-500">
              <span>Today&apos;s progress</span>
              <span>{completedCount}/{CHORES_REQUIRED} to unlock chest</span>
            </div>
            <div className="h-3 bg-stone-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-amber-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Treasure Chest */}
        <div className="flex justify-center">
          <button
            onClick={() => chestUnlocked && setShowChest(true)}
            disabled={!chestUnlocked}
            className={chestUnlocked ? "hover:scale-110 active:scale-95 transition-transform" : "opacity-40 cursor-not-allowed"}
          >
            <motion.div
              animate={chestUnlocked ? { scale: [1, 1.05, 1], rotate: [-2, 2, -2, 0] } : {}}
              transition={{ duration: 2, repeat: chestUnlocked ? Infinity : 0, repeatDelay: 1 }}
              className="relative"
            >
              <div className={`text-8xl ${chestUnlocked ? "drop-shadow-lg" : "grayscale"}`}>🎁</div>
              {chestUnlocked && !todayOpen && (
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute -top-1 -right-1 bg-amber-400 text-stone-950 rounded-full text-xs font-bold px-2 py-0.5"
                >
                  OPEN!
                </motion.div>
              )}
              {todayOpen && (
                <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full text-xs font-bold px-2 py-0.5">✓</div>
              )}
            </motion.div>
          </button>
        </div>

        {!chestUnlocked && (
          <p className="text-center text-stone-500 text-sm">
            Complete {CHORES_REQUIRED - completedCount} more chore{CHORES_REQUIRED - completedCount !== 1 ? "s" : ""} to unlock the treasure chest! 🔒
          </p>
        )}

        {/* Chores list */}
        <div>
          <h2 className="text-lg font-semibold text-stone-950 mb-3">Today&apos;s Chores</h2>
          {chores.length === 0 ? (
            <div className="bg-white border-4 border-stone-950 shadow-[4px_4px_0px_#0c0c09] rounded-3xl p-8 text-center text-stone-400">
              <div className="text-4xl mb-2">📋</div>
              <p>No chores yet! Ask a parent to add some.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {chores.map((chore, i) => (
                <motion.div
                  key={chore._id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ChoreItem chore={chore} completed={completedIds.has(chore._id)} userId={userId} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showChest && (
          <TreasureChest userId={userId} existingOpen={todayOpen ?? null} onClose={() => setShowChest(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
