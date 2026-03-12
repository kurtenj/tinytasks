"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Id } from "../../convex/_generated/dataModel";
import {
  Plus,
  Trash2,
  LogOut,
  RotateCcw,
  Settings,
  Gift,
  CheckSquare,
  Users,
} from "lucide-react";
import { AddChoreDialog } from "@/components/AddChoreDialog";
import { AddRewardDialog } from "@/components/AddRewardDialog";

type Tab = "chores" | "rewards" | "progress";

interface AdminDashboardProps {
  userId: Id<"users">;
  onSwitchUser: () => void;
}

export function AdminDashboard({
  userId,
  onSwitchUser,
}: AdminDashboardProps) {
  const [tab, setTab] = useState<Tab>("chores");
  const [showAddChore, setShowAddChore] = useState(false);
  const [showAddReward, setShowAddReward] = useState(false);

  const chores = useQuery(api.chores.listAll);
  const rewards = useQuery(api.rewards.listAll);
  const kids = useQuery(api.users.getKids);
  const todayCompletions = useQuery(api.completions.getTodayAll);
  const removeChore = useMutation(api.chores.remove);
  const removeReward = useMutation(api.rewards.remove);
  const resetDay = useMutation(api.completions.resetDay);
  const updateChore = useMutation(api.chores.update);

  const completedChoreIds = new Set(
    todayCompletions?.map((c) => c.choreId) ?? []
  );

  const getKidCompletions = (kidId: Id<"users">) =>
    todayCompletions?.filter((c) => c.userId === kidId).length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-700 text-white px-4 pb-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-200" />
              <h1 className="text-xl font-bold">Admin Panel</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => resetDay()}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset Day
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={onSwitchUser}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 bg-white/20 rounded-xl p-1">
            {(
              [
                { id: "chores", icon: CheckSquare, label: "Chores" },
                { id: "rewards", icon: Gift, label: "Rewards" },
                { id: "progress", icon: Users, label: "Progress" },
              ] as const
            ).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === id
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-white/80 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Chores Tab */}
        {tab === "chores" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-800">
                Chores ({chores?.length ?? 0})
              </h2>
              <Button
                size="sm"
                onClick={() => setShowAddChore(true)}
                className="bg-violet-600 hover:bg-violet-700"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Chore
              </Button>
            </div>
            <div className="space-y-2">
              {chores?.map((chore) => (
                <Card
                  key={chore._id}
                  className={`p-4 flex items-center gap-3 ${!chore.isActive ? "opacity-50" : ""}`}
                >
                  {chore.icon && (
                    <span className="text-2xl">{chore.icon}</span>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{chore.title}</p>
                    {chore.description && (
                      <p className="text-sm text-gray-400">
                        {chore.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {completedChoreIds.has(chore._id) && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        Today ✓
                      </span>
                    )}
                    <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={chore.isActive}
                        onChange={(e) =>
                          updateChore({
                            id: chore._id,
                            isActive: e.target.checked,
                          })
                        }
                        className="accent-violet-600"
                      />
                      Active
                    </label>
                    <button
                      onClick={() => removeChore({ id: chore._id })}
                      className="text-red-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              ))}
              {chores?.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-2">📋</div>
                  <p>No chores yet. Add some!</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Rewards Tab */}
        {tab === "rewards" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-800">
                Rewards ({rewards?.length ?? 0})
              </h2>
              <Button
                size="sm"
                onClick={() => setShowAddReward(true)}
                className="bg-violet-600 hover:bg-violet-700"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Reward
              </Button>
            </div>
            <div className="space-y-2">
              {rewards?.map((reward) => (
                <Card
                  key={reward._id}
                  className={`p-4 flex items-center gap-3 ${!reward.isActive ? "opacity-50" : ""}`}
                >
                  <span className="text-2xl">
                    {reward.type === "points"
                      ? "⭐"
                      : reward.type === "badge"
                        ? "🏆"
                        : reward.type === "message"
                          ? "💌"
                          : "🖼️"}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{reward.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          reward.rarity === "epic"
                            ? "bg-yellow-100 text-yellow-700"
                            : reward.rarity === "rare"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-green-100 text-green-700"
                        }`}
                      >
                        {reward.rarity}
                      </span>
                      <span className="text-xs text-gray-400">
                        {reward.type}: {reward.value}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeReward({ id: reward._id })}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Card>
              ))}
              {rewards?.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-2">🎁</div>
                  <p>No rewards yet. Add some to the treasure chest!</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Progress Tab */}
        {tab === "progress" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="font-bold text-gray-800 mb-4">
              Today&apos;s Progress
            </h2>
            <div className="space-y-4">
              {kids?.map((kid) => {
                const completedToday = getKidCompletions(kid._id);
                const total =
                  chores?.filter((c) => c.isActive).length ?? 0;
                const pct = total ? (completedToday / total) * 100 : 0;
                return (
                  <Card key={kid._id} className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{kid.avatar ?? "⭐"}</span>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <p className="font-semibold text-gray-800">
                            {kid.name}
                          </p>
                          <span className="text-sm text-gray-500">
                            {completedToday}/{total} chores
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                          <span>⭐ {kid.points} pts</span>
                          <span>🔥 {kid.streak} day streak</span>
                          <span>🏆 Level {kid.level}</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-violet-500 to-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </Card>
                );
              })}
              {!kids?.length && (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-2">👶</div>
                  <p>No kids added yet.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {showAddChore && (
        <AddChoreDialog
          userId={userId}
          onClose={() => setShowAddChore(false)}
        />
      )}
      {showAddReward && (
        <AddRewardDialog
          userId={userId}
          onClose={() => setShowAddReward(false)}
        />
      )}
    </div>
  );
}
