import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Star, Archive } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import KnowledgeForm from "@/components/knowledge/KnowledgeForm";
import LinkedItems from "@/components/shared/LinkedItems";
import StatusBadge from "@/components/shared/StatusBadge";

export default function KnowledgeDetail() {
  const navigate = useNavigate();
  const id = new URLSearchParams(window.location.search).get("id");
  const [record, setRecord] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await base44.entities.Knowledge.get(id);
      setRecord(r);
    } catch {
      setNotFound(true);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (notFound) return <div className="py-20 text-center text-sm text-muted-foreground">Knowledge record not found.</div>;
  if (!record) return <div className="py-20 text-center text-sm text-muted-foreground">Loading...</div>;

  const toggleFavorite = async () => {
    await base44.entities.Knowledge.update(id, { favorite: !record.favorite });
    load();
  };

  const archive = async () => {
    await base44.entities.Knowledge.update(id, { status: "archived" });
    navigate("/knowledge");
  };

  const update = async (data) => {
    await base44.entities.Knowledge.update(id, data);
    setEditOpen(false);
    load();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button onClick={() => navigate("/knowledge")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Knowledge Vault
      </button>

      <div className="rounded-2xl border border-border bg-card/60 p-6">
        <div className="mb-3 flex items-center justify-between">
          <StatusBadge value={record.type} />
          <div className="flex items-center gap-2">
            <button onClick={toggleFavorite}>
              <Star className={`h-4 w-4 ${record.favorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
            </button>
            <Button size="sm" variant="ghost" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={archive}>
              <Archive className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        </div>
        <h1 className="text-xl font-semibold text-foreground">{record.title}</h1>
        {record.category && <p className="mt-1 text-xs text-muted-foreground">Category: {record.category}</p>}
        {record.source && <p className="mt-1 text-xs text-muted-foreground">Source: {record.source}</p>}
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{record.content}</p>
        {record.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {record.tags.map((t) => (
              <span key={t} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-6">
        <LinkedItems recordType="knowledge" recordId={id} />
      </div>

      <KnowledgeForm open={editOpen} onOpenChange={setEditOpen} initial={record} onSave={update} />
    </div>
  );
}