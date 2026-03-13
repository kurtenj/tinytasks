"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
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

function HandCoinsIcon({ stroke, opacity = 1 }: { stroke: string; opacity?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity, flexShrink: 0 }}>
      <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
      <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" />
      <path d="m2 16 6 6" />
      <circle cx="16" cy="9" r="2.9" />
      <circle cx="6" cy="5" r="3" />
    </svg>
  );
}

function ParentsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0C0C09" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, flexShrink: 0 }}>
      <path d="M19 16v-2a2 2 0 0 0-4 0v2" />
      <path d="M9.5 15H7a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <rect x="13" y="16" width="8" height="5" rx="0.9" />
    </svg>
  );
}

function useLiveClock() {
  const [label, setLabel] = useState(() => formatClock());

  useEffect(() => {
    const update = () => setLabel(formatClock());
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, []);

  return label;
}

function formatClock(): string {
  const now = new Date();
  const day = now.toLocaleDateString("en-US", { weekday: "long" });
  const time = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day}, ${time}`;
}

interface UserSelectorProps {
  users: Doc<"users">[];
  onSelectUser: (id: Id<"users">, role: "admin" | "kid") => void;
}

export function UserSelector({ users, onSelectUser }: UserSelectorProps) {
  const createUser = useMutation(api.users.create);
  const [pendingAdmin, setPendingAdmin] = useState<Doc<"users"> | null>(null);
  const clockLabel = useLiveClock();

  const today    = new Date().toLocaleDateString("en-CA");
  const todayDow = new Date().getDay();
  const kidSummaries = useQuery(api.chores.getKidsSummary, { today, todayDow });

  const kids   = users.filter((u) => u.role === "kid");
  const admins = users.filter((u) => u.role === "admin");

  const getRemainingCount = (kidId: Id<"users">) =>
    kidSummaries?.find((s) => s.userId === kidId)?.remaining ?? null;

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
    <div className="min-h-svh bg-stone-100 font-funnel flex flex-col items-center pt-0 pb-4 px-4 gap-0">
      {/* Title + clock */}
      <div className="flex flex-col items-center gap-12 px-0 py-6 w-full">
        <motion.h1
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-knewave text-[56px] leading-[68px] text-center text-stone-950 shrink-0"
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
          <p className="text-stone-500 text-lg">Welcome! Let&apos;s get started.</p>
          <button
            onClick={handleSetupFamily}
            className="bg-stone-950 text-white rounded-2xl px-7 py-3.5 text-lg font-medium hover:bg-stone-800 active:scale-[0.97] transition-all"
          >
            Set Up Family
          </button>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-4 w-full flex-1 py-4">
          {kidRows.map((row, ri) => (
            <div key={ri} className="flex gap-4 w-full">
              {row.map((kid, ki) => {
                const { bg, text, stroke } = CARD_COLORS[kids.indexOf(kid) % CARD_COLORS.length];
                const remaining = getRemainingCount(kid._id);
                return (
                  <motion.button
                    key={kid._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (ri * 2 + ki) * 0.08 + 0.15, scale: { type: "spring", stiffness: 400, damping: 17 } }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onSelectUser(kid._id, "kid")}
                    className={`${bg} border-4 border-stone-950 shadow-[5px_5px_0px_#0c0c09] rounded-3xl flex flex-col justify-between h-[180px] overflow-clip p-4 w-full text-left`}
                  >
                    {/* Name row with avatar dot */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-black/25 shrink-0" />
                      <span className={`${text} text-xl font-medium leading-6`}>{kid.name}</span>
                    </div>
                    {/* Stats */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <HandCoinsIcon stroke={stroke} opacity={0.25} />
                        <span className={`${text} text-xl font-medium`}>{kid.points}</span>
                      </div>
                      {remaining !== null && (
                        <span className={`${text} text-sm font-semibold`}>
                          {remaining} {remaining === 1 ? "chore" : "chores"} left
                        </span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
              {row.length === 1 && <div className="w-full opacity-0 pointer-events-none h-[180px]" />}
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
          className="flex items-center justify-center gap-2 bg-stone-200 rounded-3xl py-4 w-full shrink-0 hover:bg-stone-300 transition-colors"
        >
          <ParentsIcon />
          <span className="text-stone-950/50 text-xl">Parents</span>
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
