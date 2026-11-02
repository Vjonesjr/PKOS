import { useState } from 'react';
import { Check, Loader2, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { setHabitStatus, ymd } from '@/lib/habits';
import { actionSaved } from '@/lib/taskStatus';
export default function HabitToggle({habit,status,streak=0,onChanged,compact}){
 const [busy,setBusy]=useState(false),today=ymd(new Date());
 const set=async next=>{if(busy)return;setBusy(true);try{const value=status===next?null:next;await setHabitStatus(habit,today,value);if(value==='done'&&streak+1>(habit.best_streak||0))await base44.entities.Habit.update(habit.id,{best_streak:streak+1});onChanged?.();actionSaved(`${value==='done'?'Habit completed':value==='skipped'?'Habit skipped for today':'Habit check-in cleared'}: ${habit.title}`);}finally{setBusy(false);}};
 return <div className={compact?'w-full rounded-xl border border-border bg-card p-4 space-y-3':'space-y-2'}>{compact&&<><p className="whitespace-normal break-words text-base font-medium leading-6">{habit.title}</p><p className={`text-sm font-medium ${status==='done'?'text-primary':status==='missed'?'text-destructive':status==='skipped'?'text-amber-300':'text-muted-foreground'}`}>{status==='done'?'Completed today':status==='skipped'?'Skipped today':status==='missed'?'Missed — you can still check in':'Not checked in today'}</p></>}<div className="flex flex-wrap gap-2"><Button variant={status==='done'?'default':'outline'} disabled={busy} aria-busy={busy} aria-pressed={status==='done'} onClick={()=>set('done')} className="min-h-11 gap-2 px-4 text-sm">{busy?<Loader2 className="h-4 w-4 animate-spin"/>:<Check className="h-4 w-4"/>}{status==='done'?'Undo done':'Mark done'}</Button><Button variant={status==='skipped'?'secondary':'outline'} disabled={busy} aria-pressed={status==='skipped'} onClick={()=>set('skipped')} className="min-h-11 gap-2 px-4 text-sm"><SkipForward className="h-4 w-4"/>{status==='skipped'?'Undo skip':'Skip today'}</Button></div></div>;
}
