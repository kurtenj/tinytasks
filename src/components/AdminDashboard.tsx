"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { Plus, Trash2, LogOut, RotateCcw, Gift, CheckSquare, Users, UserPlus, Pencil } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { getPresetByFile, DEFAULT_CARD_COLOR } from "@/lib/chorePresets";
import { AddChoreDialog } from "@/components/AddChoreDialog";
import { AddRewardDialog } from "@/components/AddRewardDialog";

type Tab = "chores" | "rewards" | "progress" | "kids";

/** Small square showing the chore illustration or Lucide icon fallback */
function ChoreAvatar({ imageUrl, icon, color }: { imageUrl?: string; icon?: string; color: string }) {
  const LucideIcon = icon
    ? (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[icon]
    : undefined;
  return (
    <div
      className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center overflow-hidden border border-stone-200"
      style={{ backgroundColor: color }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="w-full h-full object-contain" />
      ) : LucideIcon ? (
        <LucideIcon className="w-5 h-5 text-stone-950/60" />
      ) : null}
    </div>
  );
}

const DAY_ABBREVS = ["Su", "M", "T", "W", "Th", "F", "Sa"];

interface AdminDashboardProps {
  userId: Id<"users">;
  onSwitchUser: () => void;
}

export function AdminDashboard({ userId, onSwitchUser }: AdminDashboardProps) {
  const [tab,           setTab]          = useState<Tab>("chores");
  const [showAddChore,  setShowAddChore]  = useState(false);
  const [showAddReward, setShowAddReward] = useState(false);
  const [editingChore,  setEditingChore]  = useState<Doc<"chores"> | null>(null);

  // Kids state
  const [newKidName,     setNewKidName]     = useState("");
  const [renamingKidId,  setRenamingKidId]  = useState<Id<"users"> | null>(null);
  const [renameValue,    setRenameValue]    = useState("");

  const chores          = useQuery(api.chores.listAll);
  const rewards         = useQuery(api.rewards.listAll);
  const kids            = useQuery(api.users.getKids);
  const todayCompletions = useQuery(api.completions.getTodayAll);

  const removeChore  = useMutation(api.chores.remove);
  const removeReward = useMutation(api.rewards.remove);
  const resetDay     = useMutation(api.completions.resetDay);
  const updateChore  = useMutation(api.chores.update);
  const createUser   = useMutation(api.users.create);
  const renameKid    = useMutation(api.users.rename);
  const removeKid    = useMutation(api.users.remove);

  const completedChoreIds = new Set(todayCompletions?.map((c) => c.choreId) ?? []);
  const getKidCompletions = (kidId: Id<"users">) =>
    todayCompletions?.filter((c) => c.userId === kidId).length ?? 0;

  const handleAddKid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKidName.trim()) return;
    await createUser({ name: newKidName.trim(), role: "kid" });
    setNewKidName("");
  };

  const handleRenameKid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameValue.trim() || !renamingKidId) return;
    await renameKid({ id: renamingKidId, name: renameValue.trim() });
    setRenamingKidId(null);
  };

  const TABS = [
    { id: "chores",   icon: CheckSquare, label: "Chores"   },
    { id: "rewards",  icon: Gift,        label: "Rewards"  },
    { id: "progress", icon: Users,       label: "Progress" },
    { id: "kids",     icon: UserPlus,    label: "Kids"     },
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
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* ── Chores Tab ── */}
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
                  <ChoreAvatar
                    imageUrl={chore.imageUrl}
                    icon={chore.icon}
                    color={chore.cardColor ?? getPresetByFile(chore.imageUrl)?.color ?? DEFAULT_CARD_COLOR}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-950">{chore.title}</p>
                    {chore.description && <p className="text-sm text-stone-400">{chore.description}</p>}
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {chore.scheduleType === "repeating" ? (
                        <span className="text-xs bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-full border border-stone-200 flex items-center gap-1 w-fit">
                          <LucideIcons.Repeat className="w-3 h-3" />
                          {chore.daysOfWeek && chore.daysOfWeek.length > 0
                            ? chore.daysOfWeek.map((d) => DAY_ABBREVS[d]).join(" ")
                            : "every day"}
                        </span>
                      ) : chore.scheduleType === "floating" ? (
                        <span className="text-xs bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-full border border-stone-200 flex items-center gap-1 w-fit">
                          <LucideIcons.Shuffle className="w-3 h-3" /> flexible
                        </span>
                      ) : null}
                      {chore.assignedTo && chore.assignedTo.length > 0 && (
                        <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full border border-amber-200">
                          {chore.assignedTo.length === 1
                            ? kids?.find((k) => k._id === chore.assignedTo![0])?.name ?? "1 kid"
                            : `${chore.assignedTo.length} kids`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {completedChoreIds.has(chore._id) && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-300">
                        Today ✓
                      </span>
                    )}
                    <label className="flex items-center gap-1 text-xs text-stone-500 cursor-pointer px-1">
                      <input
                        type="checkbox"
                        checked={chore.isActive}
                        onChange={(e) => updateChore({ id: chore._id, isActive: e.target.checked })}
                        className="accent-stone-950"
                      />
                      Active
                    </label>
                    <button
                      onClick={() => setEditingChore(chore)}
                      className="text-stone-300 hover:text-stone-700 p-1 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeChore({ id: chore._id })}
                      className="text-stone-300 hover:text-red-500 p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {chores?.length === 0 && (
                <div className="text-center py-12 text-stone-400">
                  <CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No chores yet. Add some!</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Rewards Tab ── */}
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
                  <div className="w-9 h-9 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
                    {reward.type === "points"  ? <LucideIcons.Star    className="w-4 h-4 text-amber-500" /> :
                     reward.type === "badge"   ? <LucideIcons.Trophy  className="w-4 h-4 text-amber-600" /> :
                     reward.type === "message" ? <LucideIcons.Mail    className="w-4 h-4 text-sky-500"  /> :
                                                 <LucideIcons.Image   className="w-4 h-4 text-stone-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-stone-950">{reward.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        reward.rarity === "epic"   ? "bg-amber-100 text-amber-700 border-amber-300" :
                        reward.rarity === "rare"   ? "bg-stone-100 text-stone-600 border-stone-300" :
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
                  <Gift className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No rewards yet. Add some to the treasure chest!</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Progress Tab ── */}
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
                      <span className="flex items-center gap-1"><LucideIcons.Star className="w-3 h-3" /> {kid.points} pts</span>
                      <span className="flex items-center gap-1"><LucideIcons.Flame className="w-3 h-3" /> {kid.streak} day streak</span>
                      <span className="flex items-center gap-1"><LucideIcons.Trophy className="w-3 h-3" /> Level {kid.level}</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-2.5 border border-stone-200">
                      <div className="bg-amber-400 h-2.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {!kids?.length && (
                <div className="text-center py-12 text-stone-400">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No kids added yet.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Kids Tab ── */}
        {tab === "kids" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="font-semibold text-stone-950 mb-4">Kids ({kids?.length ?? 0})</h2>

            {/* Add kid form */}
            <form onSubmit={handleAddKid} className="flex gap-2 mb-4">
              <input
                value={newKidName}
                onChange={(e) => setNewKidName(e.target.value)}
                placeholder="Kid's name"
                className="flex-1 border-2 border-stone-950 rounded-xl px-4 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-950"
              />
              <button
                type="submit"
                disabled={!newKidName.trim()}
                className="flex items-center gap-1 bg-stone-950 text-white text-sm py-2.5 px-3 rounded-xl hover:bg-stone-800 active:scale-[0.97] disabled:opacity-50 transition-all"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </form>

            <div className="space-y-2">
              {kids?.map((kid) => (
                <div key={kid._id} className="bg-white border-4 border-stone-950 shadow-[4px_4px_0px_#0c0c09] rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
                    <UserPlus className="w-4 h-4 text-stone-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {renamingKidId === kid._id ? (
                      <form onSubmit={handleRenameKid} className="flex gap-2">
                        <input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="flex-1 border-2 border-stone-950 rounded-lg px-2 py-1 text-sm focus:outline-none min-w-0"
                          autoFocus
                        />
                        <button type="submit" className="text-xs bg-stone-950 text-white px-2.5 py-1 rounded-lg hover:bg-stone-800 active:scale-[0.97] transition-all">
                          Save
                        </button>
                        <button type="button" onClick={() => setRenamingKidId(null)} className="text-xs text-stone-400 px-1 hover:text-stone-700">
                          ✕
                        </button>
                      </form>
                    ) : (
                      <p className="font-medium text-stone-950">{kid.name}</p>
                    )}
                    <p className="text-xs text-stone-400 mt-0.5">⭐ {kid.points} pts · Level {kid.level}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => { setRenamingKidId(kid._id); setRenameValue(kid.name); }}
                      className="text-stone-300 hover:text-stone-700 p-1 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeKid({ id: kid._id })}
                      className="text-stone-300 hover:text-red-500 p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {kids?.length === 0 && (
                <div className="text-center py-12 text-stone-400">
                  <UserPlus className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No kids yet. Add one above!</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {(showAddChore || editingChore) && (
        <AddChoreDialog
          userId={userId}
          chore={editingChore ?? undefined}
          onClose={() => { setShowAddChore(false); setEditingChore(null); }}
        />
      )}
      {showAddReward && <AddRewardDialog userId={userId} onClose={() => setShowAddReward(false)} />}
    </div>
  );
}
