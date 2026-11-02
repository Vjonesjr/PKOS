import { useId, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const MODES = [['all', 'All controls'], ['buttons', 'Plus / minus'], ['slider', 'Drag slider'], ['number', 'Type a number']];
export default function ProgressAdjuster({ value, onChange, disabled = false }) {
  const id = useId();
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('pkos_progress_control');
    return MODES.some(([key]) => key === saved) ? saved : 'all';
  });
  const percent = Math.max(0, Math.min(100, Number(value) || 0));
  const changeMode = e => { setMode(e.target.value); localStorage.setItem('pkos_progress_control', e.target.value); };
  return <div className="space-y-3">
    <label className="block text-sm" htmlFor={id}>Progress control</label>
    <select id={id} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm" value={mode} onChange={changeMode} disabled={disabled}>
      {MODES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
    </select>
    <div className="flex flex-wrap items-center justify-center gap-3">
      {(mode === 'all' || mode === 'buttons') && <Button type="button" variant="outline" size="icon" className="min-h-11 min-w-11" disabled={disabled || percent <= 0} aria-label="Decrease progress" onClick={() => onChange(Math.max(0, percent - 1))}><Minus className="h-5 w-5" /></Button>}
      {mode === 'all' || mode === 'number' ? <div className="flex items-center gap-2"><Input type="number" min="0" max="100" step="1" disabled={disabled} value={value} onChange={e => onChange(e.target.value)} aria-label="Progress percent" className="h-11 w-24 text-center text-base" /><span>%</span></div> : <output className="min-w-20 text-center text-xl font-semibold" aria-live="polite">{percent}%</output>}
      {(mode === 'all' || mode === 'buttons') && <Button type="button" variant="outline" size="icon" className="min-h-11 min-w-11" disabled={disabled || percent >= 100} aria-label="Increase progress" onClick={() => onChange(Math.min(100, percent + 1))}><Plus className="h-5 w-5" /></Button>}
    </div>
    {(mode === 'all' || mode === 'slider') && <div><input type="range" min="0" max="100" step="1" value={percent} disabled={disabled} onChange={e => onChange(Number(e.target.value))} aria-label="Drag progress" aria-valuetext={`${percent}%`} className="h-11 w-full cursor-pointer accent-primary" /><p className="text-xs text-muted-foreground">Drag to adjust, then save when ready.</p></div>}
  </div>;
}
