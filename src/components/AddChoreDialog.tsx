"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import type { Id } from "../../convex/_generated/dataModel";

const ICONS = [
  "🛏️",
  "🍽️",
  "🐕",
  "🧹",
  "📚",
  "🗑️",
  "🧺",
  "🌱",
  "🦷",
  "👟",
  "🧸",
  "🚿",
];

interface AddChoreDialogProps {
  userId: Id<"users">;
  onClose: () => void;
}

export function AddChoreDialog({ userId, onClose }: AddChoreDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("🛏️");
  const createChore = useMutation(api.chores.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createChore({
      title: title.trim(),
      description: description.trim() || undefined,
      icon,
      createdBy: userId,
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="bg-stone-100 border-4 border-stone-950 shadow-[6px_6px_0px_#0c0c09] rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md font-funnel"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-knewave text-2xl text-stone-950 mb-4">Add Chore</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-stone-600 font-medium mb-2 block">
              Pick an icon
            </label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`text-2xl p-2 rounded-xl transition-all ${icon === i ? "bg-amber-100 ring-2 ring-stone-950 scale-110" : "hover:bg-stone-200"}`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-stone-600 font-medium mb-1 block">
              Chore name *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Make your bed"
              className="w-full border-2 border-stone-950 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-stone-950"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm text-stone-600 font-medium mb-1 block">
              Description (optional)
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Fluff the pillows too!"
              className="w-full border-2 border-stone-950 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-stone-950"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border-2 border-stone-950 text-stone-600 py-3 rounded-xl font-medium hover:bg-stone-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 bg-stone-950 text-white py-3 rounded-xl font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors"
            >
              Add Chore
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
