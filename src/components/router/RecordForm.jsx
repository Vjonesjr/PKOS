import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RecordForm({ open, onOpenChange, title, fields, initial, onSave }) {
  const [data, setData] = useState({});
  useEffect(() => { if (open) setData(initial || {}); }, [open, initial]);
  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  const renderField = (f) => {
    const v = data[f.key] ?? "";
    if (f.kind === "text") return <Textarea rows={2} value={v} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value)} />;
    if (f.kind === "select") return (
      <Select value={v} onValueChange={(x) => set(f.key, x)}>
        <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
        <SelectContent>{f.options.map((o) => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}</SelectContent>
      </Select>
    );
    if (f.kind === "rating") return <Input type="number" min={1} max={5} value={v} onChange={(e) => set(f.key, e.target.value === "" ? null : Math.min(5, Math.max(1, Number(e.target.value))))} />;
    return <Input type={f.kind === "date" ? "date" : "text"} value={v} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value)} />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key} className={f.kind === "text" ? "sm:col-span-2" : ""}>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">{f.label}</label>
              {renderField(f)}
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button disabled={!data.name?.trim()} onClick={() => onSave(data)}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}