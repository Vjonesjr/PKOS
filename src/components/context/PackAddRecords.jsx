import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ENTITY_CONFIG, recordLabel } from "@/lib/entityConfig";

export default function PackAddRecords({ workspace, included, onAdd }) {
  const [type, setType] = useState("knowledge");
  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    ENTITY_CONFIG[type].entity.filter({ workspace }, "-updated_date", 100).then(setRecords);
  }, [type, workspace]);

  const q = query.toLowerCase();
  const available = records.filter((r) => !included.has(`${type}:${r.id}`) && recordLabel(type, r).toLowerCase().includes(q)).slice(0, 8);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(ENTITY_CONFIG).map(([k, cfg]) => <SelectItem key={k} value={k}>{cfg.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder="Search records..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {available.length === 0 ? (
        <p className="text-xs text-muted-foreground">No more records to add.</p>
      ) : (
        <div className="space-y-1">
          {available.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary/50">
              <span className="truncate text-sm text-foreground/85">{recordLabel(type, r)}</span>
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => onAdd([{ type, id: r.id }])}>
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}