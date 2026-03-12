"use client";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { getPresetByFile } from "@/lib/chorePresets";

function fileToLabel(filename: string): string {
  return filename
    .replace(/\.(png|jpg|jpeg|gif|webp)$/i, "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const DAY_ABBREVS = ["Su", "M", "T", "W", "Th", "F", "Sa"];

interface AddChoreDialogProps {
  userId: Id<"users">;
  onClose: () => void;
  chore?: Doc<"chores">;
}

export function AddChoreDialog({ userId, onClose, chore }: AddChoreDialogProps) {
  const [title,        setTitle]        = useState(chore?.title ?? "");
  const [description,  setDescription]  = useState(chore?.description ?? "");
  const [imageUrl,     setImageUrl]     = useState(chore?.imageUrl ?? "");
  const [scheduleType, setScheduleType] = useState<"floating" | "repeating">(
    chore?.scheduleType ?? "floating"
  );
  const [daysOfWeek,   setDaysOfWeek]   = useState<number[]>(chore?.daysOfWeek ?? []);
  const [assignedTo,   setAssignedTo]   = useState<Id<"users">[]>(chore?.assignedTo ?? []);
  const [cardColor,    setCardColor]    = useState(chore?.cardColor ?? "");
  const [imageFiles,   setImageFiles]   = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/chore-images")
      .then((r) => r.json())
      .then(setImageFiles)
      .catch(() => {});
  }, []);

  const createChore = useMutation(api.chores.create);
  const updateChore = useMutation(api.chores.update);
  const kids        = useQuery(api.users.getKids);

  const toggleDay = (day: number) =>
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );

  const toggleKid = (id: Id<"users">) =>
    setAssignedTo((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
    );

  async function extractColor(src: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 2, 2, 1, 1, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        resolve(`rgb(${r},${g},${b})`);
      };
      img.onerror = () => resolve("");
      img.src = src;
    });
  }

  const selectImage = async (filename: string) => {
    const path = `/chores/${filename}`;
    setImageUrl(path);
    const preset = getPresetByFile(path);
    if (!title.trim()) setTitle(preset?.label ?? fileToLabel(filename));
    const color = await extractColor(path);
    setCardColor(color);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const fields = {
      title:       title.trim(),
      description: description.trim() || undefined,
      imageUrl:    imageUrl || undefined,
      cardColor:   cardColor || undefined,
      scheduleType,
      daysOfWeek:  scheduleType === "repeating" ? daysOfWeek : [],
      assignedTo:  assignedTo.length > 0 ? assignedTo : undefined,
    };
    if (chore) {
      await updateChore({ id: chore._id, ...fields });
    } else {
      await createChore({ ...fields, createdBy: userId });
    }
    onClose();
  };

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
        className="bg-stone-100 border-4 border-stone-950 shadow-[6px_6px_0px_#0c0c09] rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md font-funnel max-h-[90svh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-knewave text-2xl text-stone-950 mb-4">
          {chore ? "Edit Chore" : "Add Chore"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Illustration picker */}
          <div>
            <label className="text-sm text-stone-600 font-medium mb-2 block">Illustration</label>
            <div className="grid grid-cols-3 gap-2">
              {imageFiles.map((filename) => {
                const path = `/chores/${filename}`;
                const selected = imageUrl === path;
                const preset = getPresetByFile(path);
                return (
                  <button
                    key={filename}
                    type="button"
                    onClick={() => selectImage(filename)}
                    className={`relative aspect-square rounded-2xl border-2 overflow-hidden transition-all active:scale-[0.97] ${
                      selected
                        ? "border-stone-950 ring-2 ring-stone-950 scale-105"
                        : "border-stone-200 hover:border-stone-400"
                    }`}
                    style={{ backgroundColor: preset?.color ?? "#e7e5e4" }}
                    title={preset?.label ?? fileToLabel(filename)}
                  >
                    <img
                      src={path}
                      alt={fileToLabel(filename)}
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  </button>
                );
              })}
              {/* No illustration option */}
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className={`aspect-square rounded-2xl border-2 flex items-center justify-center transition-all active:scale-[0.97] ${
                  !imageUrl
                    ? "border-stone-950 ring-2 ring-stone-950 bg-stone-200"
                    : "border-stone-200 bg-white hover:border-stone-400"
                }`}
                title="No illustration"
              >
                <span className="text-stone-400 text-xs font-medium">None</span>
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-sm text-stone-600 font-medium mb-1 block">Chore name *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Make your bed"
              className="w-full border-2 border-stone-950 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-stone-950"
              autoFocus={!chore}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm text-stone-600 font-medium mb-1 block">Description (optional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Fluff the pillows too!"
              className="w-full border-2 border-stone-950 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-stone-950"
            />
          </div>

          {/* Schedule type */}
          <div>
            <label className="text-sm text-stone-600 font-medium mb-2 block">Schedule</label>
            <div className="flex gap-2">
              {(["floating", "repeating"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setScheduleType(type)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.97] border-2 ${
                    scheduleType === type
                      ? "bg-amber-100 border-stone-950 text-stone-950"
                      : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  {type === "floating" ? "Flexible" : "Repeating"}
                </button>
              ))}
            </div>
          </div>

          {/* Days of week */}
          {scheduleType === "repeating" && (
            <div>
              <label className="text-sm text-stone-600 font-medium mb-2 block">Days of week</label>
              <div className="flex gap-1.5">
                {DAY_ABBREVS.map((d, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-all active:scale-[0.97] border-2 ${
                      daysOfWeek.includes(i)
                        ? "bg-stone-950 border-stone-950 text-white"
                        : "bg-white border-stone-200 text-stone-500 hover:border-stone-950"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Kid assignment */}
          {kids && kids.length > 0 && (
            <div>
              <label className="text-sm text-stone-600 font-medium mb-2 block">Assign to</label>
              <div className="flex flex-wrap gap-2">
                {kids.map((kid) => (
                  <button
                    key={kid._id}
                    type="button"
                    onClick={() => toggleKid(kid._id)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all active:scale-[0.97] border-2 ${
                      assignedTo.includes(kid._id)
                        ? "bg-amber-100 border-stone-950 text-stone-950"
                        : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    {kid.name}
                  </button>
                ))}
              </div>
              <p className="text-xs text-stone-400 mt-1.5">
                {assignedTo.length === 0
                  ? "All kids"
                  : `${assignedTo.length} kid${assignedTo.length !== 1 ? "s" : ""} selected`}
              </p>
            </div>
          )}

          {/* Actions */}
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
              disabled={!title.trim()}
              className="flex-1 bg-stone-950 text-white py-3 rounded-xl font-medium hover:bg-stone-800 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 transition-all"
            >
              {chore ? "Save" : "Add Chore"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
