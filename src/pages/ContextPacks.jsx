import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Layers } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EmptyState from "@/components/shared/EmptyState";
import { useWorkspace } from "@/lib/WorkspaceContext";

export default function ContextPacks() {
  const { workspace, isSeeding } = useWorkspace();
  const navigate = useNavigate();
  const [packs, setPacks] = useState(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const load = useCallback(async () => {
    if (isSeeding) return;
    setPacks(await base44.entities.ContextPack.filter({ workspace }, "-updated_date", 100));
  }, [workspace, isSeeding]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!name.trim()) return;
    const p = await base44.entities.ContextPack.create({ name: name.trim(), description, items: [], workspace });
    navigate(`/context-pack?id=${p.id}`);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Context Packs</h1>
          <p className="mt-1 text-sm text-muted-foreground">Bundle exactly the records an AI task needs — nothing more.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-1.5"><Plus className="h-4 w-4" /> New Pack</Button>
      </div>

      {!packs ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>
      ) : packs.length === 0 ? (
        <EmptyState icon={Layers} title="No context packs yet" description="Try one like “BI Interview Prep” or “Python Learning”." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {packs.map((p) => (
            <Link key={p.id} to={`/context-pack?id=${p.id}`} className="rounded-xl border border-border bg-card/60 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40">
              <p className="text-sm font-medium text-foreground/90">{p.name}</p>
              {p.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>}
              <p className="mt-2 text-xs text-muted-foreground">{(p.items || []).length} records</p>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Context Pack</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name, e.g. PKOS Architecture" value={name} onChange={(e) => setName(e.target.value)} />
            <Textarea placeholder="What is this pack for? (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            <div className="flex justify-end"><Button onClick={create} disabled={!name.trim()}>Create</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}