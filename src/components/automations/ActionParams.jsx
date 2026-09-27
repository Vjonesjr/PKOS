import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Extra inputs an action needs (tag, project, text, link target).
export default function ActionParams({ action, params, onChange, projects, targets }) {
  const set = (patch) => onChange({ ...params, ...patch });
  const needs = action?.params || [];
  return (
    <div className="space-y-2">
      {needs.includes("tag") && <Input value={params.tag || ""} onChange={(e) => set({ tag: e.target.value })} placeholder="Tag to add" />}
      {needs.includes("text") && <Input value={params.text || ""} onChange={(e) => set({ text: e.target.value })} placeholder="Text — use {title} for the record's title" />}
      {needs.includes("project") && (
        <Select value={params.project_id || ""} onValueChange={(v) => set({ project_id: v, target_label: projects.find((p) => p.id === v)?.title })}>
          <SelectTrigger><SelectValue placeholder="Choose project" /></SelectTrigger>
          <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
        </Select>
      )}
      {needs.includes("target") && (
        <Select value={params.target_id || ""} onValueChange={(v) => { const t = targets.find((x) => x.id === v); set({ target_id: v, target_type: t.type, target_label: t.title }); }}>
          <SelectTrigger><SelectValue placeholder="Choose learning or knowledge item" /></SelectTrigger>
          <SelectContent>{targets.map((t) => <SelectItem key={t.id} value={t.id}>{t.title} · {t.type === "learning" ? "Learning" : "Knowledge"}</SelectItem>)}</SelectContent>
        </Select>
      )}
    </div>
  );
}