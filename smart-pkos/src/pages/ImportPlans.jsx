import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { PLAN_EXTS, PLAN_MAX_BYTES, parseTemplate, finalizePlan, fromDetected } from "@/lib/planImport";
import { applyPlan, findExisting } from "@/lib/planImportApply";
import ImportDropzone from "@/components/import/ImportDropzone";
import ImportReview from "@/components/import/ImportReview";
import ImportResult from "@/components/import/ImportResult";

export default function ImportPlans() {
  const { workspace } = useWorkspace();
  const qc = useQueryClient();
  const [stage, setStage] = useState("pick"); // pick | review | done
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState(null);
  const [existing, setExisting] = useState(null);
  const [existingGoals, setExistingGoals] = useState([]);
  const [result, setResult] = useState(null);

  const handleFile = async (file) => {
    setError("");
    const ext = file.name.split(".").pop().toLowerCase();
    if (!PLAN_EXTS.includes(ext)) return setError("Only CSV, JSON or TXT files are supported.");
    if (file.size > PLAN_MAX_BYTES) return setError(`File is larger than ${Math.round(PLAN_MAX_BYTES / (1024 * 1024))} MB.`);
    setBusy(true);
    try {
      const text = await file.text();
      const parsed = parseTemplate(ext, text);
      let raw = parsed.plan;
      if (!raw) {
        const AI_IMPORT_LIMIT = 120000;
        const aiText = parsed.raw.length > AI_IMPORT_LIMIT ? parsed.raw.slice(0, AI_IMPORT_LIMIT) : parsed.raw;
        const { data } = await base44.functions.invoke("aiAssist", { action: "parse_plan_import", workspace, text: aiText });
        if (data.error) throw new Error(data.error);
        raw = fromDetected(data);
        if (parsed.raw.length > AI_IMPORT_LIMIT || data.truncated) raw.warnings.push("This file was long, so the smart scan used the first 120,000 characters. Use CSV or JSON structure for a complete import.");
      }
      const next = finalizePlan(raw);
      if (!next.goals.length && !next.projects.length) throw new Error("No goals or projects were found in this file.");
      const [ex, goals] = await Promise.all([findExisting(workspace, next), base44.entities.Goal.filter({ workspace, status: { $in: ["Active", "Draft", "Paused"] } }, { sort: "title", limit: 100, fields: ["title"] })]);
      setExisting(ex); setExistingGoals(goals.items); setPlan(next); setStage("review");
    } catch (e) {
      setError(e.message || "Could not read this file.");
    }
    setBusy(false);
  };

  const confirm = async () => {
    setBusy(true);
    try {
      const r = await applyPlan(workspace, plan);
      qc.invalidateQueries(); setResult(r); setStage("done");
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  const reset = () => { setStage("pick"); setPlan(null); setResult(null); setError(""); };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Import plans</h1>
        <p className="mt-1 text-sm text-muted-foreground">Bring in goals, projects and milestones from a file. Nothing is saved until you confirm.</p>
      </div>
      {error && <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {stage === "pick" && <ImportDropzone onFile={handleFile} busy={busy} />}
      {stage === "review" && <ImportReview plan={plan} setPlan={setPlan} existing={existing} existingGoals={existingGoals} onConfirm={confirm} onCancel={reset} saving={busy} />}
      {stage === "done" && <ImportResult result={result} onReset={reset} />}
    </div>
  );
}

---DROPZONE---
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
      <p className="text-xs text-muted-foreground">Files that don't match a template, including plain-text notes, are read by AI. You review everything before it's saved.</p>
    </div>
  );
}

