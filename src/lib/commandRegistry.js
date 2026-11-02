// Global command registry. Any module (future agents/automations included) can call
// registerCommand() to add an action to the command palette — no palette changes needed.
//
// Command shape:
// {
//   id: string, label: string, group?: string, icon?: LucideIcon, keywords?: string[],
//   kind?: "run" | "input" | "pick",   // run now | ask for text first | pick a record first
//   placeholder?: string,             // for "input"
//   pickType?: string,                // record type for "pick" (e.g. "project", "contextPack")
//   queryLabel?: (q) => string,       // shown as a smart action while the user types; runs with q
//   run: (ctx, value) => any          // ctx = { navigate, workspace, toast }
// }
const commands = new Map();
const listeners = new Set();
let snapshot = [];

const emit = () => { snapshot = [...commands.values()]; listeners.forEach((l) => l()); };

export function registerCommand(cmd) {
  commands.set(cmd.id, { group: "Actions", kind: "run", keywords: [], ...cmd });
  emit();
  return () => { commands.delete(cmd.id); emit(); };
}

export const getCommands = () => snapshot;

export function subscribeCommands(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}