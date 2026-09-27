import React, { useEffect, useState } from "react";
import { Command } from "lucide-react";
import CommandPalette from "@/components/command/CommandPalette";

// Visible entry points (desktop button + mobile floating button) and the Ctrl/Cmd+K shortcut.
export default function CommandLauncher() {
  const [open, setOpen] = useState(false);
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button onClick={() => setOpen(true)} className="hidden items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground lg:flex">
        <Command className="h-3.5 w-3.5" /> Commands
        <kbd className="rounded bg-background/60 px-1.5 py-0.5 text-[10px]">{isMac ? "⌘" : "Ctrl"} K</kbd>
      </button>
      <button onClick={() => setOpen(true)} aria-label="Open command palette"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-background shadow-lg lg:hidden">
        <Command className="h-6 w-6" />
      </button>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}