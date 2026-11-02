import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { PLAN_EXTS, PLAN_MAX_BYTES, parseTemplate, finalizePlan, fromDetected, totalPlanRecords } from "@/lib/planImport";
import { applyPlan, findExisting } from "@/lib/planImportApply";
import ImportDropzone from "@/components/import/ImportDropzone";
import ImportReview from "@/components/import/ImportReview";
import ImportResult from "@/components/import/ImportResult";

export default function ImportPlans() {
  const { workspace, isDemo } = useWorkspace();
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
      if (!totalPlanRecords(next)) throw new Error("No supported Smart PKOS records were found in this file.");
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
        <h1 className="text-2xl font-bold tracking-tight pk-grad-text">Import plans</h1>
        <p className="mt-1 text-sm text-muted-foreground">Bring in goals, projects, tasks, repeating tasks, knowledge, decisions and lessons. Nothing is saved until you confirm.</p>
      </div>
      {error && <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {stage === "pick" && <>{isDemo && <div className="rounded-xl border border-primary/25 pk-glass p-4 space-y-3"><p className="text-sm font-medium">Try a sample plan</p><p className="text-xs text-muted-foreground">Preview a goal, project, milestones and subtasks. Review the destinations and duplicates before saving.</p><button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" disabled={busy} onClick={() => handleFile(new File([JSON.stringify({goals:[{title:"Demo: Plan a neighborhood workshop",area:"Other",why:"Share useful skills with neighbors.",projects:[{title:"Demo: Organize the first workshop",status:"Planned",milestones:[{title:"Choose the topic"},{title:"Confirm the space"}],tasks:[{title:"Choose one useful workshop topic",subtasks:[{title:"List three practical ideas"},{title:"Ask neighbors what they need"}]},{title:"Check space and materials"}]}]}]})],"demo-workshop-plan.json",{type:"application/json"}))}>Preview sample import</button></div>}<ImportDropzone onFile={handleFile} busy={busy} /></>}
      {stage === "review" && <ImportReview plan={plan} setPlan={setPlan} existing={existing} existingGoals={existingGoals} onConfirm={confirm} onCancel={reset} saving={busy} />}
      {stage === "done" && <ImportResult result={result} onReset={reset} />}
    </div>
  );
}
