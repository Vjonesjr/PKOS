import React, { useRef } from "react";
import { Upload, Loader2, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadTemplate } from "@/lib/planImport";

export default function ImportDropzone({ onFile, busy }) {
  const ref = useRef(null);
  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={busy}
        onClick={() => ref.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); e.dataTransfer.files[0] && onFile(e.dataTransfer.files[0]); }}
        className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-primary/40 bg-card/40 px-4 py-10 text-center transition-colors hover:bg-primary/5 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Upload className="h-6 w-6 text-primary" />}
        <span className="text-sm font-medium text-foreground">{busy ? "Reading your file..." : "Choose or drop a file"}</span>
        <span className="text-xs text-muted-foreground">CSV, JSON or TXT, up to 10 MB</span>
      </button>
      <input ref={ref} type="file" accept=".csv,.json,.txt" className="hidden" onChange={(e) => { e.target.files[0] && onFile(e.target.files[0]); e.target.value = ""; }} />
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Templates:</span>
        <Button size="sm" variant="outline" onClick={() => downloadTemplate("csv")}><FileDown className="mr-1 h-3.5 w-3.5" /> CSV</Button>
        <Button size="sm" variant="outline" onClick={() => downloadTemplate("json")}><FileDown className="mr-1 h-3.5 w-3.5" /> JSON</Button>
      </div>
      <p className="text-xs text-muted-foreground">Template files can include goals, projects, tasks, repeating tasks, knowledge, decisions and lessons. Plain text is read by AI and always reviewed before saving.</p>
    </div>
  );
}
