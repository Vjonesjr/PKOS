import React, { createContext, useState, useContext, useEffect } from "react";

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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, workspace);
  }, [workspace]);

  const setWorkspace = (key) => {
    if (WORKSPACES[key]) setWorkspaceState(key);
  };

  return (
    <WorkspaceContext.Provider value={{ workspace, setWorkspace, isDemo: workspace === "demo" }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within a WorkspaceProvider");
  return ctx;
}