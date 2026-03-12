"use client";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { ChoreItem } from "@/components/ChoreItem";
import { TreasureChest } from "@/components/TreasureChest";
import { Progress } from "@/components/ui/progress";
import type { Id } from "../../convex/_generated/dataModel";
import { Flame, Star, LogOut, Trophy } from "lucide-react";

const CHORES_REQUIRED = 2;

interface KidDashboardProps {
  userId: Id<"users">;
  onSwitchUser: () => void;
}

export function KidDashboard({ userId, onSwitchUser }: KidDashboardProps) {
  const [showChest, setShowChest] = useState(false);

  const user = useQuery(api.users.get, { id: userId });
  const chores = useQuery(api.chores.list);
  const todayCompletions = useQuery(api.completions.getTodayForUser, {
    userId,
  });
  const todayOpen = useQuery(api.treasureOpens.getTodayForUser, { userId });

  const completedIds = new Set(
    todayCompletions?.map((c) => c.choreId) ?? []
  );
  const completedCount = completedIds.size;
  const chestUnlocked = completedCount >= CHORES_REQUIRED;
  const progress = Math.min((completedCount / CHORES_REQUIRED) * 100, 100);

  if (!user || !chores) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-50 to-purple-100 flex items-center justify-center">
        <div className="text-violet-400 animate-pulse text-4xl">⭐</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-purple-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-700 text-white px-4 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4 pt-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{user.avatar ?? "🌟"}</span>
              <div>
                <h1 className="font-bold text-xl">{user.name}</h1>
                <div className="flex items-center gap-3 text-purple-200 text-sm">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {user.points} pts
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-400" />
                    {user.streak} day streak
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-white/20 rounded-full px-3 py-1 text-sm flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                Lv {user.level}
              </div>
              <button
                onClick={onSwitchUser}
                className="text-purple-200 hover:text-white p-2"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-purple-200">
              <span>Today&apos;s progress</span>
              <span>
                {completedCount}/{CHORES_REQUIRED} chores to unlock chest
              </span>
            </div>
            <Progress value={progress} className="h-3 bg-white/20" />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Treasure Chest */}
        <div className="flex justify-center">
          <button
            onClick={() => chestUnlocked && setShowChest(true)}
            disabled={!chestUnlocked}
            className={`transition-transform ${chestUnlocked ? "hover:scale-110 active:scale-95" : "opacity-50 cursor-not-allowed"}`}
          >
            <motion.div
              animate={
                chestUnlocked
                  ? { scale: [1, 1.05, 1], rotate: [-2, 2, -2, 0] }
                  : {}
              }
              transition={{
                duration: 2,
                repeat: chestUnlocked ? Infinity : 0,
                repeatDelay: 1,
              }}
              className="relative"
            >
              <div
                className={`text-8xl ${chestUnlocked ? "drop-shadow-lg" : "grayscale"}`}
              >
                🎁
              </div>
              {chestUnlocked && !todayOpen && (
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold px-2 py-0.5"
                >
                  OPEN!
                </motion.div>
              )}
              {todayOpen && (
                <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full text-xs font-bold px-2 py-0.5">
                  ✓
                </div>
              )}
            </motion.div>
          </button>
        </div>

        {!chestUnlocked && (
          <p className="text-center text-purple-600 text-sm">
            Complete {CHORES_REQUIRED - completedCount} more chore
            {CHORES_REQUIRED - completedCount !== 1 ? "s" : ""} to unlock the
            treasure chest! 🔒
          </p>
        )}

        {/* Chores list */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3">
            Today&apos;s Chores
          </h2>
          {chores.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
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
                  <ChoreItem
                    chore={chore}
                    completed={completedIds.has(chore._id)}
                    userId={userId}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showChest && (
          <TreasureChest
            userId={userId}
            existingOpen={todayOpen ?? null}
            onClose={() => setShowChest(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
