import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useWorkspace, WORKSPACES } from "@/lib/WorkspaceContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

export default function Workspaces() {
  const navigate = useNavigate();
  const { workspace, setWorkspace } = useWorkspace();
  const [resetting, setResetting] = useState(false);
  const { toast } = useToast();

  const resetDemo = async () => {
    setResetting(true);
    try {
      await base44.functions.invoke("seedDemoData", {});
      toast({ description: "Demo data has been reset." });
    } catch (e) {
      toast({ description: "Couldn't reset demo data — please try again." });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Workspace</h1>
        <p className="text-sm text-muted-foreground mt-1">Choose which set of data you're working with.</p>
      </div>

      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card/60">
        {Object.entries(WORKSPACES).map(([key, meta]) => (
          <div key={key} className="flex items-center justify-between gap-4 p-4">
            <button onClick={() => setWorkspace(key)} className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground/90">{meta.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{meta.description}</p>
            </button>
            <div className="flex shrink-0 items-center gap-3">
              {key === "demo" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8" disabled={resetting} title="Reset Demo Data" aria-label="Reset Demo Data">
                      <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset demo data?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This deletes everything currently in the Demo workspace and replaces it with the standard sample dataset. Your Personal data is never touched.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={resetDemo}>Reset</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <button
                role="switch"
                aria-checked={workspace === key}
                onClick={() => setWorkspace(key)}
                className={`relative h-6 w-11 rounded-full transition-colors ${workspace === key ? "bg-primary" : "bg-secondary"}`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-background transition-transform ${
                    workspace === key ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}