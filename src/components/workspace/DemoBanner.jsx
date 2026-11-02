import { Sparkles, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWorkspace } from '@/lib/WorkspaceContext';
export default function DemoBanner(){
 const {isSeeding,demoError,demoProgress,fillDemoData}=useWorkspace();
 return <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
 <div className="flex flex-wrap items-center gap-2">{isSeeding?<Loader2 className="h-4 w-4 animate-spin"/>:<Sparkles className="h-4 w-4"/>}<span className="min-w-0 flex-1" role="status">{isSeeding?`Filling your Demo workspace… ${demoProgress?.created||0} examples added.`:'Demo Workspace · Connected sample data. Your Personal workspace stays separate.'}</span><Link to="/workspaces" className="underline">Demo controls</Link></div>
 {demoError&&<p role="alert" className="mt-2 break-words">{demoError} <button disabled={isSeeding} onClick={fillDemoData} className="ml-2 font-semibold underline">Retry demo setup</button></p>}
 </div>;
}
