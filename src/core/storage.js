export const STORAGE_KEYS = {
  data: 'mindforge-data-v3',
  legacyData: ['mindforge-data-v2', 'mindforge-data'],
  workspaces: 'mindforge-workspaces-v1',
  preferences: 'mindforge-preferences-v2',
  ai: 'mindforge-ai-v1',
};

export const RECORD_BUCKETS = ['captures', 'ideas', 'notes', 'outlines', 'projects', 'goals', 'plans', 'tasks', 'trash'];

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function normalizeWorkspace(candidate) {
  let data = candidate?.data || candidate;
  if (!data || !['ideas', 'notes', 'outlines', 'projects'].every((bucket) => Array.isArray(data[bucket]))) {
    return null;
  }

  data = {
    ...data,
    captures: Array.isArray(data.captures) ? data.captures : [],
    goals: Array.isArray(data.goals) ? data.goals : [],
    plans: Array.isArray(data.plans) ? data.plans : [],
    tasks: Array.isArray(data.tasks) ? data.tasks : [],
    trash: Array.isArray(data.trash) ? data.trash : [],
  };

  RECORD_BUCKETS.filter((bucket) => bucket !== 'trash').forEach((bucket) => {
    data[bucket].forEach((record) => {
      record.links = Array.isArray(record.links) ? record.links : [];
      record.tags = Array.isArray(record.tags) ? record.tags : [];
      record.priority = record.priority || 'Medium';
    });
  });

  return data;
}

export function loadLegacyPersonal(storage, fallback) {
  try {
    const current = normalizeWorkspace(JSON.parse(storage.getItem(STORAGE_KEYS.data)));
    if (current) return current;

    for (const key of STORAGE_KEYS.legacyData) {
      const migrated = normalizeWorkspace(JSON.parse(storage.getItem(key)));
      if (migrated) return migrated;
    }
  } catch {
    // Invalid historic storage falls back safely.
  }
  return clone(fallback);
}

export function loadWorkspaceStore(storage, personalFallback, demoFallback) {
  try {
    const saved = JSON.parse(storage.getItem(STORAGE_KEYS.workspaces));
    if (saved?.personal && saved?.demo) {
      return {
        personal: normalizeWorkspace(saved.personal) || loadLegacyPersonal(storage, personalFallback),
        demo: normalizeWorkspace(saved.demo) || clone(demoFallback),
      };
    }
  } catch {
    // First run or malformed storage: initialize below.
  }

  const workspaces = {
    personal: loadLegacyPersonal(storage, personalFallback),
    demo: clone(demoFallback),
  };
  try { storage.setItem(STORAGE_KEYS.workspaces, JSON.stringify(workspaces)); } catch {}
  return workspaces;
}

export function persistWorkspaceStore(storage, workspaces, preferences) {
  try {
    storage.setItem(STORAGE_KEYS.workspaces, JSON.stringify(workspaces));
    storage.setItem(STORAGE_KEYS.data, JSON.stringify(workspaces.personal));
    storage.setItem('mindforge-data', JSON.stringify(workspaces.personal));
    storage.setItem(STORAGE_KEYS.preferences, JSON.stringify(preferences));
    return { ok: true };
  } catch {
    return { ok: false, message: 'This device could not save the change. Back up MindForge before closing.' };
  }
}

