"use client";
import { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useDragControls,
  animate,
  useAnimationFrame,
} from "framer-motion";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

// ── Mock data ──────────────────────────────────────────────────────────────────

const MOCK_REMAINING = [
  {
    _id: "chore1",
    title: "Make your bed",
    description: "Fluff the pillows too!",
    imageUrl: "/chores/make-bed.png",
    scheduleType: "repeating" as const,
  },
  {
    _id: "chore2",
    title: "Clean your room",
    description: "Put everything back in its place",
    imageUrl: "/chores/clean-room.png",
    scheduleType: "floating" as const,
  },
  {
    _id: "chore3",
    title: "Do homework",
    description: "All of it!",
    imageUrl: "/chores/homework.png",
    scheduleType: "floating" as const,
  },
];

const MOCK_COMPLETED = [
  { _id: "done1", title: "Feed the dog" },
  { _id: "done2", title: "Unload dishwasher" },
];

// ── Candy stripe progress bar ─────────────────────────────────────────────────

function CandyStripeBar({ progress }: { progress: number }) {
  const offset = useMotionValue(0);
  const backgroundPosition = useTransform(offset, (v) => `${v}px 0`);

  useAnimationFrame((_, delta) => {
    offset.set(offset.get() + delta * 0.04);
  });

  return (
    <div className="relative h-3.75 rounded-full overflow-hidden bg-neutral-500/25">
      <motion.div
        className="absolute inset-y-0 left-0"
        style={{
          background:
            "repeating-linear-gradient(-45deg, #262626, #262626 10px, #404040 10px, #404040 20px)",
          backgroundPosition,
        }}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ type: "spring", stiffness: 200, damping: 24 }}
      />
    </div>
  );
}

// ── Tiny clock ─────────────────────────────────────────────────────────────────

function useClock() {
  const fmt = () =>
    new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const [label, setLabel] = useState(fmt);
  useEffect(() => {
    const id = setInterval(() => setLabel(fmt()), 10_000);
    return () => clearInterval(id);
  }, []);
  return label;
}

// ── Mock ChoreCard ─────────────────────────────────────────────────────────────

function ChoreCard({
  chore,
  onComplete,
  onCycle,
  onSnooze,
}: {
  chore: (typeof MOCK_REMAINING)[0];
  onComplete: () => void;
  onCycle?: (d: 1 | -1) => void;
  onSnooze?: () => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 0, 250], [-18, 0, 18]);
  const dragControls = useDragControls();
  const lastPointerDownRef = useRef<number>(0);

  const doComplete = () => {
    animate(x, -520, { ease: [0.4, 0, 0.9, 1], duration: 0.28 });
    setTimeout(onComplete, 210);
  };

  const doCycle = (direction: 1 | -1) => {
    if (!onCycle) {
      animate(x, 0, { type: "spring", stiffness: 320, damping: 22 });
      return;
    }
    animate(x, direction * 520, { ease: [0.4, 0, 0.9, 1], duration: 0.28 });
    setTimeout(() => onCycle(direction), 210);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const now = Date.now();
    if (now - lastPointerDownRef.current < 350) {
      lastPointerDownRef.current = 0;
      doComplete();
      return;
    }
    lastPointerDownRef.current = now;
    dragControls.start(e);
  };

  return (
    <motion.div
      drag="x"
      dragControls={dragControls}
      dragListener={false}
      style={{ x, rotate }}
      dragConstraints={{ left: -520, right: 520 }}
      dragElastic={0.04}
      onDragEnd={(_, info) => {
        const isSwipe =
          Math.abs(info.offset.x) > 80 || Math.abs(info.velocity.x) > 600;
        if (isSwipe) doCycle(info.offset.x >= 0 ? 1 : -1);
        else animate(x, 0, { type: "spring", stiffness: 320, damping: 22 });
      }}
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0 } }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="absolute inset-0 rounded-4xl border-2 border-neutral-800 overflow-hidden select-none touch-none bg-white"
      onPointerDown={handlePointerDown}
    >
      <div className="absolute inset-x-0 top-0 bottom-35 pointer-events-none px-6 pt-14">
        {chore.imageUrl && (
          <div className="relative w-full h-full">
            <Image
              src={chore.imageUrl}
              alt={chore.title}
              fill
              className="object-contain"
              sizes="(max-width: 512px) 100vw, 512px"
            />
          </div>
        )}
      </div>

      <div className="absolute bottom-0 inset-x-0 px-4 pb-4 flex flex-col gap-3">
        <div className="px-2 pointer-events-none">
          <p className="text-neutral-800 text-xl font-medium leading-tight mb-1">
            {chore.title}
          </p>
          <p className="text-neutral-500 text-sm font-medium">
            {chore.description}
          </p>
        </div>
        <div className="flex gap-3 w-full">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={doComplete}
            className="flex-1 flex items-center justify-center rounded-full border border-neutral-300 py-3 text-sm font-medium text-neutral-800"
          >
            Complete
          </button>
          {onSnooze && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onSnooze}
              className="flex-1 flex items-center justify-center rounded-full border border-neutral-300 py-3 text-sm font-medium text-neutral-800"
            >
              Do later
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Preview page ───────────────────────────────────────────────────────────────

type AllowanceState = "on_track" | "earned" | "lost";

