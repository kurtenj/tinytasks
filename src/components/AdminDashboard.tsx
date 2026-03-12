"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import type { Id } from "../../convex/_generated/dataModel";
import { Plus, Trash2, LogOut, RotateCcw, Gift, CheckSquare, Users } from "lucide-react";
import { AddChoreDialog } from "@/components/AddChoreDialog";
import { AddRewardDialog } from "@/components/AddRewardDialog";

type Tab = "chores" | "rewards" | "progress";

interface AdminDashboardProps {
  userId: Id<"users">;
  onSwitchUser: () => void;
}

export function AdminDashboard({ userId, onSwitchUser }: AdminDashboardProps) {
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

  const completedChoreIds = new Set(todayCompletions?.map((c) => c.choreId) ?? []);
  const getKidCompletions = (kidId: Id<"users">) =>
    todayCompletions?.filter((c) => c.userId === kidId).length ?? 0;

  const TABS = [
    { id: "chores",   icon: CheckSquare, label: "Chores"   },
    { id: "rewards",  icon: Gift,        label: "Rewards"  },
    { id: "progress", icon: Users,       label: "Progress" },
  ] as const;

  return (
    <div className="min-h-screen bg-stone-100 font-funnel">
      {/* Header */}
      <div className="bg-stone-950 text-white px-4 pb-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between pt-5 mb-4">
            <h1 className="font-knewave text-2xl">Admin Panel</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => resetDay()}
                className="flex items-center gap-1.5 text-stone-400 hover:text-white text-sm py-1.5 px-3 rounded-lg hover:bg-stone-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Day
              </button>
              <button onClick={onSwitchUser} className="text-stone-500 hover:text-white p-2">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-stone-800 rounded-xl p-1">
            {TABS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.97] ${
                  tab === id ? "bg-white text-stone-950 shadow-sm" : "text-stone-400 hover:text-white"
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
              <h2 className="font-semibold text-stone-950">Chores ({chores?.length ?? 0})</h2>
              <button
                onClick={() => setShowAddChore(true)}
                className="flex items-center gap-1 bg-stone-950 text-white text-sm py-2 px-3 rounded-xl hover:bg-stone-800 active:scale-[0.97] transition-all"
              >
                <Plus className="w-4 h-4" /> Add Chore
              </button>
            </div>
            <div className="space-y-2">
              {chores?.map((chore) => (
                <div
                  key={chore._id}
                  className={`bg-white border-4 border-stone-950 shadow-[4px_4px_0px_#0c0c09] rounded-2xl p-4 flex items-center gap-3 ${!chore.isActive ? "opacity-50" : ""}`}
                >
                  {chore.icon && <span className="text-2xl">{chore.icon}</span>}
                  <div className="flex-1">
                    <p className="font-medium text-stone-950">{chore.title}</p>
                    {chore.description && <p className="text-sm text-stone-400">{chore.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {completedChoreIds.has(chore._id) && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-300">
                        Today ✓
                      </span>
                    )}
                    <label className="flex items-center gap-1 text-xs text-stone-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={chore.isActive}
                        onChange={(e) => updateChore({ id: chore._id, isActive: e.target.checked })}
                        className="accent-stone-950"
                      />
                      Active
                    </label>
                    <button onClick={() => removeChore({ id: chore._id })} className="text-stone-300 hover:text-red-500 p-1 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {chores?.length === 0 && (
                <div className="text-center py-12 text-stone-400">
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
              <h2 className="font-semibold text-stone-950">Rewards ({rewards?.length ?? 0})</h2>
              <button
                onClick={() => setShowAddReward(true)}
                className="flex items-center gap-1 bg-stone-950 text-white text-sm py-2 px-3 rounded-xl hover:bg-stone-800 active:scale-[0.97] transition-all"
              >
                <Plus className="w-4 h-4" /> Add Reward
              </button>
            </div>
            <div className="space-y-2">
              {rewards?.map((reward) => (
                <div
                  key={reward._id}
                  className={`bg-white border-4 border-stone-950 shadow-[4px_4px_0px_#0c0c09] rounded-2xl p-4 flex items-center gap-3 ${!reward.isActive ? "opacity-50" : ""}`}
                >
                  <span className="text-2xl">
                    {reward.type === "points" ? "⭐" : reward.type === "badge" ? "🏆" : reward.type === "message" ? "💌" : "🖼️"}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-stone-950">{reward.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        reward.rarity === "epic" ? "bg-amber-100 text-amber-700 border-amber-300" :
                        reward.rarity === "rare" ? "bg-stone-100 text-stone-600 border-stone-300" :
                                                   "bg-emerald-100 text-emerald-700 border-emerald-300"
                      }`}>
                        {reward.rarity}
                      </span>
                      <span className="text-xs text-stone-400">{reward.type}: {reward.value}</span>
                    </div>
                  </div>
                  <button onClick={() => removeReward({ id: reward._id })} className="text-stone-300 hover:text-red-500 p-1 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {rewards?.length === 0 && (
                <div className="text-center py-12 text-stone-400">
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
            <h2 className="font-semibold text-stone-950 mb-4">Today&apos;s Progress</h2>
            <div className="space-y-4">
              {kids?.map((kid) => {
                const completedToday = getKidCompletions(kid._id);
                const total = chores?.filter((c) => c.isActive).length ?? 0;
                const pct = total ? (completedToday / total) * 100 : 0;
                return (
                  <div key={kid._id} className="bg-white border-4 border-stone-950 shadow-[4px_4px_0px_#0c0c09] rounded-2xl p-5">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-semibold text-stone-950">{kid.name}</p>
                      <span className="text-sm text-stone-400">{completedToday}/{total} chores</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-stone-400 mb-3">
                      <span>⭐ {kid.points} pts</span>
                      <span>🔥 {kid.streak} day streak</span>
                      <span>🏆 Level {kid.level}</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-2.5 border border-stone-200">
                      <div className="bg-amber-400 h-2.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {!kids?.length && (
                <div className="text-center py-12 text-stone-400">
                  <div className="text-4xl mb-2">👶</div>
                  <p>No kids added yet.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {showAddChore && <AddChoreDialog userId={userId} onClose={() => setShowAddChore(false)} />}
      {showAddReward && <AddRewardDialog userId={userId} onClose={() => setShowAddReward(false)} />}
    </div>
  );
}
