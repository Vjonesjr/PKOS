import { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { fillDemo, DEMO_VERSION } from '@/lib/demo/seed';
const STORAGE_KEY = 'pkos_active_workspace';
export const WORKSPACES = {
  personal: { label: 'Personal', description: 'Your real notes, projects, and tasks.' },
  demo: { label: 'Demo Workspace', description: 'Connected examples throughout Smart PKOS. Explore, edit, and try the features.' },
};
const WorkspaceContext = createContext();
export function WorkspaceProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [workspace, setWorkspaceState] = useState(() => WORKSPACES[localStorage.getItem(STORAGE_KEY)] ? localStorage.getItem(STORAGE_KEY) : 'personal');
  const [isSeeding, setIsSeeding] = useState(false), [demoError, setDemoError] = useState(''), [demoProgress, setDemoProgress] = useState(null), [demoSummary, setDemoSummary] = useState(null), [demoRevision, setDemoRevision] = useState(0);
  const currentUser = useRef(user?.id); currentUser.current = user?.id;
  useEffect(() => { localStorage.setItem(STORAGE_KEY, workspace); }, [workspace]);
  const fillDemoData = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;
    const id = user.id, receipt = `pkos_demo_ready:${id}:${DEMO_VERSION}`;
    setIsSeeding(true); setDemoError(''); setDemoProgress({entity:'Projects',created:0});
    try {
      const result = await fillDemo(base44, user, progress => { if (currentUser.current === id) setDemoProgress(progress); });
      if (currentUser.current !== id) return;
      setDemoSummary(result); sessionStorage.setItem(receipt, '1');
      return result;
    } catch (e) {
      if (currentUser.current === id) { sessionStorage.removeItem(receipt); setDemoError(e.message || 'Demo setup paused. Retry to fill the remaining examples.'); }
    } finally {
      if (currentUser.current === id) { setIsSeeding(false); setDemoRevision(n => n+1); }
    }
  }, [isAuthenticated, user?.id]);
  useEffect(() => {
    if (workspace !== 'demo' || !isAuthenticated || !user?.id) return;
    const receipt = `pkos_demo_ready:${user.id}:${DEMO_VERSION}`;
    if (!sessionStorage.getItem(receipt)) fillDemoData();
  }, [workspace, user?.id, isAuthenticated, fillDemoData]);
  const setWorkspace = key => { if (WORKSPACES[key]) setWorkspaceState(key); };
  return <WorkspaceContext.Provider value={{workspace,setWorkspace,isDemo:workspace==='demo',isSeeding,demoError,demoProgress,demoSummary,demoRevision,fillDemoData}}>{children}</WorkspaceContext.Provider>;
}
export function useWorkspace() { const value=useContext(WorkspaceContext); if(!value) throw new Error('useWorkspace must be used within a WorkspaceProvider'); return value; }