export default function PreviewPage() {
  const clock = useClock();
  const [remaining, setRemaining] = useState(MOCK_REMAINING);
  const [completed, setCompleted] = useState(MOCK_COMPLETED);
  const [frontOffset, setFrontOffset] = useState(0);
  const [allowance, setAllowance] = useState<AllowanceState>("on_track");

  const safeOffset = remaining.length > 0 ? frontOffset % remaining.length : 0;
  const deckChores = Array.from(
    { length: Math.min(3, remaining.length) },
    (_, i) => remaining[(safeOffset + i) % remaining.length],
  );
  const [frontChore, midChore, backChore] = deckChores;

  const totalVisible = completed.length + remaining.length;
  const progress =
    totalVisible > 0
      ? Math.min((completed.length / totalVisible) * 100, 100)
      : 0;

  const handleComplete = () => {
    const chore = remaining[safeOffset];
    setRemaining((r) => r.filter((c) => c._id !== chore._id));
    setCompleted((c) => [{ _id: chore._id, title: chore.title }, ...c]);
    setFrontOffset(0);
  };

  const handleCycle = (direction: 1 | -1) => {
    setFrontOffset((o) => {
      if (remaining.length === 0) return 0;
      return (
        (((o + direction) % remaining.length) + remaining.length) %
        remaining.length
      );
    });
  };

  const handleSnooze = () => setFrontOffset(0);

  const reset = () => {
    setRemaining(MOCK_REMAINING);
    setCompleted(MOCK_COMPLETED);
    setFrontOffset(0);
  };

  const isAllDone = remaining.length === 0;

  return (
    <div className="relative min-h-screen bg-neutral-100 font-google-sans flex flex-col">
      {/* Dev toolbar */}
      <div className="fixed top-2 right-2 z-50 flex gap-1.5 flex-wrap justify-end max-w-xs">
        <button
          onClick={reset}
          className="text-xs bg-neutral-950 text-white px-2.5 py-1 rounded-lg"
        >
          Reset
        </button>
        {(["on_track", "earned", "lost"] as AllowanceState[]).map((s) => (
          <button
            key={s}
            onClick={() => setAllowance(s)}
            className={`text-xs px-2.5 py-1 rounded-lg border ${allowance === s ? "bg-neutral-800 text-white border-neutral-800" : "bg-white text-neutral-600 border-neutral-300"}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Dark background extension */}
      {!isAllDone && (
        <div className="absolute top-0 inset-x-0 h-119.75 bg-olive-200 rounded-b-3xl" />
      )}

      {/* Header */}
      <motion.div
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="relative bg-olive-200 rounded-b-4xl px-4 pt-4 pb-5"
      >
        <div className="max-w-lg mx-auto space-y-4">
          <button className="active:scale-[0.97] transition-transform">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} className="text-neutral-800" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-500/25 shrink-0" />
            <p className="text-3xl leading-10 font-google-sans text-neutral-800">
              Alex
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-neutral-800">Progress</p>
              <p className="text-sm font-medium text-neutral-800">{clock}</p>
            </div>
            <CandyStripeBar progress={progress} />
          </div>

          {/* Allowance */}
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${
                allowance === "earned"
                  ? "bg-green-600"
                  : allowance === "lost"
                    ? "bg-red-600"
                    : "bg-neutral-800"
              }`}
            />
            <span
              className={`text-sm font-medium ${
                allowance === "earned"
                  ? "text-green-600"
                  : allowance === "lost"
                    ? "text-red-600"
                    : "text-neutral-800"
              }`}
            >
              {allowance === "earned"
                ? "Allowance earned!"
                : allowance === "lost"
                  ? "No allowance this week"
                  : "Allowance on track"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Body */}
      <div className="relative max-w-lg mx-auto flex flex-col flex-1 w-full">
        {/* Card deck */}
        {!isAllDone && (
          <div className="px-4 pt-8">
            <div className="relative h-105">
              {backChore && (
                <div
                  className="absolute -top-8 rounded-4xl border-2 border-neutral-800 bg-white"
                  style={{ insetInline: "2rem", height: 420 }}
                />
              )}
              {midChore && (
                <div
                  className="absolute -top-4 rounded-4xl border-2 border-neutral-800 bg-white"
                  style={{ insetInline: "1rem", height: 420 }}
                />
              )}
              <AnimatePresence>
                {frontChore && (
                  <ChoreCard
                    key={frontChore._id}
                    chore={frontChore}
                    onComplete={handleComplete}
                    onCycle={remaining.length > 1 ? handleCycle : undefined}
                    onSnooze={
                      frontChore.scheduleType !== "repeating"
                        ? handleSnooze
                        : undefined
                    }
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Empty state */}
        {isAllDone && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xl font-regular text-neutral-400">
              All chores done, good job!
            </p>
          </div>
        )}

        {/* Completed list */}
        {completed.length > 0 && (
          <div className="mt-auto px-4 pt-6 pb-8">
            <p className="text-sm font-medium text-neutral-400 mb-1 pointer-events-none">
              Completed
            </p>
            <div className="flex flex-col">
              {completed.map((chore) => (
                <div key={chore._id} className="flex items-center py-1">
                  <span className="text-neutral-800 text-sm font-medium">
                    {chore.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
