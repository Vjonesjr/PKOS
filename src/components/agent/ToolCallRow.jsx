import React from "react";
import { Loader2, Check, AlertCircle } from "lucide-react";

// Compact status line for an agent tool call (e.g. reading tasks).
export default function ToolCallRow({ toolCall }) {
  const p = toolCall.display_projection;
  const running = ["pending", "running", "in_progress"].includes(toolCall.status);
  const failed = ["failed", "error"].includes(toolCall.status);
  const label = running ? p?.active_label : failed ? p?.error_label : p?.label;
  const name = label || (toolCall.name || "tool").replace(/[_.]/g, " ");
  const Icon = running ? Loader2 : failed ? AlertCircle : Check;
  return (
    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className={`h-3 w-3 ${running ? "animate-spin" : ""} ${failed ? "text-destructive" : ""}`} />
      <span className="capitalize">{name}</span>
    </div>
  );
}