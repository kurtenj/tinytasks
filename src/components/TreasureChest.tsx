"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import type { Doc, Id } from "../../convex/_generated/dataModel";

interface TreasureChestProps {
  userId: Id<"users">;
  existingOpen: Doc<"treasureOpens"> | null;
  onClose: () => void;
}

export function TreasureChest({
  userId,
  existingOpen,
  onClose,
}: TreasureChestProps) {
  const [phase, setPhase] = useState<"closed" | "opening" | "revealed">(
    existingOpen ? "revealed" : "closed"
  );
  const [revealedReward, setRevealedReward] = useState<Doc<"rewards"> | null>(
    null
  );

  const rewards = useQuery(api.rewards.list);
  const openChest = useMutation(api.treasureOpens.openChest);
  const updatePoints = useMutation(api.users.updatePoints);

  const handleOpen = async () => {
    if (!rewards || rewards.length === 0) return;
    setPhase("opening");

    // Pick random reward (weighted by rarity: common=5x, rare=3x, epic=2x)
    const weighted = rewards.flatMap((r) => {
      if (r.rarity === "epic") return [r, r];
      if (r.rarity === "rare") return [r, r, r];
      return [r, r, r, r, r];
    });
    const reward = weighted[Math.floor(Math.random() * weighted.length)];

    await openChest({ userId, rewardId: reward._id });

    if (reward.type === "points") {
      const pts = parseInt(reward.value) || 10;
      await updatePoints({ userId, points: pts });
    }

    setTimeout(() => {
      setRevealedReward(reward);
      setPhase("revealed");
      // Launch confetti
      const colors =
        reward.rarity === "epic"
          ? ["#FFD700", "#FFA500", "#FF4500"]
          : reward.rarity === "rare"
            ? ["#C084FC", "#A855F7", "#7C3AED"]
            : ["#86EFAC", "#4ADE80", "#22C55E"];

      confetti({
        particleCount:
          reward.rarity === "epic" ? 200 : reward.rarity === "rare" ? 120 : 80,
        spread: 90,
        origin: { y: 0.6 },
        colors,
      });
    }, 800);
  };

  const rarityColors = {
    common: "from-green-400 to-emerald-500",
    rare: "from-purple-400 to-violet-600",
    epic: "from-yellow-400 to-orange-500",
  };

  const rarityLabels = {
    common: "✨ Common",
    rare: "💜 Rare",
    epic: "🌟 EPIC",
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
        className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {phase === "closed" && (
          <>
            <motion.div
              animate={{ rotate: [-3, 3, -3, 3, 0], y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }}
              className="text-8xl mb-6"
            >
              🎁
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Treasure Chest!
            </h2>
            <p className="text-gray-500 mb-6">
              You earned it! Open your reward!
            </p>
            <button
              onClick={handleOpen}
              disabled={!rewards || rewards.length === 0}
              className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold py-4 rounded-2xl text-lg hover:from-violet-600 hover:to-purple-700 active:scale-95 transition-all shadow-lg disabled:opacity-50"
            >
              {!rewards
                ? "Loading..."
                : rewards.length === 0
                  ? "No rewards set up yet"
                  : "Open! 🎉"}
            </button>
          </>
        )}

        {phase === "opening" && (
          <div className="py-8">
            <motion.div
              animate={{ rotate: 360, scale: [1, 1.5, 1] }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="text-8xl mb-4"
            >
              ✨
            </motion.div>
            <p className="text-violet-600 font-semibold text-lg animate-pulse">
              Opening...
            </p>
          </div>
        )}

        {phase === "revealed" && revealedReward && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
          >
            <div
              className={`w-20 h-20 rounded-full bg-gradient-to-br ${rarityColors[revealedReward.rarity]} flex items-center justify-center mx-auto mb-4 shadow-lg`}
            >
              <span className="text-4xl">
                {revealedReward.type === "points"
                  ? "⭐"
                  : revealedReward.type === "badge"
                    ? "🏆"
                    : revealedReward.type === "message"
                      ? "💌"
                      : "🖼️"}
              </span>
            </div>

            <div
              className={`inline-block bg-gradient-to-r ${rarityColors[revealedReward.rarity]} text-white text-xs font-bold px-3 py-1 rounded-full mb-3`}
            >
              {rarityLabels[revealedReward.rarity]}
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {revealedReward.title}
            </h2>

            {revealedReward.type === "points" && (
              <p className="text-3xl font-bold text-yellow-500 mb-2">
                +{revealedReward.value} points!
              </p>
            )}
            {revealedReward.type === "message" && (
              <p className="text-gray-600 italic mb-4">
                &ldquo;{revealedReward.value}&rdquo;
              </p>
            )}
            {revealedReward.type === "badge" && (
              <p className="text-gray-600 mb-4">
                You earned the <strong>{revealedReward.value}</strong> badge!
              </p>
            )}

            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold py-3 rounded-2xl mt-4 hover:from-violet-600 hover:to-purple-700 active:scale-95 transition-all"
            >
              Awesome! 🎉
            </button>
          </motion.div>
        )}

        {phase === "revealed" && !revealedReward && existingOpen && (
          <div>
            <div className="text-6xl mb-4">🎁</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Already opened today!
            </h2>
            <p className="text-gray-500 mb-4">
              Come back tomorrow for a new reward!
            </p>
            <button
              onClick={onClose}
              className="w-full bg-violet-600 text-white py-3 rounded-2xl font-bold"
            >
              OK!
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
