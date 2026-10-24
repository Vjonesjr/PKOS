import React, { useEffect, useState } from "react";
import { LogOut, UserCircle, Palette } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import ExportPanel from "@/components/settings/ExportPanel";
import RestorePanel from "@/components/settings/RestorePanel";
import { applyTheme, getStoredTheme, THEMES } from "@/lib/theme";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(getStoredTheme);
  const [doubleBackExit, setDoubleBackExit] = useState(() => localStorage.getItem("smart_pkos_double_back_exit") === "true");

  useEffect(() => { base44.auth.me().then(setUser); }, []);
  useEffect(() => { applyTheme(theme); }, [theme]);
  useEffect(() => { localStorage.setItem("smart_pkos_double_back_exit", String(doubleBackExit)); }, [doubleBackExit]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1><p className="mt-1 text-sm text-muted-foreground">Your account and workspace.</p></div>
      <div className="rounded-2xl border border-border bg-card/60 p-6">
        <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary"><UserCircle className="h-5 w-5 text-muted-foreground" /></div><div><p className="text-sm font-medium text-foreground/90">{user?.full_name || "..."}</p><p className="text-xs text-muted-foreground">{user?.email || ""}</p></div></div>
        <Button variant="outline" className="gap-1.5" onClick={() => base44.auth.logout()}><LogOut className="h-4 w-4" /> Log Out</Button>
      </div>
      <div className="rounded-2xl border border-border bg-card/60 p-6">
        <div className="mb-3 flex items-center gap-2"><Palette className="h-4 w-4 text-primary" /><p className="text-sm font-semibold text-foreground/90">Theme</p></div>
        <p className="mb-3 text-xs text-muted-foreground">Choose a coordinated palette. The selection is saved on this device.</p>
        <div className="grid gap-3 sm:grid-cols-2">{THEMES.map(({ value, label, description }) => <button key={value} type="button" aria-pressed={theme === value} onClick={() => setTheme(value)} className={`theme-option ${theme === value ? "theme-option-selected" : ""}`}><span className={`theme-swatch theme-swatch-${value}`} aria-hidden="true"><span /></span><span className="min-w-0 text-left"><span className="block text-sm font-medium text-foreground">{label}</span><span className="mt-0.5 block text-xs text-muted-foreground">{description}</span></span><span className="theme-option-check" aria-hidden="true">{theme === value ? "✓" : ""}</span></button>)}</div>
      </div>
      <div className="rounded-2xl border border-border bg-card/60 p-6"><p className="text-sm font-semibold text-foreground/90">Navigation</p><p className="mt-1 text-xs text-muted-foreground">The back arrow goes to the previous screen. When there is nowhere left to go, press it twice to try to exit the app.</p><Button variant={doubleBackExit ? "default" : "outline"} size="sm" className="mt-3" onClick={() => setDoubleBackExit((v) => !v)}>{doubleBackExit ? "Double-back exit is on" : "Double-back exit is off"}</Button></div>
      <ExportPanel />
      <RestorePanel />
    </div>
  );
}
