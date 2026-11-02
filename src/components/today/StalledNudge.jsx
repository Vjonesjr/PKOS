import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import { AlarmClock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { actionSaved } from '@/lib/taskStatus';
const day=n=>format(addDays(new Date(),n),'yyyy-MM-dd');
export default function StalledNudge({workspace,onChanged}){
 const [tasks,setTasks]=useState([]);
 const load=()=>base44.entities.Task.filter({workspace,status:{$ne:'done'},archived:{$ne:true},due_date:{$lt:day(0)}},{sort:'due_date',limit:5,fields:['title','due_date','today_date','status','workspace']}).then(p=>setTasks(p.items));
 useEffect(()=>{load();},[workspace]);
 const move=async(t,n)=>{await base44.entities.Task.update(t.id,{due_date:day(n),today_date:n===0?day(0):null});await load();onChanged?.();actionSaved(`Moved to ${n===0?'Today':n===1?'tomorrow':'next week'}: ${t.title}`);};
 if(!tasks.length)return null;
 return <section aria-label="Overdue tasks" className="space-y-4 rounded-2xl border border-amber-500/35 bg-amber-500/5 p-4"><div><h2 className="flex items-center gap-2 text-base font-semibold text-amber-300"><AlarmClock className="h-5 w-5"/>Overdue tasks</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">These tasks are still here. Open one for details, or choose a new day.</p></div>{tasks.map(t=><article key={t.id} className="space-y-3 rounded-xl border border-border bg-card p-4"><Link to={`/task-detail?id=${encodeURIComponent(t.id)}`} className="block whitespace-normal break-words text-base font-medium leading-6 text-foreground hover:text-primary">{t.title}</Link><p className="text-sm text-amber-300">Overdue · Due {t.due_date}</p><div className="grid grid-cols-3 gap-2"><Button variant="outline" className="min-h-11 px-2 text-sm" onClick={()=>move(t,0)}>Today</Button><Button variant="outline" className="min-h-11 px-2 text-sm" onClick={()=>move(t,1)}>Tomorrow</Button><Button variant="outline" className="min-h-11 px-2 text-sm" onClick={()=>move(t,7)}>Next week</Button></div></article>)}</section>;
}
