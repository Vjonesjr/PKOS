import React from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useWorkspace } from "@/lib/WorkspaceContext";

export default function DemoBanner() {
  const { isSeeding } = useWorkspace();

  if (isSeeding) {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-medium text-amber-300">
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
        Setting up your demo data...
      </div>
    );
  }

  return (
    <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-medium text-amber-300">
      <Sparkles className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1">Demo Workspace: sample data for exploring Smart PKOS. Your personal data is untouched.</span>
      <Link to="/guide" className="shrink-0 underline">Guide</Link>
    </div>
  );
}