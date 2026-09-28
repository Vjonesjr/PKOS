import React, { useState } from "react";
import { Plus, Pencil, Trash2, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/shared/EmptyState";
import RecordForm from "@/components/router/RecordForm";

// Generic list + add/edit for Tool and Device records.
export default function RecordList({ entity, fields, noun, records, workspace, onChange, subtitle }) {
  const [editing, setEditing] = useState(null);

  const save = async (data) => {
    const { id, created_date, updated_date, created_by_id, created_by, ...rest } = data;
    if (editing?.id) await entity.update(editing.id, rest);
    else await entity.create({ ...rest, workspace });
    setEditing(null);
    onChange();
  };

  const remove = async (r) => {
    if (!window.confirm(`Delete ${noun.toLowerCase()} “${r.name}”? This cannot be undone.`)) return;
    await entity.delete(r.id);
    onChange();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={() => setEditing({})} className="gap-1.5"><Plus className="h-4 w-4" /> Add {noun}</Button></div>
      {records.length === 0 ? (
        <EmptyState icon={Cpu} title={`No ${noun.toLowerCase()}s yet`} description={`Add a ${noun.toLowerCase()} so the router can use it.`} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {records.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card/60 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground/90">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{subtitle(r)}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(r)} className="text-muted-foreground hover:text-foreground" aria-label={`Edit ${noun}`}><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => remove(r)} className="text-muted-foreground hover:text-destructive" aria-label={`Delete ${noun}`}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              {r.notes && <p className="mt-2 line-clamp-2 text-xs text-foreground/70">{r.notes}</p>}
            </div>
          ))}
        </div>
      )}
      <RecordForm open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title={editing?.id ? `Edit ${noun}` : `Add ${noun}`} fields={fields} initial={editing} onSave={save} />
    </div>
  );
}