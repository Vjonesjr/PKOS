import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, FileText } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";

export default function ProjectReferences({ references = [], onChange }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const add = () => {
    if (!title.trim() && !url.trim()) return;
    onChange([...references, { title: title.trim(), url: url.trim() }]);
    setTitle("");
    setUrl("");
  };

  const remove = (idx) => onChange(references.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      {references.length === 0 ? (
        <EmptyState icon={FileText} title="No files or references yet" />
      ) : (
        references.map((r, idx) => (
          <div key={idx} className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2">
            <a href={r.url} target="_blank" rel="noreferrer" className="truncate text-sm text-foreground/90 hover:text-primary">
              {r.title || r.url}
            </a>
            <button onClick={() => remove(idx)} className="text-muted-foreground hover:text-destructive">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))
      )}
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Label" value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 flex-1 min-w-[100px]" />
        <Input placeholder="File URL or reference link" value={url} onChange={(e) => setUrl(e.target.value)} className="h-9 flex-1 min-w-[140px]" />
        <Button size="sm" onClick={add} className="h-9">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}