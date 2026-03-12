"use client";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { KidDashboard } from "@/components/KidDashboard";
import { AdminDashboard } from "@/components/AdminDashboard";
import { UserSelector } from "@/components/UserSelector";
import type { Id } from "../../convex/_generated/dataModel";

export default function Home() {
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(
    null
  );
  const [isAdmin, setIsAdmin] = useState(false);

  const users = useQuery(api.users.list);

  if (!selectedUserId) {
    return (
      <UserSelector
        users={users ?? []}
        onSelectUser={(id, role) => {
          setSelectedUserId(id);
          setIsAdmin(role === "admin");
        }}
      />
    );
  }

  if (isAdmin) {
    return (
      <AdminDashboard
        userId={selectedUserId}
        onSwitchUser={() => setSelectedUserId(null)}
      />
    );
  }

  return (
    <KidDashboard
      userId={selectedUserId}
      onSwitchUser={() => setSelectedUserId(null)}
    />
  );
}
