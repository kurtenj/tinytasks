"use client";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import NextImage from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon } from "@hugeicons/core-free-icons";
import { getToday } from "@/lib/time";

const LABEL = "text-xs font-medium text-neutral-500 uppercase mb-2 block";
const INPUT =
  "w-full bg-neutral-100 rounded-xl px-4 py-3 text-neutral-800 placeholder:text-neutral-300 outline-none";

const AVATARS = ["/avatars/em.png", "/avatars/judah.png", "/avatars/julian.png"];
const WEEK_LABELS = ["M", "T", "W", "T", "F"];
const WEEK_DOW = [1, 2, 3, 4, 5];

function getWeekDates(): string[] {
  const dow = new Date().getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  return [0, 1, 2, 3, 4].map((i) => {
    const d = new Date();
    d.setDate(d.getDate() + mondayOffset + i);
    return d.toLocaleDateString("en-CA");
  });
}

// ── DayChoreList ──────────────────────────────────────────────────────────────

type WeekCompletion = { choreId: string; date: string };

function shortDay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 12).toLocaleDateString("en-US", { weekday: "short" });
}

function Checkmark() {
  return (
    <svg
      viewBox="0 0 10 8"
      width="10"
      height="8"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="1,4 3.5,7 9,1" />
    </svg>
  );
}

