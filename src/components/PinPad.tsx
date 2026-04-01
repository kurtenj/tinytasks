"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { EraserIcon } from "@hugeicons/core-free-icons";

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-neutral-800/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", bounce: 0.3 }}
        className="bg-white border shadow-lg rounded-2xl p-6 w-full max-w-xs font-google-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dots */}
        <motion.div
          animate={shake ? { x: [-8, 8, -8, 8, -4, 4, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex justify-center gap-4 mb-4 mt-4"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`w-5 h-5 rounded-full border transition-transform duration-150 ${
                i < display.length
                  ? "bg-stone-800 border-stone-800 scale-110"
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
        <div className="grid grid-cols-3 gap-1.5">
          {keys.map((k, i) => {
            if (k === "") return <div key={i} />;
            if (k === "del") {
              return (
                <button
                  key={i}
                  onClick={handleDelete}
                  className="h-11 flex items-center justify-center rounded-md text-stone-400 hover:bg-stone-200 active:bg-stone-300 active:scale-[0.97] transition-transform duration-150"
                >
                  <HugeiconsIcon icon={EraserIcon} size={16} />
                </button>
              );
            }
            return (
              <button
                key={i}
                onClick={() => handleDigit(k)}
                className="h-11 text-base font-regular text-stone-950 rounded-md bg-stone-50 border border-stone-200 hover:bg-stone-100 active:bg-stone-800 active:text-white active:scale-[0.97] transition-transform duration-150"
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
