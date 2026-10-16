import React, { useState } from "react";
import { ExternalLink, RefreshCw, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { createFromDocument } from "@/lib/documentRecords";
import SendToRow from "@/components/documents/SendToRow";
import SourcePanel from "@/components/documents/SourcePanel";

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

  // Send a suggestion (index >= 0) or the whole document (index -1); each can be sent once.
  const send = (index) => async ({ title, content, dest, project_id }) => {
    const rec = await createFromDocument(dest, { title, content, project_id, doc });
    const patch = index >= 0
      ? { suggestions: doc.suggestions.map((s, i) => (i === index ? { ...s, sent_type: dest, sent_id: rec.id } : s)) }
      : { whole_sent_type: dest, whole_sent_id: rec.id };
    await base44.entities.Document.update(doc.id, patch);
    onChange();
  };

  const busy = doc.status === "processing" || doc.status === "uploaded";

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="min-w-0 truncate text-lg font-semibold">{doc.title || doc.file_name}</h2>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={open} aria-label="Open original" title="Open original"><ExternalLink className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" onClick={retry} disabled={retrying || busy} aria-label="Re-process" title="Re-process"><RefreshCw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} /></Button>
          <Button size="sm" variant="ghost" onClick={remove} aria-label="Delete document" title="Delete document"><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      </div>

      <SourcePanel doc={doc} projects={projects} onChange={onChange} />

      <section className="space-y-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-primary">Processed Smart PKOS content</h3>
        {busy && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Reading document...</p>}
        {doc.status === "failed" && <p className="text-sm text-destructive">Processing failed: {doc.error}. Nothing was extracted. Try re-processing.</p>}

        {doc.status === "ready" && (
          <>
            {doc.summary && <p className="text-sm text-foreground/90">{doc.summary}</p>}
            <p className="text-xs text-muted-foreground">Review and edit each item, choose where it goes, then press Send. Nothing is saved until you do.</p>
            {(doc.suggestions || []).map((s, i) => <SendToRow key={`${doc.id}-${i}`} item={s} projects={projects} defaultProject={doc.project_id} onSend={send(i)} />)}

            <h4 className="pt-2 text-sm font-semibold">Send the whole document</h4>
            <SendToRow key={`${doc.id}-all`} projects={projects} defaultProject={doc.project_id} onSend={send(-1)}
              item={{ type: "knowledge", title: doc.title, content: doc.extracted_text, sent_id: doc.whole_sent_id, sent_type: doc.whole_sent_type }} />

            <button className="text-xs text-primary hover:underline" onClick={() => setShowText(!showText)}>{showText ? "Hide" : "Show"} extracted text</button>
            {showText && <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-secondary/40 p-3 text-xs">{doc.extracted_text}</pre>}
          </>
        )}
      </section>
    </div>
  );
}