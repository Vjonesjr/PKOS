import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useWorkspace } from "@/lib/WorkspaceContext";
import DocumentUploader from "@/components/documents/DocumentUploader";
import DocumentList from "@/components/documents/DocumentList";
import DocumentDetail from "@/components/documents/DocumentDetail";

export default function Documents() {
  const { workspace, isSeeding } = useWorkspace();
  const [docs, setDocs] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(() => new URLSearchParams(window.location.search).get("doc"));

  const load = useCallback(async () => {
    if (isSeeding) return;
    const page = await base44.entities.Document.filter({ workspace }, { sort: "-created_date", limit: 50 });
    setDocs(page.items);
    setCursor(page.next_cursor);
    setHasMore(page.has_more);
  }, [workspace, isSeeding]);

  const loadMore = async () => {
    const page = await base44.entities.Document.filter({ workspace }, { sort: "-created_date", limit: 50, cursor });
    setDocs((d) => [...d, ...page.items]);
    setCursor(page.next_cursor);
    setHasMore(page.has_more);
  };

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (isSeeding) return;
    base44.entities.Project.filter({ workspace, status: { $ne: "Archived" } }, { sort: "title", limit: 100, fields: ["title"] }).then((p) => setProjects(p.items));
  }, [workspace, isSeeding]);
  // Live status updates while documents are being processed.
  useEffect(() => base44.entities.Document.subscribe(() => load()), [load]);

  const selected = docs.find((d) => d.id === selectedId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="pk-grad-text text-2xl font-semibold tracking-tight">Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">Import PDFs, text, Markdown, and images (stored privately). Keep them in your library, then choose what goes where.</p>
      </div>
      <DocumentUploader workspace={workspace} projects={projects} onChange={load} onSelect={setSelectedId} />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-2">
          <DocumentList docs={docs} selectedId={selectedId} onSelect={setSelectedId} />
          {hasMore && <button onClick={loadMore} className="w-full py-2 text-xs text-primary hover:underline">Load more</button>}
        </div>
        {selected ? (
          <DocumentDetail doc={selected} projects={projects} onChange={load} onDeleted={() => { setSelectedId(null); load(); }} />
        ) : (
          docs.length > 0 && <p className="py-10 text-center text-sm text-muted-foreground">Select a document to review and route its content.</p>
        )}
      </div>
    </div>
  );
}