import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { SEARCH_TYPES, getSearchText } from "@/lib/searchConfig";
import SearchFilters from "@/components/search/SearchFilters";
import MeaningSearch from "@/components/search/MeaningSearch";
import SearchResultGroup from "@/components/search/SearchResultGroup";
import EmptyState from "@/components/shared/EmptyState";

export default function SearchPage() {
  const { workspace, isSeeding } = useWorkspace();
  const [data, setData] = useState(null);
  const requestVersion = useRef(0);
  const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get("q") || "");
  const [activeTypes, setActiveTypes] = useState(SEARCH_TYPES);
  const [projectFilter, setProjectFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    if (isSeeding) return;
    // Smaller pages, fetched in two waves, with one backoff retry to stay under the app's rate limit.
    const get = async (entity, sort, limit) => {
      try { return await entity.filter({ workspace }, sort, limit); }
      catch (e) {
        if (!/rate limit/i.test(e?.message || "")) throw e;
        await new Promise((r) => setTimeout(r, 2500));
        return entity.filter({ workspace }, sort, limit);
      }
    };
    const e = base44.entities;
    const [captures, knowledge, projects, tasks] = await Promise.all([
      get(e.Capture, "-created_date", 100), get(e.Knowledge, "-updated_date", 100),
      get(e.Project, "-updated_date", 100), get(e.Task, "-updated_date", 100),
    ]);
    const [learning, decisions, lessons] = await Promise.all([
      get(e.LearningItem, "-updated_date", 60), get(e.Decision, "-updated_date", 60), get(e.Lesson, "-created_date", 60),
    ]);
    if (version !== requestVersion.current) return;
    setData({ workspace, capture: captures, knowledge, project: projects, task: tasks, learning, decision: decisions, lesson: lessons });
  }, [workspace, isSeeding]);

  useEffect(() => {
    load();
    return () => { requestVersion.current++; };
  }, [load]);

  const projects = data?.project || [];
  const tags = useMemo(() => {
    if (!data) return [];
    const set = new Set();
    [...(data.capture || []), ...(data.knowledge || [])].forEach((r) => (r.tags || []).forEach((t) => set.add(t)));
    return [...set].sort();
  }, [data]);
  const statuses = useMemo(() => {
    if (!data) return [];
    const set = new Set();
    Object.values(data).filter(Array.isArray).forEach((records) => records.forEach((r) => r.status && set.add(r.status)));
    return [...set].sort();
  }, [data]);

  const isDefaultFilters = projectFilter === "all" && tagFilter === "all" && statusFilter === "all" && dateFilter === "all" && activeTypes.length === SEARCH_TYPES.length;
  const q = query.trim().toLowerCase();

  const filteredRecords = useMemo(() => {
    if (!data) return {};
    const dateCutoff = () => {
      const now = new Date();
      if (dateFilter === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (dateFilter === "week") return new Date(now - 7 * 86400000);
      if (dateFilter === "month") return new Date(now - 30 * 86400000);
      return null;
    };
    const cutoff = dateCutoff();

    const result = {};
    SEARCH_TYPES.forEach((type) => {
      if (!activeTypes.includes(type)) return;
      let records = data[type] || [];

      if (tagFilter !== "all") {
        records = type === "capture" || type === "knowledge" ? records.filter((r) => (r.tags || []).includes(tagFilter)) : [];
      }
      if (projectFilter !== "all") {
        records = type === "project" ? records.filter((r) => r.id === projectFilter) : records.filter((r) => r.project_id === projectFilter);
      }
      if (statusFilter !== "all") {
        records = records.filter((r) => r.status === statusFilter);
      }
      if (cutoff) {
        records = records.filter((r) => r.created_date && new Date(r.created_date) >= cutoff);
      }

      if (records.length) result[type] = records;
    });
    return result;
  }, [data, activeTypes, projectFilter, tagFilter, statusFilter, dateFilter]);

  const groupedResults = useMemo(() => Object.fromEntries(
    Object.entries(filteredRecords).map(([type, records]) => [type, q ? records.filter(r => getSearchText(type, r).toLowerCase().includes(q)) : records])
      .filter(([, records]) => records.length)
  ), [filteredRecords, q]);
  const candidates = useMemo(() => Object.entries(filteredRecords).flatMap(([type, records]) => records.map(record => ({ type, record })))
    .sort((a, b) => (b.record.updated_date || b.record.created_date || "").localeCompare(a.record.updated_date || a.record.created_date || ""))
    .slice(0, 120), [filteredRecords]);
  const meaningKey = workspace + ":" + query + ":" + candidates.map(x => x.type + x.record.id).join(",");

  const totalResults = Object.values(groupedResults).reduce((sum, r) => sum + r.length, 0);
  const showResults = q.length > 0 || !isDefaultFilters;

  const toggleType = (type) => {
    setActiveTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const clearAll = () => {
    setQuery("");
    setActiveTypes(SEARCH_TYPES);
    setProjectFilter("all");
    setTagFilter("all");
    setStatusFilter("all");
    setDateFilter("all");
  };

  if (!data || data.workspace !== workspace || isSeeding) return <p className="py-10 text-center text-sm text-muted-foreground">Loading workspace search…</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Search</h1>
        <p className="text-sm text-muted-foreground mt-1">Find anything across your captures, knowledge, projects, and more.</p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search everything..."
          className="w-full rounded-xl border border-border bg-secondary/60 py-2.5 pl-10 pr-9 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary/50"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card/40 p-4">
        <SearchFilters
          activeTypes={activeTypes}
          onToggleType={toggleType}
          projects={projects}
          projectFilter={projectFilter}
          onProjectFilter={setProjectFilter}
          tags={tags}
          tagFilter={tagFilter}
          onTagFilter={setTagFilter}
          statuses={statuses}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
          dateFilter={dateFilter}
          onDateFilter={setDateFilter}
        />
        {!isDefaultFilters && (
          <button onClick={clearAll} className="mt-3 text-xs font-medium text-primary hover:underline">
            Clear all filters
          </button>
        )}
      </div>

      <MeaningSearch key={meaningKey} workspace={workspace} query={query} candidates={candidates} />

      {data && !showResults && (
        <EmptyState icon={SearchIcon} title="Start typing to search" description="Or use the filters above to browse by project, tag, status, or date." />
      )}

      {data && showResults && totalResults === 0 && (
        <EmptyState icon={SearchIcon} title={`No matches${query ? ` for "${query}"` : ""}`} description="Try a different term or adjust your filters." />
      )}

      {data && showResults && totalResults > 0 && (
        <div className="space-y-6">
          {Object.entries(groupedResults).map(([type, records]) => (
            <SearchResultGroup key={type} type={type} records={records} query={q} />
          ))}
        </div>
      )}
    </div>
  );
}