import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useWorkspace } from '@/lib/WorkspaceContext';
import { usePreferences } from '@/lib/mvp/PreferencesContext';
import { isStalled } from '@/lib/mvp/preferences';
import ProjectForm from '@/components/projects/ProjectForm';
import { useViewMode } from '@/lib/useViewMode';
import TreeView from '@/components/views/TreeView';
import ExplorerView from '@/components/views/ExplorerView';

const FILTERS = ['Active', 'Stalled', 'Later', 'Finished', 'Archived'];

export default function Projects() {
  const { workspace, isSeeding } = useWorkspace();
  const { prefs } = usePreferences();
  const navigate = useNavigate();
  const viewMode = useViewMode();
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState('Active');
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (isSeeding) return;
    try {
      setProjects(await base44.entities.Project.filter({ workspace }, '-updated_date', 500));
      setError('');
    } catch (e) {
      setError(e.message || 'Could not load projects.');
    }
  }, [workspace, isSeeding]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = projects.filter((p) =>
    filter === 'Active'
      ? p.status === 'Active'
      : filter === 'Stalled'
      ? isStalled(p, prefs)
      : filter === 'Finished'
      ? p.status === 'Completed'
      : filter === 'Archived'
      ? p.status === 'Archived'
      : ['Idea', 'Planned', 'Waiting', 'Paused'].includes(p.status)
  );

  const treeItems = filtered.map((p) => ({
    id: p.id,
    label: p.title,
    children: p.next_action ? [{ id: p.id + '-next', label: 'Next: ' + p.next_action }] : [],
  }));

  const explorerItems = filtered.map((p) => ({
    id: p.id,
    title: p.title,
    preview: p.next_action || p.status,
    folder: p.status,
    tags: p.blockers ? ['blocked'] : [],
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold pk-grad-text">Projects</h1>
        <Button onClick={() => setFormOpen(true)}>New Project</Button>
      </div>
      <p className="text-sm text-muted-foreground">
        {projects.filter((p) => p.status === 'Active').length}/{prefs.maxProjects} active. New projects start in Later.
      </p>
      <div role="group" aria-label="Project filters" className="flex flex-wrap gap-2">
        {FILTERS.map((label) => (
          <Button key={label} variant={filter === label ? 'default' : 'outline'} aria-pressed={filter === label} onClick={() => setFilter(label)}>
            {label}
          </Button>
        ))}
      </div>
      {error && <p role="alert" className="text-destructive">{error}</p>}

      {viewMode === 'tree' ? (
        <TreeView items={treeItems} onSelect={(node) => navigate(`/project-detail?id=${node.id}`)} />
      ) : viewMode === 'explorer' ? (
        <ExplorerView
          folders={FILTERS.map((f) => ({ id: f, name: f }))}
          tags={[{ id: 'blocked', name: 'Blocked' }]}
          items={explorerItems}
          onSelect={(item) => navigate(`/project-detail?id=${item.id}`)}
        />
      ) : filtered.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((p) => (
            <Link key={p.id} to={`/project-detail?id=${p.id}`} className="space-y-3 rounded-2xl border border-border bg-card/60 p-5">
              <p className="break-words text-lg font-semibold">{p.title}</p>
              <p className="text-sm text-muted-foreground">Next: {p.next_action || 'Open to choose a next action or review the finish line.'}</p>
              {p.blockers && <p className="break-words text-sm">Blocker: {p.blockers}</p>}
              <div className="flex items-center gap-3">
                <Progress className="h-2 flex-1" value={p.progress || 0} />
                <span className="text-sm">{p.progress || 0}%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Last recorded update: {p.updated_date ? new Date(p.updated_date).toLocaleDateString() : 'Not recorded'}
                {isStalled(p, prefs) ? ' · Stalled' : ''}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border p-8 text-center text-muted-foreground">
          No {filter.toLowerCase()} projects. Choose another filter or add a project to Later.
        </div>
      )}

      <ProjectForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSave={async (data) => {
          const p = await base44.entities.Project.create({ ...data, status: 'Planned', workspace });
          setFormOpen(false);
          navigate(`/project-detail?id=${p.id}`);
        }}
      />
    </div>
  );
}
