import { usePreferences } from "@/lib/mvp/PreferencesContext";
import React, { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { restoreBackup } from "@/lib/backup";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { useToast } from "@/components/ui/use-toast";

export default function RestorePanel() {
  const {save: savePreferences}=usePreferences();
  const [restorePreferences,setRestorePreferences]=useState(false);
  const fileInputRef = useRef(null);
  const [pending, setPending] = useState(null);
  const [counts, setCounts] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const { workspace } = useWorkspace();
  const { toast } = useToast();

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (parsed?.app !== "Smart PKOS" || !parsed?.data || typeof parsed.data !== "object") throw new Error("not a backup file");
      const c = {};
      for (const [entity, records] of Object.entries(parsed.data)) {
        c[entity] = Array.isArray(records) ? records.length : 0;
      }
      setCounts(c);
      setPending(parsed);
    } catch {
      toast({ description: "This doesn't look like a valid Smart PKOS backup file.", variant: "destructive" });
    }
  };

  const confirmRestore = async () => {
    setRestoring(true);
    try {
      const summary = await restoreBackup(pending, workspace);
      if(restorePreferences&&pending.preferences)savePreferences(pending.preferences);
      const total = Object.values(summary).reduce((a, b) => a + b, 0);
      toast({ description: `Restored ${total} records into your ${workspace} workspace.` });
      setPending(null);
      setCounts(null);
    } catch {
      toast({ description: "Restore failed partway through. Anything already added stays — nothing existing was touched.", variant: "destructive" });
    } finally {
      setRestoring(false);
    }
  };

  const totalIncoming = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;
  const humanize = (name) => name.replace(/([a-z0-9])([A-Z])/g, "$1 $2");

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-6">
      <div>
        <p className="text-sm font-semibold text-foreground/90">Restore from Backup</p>
        <p className="mt-1 text-xs text-muted-foreground">Restoring only adds records — it never edits or deletes anything you already have.</p>
      </div>
      <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={onFileChange} />
      <Button variant="outline" className="gap-1.5" onClick={() => fileInputRef.current?.click()}>
        <Upload className="h-4 w-4" /> Choose Backup File
      </Button>

      <Dialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm restore</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-foreground/80">
              This will add <span className="font-medium">{totalIncoming}</span> record{totalIncoming === 1 ? "" : "s"} into your{" "}
              <span className="font-medium">{workspace}</span> workspace as new entries. Nothing already saved will be changed or removed.
            </p>
            {pending?.preferences&&<label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={restorePreferences} onChange={e=>setRestorePreferences(e.target.checked)}/>Also restore device preferences</label>}
            <ul className="space-y-0.5 text-xs text-muted-foreground">
              {counts &&
                Object.entries(counts)
                  .filter(([, n]) => n > 0)
                  .map(([entity, n]) => (
                    <li key={entity}>
                      {humanize(entity)}: {n}
                    </li>
                  ))}
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)} disabled={restoring}>
              Cancel
            </Button>
            <Button onClick={confirmRestore} disabled={restoring}>
              {restoring ? "Restoring..." : "Confirm Restore"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}