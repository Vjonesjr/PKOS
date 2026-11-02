import React, { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TagInput from "@/components/documents/TagInput";
import { ACCEPT_ATTR, MAX_BYTES, mimeFor, hashFile } from "@/lib/fileImport";

export default function DocumentUploader({ workspace, projects, onChange, onSelect }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(0);
  const [tags, setTags] = useState([]);
  const [project, setProject] = useState("none");
  const { toast } = useToast();

  const handle = async (files) => {
    for (const file of Array.from(files)) {
      const mime = mimeFor(file);
      if (!mime) { toast({ title: `${file.name}: unsupported type`, variant: "destructive" }); continue; }
      if (file.size > MAX_BYTES) { toast({ title: `${file.name}: over 10 MB`, variant: "destructive" }); continue; }
      setBusy((n) => n + 1);
      try {
        const content_hash = await hashFile(file);
        const { items: [existing] } = await base44.entities.Document.filter({ workspace, content_hash }, { limit: 1 });
        if (existing) { toast({ title: `${file.name} was already imported`, description: "Opened the existing copy instead." }); onSelect(existing.id); continue; }
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
        const doc = await base44.entities.Document.create({
          file_uri, file_name: file.name, mime_type: mime, size: file.size, content_hash, status: "uploaded", workspace,
          tags, project_id: project === "none" ? undefined : project,
        });
        onChange();
        onSelect(doc.id);
        await base44.functions.invoke("processDocument", { document_id: doc.id }).catch((e) =>
          toast({ title: `${file.name}: ${e.response?.data?.error || "processing failed"}`, variant: "destructive" }));
      } finally {
        setBusy((n) => n - 1);
        onChange();
      }
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card/40 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Tags for new imports</p>
          <TagInput tags={tags} onChange={setTags} />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Related project</p>
          <Select value={project} onValueChange={setProject}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No project</SelectItem>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handle(e.dataTransfer.files); }}
        onClick={() => input.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-6 text-center hover:border-primary/60"
      >
        {busy ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Upload className="h-6 w-6 text-primary" />}
        <p className="text-sm font-medium">{busy ? `Uploading & reading ${busy} file(s)...` : "Drop files or click to upload"}</p>
        <p className="text-xs text-muted-foreground">PDF, TXT, Markdown, PNG, JPG, WEBP · up to 10 MB each</p>
        <input ref={input} type="file" multiple hidden accept={ACCEPT_ATTR} onChange={(e) => { handle(e.target.files); e.target.value = ""; }} />
      </div>
    </div>
  );
}