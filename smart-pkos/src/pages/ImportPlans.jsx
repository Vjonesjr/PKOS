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
  const [progress, setProgress] = useState("");

  const handleFile = async (file) => {
    setError(""); setProgress("");
    const ext = file.name.split(".").pop().toLowerCase();
    if (!PLAN_EXTS.includes(ext)) return setError("Only CSV, JSON or TXT files are supported.");
    if (file.size > PLAN_MAX_BYTES) return setError("File is larger than 1 MB.");
    setBusy(true);
    try {
      const text = await file.text();
      const parsed = parseTemplate(ext, text);
      let raw = parsed.plan;
      if (!raw) {
        // Review the entire unstructured file, never quietly submit only the beginning.
        const chunks = [];
        const source = parsed.raw;
        const size = 9500;
        for (let offset = 0; offset < source.length;) {
          let end = Math.min(source.length, offset + size);
          if (end < source.length) {
            const boundary = source.lastIndexOf("\n", end);
            if (boundary > offset + size / 2) end = boundary + 1;
          }
          chunks.push(source.slice(offset, end));
          offset = end;
        }
        if (chunks.length > 120) throw new Error("Unstructured file needs more than 120 AI sections. Split the file or use the CSV/JSON template. No partial import was saved.");
        const responses = [];
        for (let i = 0; i < chunks.length; i++) {
          setProgress(`Scanning section ${i + 1} of ${chunks.length}… Nothing saved yet.`);
          const { data } = await base44.functions.invoke("aiAssist", { action: "parse_plan_import", workspace, text: chunks[i] });
          if (data.error || data.truncated) throw new Error(data.error || `Section ${i + 1} was truncated. No records saved.`);
          responses.push(data);
        }
        const merged = { goals: [], projects: [] };
        const goalIndex = new Map(), projectIndex = new Map();
        const norm = (title) => String(title || "").trim().toLowerCase().replace(/\s+/g, " ");
        const mergeMilestones = (target, item) => {
          const seen = new Set((target.milestones || []).map((m) => norm(m.title)));
          for (const milestone of (item.milestones || [])) {
            const k = norm(milestone.title);
            if (k && !seen.has(k)) { target.milestones.push(milestone); seen.add(k); }
          }
        };
        for (const response of responses) {
          for (const goal of response.goals || []) {
            const k = norm(goal.title); if (!k) continue;
            if (!goalIndex.has(k)) { const copy = { ...goal, milestones: [...(goal.milestones || [])] }; goalIndex.set(k, copy); merged.goals.push(copy); }
            else mergeMilestones(goalIndex.get(k), goal);
          }
          for (const project of response.projects || []) {
            const k = norm(project.title); if (!k) continue;
            if (!projectIndex.has(k)) { const copy = { ...project, milestones: [...(project.milestones || [])], tasks: [...(project.tasks || [])] }; projectIndex.set(k, copy); merged.projects.push(copy); }
            else {
              const entry = projectIndex.get(k); mergeMilestones(entry, project);
              const seen = new Set(entry.tasks.map((t) => norm(t.title)));
              for (const task of (project.tasks || [])) { const tk = norm(task.title); if (tk && !seen.has(tk)) { entry.tasks.push(task); seen.add(tk); } }
              if (!entry.goal_title && project.goal_title) entry.goal_title = project.goal_title;
            }
          }
        }
        raw = fromDetected(merged);
        raw.warnings.push(`Scanned all ${chunks.length} sections. Review records crossing section boundaries before approving.`);
      }
      const next = finalizePlan(raw);
      if (!next.goals.length && !next.projects.length) throw new Error("No goals or projects were found in this file.");
      const [ex, goals] = await Promise.all([findExisting(workspace, next), base44.entities.Goal.filter({ workspace, status: { $in: ["Active", "Draft", "Paused"] } }, { sort: "title", limit: 100, fields: ["title"] })]);
      setExisting(ex); setExistingGoals(goals.items); setPlan(next); setStage("review"); setProgress("");
    } catch (e) {
      setProgress(""); setError(e.message || "Could not read this file.");
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
      {progress && <p role="status" className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-foreground">{progress}</p>}
      {error && <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {stage === "pick" && <ImportDropzone onFile={handleFile} busy={busy} />}
      {stage === "review" && <ImportReview plan={plan} setPlan={setPlan} existing={existing} existingGoals={existingGoals} onConfirm={confirm} onCancel={reset} saving={busy} />}
      {stage === "done" && <ImportResult result={result} onReset={reset} />}
    </div>
  );
}