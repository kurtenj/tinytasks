"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { PinPad } from "@/components/PinPad";

// Each entry: Tailwind bg class, text class, SVG stroke hex
const CARD_COLORS = [
  { bg: "bg-amber-400",   text: "text-stone-950", stroke: "#0c0c09" },
  { bg: "bg-emerald-700", text: "text-white",      stroke: "#ffffff" },
  { bg: "bg-rose-400",    text: "text-stone-950",  stroke: "#0c0c09" },
  { bg: "bg-sky-500",     text: "text-white",      stroke: "#ffffff" },
];

function CoinIcon({ stroke }: { stroke: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M18 18L16 18" stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M6 18L10 18"  stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M20 16.01L20 16" stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M12 16.01L12 16" stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M4 16.01L4 16"   stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M22 14L22 10"    stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M14 10L14 14"    stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M2 10L2 14"      stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M20 8.01L20 8"   stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M12 8.01L12 8"   stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M4 8.01L4 8"     stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M18 6L16 6"      stroke={stroke} strokeWidth="2" strokeLinecap="square" />
      <path d="M6 6L10 6"       stroke={stroke} strokeWidth="2" strokeLinecap="square" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M16 4V10"  stroke="#57534e" strokeWidth="2" strokeLinecap="square" />
      <path d="M12 15V16" stroke="#57534e" strokeWidth="2" strokeLinecap="square" />
      <path d="M5 21H19"  stroke="#57534e" strokeWidth="2" strokeLinecap="square" />
      <path d="M3 12V19"  stroke="#57534e" strokeWidth="2" strokeLinecap="square" />
      <path d="M21 12V19" stroke="#57534e" strokeWidth="2" strokeLinecap="square" />
      <path d="M8 10V4"   stroke="#57534e" strokeWidth="2" strokeLinecap="square" />
      <path d="M5 10H19"  stroke="#57534e" strokeWidth="2" strokeLinecap="square" />
      <path d="M10 2H14"  stroke="#57534e" strokeWidth="2" strokeLinecap="square" />
    </svg>
  );
}

interface UserSelectorProps {
  users: Doc<"users">[];
  onSelectUser: (id: Id<"users">, role: "admin" | "kid") => void;
}

export function UserSelector({ users, onSelectUser }: UserSelectorProps) {
  const createUser = useMutation(api.users.create);
  const [pendingAdmin, setPendingAdmin] = useState<Doc<"users"> | null>(null);

  const kids = users.filter((u) => u.role === "kid");
  const admins = users.filter((u) => u.role === "admin");

  const handleSetupFamily = async () => {
    if (admins.length === 0) await createUser({ name: "Parent", role: "admin" });
    if (kids.length === 0) {
      await createUser({ name: "Kid 1", role: "kid" });
      await createUser({ name: "Kid 2", role: "kid" });
    }
  };

  // Pair kids into rows of 2
  const kidRows: Doc<"users">[][] = [];
  for (let i = 0; i < kids.length; i += 2) kidRows.push(kids.slice(i, i + 2));

  return (
    <div className="min-h-svh bg-stone-100 font-funnel flex flex-col items-center pt-16 pb-4 px-4 gap-12">
      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-knewave text-[56px] leading-[68px] text-center text-stone-950 shrink-0"
      >
        Tiny{"\n"}Tasks
      </motion.h1>

      {users.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-4"
        >
          <p className="text-stone-500 text-lg">Welcome! Let&apos;s get started.</p>
          <button
            onClick={handleSetupFamily}
            className="bg-stone-950 text-white rounded-2xl px-7 py-3.5 text-lg font-medium hover:bg-stone-800 active:scale-[0.97] transition-all"
          >
            Set Up Family
          </button>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-4 w-full flex-1">
          {kidRows.map((row, ri) => (
            <div key={ri} className="flex gap-4 w-full">
              {row.map((kid, ki) => {
                const { bg, text, stroke } = CARD_COLORS[kids.indexOf(kid) % CARD_COLORS.length];
                return (
                  <motion.button
                    key={kid._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (ri * 2 + ki) * 0.08 + 0.15, scale: { type: "spring", stiffness: 400, damping: 17 } }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onSelectUser(kid._id, "kid")}
                    className={`${bg} border-4 border-stone-950 shadow-[5px_5px_0px_#0c0c09] rounded-3xl flex flex-col gap-4 h-[180px] overflow-clip p-4 w-full text-left`}
                  >
                    <span className={`${text} text-xl font-medium leading-6`}>{kid.name}</span>
                    <div className="flex-1" />
                    <div className="flex items-center gap-2">
                      <CoinIcon stroke={stroke} />
                      <span className={`${text} text-xl font-medium`}>{kid.points}</span>
                    </div>
                  </motion.button>
                );
              })}
              {row.length === 1 && <div className="w-full" />}
            </div>
          ))}
        </div>
      )}

      {/* Parent button(s) */}
      {admins.map((admin) => (
        <motion.button
          key={admin._id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, scale: { type: "spring", stiffness: 400, damping: 17 } }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setPendingAdmin(admin)}
          className="flex items-center justify-center gap-4 bg-stone-200 rounded-lg py-4 w-full shrink-0 hover:bg-stone-300 transition-colors"
        >
          <span className="text-stone-500 text-xl">{admin.name}</span>
          <LockIcon />
        </motion.button>
      ))}

      <AnimatePresence>
        {pendingAdmin && (
          <PinPad
            adminName={pendingAdmin.name}
            onSuccess={() => { onSelectUser(pendingAdmin._id, "admin"); setPendingAdmin(null); }}
            onCancel={() => setPendingAdmin(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
