import React, { useState } from "react";
import { ExternalLink, RefreshCw, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { createFromDocument } from "@/lib/documentRecords";
import SendToRow from "@/components/documents/SendToRow";

export default function DocumentDetail({ doc, projects, onChange, onDeleted }) {
  const [retrying, setRetrying] = useState(false);
  const [showText, setShowText] = useState(false);

  const open = async () => {
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: doc.file_uri });
    window.open(signed_url, "_blank", "noopener");
  };
  const retry = async () => {
    setRetrying(true);
    await base44.functions.invoke("processDocument", { document_id: doc.id }).catch(() => {});
    setRetrying(false);
    onChange();
  };
  const remove = async () => {
    if (!window.confirm(`Delete "${doc.title || doc.file_name}" from the library? Records already sent are kept.`)) return;
    await base44.entities.Document.delete(doc.id);
    onDeleted();
  };

  // Send a suggestion (index >= 0) or the whole document (index -1) to the chosen destination.
  const send = (index) => async ({ title, content, dest, project_id }) => {
    const rec = await createFromDocument(dest, { title, content, project_id, tags: doc.tags, workspace: doc.workspace });
    if (index >= 0) {
      const suggestions = doc.suggestions.map((s, i) => (i === index ? { ...s, sent_type: dest, sent_id: rec.id } : s));
      await base44.entities.Document.update(doc.id, { suggestions });
    }
    onChange();
  };

  const busy = doc.status === "processing" || doc.status === "uploaded";

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">{doc.title || doc.file_name}</h2>
          <p className="text-xs text-muted-foreground">{doc.file_name} · {Math.round((doc.size || 0) / 1024)} KB</p>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={open} aria-label="Open original" title="Open original"><ExternalLink className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" onClick={retry} disabled={retrying || busy} aria-label="Re-process" title="Re-process"><RefreshCw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} /></Button>
          <Button size="sm" variant="ghost" onClick={remove} aria-label="Delete document" title="Delete document"><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      </div>

      {busy && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Reading document...</p>}
      {doc.status === "failed" && <p className="text-sm text-destructive">Processing failed: {doc.error}. Try re-processing.</p>}

      {doc.status === "ready" && (
        <>
          {doc.summary && <p className="text-sm text-foreground/90">{doc.summary}</p>}
          {doc.tags?.length > 0 && <div className="flex flex-wrap gap-1">{doc.tags.map((t) => <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-xs">{t}</span>)}</div>}

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Suggested items</h3>
            <p className="text-xs text-muted-foreground">Edit each one and choose where it goes. Nothing is saved until you press Send.</p>
            {(doc.suggestions || []).map((s, i) => <SendToRow key={`${doc.id}-${i}`} item={s} projects={projects} onSend={send(i)} />)}
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Send the whole document</h3>
            <SendToRow key={`${doc.id}-all`} item={{ type: "knowledge", title: doc.title, content: doc.extracted_text }} projects={projects} onSend={send(-1)} />
          </section>

          <button className="text-xs text-primary hover:underline" onClick={() => setShowText(!showText)}>{showText ? "Hide" : "Show"} extracted text</button>
          {showText && <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-secondary/40 p-3 text-xs">{doc.extracted_text}</pre>}
        </>
      )}
    </div>
  );
}