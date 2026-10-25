import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { GUIDE_SEEN_KEY } from "@/lib/guideSteps";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Inbox, Library, FolderKanban, GraduationCap, History, Sparkles, Menu, X, Settings, Search, Layers, Sun, Cpu, Zap, Target, FileText, Briefcase, Wand2, CalendarCheck, FileUp, ArrowLeft } from "lucide-react";
import useAutomationEngine from "@/hooks/useAutomationEngine";
import UniversalSearch from "@/components/shared/UniversalSearch";
import QuickCapture from "@/components/shared/QuickCapture";
import CommandLauncher from "@/components/command/CommandLauncher";
import WorkspaceSwitcherButton from "@/components/workspace/WorkspaceSwitcherButton";
import DemoBanner from "@/components/workspace/DemoBanner";
import { useWorkspace } from "@/lib/WorkspaceContext";

const MOBILE_NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/today", label: "Today", icon: Sun },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/import", label: "Import", icon: FileUp },
];

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/guide", label: "Quick Start", icon: BookOpen },
  { to: "/today", label: "Today", icon: Sun },
  { to: "/search", label: "Search", icon: Search },
  { to: "/capture", label: "Capture", icon: Inbox },
  { to: "/parse", label: "Quick Parse", icon: Wand2 },
  { to: "/knowledge", label: "Knowledge", icon: Library },
  { to: "/knowledge-map", label: "Knowledge Map", icon: Layers },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/import", label: "Import plans", icon: FileUp },
  { to: "/learning", label: "Learning", icon: GraduationCap },
  { to: "/review", label: "Review", icon: History },
  { to: "/weekly-review", label: "Weekly review", icon: CalendarCheck },
  { to: "/ai", label: "AI", icon: Sparkles },
  { to: "/chief-of-staff", label: "Chief of Staff", icon: Briefcase },
  { to: "/context-packs", label: "Context Packs", icon: Layers },
  { to: "/router", label: "Tool Router", icon: Cpu },
  { to: "/automations", label: "Automations", icon: Zap },
];

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDemo, workspace, setWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const backEnabled = localStorage.getItem("smart_pkos_back_enabled") !== "false";
  const exitOnDoubleBack = localStorage.getItem("smart_pkos_double_back_exit") === "true";
  const lastBackAt = useRef(0);
  useAutomationEngine(workspace);

  const goBack = () => {
    if (window.history.length > 1) return navigate(-1);
    const now = Date.now();
    if (exitOnDoubleBack && now - lastBackAt.current < 1500) {
      window.navigator.app?.exitApp?.();
      window.close?.();
    }
    lastBackAt.current = now;
    navigate("/");
  };

  // First visit: start in the demo profile with the Quick Start Guide open.
  useEffect(() => {
    base44.auth.me().then((u) => {
      if (u[GUIDE_SEEN_KEY]) return;
      base44.auth.updateMe({ [GUIDE_SEEN_KEY]: true });
      setWorkspace("demo");
      navigate("/guide", { replace: true });
    });
  }, []);

  const isActive = (to) => (to === "/" ? location.pathname === "/" : location.pathname.startsWith(to));

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col overflow-y-auto border-r border-border bg-card/40 px-4 py-6 lg:flex">
        <div className="mb-8 px-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-[0_0_16px_-2px_hsl(var(--primary))]">
              <Sparkles className="h-4 w-4 text-background" />
            </div>
            <span className="font-semibold tracking-tight text-foreground">Smart PKOS</span>
          </div>
          <WorkspaceSwitcherButton className="mt-4 w-full justify-center" />
        </div>
        <nav className="flex-1 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive(item.to) ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              {isActive(item.to) && <motion.span layoutId="navGlow" className="absolute left-0 h-5 w-0.5 rounded-full bg-primary" />}
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-2 border-t border-border pt-4">
          <Link to="/decisions" className="block px-3 text-xs text-muted-foreground transition-colors hover:text-primary">
            Decisions
          </Link>
          <Link to="/lessons" className="block px-3 text-xs text-muted-foreground transition-colors hover:text-primary">
            Lessons
          </Link>
          <Link to="/settings" className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-primary">
            <Settings className="h-3.5 w-3.5" /> Settings
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          {backEnabled && <button onClick={goBack} className="rounded-lg p-1 text-foreground" aria-label="Go back"><ArrowLeft className="h-5 w-5" /></button>}
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-1 text-foreground" aria-label="Open navigation menu">
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <WorkspaceSwitcherButton />
        <QuickCapture />
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60" onClick={() => setMobileOpen(false)} />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto border-r border-border bg-card p-5"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="font-semibold text-foreground">Smart PKOS</span>
                <button onClick={() => setMobileOpen(false)} aria-label="Close navigation menu">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              <nav className="space-y-1">
                {NAV.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                      isActive(item.to) ? "bg-secondary text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
                <Link to="/decisions" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-muted-foreground">
                  Decisions
                </Link>
                <Link to="/lessons" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-muted-foreground">
                  Lessons
                </Link>
                <Link to="/settings" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                  <Settings className="h-4 w-4" /> Settings
                </Link>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="lg:pl-60">
        <div className="hidden items-center justify-between gap-4 border-b border-border px-8 py-4 lg:flex">
          <UniversalSearch />
          <div className="flex items-center gap-3">
            <CommandLauncher />
            <QuickCapture />
          </div>
        </div>
        <main className="px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8">
          {isDemo && <DemoBanner />}
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <nav aria-label="Bottom navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card/95 px-1 pb-[env(safe-area-inset-bottom)] pt-1 shadow-lg backdrop-blur lg:hidden">
        {MOBILE_NAV.map((item) => {
          const active = isActive(item.to);
          return <Link key={item.to} to={item.to} aria-current={active ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[11px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>
            <item.icon className="h-5 w-5" /><span>{item.label}</span>
          </Link>;
        })}
      </nav>
    </div>
  );
}