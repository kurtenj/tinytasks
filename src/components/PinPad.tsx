"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { Delete, X } from "lucide-react";

interface PinPadProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function PinPad({ onSuccess, onCancel }: PinPadProps) {
  const savedPin = useQuery(api.settings.getPin);
  const savePin = useMutation(api.settings.setPin);

  const isSetup = savedPin === null;
  const [entry, setEntry] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phase, setPhase] = useState<"enter" | "confirm">("enter");
  const [shake, setShake] = useState(false);
  const [error, setError] = useState("");

  const display = phase === "confirm" ? confirm : entry;

  const triggerShake = (msg: string) => {
    setError(msg);
    setShake(true);
    setTimeout(() => {
      setShake(false);
      if (phase === "confirm") setConfirm("");
      else setEntry("");
    }, 500);
  };

  const handleDigit = async (d: string) => {
    if (display.length >= 4) return;
    setError("");

    if (phase === "confirm") {
      const next = confirm + d;
      setConfirm(next);
      if (next.length === 4) {
        if (next === entry) {
          await savePin({ pin: next });
          onSuccess();
        } else {
          triggerShake("PINs don't match. Try again.");
        }
      }
    } else {
      const next = entry + d;
      setEntry(next);
      if (next.length === 4) {
        if (isSetup) {
          setTimeout(() => setPhase("confirm"), 200);
        } else {
          if (next === savedPin) {
            onSuccess();
          } else {
            triggerShake("Wrong PIN. Try again.");
          }
        }
      }
    }
  };

  const handleDelete = () => {
    setError("");
    if (phase === "confirm") setConfirm((p) => p.slice(0, -1));
    else setEntry((p) => p.slice(0, -1));
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  const title = isSetup
    ? phase === "enter" ? "Set Admin PIN" : "Confirm PIN"
    : "Parent Access";

  const subtitle = isSetup
    ? phase === "enter"
      ? "Choose a 4-digit PIN for parent access"
      : "Enter the PIN again to confirm"
    : "Enter your 4-digit PIN";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", bounce: 0.3 }}
        className="bg-stone-100 border-4 border-stone-950 shadow-[6px_6px_0px_#0c0c09] rounded-3xl p-8 w-full max-w-xs font-funnel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-medium text-stone-950">{title}</h2>
            <p className="text-sm text-stone-500 mt-0.5">{subtitle}</p>
          </div>
          <button onClick={onCancel} className="text-stone-400 hover:text-stone-700 p-1 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dots */}
        <motion.div
          animate={shake ? { x: [-8, 8, -8, 8, -4, 4, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex justify-center gap-4 mb-3"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                i < display.length
                  ? "bg-stone-950 border-stone-950 scale-110"
                  : "bg-transparent border-stone-400"
              }`}
            />
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {error ? (
            <motion.p
              key={error}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center text-red-500 text-sm mb-4 h-5"
            >
              {error}
            </motion.p>
          ) : (
            <div className="mb-4 h-5" />
          )}
        </AnimatePresence>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2">
          {keys.map((k, i) => {
            if (k === "") return <div key={i} />;
            if (k === "del") {
              return (
                <button
                  key={i}
                  onClick={handleDelete}
                  className="h-14 flex items-center justify-center rounded-2xl text-stone-500 hover:bg-stone-200 active:bg-stone-300 active:scale-[0.97] transition-all"
                >
                  <Delete className="w-5 h-5" />
                </button>
              );
            }
            return (
              <button
                key={i}
                onClick={() => handleDigit(k)}
                className="h-14 text-xl font-semibold text-stone-950 rounded-2xl bg-white border-2 border-stone-200 hover:border-stone-950 active:scale-[0.97] transition-all"
              >
                {k}
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
