import { Lightbulb, CheckSquare, FolderPlus, BookPlus, FolderOpen, Search, History, GraduationCap, Scale, BookOpen, Sparkles, Layers, FileText, Inbox, Sun, Cpu } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { registerCommand } from "@/lib/commandRegistry";

const created = (ctx, what) => ctx.toast({ description: `${what} created.` });

const BUILTINS = [
  { id: "capture-idea", label: "Capture idea", icon: Lightbulb, kind: "input", placeholder: "What's the idea?", keywords: ["capture", "inbox", "note"],
    run: async (ctx, text) => { await base44.entities.Capture.create({ type: "idea", title: text.slice(0, 80), content: text, workspace: ctx.workspace }); created(ctx, "Idea captured —"); } },
  { id: "create-task", label: "Create task", icon: CheckSquare, kind: "input", placeholder: "Task title", keywords: ["todo"],
    run: async (ctx, text) => { const task = await base44.entities.Task.create({ title: text, workspace: ctx.workspace }); created(ctx, "Task"); ctx.navigate(`/task-detail?id=${task.id}`); } },
  { id: "create-project", label: "Create project", icon: FolderPlus, kind: "input", placeholder: "Project name",
    run: async (ctx, text) => { const p = await base44.entities.Project.create({ title: text, workspace: ctx.workspace }); ctx.navigate(`/project-detail?id=${p.id}`); } },
  { id: "add-knowledge", label: "Add knowledge", icon: BookPlus, kind: "input", placeholder: "Knowledge title", keywords: ["note", "vault"],
    queryLabel: (q) => `Create "${q}" note`,
    run: async (ctx, text) => { const k = await base44.entities.Knowledge.create({ title: text, workspace: ctx.workspace }); ctx.navigate(`/knowledge-detail?id=${k.id}`); } },
  { id: "create-decision", label: "Create decision", icon: Scale, kind: "input", placeholder: "What did you decide?",
    run: async (ctx, text) => { const d = await base44.entities.Decision.create({ decision: text, title: text.slice(0, 80), date: new Date().toISOString().slice(0, 10), workspace: ctx.workspace }); ctx.navigate(`/decision-detail?id=${d.id}`); } },
  { id: "record-lesson", label: "Record lesson", icon: BookOpen, kind: "input", placeholder: "What did you learn?",
    run: async (ctx, text) => { const l = await base44.entities.Lesson.create({ learned: text, title: text.slice(0, 80), workspace: ctx.workspace }); ctx.navigate(`/lesson-detail?id=${l.id}`); } },
  { id: "open-project", label: "Open project", icon: FolderOpen, kind: "pick", pickType: "project",
    run: (ctx, p) => ctx.navigate(`/project-detail?id=${p.id}`) },
  { id: "project-brief", label: "Generate project brief", icon: FileText, kind: "pick", pickType: "project", keywords: ["copilot", "ai"],
    run: (ctx, p) => ctx.navigate(`/project-detail?id=${p.id}&brief=1`) },
  { id: "open-context-pack", label: "Open context pack", icon: Layers, kind: "pick", pickType: "contextPack",
    run: (ctx, p) => ctx.navigate(`/context-pack?id=${p.id}`) },
  { id: "search-knowledge", label: "Search knowledge", icon: Search, kind: "input", placeholder: "Search for...", queryLabel: (q) => `Search for "${q}"`,
    run: (ctx, text) => ctx.navigate(`/search?q=${encodeURIComponent(text)}`) },
  { id: "draft-goal-ai", label: "Draft goal with AI", icon: Sparkles, kind: "input", placeholder: "What do you want to achieve?", keywords: ["goal", "okr", "ai", "Create Goal from Idea", "Turn Idea into Goal", "AI Goal Draft"],
    run: (ctx, text) => ctx.navigate(`/goals?draft=${encodeURIComponent(text)}`) },
  { id: "quick-parse", label: "Quick parse a brain dump", icon: Inbox, keywords: ["parse", "/parse", "dump", "adhd"], run: (ctx) => ctx.navigate("/parse") },
  { id: "quick-start", label: "Open Quick Start guide", icon: Sparkles, keywords: ["help", "tutorial", "guide", "how"], run: (ctx) => ctx.navigate("/guide") },
  { id: "start-review", label: "Start review", icon: History, run: (ctx) => ctx.navigate("/review") },
  { id: "study-flashcards", label: "Study flashcards", icon: GraduationCap, run: (ctx) => ctx.navigate("/learning") },
  { id: "ask-ai", label: "Ask AI", icon: Sparkles, run: (ctx) => ctx.navigate("/ai") },
  { id: "process-inbox", label: "Process inbox", icon: Inbox, keywords: ["triage"], run: (ctx) => ctx.navigate("/triage") },
  { id: "today-brief", label: "Open Today brief", icon: Sun, keywords: ["plan", "daily"], run: (ctx) => ctx.navigate("/today") },
  { id: "tool-router", label: "Route a task to tools", icon: Cpu, keywords: ["device", "router"], run: (ctx) => ctx.navigate("/router") },
];

BUILTINS.forEach(registerCommand);