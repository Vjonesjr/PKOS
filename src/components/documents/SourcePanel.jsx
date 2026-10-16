import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import TagInput from "@/components/documents/TagInput";

// ORIGINAL SOURCE: file metadata, preview and editable tags/project.
export default function SourcePanel({ doc, projects, onChange }) {
  const [preview, setPreview] = useState(null);
  const isImage = doc.mime_type?.startsWith("image/");

  useEffect(() => {
    setPreview(null);
    if (isImage) base44.integrations.Core.CreateFileSignedUrl({ file_uri: doc.file_uri }).then((r) => setPreview(r.signed_url));
  }, [doc.id, doc.file_uri, isImage]);

  const update = async (patch) => { await base44.entities.Document.update(doc.id, patch); onChange(); };
  const project = projects.find((p) => p.id === doc.project_id);

  return (
    <section className="space-y-3 rounded-xl border border-border bg-secondary/20 p-4">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Original source</h3>
      {isImage && preview && <img src={preview} alt={doc.file_name} className="max-h-64 rounded-lg border border-border object-contain" />}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <dt className="text-muted-foreground">File</dt><dd className="truncate">{doc.file_name}</dd>
        <dt className="text-muted-foreground">Type</dt><dd>{doc.mime_type}</dd>
        <dt className="text-muted-foreground">Size</dt><dd>{Math.round((doc.size || 0) / 1024)} KB</dd>
        <dt className="text-muted-foreground">Imported</dt><dd>{doc.created_date?.slice(0, 10)}</dd>
        <dt className="text-muted-foreground">Project</dt><dd className="truncate">{project?.title || "None"}</dd>
        {doc.extraction_method && <><dt className="text-muted-foreground">Text source</dt><dd>{doc.extraction_method === "direct" ? "Read directly from file" : "Read by AI"}</dd></>}
      </dl>
      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">Tags</p>
        <TagInput tags={doc.tags || []} onChange={(tags) => update({ tags })} />
      </div>
    </section>
  );
}