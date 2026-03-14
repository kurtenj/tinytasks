"use client";
import { useState, useEffect } from "react";

export function getToday(): string {
  return new Date().toLocaleDateString("en-CA");
}

export function formatClock(): string {
  const now = new Date();
  const day = now.toLocaleDateString("en-US", { weekday: "long" });
  const time = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${day}, ${time}`;
}

export function useLiveClock(): string {
  const [label, setLabel] = useState(() => formatClock());
  useEffect(() => {
    const id = setInterval(() => setLabel(formatClock()), 10000);
    return () => clearInterval(id);
  }, []);
  return label;
}
