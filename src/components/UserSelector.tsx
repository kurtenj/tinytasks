"use client";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { Crown, Star, Plus } from "lucide-react";

const KID_AVATARS = ["🐶", "🐱", "🐰", "🦊", "🐸", "🦁", "🐼", "🐨"];
const ADMIN_AVATAR = "👑";

interface UserSelectorProps {
  users: Doc<"users">[];
  onSelectUser: (id: Id<"users">, role: "admin" | "kid") => void;
}

export function UserSelector({ users, onSelectUser }: UserSelectorProps) {
  const createUser = useMutation(api.users.create);

  const kids = users.filter((u) => u.role === "kid");
  const admins = users.filter((u) => u.role === "admin");

  const handleCreateSampleData = async () => {
    // Create admin if none
    if (admins.length === 0) {
      await createUser({ name: "Parent", role: "admin", avatar: ADMIN_AVATAR });
    }
    // Create kids if none
    if (kids.length === 0) {
      await createUser({
        name: "Alex",
        role: "kid",
        avatar: KID_AVATARS[0],
      });
      await createUser({
        name: "Jordan",
        role: "kid",
        avatar: KID_AVATARS[1],
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-600 to-purple-800 flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="text-7xl mb-4">⭐</div>
        <h1 className="text-4xl font-bold text-white">Tiny Tasks</h1>
        <p className="text-purple-200 mt-2">Who&apos;s ready to earn today?</p>
      </motion.div>

      {users.length === 0 ? (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 text-center max-w-sm">
            <p className="text-gray-600 mb-4">Welcome! Let&apos;s get started.</p>
            <Button
              onClick={handleCreateSampleData}
              className="bg-violet-600 hover:bg-violet-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Set Up Family
            </Button>
          </Card>
        </motion.div>
      ) : (
        <div className="w-full max-w-md space-y-6">
          {kids.length > 0 && (
            <div>
              <h2 className="text-white/70 text-sm font-medium uppercase tracking-wide mb-3 text-center">
                Kids
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {kids.map((user, i) => (
                  <motion.div
                    key={user._id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 + 0.2 }}
                  >
                    <button
                      onClick={() => onSelectUser(user._id, "kid")}
                      className="w-full bg-white rounded-2xl p-5 flex flex-col items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-transform"
                    >
                      <span className="text-5xl">
                        {user.avatar ??
                          KID_AVATARS[i % KID_AVATARS.length]}
                      </span>
                      <span className="font-semibold text-gray-800">
                        {user.name}
                      </span>
                      <div className="flex items-center gap-1 text-yellow-500 text-sm">
                        <Star className="w-3 h-3 fill-yellow-500" />
                        <span>{user.points} pts</span>
                      </div>
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {admins.length > 0 && (
            <div>
              <h2 className="text-white/70 text-sm font-medium uppercase tracking-wide mb-3 text-center">
                Parents
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {admins.map((user, i) => (
                  <motion.div
                    key={user._id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 + 0.4 }}
                  >
                    <button
                      onClick={() => onSelectUser(user._id, "admin")}
                      className="w-full bg-white/20 rounded-2xl p-5 flex flex-col items-center gap-2 hover:bg-white/30 active:bg-white/40 transition-colors border border-white/30"
                    >
                      <Crown className="w-8 h-8 text-yellow-300" />
                      <span className="font-semibold text-white">
                        {user.name}
                      </span>
                      <span className="text-white/60 text-xs">Admin</span>
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
