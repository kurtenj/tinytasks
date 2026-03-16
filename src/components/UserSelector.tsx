"use client";
import { useState } from "react";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import Image from "next/image";
import { PinPad } from "@/components/PinPad";
import { useLiveClock, getToday } from "@/lib/time";

const KID_COLORS = ["oklch(93% 0.007 106.5)"];

interface UserSelectorProps {
  users: Doc<"users">[];
  onSelectUser: (id: Id<"users">, role: "admin" | "kid") => void;
}

export function UserSelector({ users, onSelectUser }: UserSelectorProps) {
  const createUser = useMutation(api.users.create);
  const [pendingAdmin, setPendingAdmin] = useState<Doc<"users"> | null>(null);
  const clockLabel = useLiveClock();

  const today = getToday();
  const todayDow = new Date().getDay();
  const kidSummaries = useQuery(api.chores.getKidsSummary, { today, todayDow });

  const kids = users.filter((u) => u.role === "kid");
  const admins = users.filter((u) => u.role === "admin");

  const getRemainingCount = (kidId: Id<"users">) => {
    const serverCount = kidSummaries?.find(
      (s) => s.userId === kidId,
    )?.remaining;
    if (serverCount == null) return null;
    try {
      const raw = localStorage.getItem(`snoozed-${kidId}-${today}`);
      const snoozed = raw ? (JSON.parse(raw) as string[]).length : 0;
      return Math.max(0, serverCount - snoozed);
    } catch {
      return serverCount;
    }
  };

  const handleSetupFamily = async () => {
    if (admins.length === 0)
      await createUser({ name: "Parent", role: "admin" });
    if (kids.length === 0) {
      await createUser({ name: "Kid 1", role: "kid" });
      await createUser({ name: "Kid 2", role: "kid" });
    }
  };

  return (
    <div className="min-h-svh bg-white font-google-sans flex flex-col items-center pt-0 pb-4 px-4 gap-0">
      {/* Title + clock */}
      <div className="flex flex-col items-center gap-12 px-0 py-6 w-full">
        <motion.h1
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-google-sans text-3xl font-bold pt-6 text-center text-stone-950"
        >
          Tiny{"\n"}Tasks
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-xl font-medium text-stone-950/50"
        >
          {clockLabel}
        </motion.p>
      </div>

      {users.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-4 flex-1 justify-center"
        >
          <p className="text-stone-500 text-lg">
            Welcome! Let&apos;s get started.
          </p>
          <button
            onClick={handleSetupFamily}
            className="bg-stone-950 text-white rounded-2xl px-7 py-3.5 text-lg font-medium hover:bg-stone-800 active:scale-[0.97] transition-transform duration-150"
          >
            Set Up Family
          </button>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-4 w-full flex-1 py-4">
          {kids.map((kid, i) => {
            const remaining = getRemainingCount(kid._id);
            return (
              <motion.button
                key={kid._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: i * 0.08 + 0.15,
                  scale: { type: "spring", stiffness: 400, damping: 17 },
                }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelectUser(kid._id, "kid")}
                className="rounded-3xl flex flex-col justify-between overflow-clip p-4 w-full text-left"
                style={{ backgroundColor: KID_COLORS[i % KID_COLORS.length] }}
              >
                {/* Name row with avatar */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-3xl bg-black/25 shrink-0 overflow-hidden flex items-center justify-center">
                    {kid.avatar && (
                      <Image
                        src={kid.avatar}
                        alt=""
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <span className="text-stone-950 text-xl font-medium leading-6">
                    {kid.name}
                  </span>
                </div>
                {remaining !== null && (
                  <span className="text-stone-950/60 text-sm font-medium mt-3 block">
                    {remaining} {remaining === 1 ? "chore" : "chores"} left
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Parent button */}
      {admins[0] && (
        <motion.button
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 28,
            delay: 0.3,
          }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setPendingAdmin(admins[0])}
          className="flex items-center justify-center gap-2 border border-neutral-300 rounded-3xl py-4 w-full shrink-0 hover:bg-neutral-100 transition-colors text-neutral-800 font-medium mt-2"
        >
          <span className="text-md">Admin</span>
        </motion.button>
      )}

      <AnimatePresence>
        {pendingAdmin && (
          <PinPad
            onSuccess={() => {
              onSelectUser(pendingAdmin._id, "admin");
              setPendingAdmin(null);
            }}
            onCancel={() => setPendingAdmin(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
