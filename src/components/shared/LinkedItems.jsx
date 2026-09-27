import React, { useEffect, useState, useCallback } from "react";
import { Link2, Plus, X, ArrowUpRight } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { ENTITY_CONFIG, fetchRecord, recordLabel } from "@/lib/entityConfig";

const LINKABLE_TYPES = ["knowledge", "project", "decision", "lesson", "learning", "capture"];

export default function LinkedItems({ recordType, recordId, allowedTypes = LINKABLE_TYPES, filterTypes }) {
  const [related, setRelated] = useState([]);
  const [linkedFrom, setLinkedFrom] = useState([]);
  const [adding, setAdding] = useState(false);
  const [pickType, setPickType] = useState(allowedTypes[0]);
  const [options, setOptions] = useState([]);
  const [pickId, setPickId] = useState("");

  const load = useCallback(async () => {
    const [forward, reverse] = await Promise.all([
      base44.entities.Link.filter({ source_type: recordType, source_id: recordId }),
      base44.entities.Link.filter({ target_type: recordType, target_id: recordId }),
    ]);
    const fwd = await Promise.all(forward.map(async (l) => ({ link: l, record: await fetchRecord(l.target_type, l.target_id), type: l.target_type })));
    const rev = await Promise.all(reverse.map(async (l) => ({ link: l, record: await fetchRecord(l.source_type, l.source_id), type: l.source_type })));
    const passesFilter = (x) => !filterTypes || filterTypes.includes(x.type);
    setRelated(fwd.filter((x) => x.record && passesFilter(x)));
    setLinkedFrom(rev.filter((x) => x.record && passesFilter(x)));
  }, [recordType, recordId, filterTypes]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!adding) return;
    (async () => {
      const cfg = ENTITY_CONFIG[pickType];
      const list = await cfg.entity.list("-updated_date", 50);
      setOptions(list.filter((r) => !(pickType === recordType && r.id === recordId)));
    })();
  }, [adding, pickType, pickType, recordType, recordId]);

  const addLink = async () => {
    if (!pickId) return;
    await base44.entities.Link.create({ source_type: recordType, source_id: recordId, target_type: pickType, target_id: pickId });
    setAdding(false);
    setPickId("");
    load();
  };

  const removeLink = async (linkId) => {
    await base44.entities.Link.delete(linkId);
    load();
  };

  const Row = ({ item, removable }) => {
    const cfg = ENTITY_CONFIG[item.type];
    return (
      <div key={item.link.id} className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2">
        <RouterLink
          to={cfg.route === "/knowledge-detail" || cfg.route === "/project-detail" ? `${cfg.route}?id=${item.record.id}` : cfg.route}
          className="flex items-center gap-2 text-sm text-foreground/90 hover:text-primary"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.bg}`} />
          <span className="truncate">{recordLabel(item.type, item.record)}</span>
          <ArrowUpRight className="h-3 w-3 opacity-50" />
        </RouterLink>
        {removable && (
          <button onClick={() => removeLink(item.link.id)} className="text-muted-foreground hover:text-destructive">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Link2 className="h-3.5 w-3.5" /> Related Items
          </p>
          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => setAdding((v) => !v)}>
            <Plus className="h-3 w-3" /> Link
          </Button>
        </div>
        {adding && (
          <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-border p-2">
            <Select value={pickType} onValueChange={setPickType}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allowedTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {ENTITY_CONFIG[t].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={pickId} onValueChange={setPickId}>
              <SelectTrigger className="h-8 flex-1 min-w-[140px] text-xs">
                <SelectValue placeholder="Select record..." />
              </SelectTrigger>
              <SelectContent>
                {options.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {recordLabel(pickType, o)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" className="h-8" onClick={addLink} disabled={!pickId}>
              Add
            </Button>
          </div>
        )}
        <div className="space-y-1.5">
          {related.length === 0 ? <p className="text-xs text-muted-foreground">No related items yet.</p> : related.map((item) => <Row key={item.link.id} item={item} removable />)}
        </div>
      </div>
      {linkedFrom.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Linked From</p>
          <div className="space-y-1.5">
            {linkedFrom.map((item) => (
              <Row key={item.link.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}