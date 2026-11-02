import useTabScope from "@/hooks/useTabScope";
import {Outlet,Link,useLocation,useNavigate} from 'react-router-dom';
import {useEffect,useState} from 'react';
import {ArrowLeft,Home,FolderKanban,Inbox,Settings} from 'lucide-react';
import {base44} from '@/api/base44Client';
import {GUIDE_SEEN_KEY} from '@/lib/guideSteps';
import {useWorkspace} from '@/lib/WorkspaceContext';
import WorkspaceSwitcherButton from '@/components/workspace/WorkspaceSwitcherButton';
import QuickCapture from '@/components/shared/QuickCapture';
import DemoBanner from '@/components/workspace/DemoBanner';
import Celebration from '@/components/shared/Celebration';
import ActionFeedback from '@/components/shared/ActionFeedback';
import IncomingShare from '@/components/shared/IncomingShare';
import useAppBack from '@/hooks/useAppBack';
import ScrollNavigation from '@/components/scroll/ScrollNavigation';
const TABS=[['/','Home',Home],['/projects','Projects',FolderKanban],['/capture','Capture',Inbox],['/settings','Settings',Settings]];
export default function Layout(){const location=useLocation(),navigate=useNavigate(),{isDemo,setWorkspace,workspace,demoRevision}=useWorkspace(),{goBack,exitHint}=useAppBack();const [display,setDisplay]=useState(()=>{try{return {font:'system',size:'100',spacing:'normal',width:'normal',...JSON.parse(localStorage.getItem('pkos_display')||'{}')}}catch{return {font:'system',size:'100',spacing:'normal',width:'normal'}}});useEffect(()=>{const update=()=>{try{setDisplay({font:'system',size:'100',spacing:'normal',width:'normal',...JSON.parse(localStorage.getItem('pkos_display')||'{}')})}catch{}};window.addEventListener('pkos:display-changed',update);return()=>window.removeEventListener('pkos:display-changed',update);},[]);useEffect(()=>{base44.auth.me().then(u=>{if(!u[GUIDE_SEEN_KEY]){setWorkspace('demo');navigate('/setup',{replace:true});}}).catch(()=>{});},[]);
const section=useTabScope();
const fontFamily=display.font==='system'?undefined:display.font;const lineHeight=display.spacing==='compact'?1.3:display.spacing==='relaxed'?1.75:display.spacing==='airy'?1.95:1.55;const widthClass=display.width==='narrow'?'max-w-4xl':display.width==='wide'?'max-w-7xl':display.width==='full'?'max-w-none':'max-w-6xl';return <div className="min-h-screen" style={{fontFamily,fontSize:`${Number(display.size||100)}%`,lineHeight}}><header data-pkos-header className="sticky top-0 z-40 flex items-center justify-between gap-2 border-b border-border bg-background/95 px-3 py-3 backdrop-blur"><button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border" aria-label="Go back" onClick={goBack}><ArrowLeft className="h-5 w-5"/></button><WorkspaceSwitcherButton/><QuickCapture/></header>{exitHint&&<p role="status" className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-foreground p-3 text-background">Press Back again to exit</p>}<Celebration/><ActionFeedback/><IncomingShare/><main data-scroll-style={display.scrollStyle||"standard"} className={`pkos-scroll-main mx-auto ${widthClass} px-4 py-6 pb-28`}><ScrollNavigation/>{isDemo&&<DemoBanner/>}<div key={`${location.pathname}:${workspace}:${demoRevision}`}><Outlet/></div></main><nav aria-label="Bottom navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">{TABS.map(([path,label,Icon])=><Link key={path} to={path} aria-current={section===path?'page':undefined} className={`flex min-h-16 flex-col items-center justify-center gap-1 text-sm ${section===path?'bg-primary/10 font-semibold text-primary':'text-muted-foreground'}`}><Icon className="h-5 w-5"/>{label}</Link>)}</nav></div>;}
