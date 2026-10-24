import React, { useState } from "react";
import { Sparkles, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const LEVELS = [
  { value: "basic", label: "1 — Basic", description: "3–5 main steps" },
  { value: "detailed", label: "2 — Detailed", description: "6–10 concrete actions" },
  { value: "step_by_step", label: "3 — Step-by-step", description: "Small actions when useful, up to 20" },
];
const normalize = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");

/** Reusable AI suggestions only: generation never creates/edits records until Accept. */
export default function StepGenerator({ action, workspace, parentId, existingTitles = [], onAccept, label = "Generate with AI" }) {
  const [level, setLevel] = useState("detailed");
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const generate = async () => {
    setError(""); setNotice(""); setLoading(true);
    try {
      const response = await base44.functions.invoke("aiAssist", { action, workspace, parentId, level });
      if (response.data?.error) throw new Error(response.data.error);
      const original = new Set(existingTitles.map(normalize));
      const seen = new Set();
      const proposals = (response.data?.steps || [])
        .filter((title) => {
          const key = normalize(title);
          if (!key || seen.has(key) || original.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map((title) => ({ title: String(title).trim(), selected: true }));
      setItems(proposals);
      if (!proposals.length) setNotice("No new steps found. You can still add steps manually.");
    } catch (e) {
      setError(e.message || "Could not generate steps. Manual entry is still available.");
    } finally { setLoading(false); }
  };

  const edit = (index, patch) => setItems((items) => items.map((item, i) => i === index ? { ...item, ...patch } : item));
  const move = (index, direction) => setItems((items) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return items;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });

  const accept = async () => {
    const existing = new Set(existingTitles.map(normalize));
    const seen = new Set();
    const titles = (items || []).filter((item) => item.selected).map((item) => item.title.trim()).filter((title) => {
      const key = normalize(title);
      if (!key || seen.has(key) || existing.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (!titles.length) return setError("Select at least one new step to save.");
    setSaving(true); setError("");
    try {
      await onAccept(titles);
      setItems(null);
      setNotice(`Saved ${titles.length} new step${titles.length === 1 ? "" : "s"}.`);
    } catch (e) {
      setError(e.message || "Couldn't save all steps. Review the existing steps before retrying.");
    } finally { setSaving(false); }
  };

  return (
    <section className="space-y-3 rounded-xl border border-primary/25 bg-card/40 p-4" aria-label="AI step generator">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">Suggestions only — never saved automatically</p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="group" aria-label="Choose step detail level">
        {LEVELS.map((entry) => (
          <button key={entry.value} type="button" aria-pressed={level === entry.value} onClick={() => setLevel(entry.value)}
            className={`min-h-14 rounded-lg border p-2 text-left ${level === entry.value ? "border-primary bg-primary/10" : "border-border bg-secondary/40"}`}>
            <span className="block text-sm font-medium">{entry.label}</span>
            <span className="block text-xs text-muted-foreground">{entry.description}</span>
          </button>
        ))}
      </div>
      <Button type="button" variant="outline" onClick={generate} disabled={loading || saving || !parentId} className="w-full gap-2 sm:w-auto">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {loading ? "Generating..." : items ? "Regenerate preview" : "Suggest steps"}
      </Button>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
      {items && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Review and edit {items.length} suggestion{items.length === 1 ? "" : "s"} before saving
          </p>
          {items.map((item, index) => (
            <div key={index} className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-border bg-background/40 p-2">
              <Checkbox checked={item.selected} onCheckedChange={(selected) => edit(index, { selected: !!selected })} aria-label={`Include step ${index + 1}`} />
              <span className="w-5 shrink-0 text-xs text-muted-foreground">{index + 1}.</span>
              <Input value={item.title} onChange={(event) => edit(index, { title: event.target.value })} className="min-w-0 flex-1 basis-40" aria-label={`Step ${index + 1} title`} />
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move step up" className="flex h-11 w-11 items-center justify-center rounded-md border border-border disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
              <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label="Move step down" className="flex h-11 w-11 items-center justify-center rounded-md border border-border disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={accept} disabled={saving || loading} className="min-h-11">{saving ? "Saving..." : "Save selected steps"}</Button>
            <Button type="button" variant="ghost" onClick={() => { setItems(null); setError(""); }} disabled={saving} className="min-h-11">Discard preview</Button>
          </div>
        </div>
      )}
    </section>
  );
}