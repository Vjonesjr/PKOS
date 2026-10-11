import React, { useState } from "react";
import { Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DESTINATIONS, defaultDestination } from "@/lib/documentRecords";

// One piece of content the user can route: edit it, pick destination + project, send.
export default function SendToRow({ item, projects, defaultProject, onSend }) {
  const [title, setTitle] = useState(item.title || "");
  const [content, setContent] = useState(item.content || "");
  const [dest, setDest] = useState(defaultDestination(item.type));
  const [project, setProject] = useState(defaultProject || "none");
  const [busy, setBusy] = useState(false);

  if (item.sent_id) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/30 px-3 py-2 text-sm text-muted-foreground">
        <Check className="h-4 w-4 text-primary" /> <span className="truncate">{item.title}</span>
        <span className="ml-auto text-xs">Sent to {DESTINATIONS.find((d) => d.value === item.sent_type)?.label || item.sent_type}</span>
      </div>
    );
  }

  const send = async () => {
    setBusy(true);
    try { await onSend({ title: title.trim() || "Untitled", content, dest, project_id: project === "none" ? "" : project }); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-2 rounded-xl border border-border bg-card/40 p-3">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
      <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} />
      <div className="flex flex-wrap gap-2">
        <Select value={dest} onValueChange={setDest}>
          <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{DESTINATIONS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={project} onValueChange={setProject}>
          <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Project" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No project</SelectItem>
            {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" className="ml-auto h-8" onClick={send} disabled={busy}><Send className="h-3.5 w-3.5" /> Send</Button>
      </div>
    </div>
  );
}