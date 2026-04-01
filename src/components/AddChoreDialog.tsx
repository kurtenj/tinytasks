"use client";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import NextImage from "next/image";
import { motion } from "framer-motion";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon } from "@hugeicons/core-free-icons";
import { getPresetByFile, DAY_ABBREVS } from "@/lib/chorePresets";

function fileToLabel(filename: string): string {
  return filename
    .replace(/\.(png|jpg|jpeg|gif|webp)$/i, "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const LABEL = "text-xs font-medium text-neutral-500 uppercase mb-2 block";
const INPUT =
  "w-full bg-neutral-100 rounded-xl px-4 py-3 text-neutral-800 placeholder:text-neutral-300 outline-none";
const TOGGLE = (active: boolean) =>
  `transition-transform duration-150 active:scale-[0.97] rounded-lg text-sm font-medium ${
    active
      ? "bg-neutral-900 text-white"
      : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
  }`;

interface AddChoreDialogProps {
  userId: Id<"users">;
  onClose: () => void;
  chore?: Doc<"chores">;
}

export function AddChoreDialog({
  userId,
  onClose,
  chore,
}: AddChoreDialogProps) {
  const [title, setTitle] = useState(chore?.title ?? "");
  const [description, setDescription] = useState(chore?.description ?? "");
  const [imageUrl, setImageUrl] = useState(chore?.imageUrl ?? "");
  const [scheduleType, setScheduleType] = useState<"floating" | "repeating">(
    chore?.scheduleType ?? "floating",
  );
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    chore?.daysOfWeek ?? [],
  );
  const [assignedTo, setAssignedTo] = useState<Id<"users">[]>(
    chore?.assignedTo ?? [],
  );
  const [cardColor, setCardColor] = useState(chore?.cardColor ?? "");
  const [imageFiles, setImageFiles] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(chore?.isActive ?? true);

  useEffect(() => {
    fetch("/api/chore-images")
      .then((r) => r.json())
      .then(setImageFiles)
      .catch(() => {});
  }, []);

  const createChore = useMutation(api.chores.create);
  const updateChore = useMutation(api.chores.update);
  const removeChore = useMutation(api.chores.remove);
  const kids = useQuery(api.users.getKids);

  const toggleDay = (day: number) =>
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );

  const toggleKid = (id: Id<"users">) =>
    setAssignedTo((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id],
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
      title: title.trim(),
      description: description.trim() || undefined,
      imageUrl: imageUrl || undefined,
      cardColor: cardColor || undefined,
      scheduleType,
      daysOfWeek: scheduleType === "repeating" ? daysOfWeek : [],
      assignedTo: assignedTo.length > 0 ? assignedTo : undefined,
    };
    if (chore) {
      await updateChore({ id: chore._id, ...fields, isActive });
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
      className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
        className="bg-white rounded-t-4xl sm:rounded-4xl w-full max-w-md font-google-sans max-h-[92svh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4">
          <h2 className="text-2xl font-semibold leading-10 font-google-sans text-neutral-900">
            {chore ? "Edit Chore" : "Add Chore"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-5">
          {/* Illustration picker */}
          <div>
            <label className={LABEL}>Illustration</label>
            <div className="grid grid-cols-4 gap-2">
              {imageFiles.map((filename) => {
                const path = `/chores/${filename}`;
                const selected = imageUrl === path;
                const preset = getPresetByFile(path);
                return (
                  <button
                    key={filename}
                    type="button"
                    onClick={() => selectImage(filename)}
                    className={`relative aspect-4/3 rounded-2xl overflow-hidden transition-transform duration-150 active:scale-[0.97] border-2 outline-none bg-neutral-100 ${
                      selected
                        ? "border-neutral-800 scale-105"
                        : "border-transparent"
                    }`}
                    title={preset?.label ?? fileToLabel(filename)}
                  >
                    <NextImage
                      src={path}
                      alt={fileToLabel(filename)}
                      fill
                      className="object-cover"
                      sizes="100px"
                    />
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className={`aspect-square rounded-2xl border-2 flex items-center justify-center transition-transform duration-150 active:scale-[0.97] outline-none ${
                  !imageUrl
                    ? "border-neutral-800 bg-neutral-100"
                    : "border-transparent bg-neutral-100 hover:border-neutral-300"
                }`}
                title="No illustration"
              >
                <span className="text-neutral-400 text-xs font-medium">
                  None
                </span>
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className={LABEL}>Chore name</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Make your bed"
              className={INPUT}
              autoFocus={!chore}
            />
          </div>

          {/* Description */}
          <div>
            <label className={LABEL}>
              Description{" "}
              <span className="normal-case text-neutral-300">(optional)</span>
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Fluff the pillows too!"
              className={INPUT}
            />
          </div>

          {/* Schedule type */}
          <div>
            <label className={LABEL}>Schedule</label>
            <div className="flex gap-2">
              {(["floating", "repeating"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setScheduleType(type)}
                  className={`flex-1 py-2.5 ${TOGGLE(scheduleType === type)}`}
                >
                  {type === "floating" ? "Flexible" : "Repeating"}
                </button>
              ))}
            </div>
          </div>

          {/* Days of week */}
          {scheduleType === "repeating" && (
            <div>
              <label className={LABEL}>Days of week</label>
              <div className="flex gap-1.5">
                {DAY_ABBREVS.map((d, i) =>
                  i === 0 || i === 6 ? null : (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={`flex-1 h-9 text-xs font-semibold ${TOGGLE(daysOfWeek.includes(i))}`}
                    >
                      {d}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}

          {/* Kid assignment */}
          {kids && kids.length > 0 && (
            <div>
              <label className={LABEL}>Assign to</label>
              <div className="flex flex-wrap gap-2">
                {kids.map((kid) => (
                  <button
                    key={kid._id}
                    type="button"
                    onClick={() => toggleKid(kid._id)}
                    className={`px-4 py-2 ${TOGGLE(assignedTo.includes(kid._id))}`}
                  >
                    {kid.name}
                  </button>
                ))}
              </div>
              <p className="text-xs text-neutral-400 mt-2">
                {assignedTo.length === 0
                  ? "All kids"
                  : `${assignedTo.length} kid${assignedTo.length !== 1 ? "s" : ""} selected`}
              </p>
            </div>
          )}

          {/* Active toggle + delete (edit mode only) */}
          {chore && (
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-neutral-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="accent-neutral-800 w-4 h-4"
                />
                Active
              </label>
              <button
                type="button"
                onClick={async () => {
                  await removeChore({ id: chore._id });
                  onClose();
                }}
                className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-red-500 transition-colors"
              >
                <HugeiconsIcon icon={Delete01Icon} size={16} /> Delete chore
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-neutral-100 text-neutral-600 py-3 rounded-xl font-medium hover:bg-neutral-200 active:scale-[0.97] transition-all duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 bg-neutral-900 text-white py-3 rounded-xl font-medium hover:bg-neutral-800 active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100 transition-all duration-150"
            >
              {chore ? "Save" : "Add Chore"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
