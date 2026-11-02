import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/lib/WorkspaceContext';
import { updateTaskStatus } from '@/lib/taskStatus';
import { Button } from '@/components/ui/button';
export default function ActionFeedback(){
 const {workspace}=useWorkspace(),qc=useQueryClient(),[notice,setNotice]=useState(null),timer=useRef(null);
 useEffect(()=>{setNotice(null);clearTimeout(timer.current);},[workspace]);
 useEffect(()=>{
  const show=next=>{setNotice(next);clearTimeout(timer.current);const ms=next.undo?10000:next.error?7000:next.task?7000:4500;timer.current=setTimeout(()=>setNotice(null),ms);};
  const saved=e=>{const {task,previousStatus}=e.detail||{};if(!task||task.workspace!==workspace)return;show({task,previousStatus,message:task.status==='done'?`Completed: ${task.title}`:`Returned to active tasks: ${task.title}`});qc.invalidateQueries();};
  const progress=e=>setNotice(previous=>previous?{...previous,milestone:e.detail}:{message:e.detail?.title||'Progress saved',milestone:e.detail});
  const celebration=()=>setNotice(null);
  const success=e=>show({message:e.detail?.message||'Changes saved.',undo:e.detail?.undo});
  const error=e=>show({error:true,message:e.detail?.message||'That action could not be saved. Please retry.'});
  window.addEventListener('pkos:task-saved',saved);window.addEventListener('pkos:action-error',error);window.addEventListener('pkos:action-success',success);window.addEventListener('pkos:progress-celebration',progress);window.addEventListener('pkos:celebrate',celebration);
  const taps=new Map();
  const tap=e=>{const el=e.target instanceof Element?e.target.closest('button,a[href],[role="button"],[role="checkbox"],[role="tab"],[role="option"],[role="menuitem"]'):null;if(!el||el.matches(':disabled,[aria-disabled="true"]'))return;clearTimeout(taps.get(el));el.setAttribute('data-tapped','true');taps.set(el,setTimeout(()=>{el.removeAttribute('data-tapped');taps.delete(el);},450));};
  document.addEventListener('click',tap,true);
  return()=>{window.removeEventListener('pkos:task-saved',saved);window.removeEventListener('pkos:action-error',error);window.removeEventListener('pkos:action-success',success);window.removeEventListener('pkos:progress-celebration',progress);window.removeEventListener('pkos:celebrate',celebration);document.removeEventListener('click',tap,true);clearTimeout(timer.current);taps.forEach((id,el)=>{clearTimeout(id);el.removeAttribute('data-tapped');});};
 },[workspace,qc]);
 const undo=async()=>{if(notice.undo){await notice.undo();setNotice(null);return;}const t=await base44.entities.Task.get(notice.task.id);if(t.workspace!==workspace)throw Error('Open the matching workspace to undo this change.');await updateTaskStatus(t,notice.previousStatus||'todo');};
 if(!notice)return null;
 return <aside aria-label="Action confirmation" className={`fixed inset-x-3 bottom-20 z-[110] mx-auto max-w-xl rounded-2xl border bg-card p-4 shadow-2xl ${notice.error?'border-destructive':'border-primary/60'}`}><div className="flex items-start gap-3"><div className="mt-0.5 text-primary">{notice.error?<AlertCircle className="h-5 w-5 text-destructive"/>:<CheckCircle2 className="h-5 w-5"/>}</div><div className="min-w-0 flex-1"><p role={notice.error?'alert':'status'} className="break-words text-sm font-semibold">{notice.message}</p>{notice.task?.status==='done'&&<p className="mt-1 text-xs text-muted-foreground">Saved in Completed tasks. You can reopen it at any time.</p>}{notice.milestone&&<p className="mt-2 break-words text-sm text-primary">🎉 {notice.milestone.title}{typeof notice.milestone.progress==='number'?` · ${notice.milestone.progress}%`:""}</p>}<div className="mt-3 flex flex-wrap gap-2">{notice.undo&&<Button size="sm" variant="outline" onClick={undo}>Undo</Button>}{notice.task&&<><Button size="sm" variant="outline" onClick={undo}>Undo</Button><Button size="sm" asChild><Link to={notice.task.status==='done'?'/completed':'/'}>{notice.task.status==='done'?'View completed tasks':'View active tasks'}</Link></Button></>}</div></div><button aria-label="Dismiss confirmation" className="flex h-8 w-8 items-center justify-center text-muted-foreground" onClick={()=>setNotice(null)}><X className="h-4 w-4"/></button></div></aside>;
}
