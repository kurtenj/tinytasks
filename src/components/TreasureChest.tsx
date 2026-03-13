"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import type { Doc, Id } from "../../convex/_generated/dataModel";

interface TreasureChestProps {
  userId: Id<"users">;
  today: string;
  existingOpen: Doc<"treasureOpens"> | null;
  onClose: () => void;
}

const RARITY_STYLES = {
  epic:   { badge: "bg-amber-100 text-amber-700 border border-amber-300",   label: "🌟 Epic"   },
  rare:   { badge: "bg-stone-100 text-stone-600 border border-stone-300",   label: "✨ Rare"   },
  common: { badge: "bg-emerald-100 text-emerald-700 border border-emerald-300", label: "⚡ Common" },
};

export function TreasureChest({ userId, today, existingOpen, onClose }: TreasureChestProps) {
  const [phase, setPhase] = useState<"closed" | "opening" | "revealed">(
    existingOpen ? "revealed" : "closed"
  );
  const [revealedReward, setRevealedReward] = useState<Doc<"rewards"> | null>(null);

  const rewards      = useQuery(api.rewards.list);
  const openChest    = useMutation(api.treasureOpens.openChest);
  const updatePoints = useMutation(api.users.updatePoints);

  const handleOpen = async () => {
    if (!rewards || rewards.length === 0) return;
    setPhase("opening");

    const weighted = rewards.flatMap((r) => {
      if (r.rarity === "epic") return [r, r];
      if (r.rarity === "rare") return [r, r, r];
      return [r, r, r, r, r];
    });
    const reward = weighted[Math.floor(Math.random() * weighted.length)];

    await openChest({ userId, rewardId: reward._id, today });

    if (reward.type === "points") {
      await updatePoints({ userId, points: parseInt(reward.value) || 10 });
    }

    setTimeout(() => {
      setRevealedReward(reward);
      setPhase("revealed");
      confetti({
        particleCount: reward.rarity === "epic" ? 200 : reward.rarity === "rare" ? 120 : 80,
        spread: 90,
        origin: { y: 0.6 },
        colors:
          reward.rarity === "epic"   ? ["#FCD34D", "#F59E0B", "#D97706"] :
          reward.rarity === "rare"   ? ["#D6D3D1", "#A8A29E", "#78716C"] :
                                       ["#6EE7B7", "#34D399", "#10B981"],
      });
    }, 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={phase === "revealed" ? onClose : undefined}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: "spring", bounce: 0.4 }}
        className="bg-stone-100 border-4 border-stone-950 shadow-[6px_6px_0px_#0c0c09] rounded-3xl p-8 max-w-sm w-full text-center font-funnel"
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence mode="wait">

          {phase === "closed" && (
            <motion.div key="closed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div
                animate={{ rotate: [-3, 3, -3, 3, 0], y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }}
                className="text-8xl mb-6"
              >
                🎁
              </motion.div>
              <h2 className="font-knewave text-2xl text-stone-950 mb-2">Treasure Chest!</h2>
              <p className="text-stone-500 mb-6">You earned it! Open your reward!</p>
              <button
                onClick={handleOpen}
                disabled={!rewards || rewards.length === 0}
                className="w-full bg-stone-950 text-white font-bold py-4 rounded-2xl text-lg hover:bg-stone-800 active:scale-[0.97] transition-all disabled:opacity-50"
              >
                {!rewards ? "Loading…" : rewards.length === 0 ? "No rewards set up yet" : "Open! 🎉"}
              </button>
            </motion.div>
          )}

          {phase === "opening" && (
            <motion.div key="opening" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-8">
              <motion.div
                animate={{ rotate: 360, scale: [1, 1.5, 1] }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="text-8xl mb-4"
              >
                ✨
              </motion.div>
              <p className="text-stone-600 font-semibold text-lg animate-pulse">Opening…</p>
            </motion.div>
          )}

          {phase === "revealed" && revealedReward && (
            <motion.div
              key="revealed"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
            >
              <div className="w-20 h-20 rounded-full bg-amber-100 border-4 border-stone-950 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">
                  {revealedReward.type === "points" ? "⭐" :
                   revealedReward.type === "badge"   ? "🏆" :
                   revealedReward.type === "message" ? "💌" : "🖼️"}
                </span>
              </div>

              <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full mb-3 ${RARITY_STYLES[revealedReward.rarity].badge}`}>
                {RARITY_STYLES[revealedReward.rarity].label}
              </span>

              <h2 className="font-knewave text-2xl text-stone-950 mb-2">{revealedReward.title}</h2>

              {revealedReward.type === "points" && (
                <p className="text-3xl font-bold text-amber-500 mb-2">+{revealedReward.value} pts!</p>
              )}
              {revealedReward.type === "message" && (
                <p className="text-stone-600 italic mb-4">&ldquo;{revealedReward.value}&rdquo;</p>
              )}
              {revealedReward.type === "badge" && (
                <p className="text-stone-600 mb-4">You earned the <strong>{revealedReward.value}</strong> badge!</p>
              )}

              <button
                onClick={onClose}
                className="w-full bg-stone-950 text-white font-bold py-3 rounded-2xl mt-4 hover:bg-stone-800 active:scale-[0.97] transition-all"
              >
                Awesome! 🎉
              </button>
            </motion.div>
          )}

          {phase === "revealed" && !revealedReward && existingOpen && (
            <motion.div key="already-opened" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="text-6xl mb-4">🎁</div>
              <h2 className="font-knewave text-xl text-stone-950 mb-2">Already opened today!</h2>
              <p className="text-stone-500 mb-4">Come back tomorrow for a new reward!</p>
              <button
                onClick={onClose}
                className="w-full bg-stone-950 text-white py-3 rounded-2xl font-bold hover:bg-stone-800 active:scale-[0.97] transition-all"
              >
                OK!
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
