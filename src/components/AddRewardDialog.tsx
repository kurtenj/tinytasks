"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import type { Id } from "../../convex/_generated/dataModel";

type RewardType = "points" | "badge" | "message" | "image";
type Rarity = "common" | "rare" | "epic";

interface AddRewardDialogProps {
  userId: Id<"users">;
  onClose: () => void;
}

export function AddRewardDialog({ userId, onClose }: AddRewardDialogProps) {
  const [type, setType] = useState<RewardType>("points");
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("10");
  const [rarity, setRarity] = useState<Rarity>("common");
  const createReward = useMutation(api.rewards.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !value.trim()) return;
    await createReward({
      type,
      title: title.trim(),
      value: value.trim(),
      rarity,
      createdBy: userId,
    });
    onClose();
  };

  const typeOptions = [
    { value: "points" as const, label: "⭐ Points", placeholder: "10" },
    { value: "badge" as const, label: "🏆 Badge", placeholder: "Star Reader" },
    { value: "message" as const, label: "💌 Message", placeholder: "You're amazing!" },
    { value: "image" as const, label: "🖼️ Image URL", placeholder: "https://..." },
  ];

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
        <h2 className="font-knewave text-2xl text-stone-950 mb-4">Add Reward</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-stone-600 font-medium mb-2 block">
              Reward Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {typeOptions.map(({ value: v, label }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setType(v);
                    setValue(v === "points" ? "10" : "");
                  }}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all active:scale-[0.97] border-2 ${
                    type === v
                      ? "bg-amber-100 border-stone-950 text-stone-950"
                      : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-stone-600 font-medium mb-2 block">
              Rarity
            </label>
            <div className="flex gap-2">
              {(["common", "rare", "epic"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRarity(r)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.97] capitalize border-2 ${
                    rarity === r
                      ? "bg-amber-100 border-stone-950 text-stone-950"
                      : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  {r === "epic" ? "🌟" : r === "rare" ? "✨" : "⚡"} {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-stone-600 font-medium mb-1 block">
              Title *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Super Star!"
              className="w-full border-2 border-stone-950 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-stone-950"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm text-stone-600 font-medium mb-1 block">
              {type === "points"
                ? "Points amount"
                : type === "badge"
                  ? "Badge name"
                  : type === "message"
                    ? "Message"
                    : "Image URL"}{" "}
              *
            </label>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={typeOptions.find((t) => t.value === type)?.placeholder}
              className="w-full border-2 border-stone-950 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-stone-950"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border-2 border-stone-950 text-stone-600 py-3 rounded-xl font-medium hover:bg-stone-200 active:scale-[0.97] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !value.trim()}
              className="flex-1 bg-stone-950 text-white py-3 rounded-xl font-medium hover:bg-stone-800 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 transition-all"
            >
              Add Reward
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
