import React from "react";
import { Moon, Zap, Clock } from "lucide-react";
import { TRIGGERS, MODES } from "@/lib/automation/catalog";

const ICONS = { create: Zap, update: Zap, scan: Clock, nightly: Moon };

// Shows whether a recipe runs immediately, while the app is open, or in the nightly server check.
export default function ModeBadge({ trigger }) {
  const event = TRIGGERS[trigger]?.event;
  if (!event) return null;
  const Icon = ICONS[event];
  const cls = event === "nightly" ? "bg-accent/15 text-accent" : "bg-primary/15 text-primary";
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${cls}`}><Icon className="h-3 w-3" /> {MODES[event]}</span>;
}