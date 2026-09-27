import React, { useEffect, useState } from "react";
import { LogOut, UserCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function Settings() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Your account and workspace.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
            <UserCircle className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground/90">{user?.full_name || "..."}</p>
            <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
          </div>
        </div>
        <Button variant="outline" className="gap-1.5" onClick={() => base44.auth.logout()}>
          <LogOut className="h-4 w-4" /> Log Out
        </Button>
      </div>
    </div>
  );
}