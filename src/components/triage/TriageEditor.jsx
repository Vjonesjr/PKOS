import React, { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TRIAGE_ACTIONS } from "@/lib/triageApply";

export default function TriageEditor({ capture, suggestion, projects, onSave, onCancel }) {
  const [s, setS] = useState(suggestion);
  const [tagText, setTagText] = useState((suggestion.tags || []).join(", "));
  const set = (k, v) => setS((prev) => ({ ...prev, [k]: v }));

  const save = () => onSave({ ...s, tags: tagText.split(",").map((t) => t.trim()).filter(Boolean) });

  return (
    <div className="space-y-3 rounded-xl border border-primary/30 bg-secondary/30 p-4">
      <div>
        <p className="mb-1 text-xs text-muted-foreground">Action</p>
        <Select value={s.action} onValueChange={(v) => set("action", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(TRIAGE_ACTIONS).map(([k, label]) => <SelectItem key={k} value={k}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="mb-1 text-xs text-muted-foreground">Title</p>
        <Input value={s.title || ""} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div>
        <p className="mb-1 text-xs text-muted-foreground">Tags (comma separated)</p>
        <Input value={tagText} onChange={(e) => setTagText(e.target.value)} />
      </div>
      <div>
        <p className="mb-1 text-xs text-muted-foreground">Project {capture.project_id && "(already assigned — won't change)"}</p>
        <Select value={s.project_id || "none"} onValueChange={(v) => set("project_id", v === "none" ? "" : v)} disabled={!!capture.project_id}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No project</SelectItem>
            {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="mb-1 text-xs text-muted-foreground">Follow-up task (optional)</p>
        <Input value={s.task_title || ""} onChange={(e) => set("task_title", e.target.value)} />
      </div>
      {s.related?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {s.related.map((r) => (
            <span key={r.id} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs text-foreground/80">
              {r.title}
              <button aria-label={`Remove link to ${r.title}`} onClick={() => set("related", s.related.filter((x) => x.id !== r.id))}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={save}>Save changes</Button>
      </div>
    </div>
  );
}