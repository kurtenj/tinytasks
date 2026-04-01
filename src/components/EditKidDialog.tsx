"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import NextImage from "next/image";
import { motion } from "framer-motion";
import type { Doc } from "../../convex/_generated/dataModel";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon } from "@hugeicons/core-free-icons";

const LABEL = "text-xs font-medium text-neutral-500 uppercase mb-2 block";
const INPUT =
  "w-full bg-neutral-100 rounded-xl px-4 py-3 text-neutral-800 placeholder:text-neutral-300 outline-none";

const AVATARS = ["/avatars/em.png", "/avatars/judah.png", "/avatars/julian.png"];

interface EditKidDialogProps {
  kid: Doc<"users">;
  onClose: () => void;
}

export function EditKidDialog({ kid, onClose }: EditKidDialogProps) {
  const [name, setName] = useState(kid.name);
  const [avatar, setAvatar] = useState(kid.avatar ?? "");

  const renameKid = useMutation(api.users.rename);
  const setAvatarMutation = useMutation(api.users.setAvatar);
  const removeKid = useMutation(api.users.remove);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await Promise.all([
      renameKid({ id: kid._id, name: name.trim() }),
      setAvatarMutation({ id: kid._id, avatar: avatar || undefined }),
    ]);
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
        className="bg-white rounded-t-4xl sm:rounded-4xl w-full max-w-md font-google-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4">
          <h2 className="text-2xl font-semibold leading-10 font-google-sans text-neutral-900">
            Edit Kid
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-5">
          {/* Avatar picker */}
          <div>
            <label className={LABEL}>Avatar</label>
            <div className="flex gap-3">
              {AVATARS.map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setAvatar(avatar === src ? "" : src)}
                  className={`relative w-16 h-16 rounded-full overflow-hidden border-2 transition-transform duration-150 active:scale-[0.97] ${
                    avatar === src
                      ? "border-neutral-800 scale-105"
                      : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  <NextImage src={src} alt="" fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className={LABEL}>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kid's name"
              className={INPUT}
              autoFocus
            />
          </div>

          {/* Delete */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={async () => {
                await removeKid({ id: kid._id });
                onClose();
              }}
              className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-red-500 transition-colors"
            >
              <HugeiconsIcon icon={Delete01Icon} size={16} /> Delete kid
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-neutral-100 text-neutral-600 py-3 rounded-xl font-medium hover:bg-neutral-200 active:scale-[0.97] transition-all duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 bg-neutral-900 text-white py-3 rounded-xl font-medium hover:bg-neutral-800 active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100 transition-all duration-150"
            >
              Save
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
