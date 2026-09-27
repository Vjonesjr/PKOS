import React, { useEffect, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CornerDownLeft } from "lucide-react";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { useToast } from "@/components/ui/use-toast";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { getCommands, subscribeCommands } from "@/lib/commandRegistry";
import "@/lib/builtinCommands";
import usePaletteRecords, { recordRoute, recordTypeLabel } from "@/hooks/usePaletteRecords";

const matches = (text, q) => text.toLowerCase().includes(q);

export default function CommandPalette({ open, onOpenChange }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { workspace } = useWorkspace();
  const commands = useSyncExternalStore(subscribeCommands, getCommands);
  const records = usePaletteRecords(open, workspace);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(null); // command awaiting input or pick

  useEffect(() => { if (!open) { setQuery(""); setActive(null); } }, [open]);

  const ctx = { navigate, workspace, toast };
  const close = () => onOpenChange(false);
  const execute = async (cmd, value) => { close(); await cmd.run(ctx, value); };
  const choose = (cmd) => { if (cmd.kind === "run") return execute(cmd); setActive(cmd); setQuery(""); };

  const q = query.trim().toLowerCase();

  const renderRoot = () => {
    const cmdMatches = commands.filter((c) => !q || matches([c.label, ...c.keywords].join(" "), q));
    const recMatches = q ? records.filter((r) => matches(r.title, q)).slice(0, 25) : [];
    const groups = recMatches.reduce((a, r) => ({ ...a, [r.type]: [...(a[r.type] || []), r] }), {});
    const smart = q ? commands.filter((c) => c.queryLabel) : [];
    return (
      <>
        {Object.entries(groups).map(([type, list]) => (
          <CommandGroup key={type} heading={recordTypeLabel(type)}>
            {list.map((r) => <CommandItem key={r.type + r.id} value={r.type + r.id} onSelect={() => { close(); navigate(recordRoute(r)); }}>{r.title}</CommandItem>)}
          </CommandGroup>
        ))}
        {smart.length > 0 && (
          <CommandGroup heading="Smart Actions">
            {smart.map((c) => <CommandItem key={"s" + c.id} value={"s" + c.id} onSelect={() => execute(c, query.trim())}>{c.icon && <c.icon className="h-4 w-4" />}{c.queryLabel(query.trim())}</CommandItem>)}
          </CommandGroup>
        )}
        {cmdMatches.length > 0 && (
          <CommandGroup heading="Commands">
            {cmdMatches.map((c) => <CommandItem key={c.id} value={c.id} onSelect={() => choose(c)}>{c.icon && <c.icon className="h-4 w-4" />}{c.label}</CommandItem>)}
          </CommandGroup>
        )}
      </>
    );
  };

  const renderPick = () => (
    <CommandGroup heading={`${active.label} — choose one`}>
      {records.filter((r) => r.type === active.pickType && (!q || matches(r.title, q))).slice(0, 40).map((r) => (
        <CommandItem key={r.id} value={r.id} onSelect={() => execute(active, r)}>{r.title}</CommandItem>
      ))}
    </CommandGroup>
  );

  const renderInput = () => query.trim() && (
    <CommandGroup heading={active.label}>
      <CommandItem value="submit" onSelect={() => execute(active, query.trim())}><CornerDownLeft className="h-4 w-4" />{active.label}: “{query.trim()}”</CommandItem>
    </CommandGroup>
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false}>
      {active && (
        <button onClick={() => { setActive(null); setQuery(""); }} className="flex items-center gap-1 px-3 pt-3 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Back
        </button>
      )}
      <CommandInput value={query} onValueChange={setQuery} placeholder={active ? active.placeholder || `Search ${active.label.toLowerCase()}...` : "Type a command or search..."} />
      <CommandList>
        <CommandEmpty>{active?.kind === "input" ? "Start typing, then press Enter." : "No results."}</CommandEmpty>
        {!active ? renderRoot() : active.kind === "pick" ? renderPick() : renderInput()}
      </CommandList>
    </CommandDialog>
  );
}