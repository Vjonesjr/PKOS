import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import PackPreview from "@/components/context/PackPreview";
import PackItems from "@/components/context/PackItems";
import PackAddRecords from "@/components/context/PackAddRecords";
import PackSuggestions from "@/components/context/PackSuggestions";
import ContextPackChat from "@/components/context/ContextPackChat";
import usePackRecords from "@/hooks/usePackRecords";

export default function ContextPackDetail() {
  const navigate = useNavigate();
  const id = new URLSearchParams(window.location.search).get("id");
  const [pack, setPack] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [projects, setProjects] = useState([]);
  const records = usePackRecords(pack);

  const load = useCallback(async () => {
    const p = await base44.entities.ContextPack.get(id).catch(() => null);
    if (!p) return setNotFound(true);
    setPack(p);
    setProjects(await base44.entities.Project.filter({ workspace: p.workspace }, "-updated_date", 200));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (notFound) return <div className="py-20 text-center text-sm text-muted-foreground">Context pack not found.</div>;
  if (!pack || !records) return <div className="py-20 text-center text-sm text-muted-foreground">Loading...</div>;

  const included = new Set((pack.items || []).map((i) => `${i.type}:${i.id}`));
  const saveItems = async (items) => setPack(await base44.entities.ContextPack.update(pack.id, { items }));
  const add = (newItems) => saveItems([...(pack.items || []), ...newItems.filter((i) => !included.has(`${i.type}:${i.id}`))]);
  const remove = (type, rid) => saveItems(pack.items.filter((i) => !(i.type === type && i.id === rid)));

  // Deletes only the pack itself; source records are untouched.
  const deletePack = async () => {
    await base44.entities.ContextPack.delete(pack.id);
    navigate("/context-packs");
  };

  const Section = ({ title, children }) => (
    <div className="rounded-2xl border border-border bg-card/60 p-5">
      <p className="mb-3 text-sm font-semibold text-foreground/90">{title}</p>
      {children}
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <button onClick={() => navigate("/context-packs")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Context Packs
      </button>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{pack.name}</h1>
          {pack.description && <p className="mt-1 text-sm text-muted-foreground">{pack.description}</p>}
        </div>
        <Button variant="ghost" size="sm" onClick={deletePack} aria-label="Delete pack" className="gap-1.5 text-destructive">
          <Trash2 className="h-3.5 w-3.5" /> Delete pack
        </Button>
      </div>

      <PackPreview records={records} projects={projects} />
      <Section title="Included Records"><PackItems records={records} onRemove={remove} /></Section>
      <Section title="Smart Suggestions"><PackSuggestions pack={pack} onAdd={add} /></Section>
      <Section title="Add Records"><PackAddRecords workspace={pack.workspace} included={included} onAdd={add} /></Section>
      <ContextPackChat key={pack.id} fixedPack={pack} />
    </div>
  );
}