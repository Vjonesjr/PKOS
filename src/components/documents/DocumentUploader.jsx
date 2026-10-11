import React, { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const ACCEPT = { "application/pdf": 1, "text/plain": 1, "image/png": 1, "image/jpeg": 1 };
const MAX = 10 * 1024 * 1024;

export default function DocumentUploader({ workspace, onChange }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(0);
  const { toast } = useToast();

  const handle = async (files) => {
    for (const file of Array.from(files)) {
      if (!ACCEPT[file.type]) { toast({ title: `${file.name}: unsupported type`, variant: "destructive" }); continue; }
      if (file.size > MAX) { toast({ title: `${file.name}: over 10 MB`, variant: "destructive" }); continue; }
      setBusy((n) => n + 1);
      try {
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
        const doc = await base44.entities.Document.create({ file_uri, file_name: file.name, mime_type: file.type, size: file.size, status: "uploaded", workspace });
        onChange();
        await base44.functions.invoke("processDocument", { document_id: doc.id }).catch((e) =>
          toast({ title: `${file.name}: ${e.response?.data?.error || "processing failed"}`, variant: "destructive" }));
      } finally {
        setBusy((n) => n - 1);
        onChange();
      }
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); handle(e.dataTransfer.files); }}
      onClick={() => input.current?.click()}
      className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center hover:border-primary/60"
    >
      {busy ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Upload className="h-6 w-6 text-primary" />}
      <p className="text-sm font-medium">{busy ? `Uploading & reading ${busy} file(s)...` : "Drop files or click to upload"}</p>
      <p className="text-xs text-muted-foreground">PDF, TXT, PNG, JPG · up to 10 MB each</p>
      <input ref={input} type="file" multiple hidden accept=".pdf,.txt,.png,.jpg,.jpeg" onChange={(e) => { handle(e.target.files); e.target.value = ""; }} />
    </div>
  );
}