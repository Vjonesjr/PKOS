import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { getRoute } from "@/lib/searchConfig";

const entities = { knowledge: "Knowledge", task: "Task", decision: "Decision", lesson: "Lesson", project: "Project", learning: "LearningItem" };
export default function ConversationDistiller({ workspace, onSaved }) {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("Imported conversation");
  const [items, setItems] = useState(null);
  const [source, setSource] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState({});
  const lock = useRef(false);
  const sourceRef = useRef(null);
  const alive = useRef(true);
  React.useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const importFile = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (!/\.(txt|md)$/i.test(file.name) || file.size > 120000) throw new Error("Choose a .txt or .md file under 120 KB.");
      const value = await file.text();
      if (value.length > 30000) throw new Error("Split this conversation into sections under 30,000 characters.");
      setText(value); setTitle(file.name); setError("");
    } catch (e) { setError(e.message); }
    e.target.value = "";
  };
  const analyze = async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try {
      const res = await base44.functions.invoke("pkosIntelligence", { action: "distill", text, workspace });
      if (res.data?.error) throw new Error(res.data.error);
      if (!Array.isArray(res.data?.items)) throw new Error("No valid proposals returned.");
      if (!alive.current) return;
      setSource({ text, title }); sourceRef.current = null;
      setItems(res.data.items); setSaved({});
    } catch (e) { if (alive.current) setError(e.message || "Analysis failed."); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  };
  const edit = (i, field, value) => setItems(prev => prev.map((x, n) => n === i ? { ...x, [field]: value } : x));
  const save = async (item, i) => {
    if (lock.current || saved[i] || !item.title.trim() || !item.content.trim()) return;
    lock.current = true; setBusy(true); setError("");
    try {
      if (!sourceRef.current) {
        sourceRef.current = await base44.entities.Capture.create({ title: source.title, content: source.text, type: "reference", status: "inbox", workspace, tags: ["conversation-source"] });
      }
      const content = item.content.trim() + "\n\nSource conversation: " + source.title + "\nSource capture ID: " + sourceRef.current.id + "\nEvidence: " + item.evidence;
      const fields = item.type === "task" ? { description: content, source_capture_id: sourceRef.current.id, status: "todo" } :
        item.type === "decision" ? { decision: item.content.trim(), context: content, status: "pending" } :
        item.type === "lesson" ? { learned: content } :
        item.type === "project" ? { description: content, status: "Idea" } : { content };
      const rec = await base44.entities[entities[item.type]].create({ title: item.title.trim(), ...fields, workspace });
      if (alive.current) setSaved(prev => ({ ...prev, [i]: rec }));
      // The record is already saved; a link failure must never trigger another creation.
      try {
        await base44.entities.Link.create({ source_type: item.type, source_id: rec.id, target_type: "capture", target_id: sourceRef.current.id, label: "Distilled from conversation", workspace });
      } catch { if (alive.current) setError("Item saved, but its source link failed. The source capture ID is preserved in the item."); }
      if (alive.current) onSaved?.();
    } catch (e) { if (alive.current) setError(e.message || "Save failed. Please retry."); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  };
  return <details className="rounded-2xl border border-primary/20 bg-card/60 p-4">
    <summary className="cursor-pointer font-semibold text-sm">Conversation Distiller</summary>
    <div className="mt-4 space-y-3">
      <p className="text-xs text-muted-foreground">Paste a conversation or import .txt/.md. AI proposes reusable items; you edit and approve each one. Approving an item also saves the original conversation and links it as evidence.</p>
      {!items ? <>
        <label className="block text-sm">Source title<input className="block mt-1 w-full rounded-lg border border-border bg-secondary p-2" maxLength={160} value={title} onChange={e => setTitle(e.target.value)} disabled={busy} /></label>
        <label className="block text-sm">Conversation<textarea className="block mt-1 w-full min-h-40 rounded-lg border border-border bg-secondary p-3" maxLength={30000} value={text} onChange={e => setText(e.target.value)} disabled={busy} /></label>
        <label className="block text-xs">Import text file<input type="file" accept=".txt,.md,text/plain,text/markdown" onChange={importFile} disabled={busy} className="block mt-1" /></label>
        <p className="text-xs text-muted-foreground">{text.length.toLocaleString()} / 30,000 characters. Analyze uses AI credits; nothing is saved yet.</p>
        <Button disabled={busy || text.trim().length < 20 || !title.trim()} onClick={analyze}>{busy ? "Analyzing…" : "Analyze conversation"}</Button>
      </> : <>
        <p className="text-sm">{items.length} proposals. Read the source quote before approving.</p>
        {items.length === 0 && <p className="text-sm">No supported reusable items found. Try a different section.</p>}
        {items.map((item, i) => <article key={i} className="rounded-xl border border-border p-3 space-y-2">
          <p className="text-xs uppercase text-primary">{item.type}</p>
          <label className="block text-xs">Title<input aria-label={"Proposal " + (i+1) + " title"} className="block w-full rounded border border-border bg-secondary p-2 text-sm" value={item.title} onChange={e => edit(i,"title",e.target.value)} disabled={busy || Boolean(saved[i])} /></label>
          <label className="block text-xs">Content<textarea aria-label={"Proposal " + (i+1) + " content"} className="block min-h-24 w-full rounded border border-border bg-secondary p-2 text-sm" value={item.content} onChange={e => edit(i,"content",e.target.value)} disabled={busy || Boolean(saved[i])} /></label>
          <blockquote className="border-l-2 border-primary/40 pl-3 text-xs text-muted-foreground whitespace-pre-wrap">{item.evidence}</blockquote>
          {saved[i] ? <Link className="text-sm text-primary underline" to={getRoute(item.type,saved[i])}>Saved — open record</Link> :
            <Button size="sm" disabled={busy || !item.title.trim() || !item.content.trim()} onClick={() => save(item,i)}>Approve and save {item.type}</Button>}
        </article>)}
        <Button variant="outline" disabled={busy} onClick={() => { setItems(null); setSource(null); sourceRef.current = null; setError(""); }}>Start another conversation</Button>
      </>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  </details>;
}
