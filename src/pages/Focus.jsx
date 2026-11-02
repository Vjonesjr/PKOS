import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import usePageBack from '@/hooks/usePageBack';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useWorkspace } from '@/lib/WorkspaceContext';
import { usePreferences } from '@/lib/mvp/PreferencesContext';
import { readFocus, writeFocus, startFocus, pauseFocus, endFocus, elapsedSeconds } from '@/lib/mvp/focusStore';
import { updateTaskStatus, actionSaved } from '@/lib/taskStatus';
import CircularFocusTimer from '@/components/focus/CircularFocusTimer';

export default function Focus() {
  const { workspace } = useWorkspace();
  const { prefs } = usePreferences();
  const location = useLocation();
  const id = new URLSearchParams(location.search).get('task');
  const goBack = usePageBack();

  const [task, setTask] = useState(null);
  const [session, setSession] = useState(readFocus);
  const [minutes, setMinutes] = useState(prefs.focusMinutes || 25);
  const [tick, setTick] = useState(Date.now());
  const [error, setError] = useState('');
  const [reflection, setReflection] = useState('');
  const [ending, setEnding] = useState(false);
  const [breaks, setBreaks] = useState([]);
  const audio = useRef(null);

  useEffect(() => {
    let active = true;
    base44.entities.Task.get(id)
      .then((t) => {
        if (active) {
          if (!t || t.workspace !== workspace) throw Error('Task not found in this workspace.');
          setTask(t);
        }
      })
      .catch((e) => {
        if (active) setError(e.message || 'Could not load this task.');
      });
    return () => {
      active = false;
    };
  }, [id, workspace]);

  useEffect(() => {
    const update = () => setSession(readFocus());
    update();
    window.addEventListener('pkos:focus', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('pkos:focus', update);
      window.removeEventListener('storage', update);
    };
  }, []);

  const mine = session?.taskId === id && session.workspace === workspace;
  const remaining = mine
    ? session.status === 'running'
      ? Math.max(0, Math.ceil((session.deadline - tick) / 1000))
      : session.remaining
    : minutes * 60;

  const total = minutes * 60;
  const status = mine ? session.status : 'idle';

  useEffect(() => {
    if (!mine || session.status !== 'running') return;
    const interval = setInterval(() => setTick(Date.now()), 250);
    const visible = () => setTick(Date.now());
    document.addEventListener('visibilitychange', visible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [mine, session?.status]);

  useEffect(() => {
    if (!mine || session.status !== 'running' || remaining > 0) return;
    pauseFocus(session);
    if (prefs.vibration) navigator.vibrate?.([100, 80, 100]);
    if (prefs.sound && audio.current) {
      const oscillator = audio.current.createOscillator();
      const gain = audio.current.createGain();
      oscillator.connect(gain);
      gain.connect(audio.current.destination);
      gain.gain.value = 0.08;
      oscillator.start();
      oscillator.stop(audio.current.currentTime + 0.2);
    }
  }, [remaining, mine, session?.status, prefs]);

  function resume(phase = mine ? session.phase : 'work', seconds = mine ? session.remaining : minutes * 60) {
    if (!task || task.status === 'done') return;
    try {
      if (prefs.sound && !audio.current) {
        const Context = window.AudioContext || window.webkitAudioContext;
        if (Context) audio.current = new Context();
      }
      const current = mine ? readFocus() || session : startFocus(task, workspace, minutes);
      writeFocus({
        ...current,
        status: 'running',
        phase,
        remaining: seconds,
        deadline: Date.now() + seconds * 1000,
        runningSince: Date.now(),
      });
      setTick(Date.now());
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }

  async function complete() {
    if (!task) return;
    const result = await updateTaskStatus(task, 'done');
    if (!result) return;
    if (mine) endFocus(session, 'Task completed', reflection);
    setTask(result);
    setEnding(false);
  }

  function addBreakAt(seconds) {
    if (seconds <= 0 || seconds >= total) return;
    setBreaks((prev) => [...prev, { at: seconds, label: `Break ${prev.length + 1}` }].sort((a, b) => a.at - b.at));
  }

  function removeBreak(index) {
    setBreaks((prev) => prev.filter((_, i) => i !== index));
  }

  if (error) {
    return (
      <div className="p-4 space-y-4">
        <p className="text-destructive">{error}</p>
        <Button variant="ghost" onClick={goBack}>Back</Button>
      </div>
    );
  }

  if (!task) {
    return <div className="p-4 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="flex flex-col items-center gap-6 p-4 pb-24 max-w-md mx-auto">
      <div className="w-full text-center space-y-1">
        <p className="text-sm text-muted-foreground">Focus session</p>
        <h1 className="text-lg font-semibold">{task.title || 'Untitled task'}</h1>
      </div>

      <CircularFocusTimer
        totalSeconds={total}
        remainingSeconds={remaining}
        breaks={breaks}
        status={status}
      />

      <div className="flex flex-wrap justify-center gap-2">
        {[prefs.focusMinutes || 25, 15, 25, 45, 60]
          .filter((v, i, a) => a.indexOf(v) === i)
          .map((v) => (
            <Button
              key={v}
              size="sm"
              variant={minutes === v ? 'default' : 'outline'}
              disabled={mine && session.status === 'running'}
              onClick={() => {
                setMinutes(v);
                if (mine) writeFocus({ ...session, status: 'paused', remaining: v * 60, phase: 'work' });
              }}
            >
              {v} min
            </Button>
          ))}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {mine && session.status === 'running' ? (
          <Button onClick={() => pauseFocus(session)}>Pause</Button>
        ) : (
          <Button
            disabled={!!session && !mine || task.status === 'done' || remaining === 0}
            onClick={() => resume()}
          >
            {mine ? 'Resume' : 'Start'}
          </Button>
        )}
        <Button
          variant="outline"
          disabled={!!session && !mine}
          onClick={() => {
            if (mine) {
              const p = session.status === 'running' ? pauseFocus(session) : session;
              writeFocus({ ...p, remaining: minutes * 60, phase: 'work' });
            }
            setTick(Date.now());
          }}
        >
          Reset
        </Button>
      </div>

      <div className="w-full space-y-2">
        <p className="text-xs text-muted-foreground text-center">Tap to add a break marker</p>
        <div className="flex flex-wrap justify-center gap-2">
          {[5, 10, 15, 20].map((m) => (
            <Button key={m} size="sm" variant="ghost" onClick={() => addBreakAt(m * 60)}>
              +{m}m break
            </Button>
          ))}
        </div>
        {breaks.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {breaks.map((b, i) => (
              <Button key={i} size="sm" variant="outline" onClick={() => removeBreak(i)}>
                {Math.floor(b.at / 60)}m ✕
              </Button>
            ))}
          </div>
        )}
      </div>

      {mine && (
        <p className="text-sm text-muted-foreground">
          Active work: {Math.floor(elapsedSeconds(session) / 60)} minutes
        </p>
      )}

      {prefs.reflection && mine && (
        <label className="w-full block space-y-2 text-sm">
          <span>What helped / what would I change? (optional)</span>
          <Textarea rows={2} value={reflection} onChange={(e) => setReflection(e.target.value)} />
        </label>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          disabled={!mine}
          onClick={() => {
            endFocus(session, 'Ended without completing task', reflection);
            setEnding(true);
            actionSaved('Session saved. Your task is still open.');
          }}
        >
          End session
        </Button>
        <Button disabled={task.status === 'done'} onClick={complete}>
          Complete Task
        </Button>
      </div>

      {ending && (
        <p role="status" className="rounded-xl border border-primary p-3 text-sm">
          Session ended and saved. The task stays in your queue.
        </p>
      )}

      <Button variant="ghost" onClick={goBack}>
        Back to previous screen
      </Button>
    </div>
  );
}
