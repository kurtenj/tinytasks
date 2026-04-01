"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import {
  PlusSignIcon,
  CheckmarkSquare01Icon,
  UserAdd01Icon,
  ArrowLeft01Icon,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons";
import * as HugeiconsIcons from "@hugeicons/core-free-icons";
import { DAY_ABBREVS } from "@/lib/chorePresets";
import { getToday } from "@/lib/time";
import { AddChoreDialog } from "@/components/AddChoreDialog";
import { EditKidDialog } from "@/components/EditKidDialog";

type Tab = "chores" | "kids";

const TABS: { id: Tab; label: string }[] = [
  { id: "chores", label: "Chores" },
  { id: "kids", label: "Kids" },
];

interface AdminDashboardProps {
  userId: Id<"users">;
  onSwitchUser: () => void;
}

export function AdminDashboard({ userId, onSwitchUser }: AdminDashboardProps) {
  const [tab, setTab] = useState<Tab>("chores");
  const [showAddChore, setShowAddChore] = useState(false);
  const [editingChore, setEditingChore] = useState<Doc<"chores"> | null>(null);
  const [editingKid, setEditingKid] = useState<Doc<"users"> | null>(null);

  // Kids state
  const [newKidName, setNewKidName] = useState("");
  const [allowanceInput, setAllowanceInput] = useState("");
  const [editingAllowance, setEditingAllowance] = useState(false);

  const today = getToday();
  const chores = useQuery(api.chores.listAll);
  const kids = useQuery(api.users.getKids);
  const allowanceAmount = useQuery(api.settings.getAllowanceAmount);

  const resetDay = useMutation(api.completions.resetDay);
  const createUser = useMutation(api.users.create);
  const setAllowanceAmount = useMutation(api.settings.setAllowanceAmount);

  const handleSaveAllowance = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(allowanceInput);
    if (isNaN(val) || val < 0) return;
    await setAllowanceAmount({ amount: val.toFixed(2) });
    setEditingAllowance(false);
  };

  const handleAddKid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKidName.trim()) return;
    await createUser({ name: newKidName.trim(), role: "kid" });
    setNewKidName("");
  };

  return (
    <div className="h-screen bg-neutral-100 font-google-sans flex flex-col overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="relative px-4 pt-safe-4 pb-5"
      >
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onSwitchUser}
              className="active:scale-[0.97] transition-transform"
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={24}
                strokeWidth={3}
                className="text-neutral-800"
              />
            </button>
            <span className="text-2xl font-semibold leading-10 font-google-sans text-neutral-900 flex-1">
              Parents
            </span>
            <button
              onClick={() => resetDay({ today })}
              className="flex items-center gap-1.5 bg-neutral-200 text-neutral-500 text-sm py-1.5 px-3 rounded-lg hover:bg-neutral-300 transition-colors"
            >
              Reset Day
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-neutral-200 rounded-lg overflow-clip">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 flex items-center justify-center py-2 text-sm ${
                  tab === id
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600 hover:bg-neutral-300 transition-colors"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="max-w-2xl mx-auto px-4 py-6 w-full flex-1 overflow-y-auto">
        {/* ── Chores Tab ── */}
        {tab === "chores" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-stone-950">
                Chores ({chores?.length ?? 0})
              </h2>
              <button
                onClick={() => setShowAddChore(true)}
                className="flex items-center gap-1.5 bg-neutral-200 text-neutral-500 text-sm py-1.5 px-3 rounded-lg hover:bg-neutral-300 transition-colors"
              >
                Add Chore
              </button>
            </div>

            {chores?.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <HugeiconsIcon
                  icon={CheckmarkSquare01Icon}
                  size={40}
                  className="mx-auto mb-2 opacity-30"
                />
                <p>No chores yet. Add some!</p>
              </div>
            ) : (
              <div className="grid border-2 border-neutral-500/25 rounded-lg overflow-clip">
                {chores?.map((chore) => {
                  const choreIconData = chore.icon
                    ? (
                        HugeiconsIcons as unknown as Record<
                          string,
                          IconSvgElement
                        >
                      )[chore.icon]
                    : undefined;
                  return (
                    <div
                      key={chore._id}
                      className={`py-2 border-b-2 border-neutral-500/25 last:border-b-0 overflow-hidden flex flex-row bg-white cursor-pointer active:scale-[0.98] transition-transform ${!chore.isActive ? "opacity-50" : ""}`}
                      onClick={() => setEditingChore(chore)}
                    >
                      {/* Illustration */}
                      <div className="relative w-32 shrink-0 flex items-center justify-center bg-neutral-50">
                        {chore.imageUrl ? (
                          <Image
                            src={chore.imageUrl}
                            alt={chore.title}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        ) : choreIconData ? (
                          <HugeiconsIcon
                            icon={choreIconData}
                            size={36}
                            className="text-stone-950/40"
                          />
                        ) : null}
                      </div>

                      {/* Info */}
                      <div className="px-3 py-2.5 flex flex-col justify-center gap-1 min-w-0">
                        <p className="font-medium text-stone-950 text-sm leading-tight truncate">
                          {chore.title}
                        </p>
                        {chore.description && (
                          <p className="text-xs text-stone-400 leading-tight truncate">
                            {chore.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1 flex-wrap text-xs text-stone-400">
                          {chore.scheduleType === "repeating" ? (
                            <span>
                              {chore.daysOfWeek && chore.daysOfWeek.length > 0
                                ? chore.daysOfWeek
                                    .map((d) => DAY_ABBREVS[d])
                                    .join(" ")
                                : "every day"}
                            </span>
                          ) : chore.scheduleType === "floating" ? (
                            <span>Flexible</span>
                          ) : null}
                          {chore.assignedTo && chore.assignedTo.length > 0 && (
                            <span>
                              {chore.assignedTo.length === 1
                                ? (kids?.find(
                                    (k) => k._id === chore.assignedTo![0],
                                  )?.name ?? "1 kid")
                                : `${chore.assignedTo.length} kids`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Kids Tab ── */}
        {tab === "kids" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="font-semibold text-stone-950 mb-4">
              Kids ({kids?.length ?? 0})
            </h2>

            {/* Allowance setting */}
            <div className="bg-white border-2 border-neutral-500/25 rounded-lg p-3 mb-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-stone-950 text-sm">
                  Weekly Allowance
                </p>
                <p className="text-xs text-stone-400 mt-0.5">
                  Paid on weekends when all chores are done
                </p>
              </div>
              {editingAllowance ? (
                <form
                  onSubmit={handleSaveAllowance}
                  className="flex gap-2 shrink-0"
                >
                  <span className="self-center text-stone-500 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={allowanceInput}
                    onChange={(e) => setAllowanceInput(e.target.value)}
                    className="w-20 border-2 border-stone-950 rounded-lg px-2 py-1 text-sm focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="text-xs bg-stone-950 text-white px-2.5 py-1 rounded-lg hover:bg-stone-800 active:scale-[0.97] transition-transform duration-150"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingAllowance(false)}
                    className="text-xs text-stone-400 px-1 hover:text-stone-700"
                  >
                    ✕
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => {
                    setAllowanceInput(allowanceAmount ?? "");
                    setEditingAllowance(true);
                  }}
                  className="shrink-0 flex items-center gap-2 text-sm font-semibold text-stone-950 hover:text-stone-600 transition-colors"
                >
                  {allowanceAmount ? `$${allowanceAmount}` : "Not set"}
                  <HugeiconsIcon
                    icon={PencilEdit01Icon}
                    size={14}
                    className="opacity-40"
                  />
                </button>
              )}
            </div>

            {/* Add kid form */}
            <form onSubmit={handleAddKid} className="flex gap-2 mb-4">
              <input
                value={newKidName}
                onChange={(e) => setNewKidName(e.target.value)}
                placeholder="Kid's name"
                className="flex-1 border-2 border-neutral-500/25 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:border-stone-950"
              />
              <button
                type="submit"
                disabled={!newKidName.trim()}
                className="flex items-center gap-1 bg-neutral-200 text-neutral-500 text-sm py-2 px-3 rounded-lg hover:bg-neutral-300 active:scale-[0.97] disabled:opacity-50 transition-all duration-150"
              >
                <HugeiconsIcon icon={PlusSignIcon} size={16} /> Add
              </button>
            </form>

            {kids?.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <HugeiconsIcon
                  icon={UserAdd01Icon}
                  size={40}
                  className="mx-auto mb-2 opacity-30"
                />
                <p>No kids yet. Add one above!</p>
              </div>
            ) : (
              <div className="border-2 border-neutral-500/25 rounded-lg overflow-clip">
                {kids?.map((kid) => (
                  <div
                    key={kid._id}
                    onClick={() => setEditingKid(kid)}
                    className="border-b-2 border-neutral-500/25 last:border-b-0 overflow-hidden flex flex-row bg-white cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    {/* Avatar */}
                    <div className="relative w-16 shrink-0 flex items-center justify-center bg-neutral-50">
                      {kid.avatar ? (
                        <Image
                          src={kid.avatar}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <HugeiconsIcon icon={UserAdd01Icon} size={24} className="text-stone-950/40" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="px-3 py-2.5 flex flex-col justify-center gap-1 min-w-0 flex-1">
                      <p className="font-medium text-stone-950 text-sm">{kid.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {(showAddChore || editingChore) && (
        <AddChoreDialog
          userId={userId}
          chore={editingChore ?? undefined}
          onClose={() => {
            setShowAddChore(false);
            setEditingChore(null);
          }}
        />
      )}

      {editingKid && (
        <EditKidDialog kid={editingKid} onClose={() => setEditingKid(null)} />
      )}
    </div>
  );
}
