import React from "react";
import { Sparkles } from "lucide-react";

export default function DemoBanner() {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-medium text-amber-300">
      <Sparkles className="h-3.5 w-3.5 shrink-0" />
      Demo Workspace — sample data for exploring Smart PKOS. Your personal data is untouched.
    </div>
  );
}