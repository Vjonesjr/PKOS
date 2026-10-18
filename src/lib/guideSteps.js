// Quick Start tutorial. Each step opens a page in the Demo Workspace so the
// user sees real-looking sample data before touching their own.
export const GUIDE_SEEN_KEY = "pkos_guide_seen";
export const GUIDE_DONE_KEY = "pkos_guide_done";

export const GUIDE_STEPS = [
  { id: "home", to: "/", title: "Your dashboard", why: "See everything at a glance.",
    how: ["Check goal progress and habit streaks", "Look at momentum charts for the last week"] },
  { id: "capture", to: "/capture", title: "Capture a thought", why: "Get ideas out of your head fast.",
    how: ["Type anything into the box", "Pick a type (idea, task, note) or leave it", "Sort it later in Triage"] },
  { id: "parse", to: "/parse", title: "Quick Parse a brain dump", why: "Turn messy text into clear tasks.",
    how: ["Paste a list or ramble", "Review the tasks, edit anything", "Tap Accept to save them"] },
  { id: "today", to: "/today", title: "Plan your day", why: "Focus on what matters today.",
    how: ["Generate a Today Brief", "Add items to Today", "Snooze anything that slipped"] },
  { id: "projects", to: "/projects", title: "Projects", why: "Group tasks toward an outcome.",
    how: ["Open a project to see its tasks", "Set one clear next action"] },
  { id: "goals", to: "/goals", title: "Goals & habits", why: "Track the bigger picture.",
    how: ["Draft a goal with AI", "Add a habit and tick it off daily"] },
  { id: "knowledge", to: "/knowledge", title: "Knowledge", why: "Keep notes you want to find again.",
    how: ["Save notes and references", "Use 'Parse into tasks' on long notes"] },
  { id: "search", to: "/search", title: "Find anything", why: "Forgot where something is? Search.",
    how: ["Search across every type of item", "Or press Ctrl+K for commands"] },
  { id: "chief", to: "/chief-of-staff", title: "Ask your Chief of Staff", why: "Get help deciding what to do.",
    how: ["Ask 'what should I focus on?'", "Tap Apply on any suggested task"] },
];