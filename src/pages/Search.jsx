import React, { useState, useEffect, useMemo } from "react";
import { Search as SearchIcon, X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { SEARCH_TYPES } from "@/lib/searchConfig";
import useServerSearch from "@/hooks/useServerSearch";
import SearchFilters from "@/components/search/SearchFilters";
import MeaningSearch from "@/components/search/MeaningSearch";
import SearchResultGroup from "@/components/search/SearchResultGroup";
import EmptyState from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";

// Known status values across searchable types (avoids loading records just to list them).
const STATUSES = ["inbox", "processed", "archived", "active", "Idea", "Planned", "Active", "Waiting", "Completed", "todo", "in_progress", "done", "not_started", "completed", "pending", "made", "reviewed"];

export default function SearchPage() {
  const { workspace, isSeeding } = useWorkspace();
  const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get("q") || "");
  const [activeTypes, setActiveTypes] = useState(SEARCH_TYPES);
  const [projectFilter, setProjectFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [projects, setProjects] = useState([]);
  const [tags, setTags] = useState([]);

  // Filter options: projects for the dropdown, distinct tags from the server.
  useEffect(() => {
    if (isSeeding) return;
    const e = base44.entities;
    Promise.all([
      e.Project.filter({ workspace }, { sort: "title", limit: 200, fields: ["title"] }),
      e.Capture.filter({ workspace }, { distinct: "tags" }),
      e.Knowledge.filter({ workspace }, { distinct: "tags" }),
    ]).then(([p, t1, t2]) => {
      setProjects(p.items);
      setTags([...new Set([...t1.items, ...t2.items].flat().filter(Boolean))].sort());
    });
  }, [workspace, isSeeding]);

  const isDefaultFilters = projectFilter === "all" && tagFilter === "all" && statusFilter === "all" && dateFilter === "all" && activeTypes.length === SEARCH_TYPES.length;
  const q = query.trim();
  const showResults = q.length > 0 || !isDefaultFilters;

  const { results, loading, loadMore } = useServerSearch({
    enabled: showResults && !isSeeding,
    types: activeTypes,
    filters: { workspace, q, projectFilter, tagFilter, statusFilter, dateFilter },
  });

  const groups = SEARCH_TYPES.filter((t) => results[t]?.items.length);
  const totalResults = groups.reduce((s, t) => s + results[t].items.length, 0);
  const candidates = useMemo(() => groups.flatMap((type) => results[type].items.map((record) => ({ type, record }))).slice(0, 120), [results]);
  const meaningKey = workspace + ":" + query + ":" + candidates.map((x) => x.type + x.record.id).join(",");

  const toggleType = (type) => setActiveTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  const clearAll = () => {
    setQuery(""); setActiveTypes(SEARCH_TYPES); setProjectFilter("all"); setTagFilter("all"); setStatusFilter("all"); setDateFilter("all");
  };

  if (isSeeding) return <p className="py-10 text-center text-sm text-muted-foreground">Loading workspace search…</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Search</h1>
        <p className="text-sm text-muted-foreground mt-1">Find anything across your captures, knowledge, projects, and more.</p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search everything..."
          className="w-full rounded-xl border border-border bg-secondary/60 py-2.5 pl-10 pr-9 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary/50" />
        {query && (
          <button onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card/40 p-4">
        <SearchFilters activeTypes={activeTypes} onToggleType={toggleType} projects={projects} projectFilter={projectFilter} onProjectFilter={setProjectFilter}
          tags={tags} tagFilter={tagFilter} onTagFilter={setTagFilter} statuses={STATUSES} statusFilter={statusFilter} onStatusFilter={setStatusFilter}
          dateFilter={dateFilter} onDateFilter={setDateFilter} />
        {!isDefaultFilters && <button onClick={clearAll} className="mt-3 text-xs font-medium text-primary hover:underline">Clear all filters</button>}
      </div>

      {showResults && !loading && <MeaningSearch key={meaningKey} workspace={workspace} query={query} candidates={candidates} />}

      {!showResults && <EmptyState icon={SearchIcon} title="Start typing to search" description="Or use the filters above to browse by project, tag, status, or date." />}
      {showResults && loading && <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Searching…</p>}
      {showResults && !loading && totalResults === 0 && (
        <EmptyState icon={SearchIcon} title={`No matches${q ? ` for "${q}"` : ""}`} description="Try a different term or adjust your filters." />
      )}
      {showResults && !loading && totalResults > 0 && (
        <div className="space-y-6">
          {groups.map((type) => (
            <div key={type} className="space-y-2">
              <SearchResultGroup type={type} records={results[type].items} query={q.toLowerCase()} />
              {results[type].hasMore && <Button size="sm" variant="ghost" onClick={() => loadMore(type)}>Load more</Button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}