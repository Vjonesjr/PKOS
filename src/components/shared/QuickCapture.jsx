import React, { useState } from "react";
import { Plus, ChevronDown, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useWorkspace } from "@/lib/WorkspaceContext";

const TYPES = ["idea", "note", "task", "question", "project_thought", "learning_note", "decision", "lesson", "reference", "prompt"];

export default function QuickCapture({ onCaptured }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("idea");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [important, setImportant] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [file,setFile]=useState(null);
  const [fileUri,setFileUri]=useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  const { workspace } = useWorkspace();

  const reset = () => {
    setType("idea");
    setTitle("");
    setContent("");
    setTags("");
    setImportant(false);
    setDueDate("");
    setMoreOpen(false);
    setError(null);setFile(null);setFileUri("");
  };

  const handleSave = async () => {
    if (!content.trim()&&!file) return;
    setSaving(true);
    setError(null);
    try {
      let uri=fileUri;
      if(file&&!uri){if(file.size>20*1024*1024)throw Error("Choose a file under 20 MB.");const uploaded=await base44.integrations.Core.UploadPrivateFile({file});uri=uploaded.file_uri;if(!uri)throw Error("The file upload could not be confirmed.");setFileUri(uri);}
      await base44.entities.Capture.create({
        type,
        title: title.trim(),
        content: [content.trim(),file?`Attachment: ${file.name}\nPrivate file: ${uri}`:""].filter(Boolean).join("\n\n"),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        important,
        due_date: type === "task" && dueDate ? dueDate : undefined,
        status: "inbox",
        workspace,
      });
      window.dispatchEvent(new Event("pkos:capture-changed"));
      toast({ description: "Captured to your inbox." });
      reset();
      setOpen(false);
      onCaptured?.();
    } catch (e) {
      setError(e.message||"Couldn't save — please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-1.5 rounded-full shadow-[0_0_20px_-4px_hsl(var(--primary))]">
        <Plus className="h-4 w-4" /> Capture
      </Button>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setError(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quick capture</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              autoFocus
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="text-base"
            />
            <label className="block space-y-2 text-sm"><span>Attach a file (optional, up to 20 MB)</span><input type="file" className="block max-w-full text-sm" onChange={e=>{setFile(e.target.files?.[0]||null);setFileUri("");}}/>{file&&<span className="block break-words text-muted-foreground">{file.name}</span>}</label>
            <div className="flex items-center gap-2">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant={important ? "default" : "outline"}
                size="icon"
                onClick={() => setImportant((v) => !v)}
                title="Mark important"
              >
                <Star className={`h-4 w-4 ${important ? "fill-current" : ""}`} />
              </Button>
            </div>

            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`} />
              More options
            </button>

            {moreOpen && (
              <div className="space-y-2.5 rounded-lg border border-primary/25 p-3">
                <Input placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Input placeholder="Tags, comma separated" value={tags} onChange={(e) => setTags(e.target.value)} />
                {type === "task" && <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />}
              </div>
            )}

            {error && <p className="text-xs text-destructive">{error}</p>}

            <Button onClick={handleSave} disabled={(!content.trim()&&!file) || saving} className="w-full">
              {saving ? "Saving..." : "Save to Inbox"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}