import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Loader2, Wand2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { Checkbox } from "@/components/ui/checkbox";
import { readCommands, applyParsed, PARSE_HANDOFF_KEY } from "@/lib/parseApply";
import ParsedGroup from "@/components/parse/ParsedGroup";
import ParseSummary from "@/components/parse/ParseSummary";
import ParseToolbar from "@/components/parse/ParseToolbar";
import FocusTimer from "@/components/parse/FocusTimer";

// Text handed off from another screen (Capture, Knowledge, Documents), read once.
const takeHandoff = () => { const t = sessionStorage.getItem(PARSE_HANDOFF_KEY) || ""; sessionStorage.removeItem(PARSE_HANDOFF_KEY); return t; };

const MAX = 1500;

export default function QuickParse() {
  const { workspace } = useWorkspace();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [raw, setRaw] = useState(takeHandoff);
  const [view, setView] = useState({ large: false, contrast: false });
  const [syncCalendar, setSyncCalendar] = useState(false);
  const [items, setItems] = useState(null);
  const [opts, setOpts] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const today = format(new Date(), "yyyy-MM-dd");

  const parse = async () => {
    const { text, opts: o } = readCommands(raw);
    if (!text) return;
    setBusy(true); setError("");
    try {
      const res = await base44.functions.invoke("aiAssist", { action: "parse_dump", text, today, workspace });
      setItems(res.data.items.map((i) => ({ ...i, include: true })));
      setOpts(o);
    } catch (e) {
      setError(e?.response?.data?.error || "Couldn't parse that. Try again.");
    }
    setBusy(false);
  };

  const accept = async () => {
    setBusy(true);
    const r = await applyParsed(items.filter((i) => i.include && i.title.trim()), workspace, { ...opts, syncCalendar });
    setBusy(false);
    toast({ title: `Saved ${r.tasks} task(s)`, description: r.projects ? `${r.projects} new project(s) created.` : undefined });
    navigate("/today");
  };

  // Group by project name, keeping each item's original index for edits.
  const groups = {};
  (items || []).forEach((item, index) => (groups[item.group] ||= []).push({ item, index }));
  const update = (index, v) => setItems(items.map((it, k) => (k === index ? v : it)));
  const selected = (items || []).filter((i) => i.include).length;

  return (
    <div className={`mx-auto max-w-2xl space-y-4 p-4 ${view.large ? "text-lg [&_input]:text-base [&_li]:text-base" : ""} ${view.contrast ? "contrast-125 [&_.text-muted-foreground]:text-foreground" : ""}`}>
      <div>
        <h1 className="text-xl font-semibold text-foreground">Quick Parse</h1>
        <p className="text-sm text-muted-foreground">Paste a brain dump. AI sorts it into projects, todos and tiny next actions. Nothing saves until you accept.</p>
      </div>
      <Textarea rows={6} value={raw} maxLength={MAX} onChange={(e) => setRaw(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) parse(); }}
        placeholder="Laundry: wash whites, fold; Doctor 4/22 @10am; Email boss about report (done); Buy stamps; Call Mom tomorrow 30m" aria-label="Text to parse" />
      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>{raw.length}/{MAX} · Ctrl+Enter · /defer 2d · /focus 25 · /sprint 10m</span>
        <Button onClick={parse} disabled={busy || !readCommands(raw).text} className="gap-1.5">
          {busy && !items ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Parse
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {items && (items.length === 0 ? <p className="text-sm text-muted-foreground">No tasks found in that text.</p> : (
        <>
          <ParseToolbar items={items} view={view} setView={setView} />
          <ParseSummary items={items} today={today} />
          {opts.focusMinutes > 0 && <FocusTimer minutes={opts.focusMinutes} label={items.find((i) => i.include && !i.done && i.next_action)?.next_action} />}
          {Object.entries(groups).map(([name, entries]) => (
            <ParsedGroup key={name} name={name} isExisting={!!entries[0].item.project_id} entries={entries} onChange={update} />
          ))}
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Checkbox checked={syncCalendar} onCheckedChange={(v) => setSyncCalendar(!!v)} /> Also sync dated tasks to Google Calendar
          </label>
          <div className="sticky bottom-2 flex gap-2 rounded-xl border border-border bg-background/95 p-2 backdrop-blur">
            <Button variant="ghost" className="flex-1" onClick={() => setItems(null)} disabled={busy}>Discard</Button>
            <Button className="flex-1 gap-1.5" onClick={accept} disabled={busy || !selected}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Accept {selected}
            </Button>
          </div>
        </>
      ))}
    </div>
  );
}