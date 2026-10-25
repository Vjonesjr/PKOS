import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Star, Library, Inbox } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import KnowledgeForm from "@/components/knowledge/KnowledgeForm";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { useWorkspace } from "@/lib/WorkspaceContext";

export default function Knowledge() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const { workspace, isSeeding } = useWorkspace();

  const load = useCallback(async () => {
    if (isSeeding) return;
    setItems(await base44.entities.Knowledge.filter({ workspace }, "-updated_date", 200));
  }, [workspace, isSeeding]);

  useEffect(() => {
    load();
  }, [load]);

  const allTags = useMemo(() => {
    const set = new Set();
    items.forEach((k) => (k.tags || []).forEach((t) => set.add(t)));
    return Array.from(set);
  }, [items]);

  const filtered = items
    .filter((k) => (tab === "archived" ? k.status === "archived" : k.status !== "archived"))
    .filter((k) => (tab === "favorites" ? k.favorite : true))
    .filter((k) => (tagFilter === "all" ? true : (k.tags || []).includes(tagFilter)))
    .filter((k) => `${k.title} ${k.content} ${(k.tags || []).join(" ")}`.toLowerCase().includes(query.toLowerCase()));

  const create = async (data) => {
    await base44.entities.Knowledge.create({ ...data, workspace });
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
        <Link to="/knowledge-map"><Button variant="outline">Explore Map</Button></Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/60 py-12">
          <EmptyState icon={Library} title="Your knowledge vault is empty." />
          <div className="flex items-center justify-center gap-3">
            <Button onClick={() => setFormOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Add Knowledge
            </Button>
            <Link to="/capture">
              <Button variant="outline" className="gap-1.5">
                <Inbox className="h-4 w-4" /> Convert from Capture
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="favorites">Favorites</TabsTrigger>
                <TabsTrigger value="archived">Archived</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex flex-wrap gap-2">
              <Input placeholder="Search knowledge..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-52" />
              {allTags.length > 0 && (
                <Select value={tagFilter} onValueChange={setTagFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All tags</SelectItem>
                    {allTags.map((t) => (
                      <SelectItem key={t} value={t}>
                        #{t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={Library} title="No records match" description="Try a different search, tag, or view." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((k) => (
                <Link key={k.id} to={`/knowledge-detail?id=${k.id}`} className="group rounded-xl border border-border bg-card/60 p-4 transition-all hover:border-primary/40 hover:-translate-y-0.5">
                  <div className="mb-2 flex items-center justify-between">
                    <StatusBadge value={k.type} />
                    <button onClick={(e) => toggleFavorite(k, e)} aria-label={k.favorite ? "Remove from favorites" : "Add to favorites"}>
                      <Star className={`h-3.5 w-3.5 ${k.favorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                    </button>
                  </div>
                  <p className="text-sm font-medium text-foreground/90">{k.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{k.content}</p>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      <KnowledgeForm open={formOpen} onOpenChange={setFormOpen} onSave={create} />
    </div>
  );
}