import React from "react";
import { SEARCH_TYPES, SEARCH_TYPE_LABELS } from "@/lib/searchConfig";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SearchFilters({
  activeTypes,
  onToggleType,
  projects,
  projectFilter,
  onProjectFilter,
  tags,
  tagFilter,
  onTagFilter,
  statuses,
  statusFilter,
  onStatusFilter,
  dateFilter,
  onDateFilter,
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {SEARCH_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => onToggleType(type)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              activeTypes.includes(type)
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            {SEARCH_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Select value={projectFilter} onValueChange={onProjectFilter}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Project" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={tagFilter} onValueChange={onTagFilter}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Tag" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {tags.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={onStatusFilter}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={onDateFilter}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Date" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="month">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}