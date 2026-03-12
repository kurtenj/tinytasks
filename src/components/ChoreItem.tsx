"use client";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { CheckCircle2, Circle } from "lucide-react";

interface ChoreItemProps {
  chore: Doc<"chores">;
  completed: boolean;
  userId: Id<"users">;
}

export function ChoreItem({ chore, completed, userId }: ChoreItemProps) {
  const complete = useMutation(api.completions.complete);
  const uncomplete = useMutation(api.completions.uncomplete);

  const toggle = async () => {
    if (completed) {
      await uncomplete({ choreId: chore._id, userId });
    } else {
      await complete({ choreId: chore._id, userId });
    }
  };

  return (
    <motion.button
      onClick={toggle}
      whileTap={{ scale: 0.97 }}
      className={`w-full rounded-2xl p-4 flex items-center gap-3 transition-all shadow-sm ${
        completed
          ? "bg-green-50 border-2 border-green-400"
          : "bg-white border-2 border-transparent hover:border-violet-200"
      }`}
    >
      <motion.div
        initial={false}
        animate={{ scale: completed ? [1, 1.3, 1] : 1 }}
        transition={{ duration: 0.3 }}
      >
        {completed ? (
          <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
        ) : (
          <Circle className="w-6 h-6 text-gray-300 flex-shrink-0" />
        )}
      </motion.div>
      <div className="flex items-center gap-2 flex-1 text-left">
        {chore.icon && <span className="text-2xl">{chore.icon}</span>}
        <div>
          <p
            className={`font-medium ${completed ? "line-through text-gray-400" : "text-gray-800"}`}
          >
            {chore.title}
          </p>
          {chore.description && (
            <p className="text-xs text-gray-400">{chore.description}</p>
          )}
        </div>
      </div>
      {completed && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-green-500 text-sm font-medium"
        >
          Done! ✓
        </motion.span>
      )}
    </motion.button>
  );
}
