"use client";
import { useState, useEffect } from "react";

function getChoreDeadline(scheduleType: "floating" | "repeating"): Date {
  const now = new Date();
  const deadline = new Date(now);
  deadline.setHours(23, 59, 59, 999);
  if (scheduleType === "floating") {
    const dow = now.getDay(); // 0=Sun … 5=Fri … 6=Sat
    const daysUntilFriday = dow <= 5 ? 5 - dow : 6;
    deadline.setDate(now.getDate() + daysUntilFriday);
  }
  return deadline;
}

function computeChoreCountdown(scheduleType: "floating" | "repeating"): string {
  const msLeft = getChoreDeadline(scheduleType).getTime() - Date.now();
  if (msLeft <= 0) return "due now";
  const totalMins = Math.floor(msLeft / 60000);
  const hours = Math.floor(totalMins / 60);
  const days = Math.floor(hours / 24);
  if (days >= 1) return `${days}d left`;
  if (hours >= 1) return `${hours}h left`;
  return `${totalMins}m left`;
}

export function getToday(): string {
  return new Date().toLocaleDateString("en-CA");
}

function formatClock(): string {
  const now = new Date();
  const day = now.toLocaleDateString("en-US", { weekday: "long" });
  const time = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${day}, ${time}`;
}

export function useChoreCountdown(scheduleType: "floating" | "repeating"): string {
  const [label, setLabel] = useState(() => computeChoreCountdown(scheduleType));
  useEffect(() => {
    const id = setInterval(() => setLabel(computeChoreCountdown(scheduleType)), 60000);
    return () => clearInterval(id);
  }, [scheduleType]);
  return label;
}

export function useLiveClock(): string {
  const [label, setLabel] = useState(() => formatClock());
  useEffect(() => {
    const id = setInterval(() => setLabel(formatClock()), 10000);
    return () => clearInterval(id);
  }, []);
  return label;
}
