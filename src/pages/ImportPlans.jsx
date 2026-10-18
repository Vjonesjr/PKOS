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
    if (file.size > PLAN_MAX_BYTES) return setError("File is larger than 1 MB.");
    setBusy(true);
    try {
      const text = await file.text();
      const parsed = parseTemplate(ext, text);
      let raw = parsed.plan;
      if (!raw) {
        const { data } = await base44.functions.invoke("aiAssist", { action: "parse_plan_import", workspace, text: parsed.raw });
        if (data.error) throw new Error(data.error);
        raw = fromDetected(data);
        if (data.truncated) raw.warnings.push("The file was long; only the first part was read.");
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