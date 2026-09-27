import React, { useState } from "react";
import { FileJson, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { buildBackup, downloadJSON, downloadCSV } from "@/lib/backup";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { useToast } from "@/components/ui/use-toast";

const CSV_EXPORTS = [
  {
    entity: "Knowledge",
    label: "Knowledge",
    columns: [
      { key: "title", label: "Title" },
      { key: "type", label: "Type" },
      { key: "category", label: "Category" },
      { key: "tags", label: "Tags" },
      { key: "content", label: "Content" },
      { key: "status", label: "Status" },
    ],
  },
  {
    entity: "Project",
    label: "Projects",
    columns: [
      { key: "title", label: "Title" },
      { key: "status", label: "Status" },
      { key: "priority", label: "Priority" },
      { key: "next_action", label: "Next Action" },
      { key: "blockers", label: "Blockers" },
      { key: "progress", label: "Progress" },
    ],
  },
  {
    entity: "Task",
    label: "Tasks",
    columns: [
      { key: "title", label: "Title" },
      { key: "status", label: "Status" },
      { key: "priority", label: "Priority" },
      { key: "due_date", label: "Due Date" },
    ],
  },
  {
    entity: "Decision",
    label: "Decisions",
    columns: [
      { key: "title", label: "Title" },
      { key: "decision", label: "Decision" },
      { key: "context", label: "Context" },
      { key: "reasoning", label: "Reasoning" },
      { key: "status", label: "Status" },
      { key: "date", label: "Date" },
    ],
  },
  {
    entity: "Lesson",
    label: "Lessons",
    columns: [
      { key: "title", label: "Title" },
      { key: "what_happened", label: "What Happened" },
      { key: "learned", label: "Learned" },
      { key: "next_time", label: "Next Time" },
    ],
  },
  {
    entity: "LearningItem",
    label: "Learning",
    columns: [
      { key: "title", label: "Title" },
      { key: "type", label: "Type" },
      { key: "status", label: "Status" },
    ],
  },
];

export default function ExportPanel() {
  const [loading, setLoading] = useState(null);
  const { workspace } = useWorkspace();
  const { toast } = useToast();

  const exportFullBackup = async () => {
    setLoading("json");
    try {
      const backup = await buildBackup(workspace);
      downloadJSON(backup, `smart-pkos-backup-${workspace}-${new Date().toISOString().slice(0, 10)}.json`);
      toast({ description: "Backup downloaded." });
    } finally {
      setLoading(null);
    }
  };

  const exportCSV = async ({ entity, label, columns }) => {
    setLoading(entity);
    try {
      const rows = await base44.entities[entity].filter({ workspace }, "-created_date", 5000);
      downloadCSV(rows, columns, `smart-pkos-${label.toLowerCase()}-${workspace}.csv`);
      toast({ description: `${label} exported.` });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card/60 p-6">
      <div>
        <p className="text-sm font-semibold text-foreground/90">Export & Backup</p>
        <p className="mt-1 text-xs text-muted-foreground">Your data, in formats you can read and keep. The full backup preserves the links between records.</p>
      </div>
      <Button onClick={exportFullBackup} disabled={loading === "json"} className="gap-1.5">
        <FileJson className="h-4 w-4" /> {loading === "json" ? "Preparing..." : "Download Full Backup (JSON)"}
      </Button>
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Export individual sections as CSV</p>
        <div className="flex flex-wrap gap-2">
          {CSV_EXPORTS.map((cfg) => (
            <Button key={cfg.entity} size="sm" variant="outline" className="gap-1.5" disabled={loading === cfg.entity} onClick={() => exportCSV(cfg)}>
              <FileSpreadsheet className="h-3.5 w-3.5" /> {cfg.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}