import React from "react";
import { FileText, Image as ImageIcon, Loader2, AlertCircle } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";

export default function DocumentList({ docs, selectedId, onSelect }) {
  if (!docs.length) return <EmptyState icon={FileText} title="No documents yet" description="Upload a PDF, text file, or screenshot to get started." />;
  return (
    <div className="space-y-1.5">
      {docs.map((d) => {
        const Icon = d.mime_type?.startsWith("image/") ? ImageIcon : FileText;
        return (
          <button key={d.id} onClick={() => onSelect(d.id)}
            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${selectedId === d.id ? "border-primary/60 bg-primary/5" : "border-border bg-card/40 hover:bg-secondary/60"}`}>
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{d.title || d.file_name}</p>
              <p className="truncate text-xs text-muted-foreground">{d.file_name}</p>
            </div>
            {(d.status === "processing" || d.status === "uploaded") && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            {d.status === "failed" && <AlertCircle className="h-4 w-4 text-destructive" />}
          </button>
        );
      })}
    </div>
  );
}