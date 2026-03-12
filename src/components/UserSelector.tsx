"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { PinPad } from "@/components/PinPad";

const CARD_COLORS = [
  { bg: "oklch(82.8% 0.189 84.4)", text: "oklch(15.3% 0.006 107.1)", stroke: "#0C0C09" },
  { bg: "oklch(50.8% 0.118 165.6)", text: "oklch(100% 0 0)",          stroke: "#FFFFFF" },
  { bg: "oklch(70.4% 0.191 22.2)", text: "oklch(15.3% 0.006 107.1)", stroke: "#0C0C09" },
  { bg: "oklch(72% 0.15 250)",     text: "oklch(100% 0 0)",          stroke: "#FFFFFF" },
];

const BG = "oklch(93% 0.007 106.5)";
const NEAR_BLACK = "oklch(15.3% 0.006 107.1)";

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
      <path d="M16 4V10"  stroke="#474739" strokeWidth="2" strokeLinecap="square" />
      <path d="M12 15V16" stroke="#474739" strokeWidth="2" strokeLinecap="square" />
      <path d="M5 21H19"  stroke="#474739" strokeWidth="2" strokeLinecap="square" />
      <path d="M3 12V19"  stroke="#474739" strokeWidth="2" strokeLinecap="square" />
      <path d="M21 12V19" stroke="#474739" strokeWidth="2" strokeLinecap="square" />
      <path d="M8 10V4"   stroke="#474739" strokeWidth="2" strokeLinecap="square" />
      <path d="M5 10H19"  stroke="#474739" strokeWidth="2" strokeLinecap="square" />
      <path d="M10 2H14"  stroke="#474739" strokeWidth="2" strokeLinecap="square" />
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
  for (let i = 0; i < kids.length; i += 2) {
    kidRows.push(kids.slice(i, i + 2));
  }

  return (
    <div
      style={{
        backgroundColor: BG,
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "64px",
        paddingBottom: "16px",
        paddingLeft: "16px",
        paddingRight: "16px",
        gap: "48px",
        fontFamily: "var(--font-funnel), system-ui, sans-serif",
      }}
    >
      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          fontFamily: "var(--font-knewave), system-ui, sans-serif",
          fontSize: "56px",
          lineHeight: "68px",
          textAlign: "center",
          color: NEAR_BLACK,
          flexShrink: 0,
        }}
      >
        Tiny{"\n"}Tasks
      </motion.h1>

      {/* Kid cards */}
      {users.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}
        >
          <p style={{ color: "oklch(39.4% 0.023 107.4)", fontSize: "18px" }}>
            Welcome! Let&apos;s get started.
          </p>
          <button
            onClick={handleSetupFamily}
            style={{
              backgroundColor: NEAR_BLACK,
              color: "white",
              borderRadius: "16px",
              padding: "14px 28px",
              fontSize: "18px",
              fontFamily: "var(--font-funnel), system-ui, sans-serif",
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
            }}
          >
            Set Up Family
          </button>
        </motion.div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%", flex: 1 }}>
          {kidRows.map((row, ri) => (
            <div key={ri} style={{ display: "flex", gap: "16px", width: "100%" }}>
              {row.map((kid, ki) => {
                const colorIdx = kids.indexOf(kid) % CARD_COLORS.length;
                const { bg, text, stroke } = CARD_COLORS[colorIdx];
                return (
                  <motion.button
                    key={kid._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (ri * 2 + ki) * 0.08 + 0.15 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onSelectUser(kid._id, "kid")}
                    style={{
                      backgroundColor: bg,
                      borderColor: NEAR_BLACK,
                      borderRadius: "24px",
                      borderStyle: "solid",
                      borderWidth: "4px",
                      boxShadow: `${NEAR_BLACK} 5px 5px 0px`,
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                      height: "180px",
                      overflow: "clip",
                      padding: "16px",
                      width: "100%",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ color: text, fontSize: "20px", fontWeight: 500, lineHeight: "24px" }}>
                      {kid.name}
                    </span>
                    <div style={{ flex: 1 }} />
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <CoinIcon stroke={stroke} />
                      <span style={{ color: text, fontSize: "20px", fontWeight: 500 }}>
                        {kid.points}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
              {/* Fill empty slot if odd number of kids */}
              {row.length === 1 && <div style={{ width: "100%" }} />}
            </div>
          ))}
        </div>
      )}

      {/* Parent button */}
      {admins.map((admin) => (
        <motion.button
          key={admin._id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setPendingAdmin(admin)}
          style={{
            alignItems: "center",
            backgroundColor: "oklch(88% 0.011 106.6)",
            borderRadius: "8px",
            display: "flex",
            flexShrink: 0,
            gap: "16px",
            justifyContent: "center",
            padding: "16px",
            width: "100%",
            border: "none",
            cursor: "pointer",
          }}
        >
          <span style={{ color: "oklch(39.4% 0.023 107.4)", fontSize: "20px", fontFamily: "var(--font-funnel), system-ui, sans-serif" }}>
            {admin.name}
          </span>
          <LockIcon />
        </motion.button>
      ))}

      <AnimatePresence>
        {pendingAdmin && (
          <PinPad
            adminName={pendingAdmin.name}
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