function DayChoreList({
  userId,
  date,
  dow,
  weekCompletions,
}: {
  userId: Id<"users">;
  date: string;
  dow: number;
  weekCompletions: WeekCompletion[];
}) {
  const chores = useQuery(api.chores.listForKid, { userId, todayDow: dow });
  const complete = useMutation(api.completions.complete);
  const uncomplete = useMutation(api.completions.uncomplete);

  if (!chores) {
    return (
      <div className="py-3 text-center text-sm text-neutral-400 animate-pulse">
        Loading…
      </div>
    );
  }

  if (chores.length === 0) {
    return <p className="py-3 text-sm text-neutral-400">No chores scheduled this day.</p>;
  }

  return (
    <div className="space-y-1.5 pb-1">
      {chores.map((chore) => {
        const isFloating = (chore.scheduleType ?? "floating") === "floating";
        const doneToday = weekCompletions.some(
          (c) => c.choreId === chore._id && c.date === date
        );
        const doneElsewhere = !doneToday && isFloating
          ? weekCompletions.find((c) => c.choreId === chore._id && c.date !== date)
          : undefined;

        if (doneToday) {
          // Completed on this day — dark pill, tapping un-completes
          return (
            <button
              key={chore._id}
              type="button"
              onClick={() => uncomplete({ choreId: chore._id, userId, today: date })}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left bg-neutral-900 active:scale-[0.98] transition-all duration-150"
            >
              <div className="w-5 h-5 rounded-md border-2 border-white bg-white shrink-0 flex items-center justify-center text-neutral-900">
                <Checkmark />
              </div>
              <span className="text-sm font-medium text-white">{chore.title}</span>
            </button>
          );
        }

        if (doneElsewhere) {
          // Floating chore done on a different day — skipped, not missed
          return (
            <button
              key={chore._id}
              type="button"
              onClick={() => complete({ choreId: chore._id, userId, today: date })}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left bg-neutral-100 active:scale-[0.98] transition-all duration-150"
            >
              <div className="w-5 h-5 rounded-md border-2 border-neutral-300 shrink-0 flex items-center justify-center text-neutral-300">
                <Checkmark />
              </div>
              <span className="text-sm font-medium text-neutral-400 flex-1">
                {chore.title}
              </span>
              <span className="text-xs text-neutral-400 shrink-0">
                Done {shortDay(doneElsewhere.date)}
              </span>
            </button>
          );
        }

        // Not done — tap to complete
        return (
          <button
            key={chore._id}
            type="button"
            onClick={() => complete({ choreId: chore._id, userId, today: date })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left bg-neutral-100 active:scale-[0.98] transition-all duration-150"
          >
            <div className="w-5 h-5 rounded-md border-2 border-neutral-400 shrink-0" />
            <span className="text-sm font-medium text-neutral-700 flex-1">
              {chore.title}
            </span>
            {!isFloating && (
              <span className="text-xs text-neutral-400 shrink-0">Missed</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── EditKidDialog ─────────────────────────────────────────────────────────────

interface EditKidDialogProps {
  kid: Doc<"users">;
  onClose: () => void;
}

export function EditKidDialog({ kid, onClose }: EditKidDialogProps) {
  const [name, setName] = useState(kid.name);
  const [avatar, setAvatar] = useState(kid.avatar ?? "");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = getToday();
  const weekDates = getWeekDates();

  const renameKid = useMutation(api.users.rename);
  const setAvatarMutation = useMutation(api.users.setAvatar);
  const removeKid = useMutation(api.users.remove);

  const weeklyProgress = useQuery(api.chores.getWeeklyProgress, {
    userId: kid._id,
    weekDates,
    today,
  });

  const weekCompletions = useQuery(api.completions.getWeekForUser, {
    userId: kid._id,
    weekDates,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await Promise.all([
      renameKid({ id: kid._id, name: name.trim() }),
      setAvatarMutation({ id: kid._id, avatar: avatar || undefined }),
    ]);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
        className="bg-white rounded-t-4xl sm:rounded-4xl w-full max-w-md font-google-sans overflow-y-auto max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4">
          <h2 className="text-2xl font-semibold leading-10 font-google-sans text-neutral-900">
            Edit Kid
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-5">
          {/* Avatar picker */}
          <div>
            <label className={LABEL}>Avatar</label>
            <div className="flex gap-3">
              {AVATARS.map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setAvatar(avatar === src ? "" : src)}
                  className={`relative w-16 h-16 rounded-full overflow-hidden border-2 transition-transform duration-150 active:scale-[0.97] ${
                    avatar === src
                      ? "border-neutral-800 scale-105"
                      : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  <NextImage src={src} alt="" fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className={LABEL}>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kid's name"
              className={INPUT}
              autoFocus
            />
          </div>

          {/* Week history */}
          <div>
            <label className={LABEL}>This week</label>
            <div className="flex gap-1.5 mb-3">
              {weekDates.map((date, i) => {
                const day = weeklyProgress?.[i];
                const isFuture = date > today;
                const isSelected = date === selectedDate;
                const fillPct =
                  day && day.total > 0
                    ? Math.min(day.completed / day.total, 1)
                    : 0;
                return (
                  <button
                    key={date}
                    type="button"
                    disabled={isFuture}
                    onClick={() => setSelectedDate(isSelected ? null : date)}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-2 rounded-xl transition-colors ${
                      isFuture
                        ? "opacity-30 cursor-default"
                        : isSelected
                          ? "bg-neutral-200"
                          : "hover:bg-neutral-50 active:bg-neutral-100"
                    }`}
                  >
                    <span
                      className={`text-xs font-medium ${
                        isSelected ? "text-neutral-900" : "text-neutral-500"
                      }`}
                    >
                      {WEEK_LABELS[i]}
                    </span>
                    <div className="w-full h-2 rounded-full bg-neutral-200 overflow-hidden">
                      {!isFuture && fillPct > 0 && (
                        <div
                          className="h-full bg-neutral-900 rounded-full"
                          style={{ width: `${fillPct * 100}%` }}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {selectedDate && (
                <motion.div
                  key={selectedDate}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="overflow-hidden"
                >
                  <DayChoreList
                    userId={kid._id}
                    date={selectedDate}
                    dow={WEEK_DOW[weekDates.indexOf(selectedDate)]}
                    weekCompletions={weekCompletions ?? []}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Delete */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={async () => {
                await removeKid({ id: kid._id });
                onClose();
              }}
              className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-red-500 transition-colors"
            >
              <HugeiconsIcon icon={Delete01Icon} size={16} /> Delete kid
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-neutral-100 text-neutral-600 py-3 rounded-xl font-medium hover:bg-neutral-200 active:scale-[0.97] transition-all duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 bg-neutral-900 text-white py-3 rounded-xl font-medium hover:bg-neutral-800 active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100 transition-all duration-150"
            >
              Save
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
