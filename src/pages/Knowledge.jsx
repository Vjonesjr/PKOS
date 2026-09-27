import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Star, Library } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import KnowledgeForm from "@/components/knowledge/KnowledgeForm";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";

export default function Knowledge() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    setItems(await base44.entities.Knowledge.list("-updated_date", 200));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = items.filter((k) => `${k.title} ${k.content} ${(k.tags || []).join(" ")}`.toLowerCase().includes(query.toLowerCase()));

  const create = async (data) => {
    await base44.entities.Knowledge.create(data);
    setFormOpen(false);
    load();
  };

  const toggleFavorite = async (k, e) => {
    e.preventDefault();
    await base44.entities.Knowledge.update(k.id, { favorite: !k.favorite });
    load();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Knowledge Vault</h1>
          <p className="text-sm text-muted-foreground mt-1">Your long-term second brain.</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> New Record
        </Button>
      </div>

      <Input placeholder="Search knowledge..." value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-sm" />

      {filtered.length === 0 ? (
        <EmptyState icon={Library} title="No knowledge records yet" description="Capture ideas and turn them into lasting knowledge." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((k) => (
            <Link key={k.id} to={`/knowledge-detail?id=${k.id}`} className="group rounded-xl border border-border bg-card/60 p-4 transition-all hover:border-primary/40 hover:-translate-y-0.5">
              <div className="mb-2 flex items-center justify-between">
                <StatusBadge value={k.type} />
                <button onClick={(e) => toggleFavorite(k, e)}>
                  <Star className={`h-3.5 w-3.5 ${k.favorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                </button>
              </div>
              <p className="text-sm font-medium text-foreground/90">{k.title}</p>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{k.content}</p>
            </Link>
          ))}
        </div>
      )}

      <KnowledgeForm open={formOpen} onOpenChange={setFormOpen} onSave={create} />
    </div>
  );
}