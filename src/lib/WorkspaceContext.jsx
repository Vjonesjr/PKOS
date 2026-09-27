import React, { createContext, useState, useContext, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

const STORAGE_KEY = "pkos_active_workspace";

export const WORKSPACES = {
  personal: { label: "Personal", description: "Your real notes, projects, and tasks." },
  demo: { label: "Demo Workspace", description: "Sample data to explore what Smart PKOS can do." },
};

const WorkspaceContext = createContext();

export function WorkspaceProvider({ children }) {
  const [workspace, setWorkspaceState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && WORKSPACES[stored] ? stored : "personal";
  });
  const [isSeeding, setIsSeeding] = useState(false);
  const seedAttempted = useRef(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, workspace);
  }, [workspace]);

  useEffect(() => {
    if (workspace !== "demo" || seedAttempted.current) return;
    seedAttempted.current = true;
    (async () => {
      try {
        const existing = await base44.entities.Project.filter({ workspace: "demo" }, "-created_date", 1);
        if (existing.length > 0) return;
        setIsSeeding(true);
        await base44.functions.invoke("seedDemoData", {});
      } finally {
        setIsSeeding(false);
      }
    })();
  }, [workspace]);

  const setWorkspace = (key) => {
    if (WORKSPACES[key]) setWorkspaceState(key);
  };

  return (
    <WorkspaceContext.Provider value={{ workspace, setWorkspace, isDemo: workspace === "demo", isSeeding }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within a WorkspaceProvider");
  return ctx;
}