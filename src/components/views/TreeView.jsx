import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, FileText } from "lucide-react";

/**
 * Optional Tree / Hierarchy view.
 * Expandable rows. Use when display.viewMode === 'tree'.
 */
export default function TreeView({ items = [], onSelect }) {
  const [open, setOpen] = useState({});

  function toggle(id) {
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function render(nodes, depth = 0) {
    return nodes.map((node) => {
      const hasChildren = node.children && node.children.length > 0;
      const isOpen = open[node.id];
      return (
        <div key={node.id}>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted/50"
            style={{ paddingLeft: 8 + depth * 16 }}
            onClick={() => (hasChildren ? toggle(node.id) : onSelect?.(node))}
          >
            {hasChildren ? (
              isOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />
            ) : (
              <span className="w-4" />
            )}
            {hasChildren ? <Folder className="h-4 w-4 shrink-0 text-primary" /> : <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />}
            <span className="truncate">{node.label || node.title || "Untitled"}</span>
          </button>
          {hasChildren && isOpen && <div>{render(node.children, depth + 1)}</div>}
        </div>
      );
    });
  }

  if (!items.length) return <p className="p-4 text-sm text-muted-foreground">Nothing to show.</p>;
  return <div className="space-y-0.5">{render(items)}</div>;
}
