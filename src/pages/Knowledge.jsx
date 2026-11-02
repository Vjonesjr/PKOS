import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Star, Library, Inbox, Link2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import KnowledgeForm from "@/components/knowledge/KnowledgeForm";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { useViewMode } from "@/lib/useViewMode";
import TreeView from "@/components/views/TreeView";
import ExplorerView from "@/components/views/ExplorerView";

export default function Knowledge() {
  const [items, setItems] = useState([]);
  const [sources, setSources] = useState([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const { workspace, isSeeding } = useWorkspace();
  const viewMode = useViewMode();

  const load = useCallback(async () => {
    if (isSeeding) return;
    const [knowledgeRows, sourceRows] = await Promise.all([
      base44.entities.Knowledge.filter({ workspace }, "-updated_date", 200),
      base44.entities.ChatLink.filter({ workspace, status: { $ne: "archived" } }, { sort: "-updated_date", limit: 100 }),
    ]);
    setItems(Array.isArray(knowledgeRows) ? knowledgeRows : knowledgeRows.items || []);
    setSources(Array.isArray(sourceRows) ? sourceRows : sourceRows.items || []);
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
          <h1 className="text-2xl font-bold tracking-tight pk-grad-text">Knowledge Vault</h1>
          <p className="text-sm text-muted-foreground mt-1">Your long-term second brain.</p>
        </div>
        <div className="flex flex-wrap gap-2"><Button asChild variant="outline" className="gap-1.5"><Link to="/chat-links"><Link2 className="h-4 w-4" /> Chats & links</Link></Button><Button onClick={() => setFormOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> New Record
        </Button></div>
      </div>

      {sources.length > 0 && <section className="space-y-3"><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold">Saved chat/thread sources</h2><p className="text-xs text-muted-foreground">External threads and message references stay clearly labeled as sources.</p></div><Link className="text-sm text-primary hover:underline" to="/chat-links">View all</Link></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{sources.slice(0,6).map(s=><Link key={s.id} to={`/chat-links?edit=${s.id}`} className="rounded-xl border border-primary/20 bg-card/40 p-4 hover:border-primary/40"><div className="flex items-center gap-2 text-sm font-medium"><Link2 className="h-4 w-4 text-primary"/><span className="truncate">{s.title}</span></div><p className="mt-1 text-xs text-muted-foreground">{s.provider||'Other'}{s.url?' · external URL':' · saved text'}</p></Link>)}</div></section>}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-primary/25 bg-card/40 pk-glass py-12">
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
          ) : viewMode === "tree" ? (
            <TreeView items={filtered.map(k => ({ id: k.id, label: k.title, children: k.tags ? k.tags.map(t => ({ id: k.id + "-" + t, label: "#" + t })) : [] }))} onSelect={(node) => window.location.assign(`/knowledge-detail?id=${node.id}`)} />
          ) : viewMode === "explorer" ? (
            <ExplorerView folders={[{ id: "all", name: "All" }]} tags={allTags.map(t => ({ id: t, name: t }))} items={filtered.map(k => ({ id: k.id, title: k.title, preview: (k.content || "").slice(0, 80), tags: k.tags || [] }))} onSelect={(item) => window.location.assign(`/knowledge-detail?id=${item.id}`)} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((k) => (
                <Link key={k.id} to={`/knowledge-detail?id=${k.id}`} className="group rounded-xl border border-primary/25 bg-card/40 pk-glass p-4 transition-all hover:border-primary/40 hover:-translate-y-0.5">
                  <div className="mb-2 flex items-center justify-between">
                    <StatusBadge value={k.type} />
                    <button onClick={(e) => toggleFavorite(k, e)} aria-label={k.favorite ? "Remove from favorites" : "Add to favorites"} className="pk-feedback-medium">
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