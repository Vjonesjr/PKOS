import { EXPORT_BUCKETS } from './pkos-export.js';
import { STORAGE_KEYS } from '../core/storage.js';

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const copy = value => JSON.parse(JSON.stringify(value));
const refFor = (bucket, record) => `${bucket}:${record.id}`;
const plainObject = value => value && typeof value === 'object' && !Array.isArray(value);
function safeObject(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (['__proto__', 'prototype', 'constructor'].includes(key)) throw new Error('Unsafe field in import');
    safeObject(child);
  }
}
// Canonical JSON is used for comparison, never as an identity hash.
export function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (plainObject(value)) return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
  return JSON.stringify(value);
}
const contentFields = ['title', 'name', 'description', 'content', 'next', 'category'];
function contentSignature(record) {
  return canonical(Object.fromEntries(contentFields.map(field => [field, String(record[field] || '')])));
}
function hasContent(record) {
  return contentFields.some(field => String(record[field] || '').trim());
}
function titleKey(record) { return String(record.title || record.name || '').trim().toLocaleLowerCase(); }
function origins(record) { return Array.isArray(record.pkos?.origins) ? record.pkos.origins : []; }

export function parsePkosMarkdown(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_IMPORT_BYTES) throw new Error('Choose a file smaller than 5 MB');
  const start = text.lastIndexOf('\n## Portability manifest');
  if (start < 0) throw new Error('Choose a MindForge Export Knowledge Markdown file');
  const match = text.slice(start).match(/^(`{3,})json\r?\n([\s\S]*?)\r?\n\1\s*$/m);
  if (!match) throw new Error('The export manifest is missing or incomplete');
  let manifest;
  try { manifest = JSON.parse(match[2]); } catch { throw new Error('The export manifest is not valid JSON'); }
  safeObject(manifest);
  if (!plainObject(manifest) || manifest.format !== 'mindforge-pkos-markdown' || manifest.schemaVersion !== 1 || !['personal', 'demo'].includes(manifest.workspace)
    || !Array.isArray(manifest.records) || manifest.records.length > 2000) throw new Error('Unsupported export format or too many records');
  if (manifest.sourceId !== undefined && (typeof manifest.sourceId !== 'string' || manifest.sourceId.length > 200)) throw new Error('Invalid source identity');
  const seen = new Set();
  for (const entry of manifest.records) {
    if (!plainObject(entry) || !EXPORT_BUCKETS.includes(entry.bucket) || !plainObject(entry.record) || !['number', 'string'].includes(typeof entry.record.id)
      || (typeof entry.record.id === 'number' && !Number.isSafeInteger(entry.record.id))
      || String(entry.record.id).length > 200 || !String(entry.record.id) || entry.ref !== refFor(entry.bucket, entry.record) || seen.has(entry.ref)) throw new Error('Invalid or duplicate record identity');
    seen.add(entry.ref);
    for (const field of [...contentFields, 'status', 'priority', 'created', 'added', 'due']) {
      if (entry.record[field] !== undefined && typeof entry.record[field] !== 'string') throw new Error('Invalid text field in record');
    }
    for (const field of ['tags', 'links']) {
      if (entry.record[field] !== undefined && (!Array.isArray(entry.record[field]) || entry.record[field].some(value => typeof value !== 'string'))) throw new Error('Invalid record tags or links');
    }
    if (entry.record.projectId != null && !['number', 'string'].includes(typeof entry.record.projectId)) throw new Error('Invalid project reference');
    if (entry.record.pkos !== undefined && !plainObject(entry.record.pkos)) throw new Error('Invalid source metadata');
    if (entry.record.pkos?.origins !== undefined && (!Array.isArray(entry.record.pkos.origins) || entry.record.pkos.origins.some(value => typeof value !== 'string'))) throw new Error('Invalid import identity');
    if (entry.record.pkos?.unresolvedRefs !== undefined && (!Array.isArray(entry.record.pkos.unresolvedRefs) || entry.record.pkos.unresolvedRefs.some(value => typeof value !== 'string'))) throw new Error('Invalid unresolved references');
    for (const field of ['kind', 'sourceLabel', 'sourceReference']) {
      if (entry.record.pkos?.[field] !== undefined && typeof entry.record.pkos[field] !== 'string') throw new Error('Invalid source information');
    }
  }
  return copy(manifest);
}

const typeToBucket = value => ({ project: 'projects', projects: 'projects', goal: 'goals', goals: 'goals', plan: 'plans', plans: 'plans', task: 'tasks', tasks: 'tasks', 'to-do': 'tasks', todo: 'tasks', action: 'tasks', note: 'notes', notes: 'notes', knowledge: 'notes', decision: 'notes', lesson: 'notes' }[String(value || '').trim().toLowerCase()] || 'notes');
const firstValue = (row, keys) => keys.map(key => row[key]).find(value => value !== undefined && value !== null && String(value).trim() !== '');
const listValue = value => Array.isArray(value) ? value.map(item => String(item).trim()).filter(Boolean) : String(value || '').split(/[,;\n]/).map(item => item.trim()).filter(Boolean);
const normalizeImportedRow = (row, index, sourceLabel) => {
  const explicitType = firstValue(row, ['RECORD TYPE', 'record type', 'record_type', 'recordType', 'type', 'kind']);
  const destination = firstValue(row, ['DESTINATION', 'destination', 'destinationRef', 'destination_ref']);
  const linkedProject = firstValue(row, ['LINKED PROJECT', 'linked project', 'linkedProject', 'linked_project', 'linkedProjectId', 'linked_project_id', 'projectId', 'project_id']);
  const bucket = typeToBucket(explicitType || row.category);
  const id = row.id ?? `${sourceLabel}:${index + 1}`;
  const record = { ...row, id, title: row.title || row.name || row.goal || row.plan || row.task || `Imported ${bucket.slice(0, -1)} ${index + 1}`, description: row.description || row.summary || '', content: row.content || row.text || '', next: row.next || row.nextAction || row.next_action || '', tags: listValue(row.tags), links: listValue(row.links), projectId: linkedProject || '' };
  record.pkos = { ...(plainObject(row.pkos) ? row.pkos : {}), importMetadata: { recordType: String(explicitType || bucket), destination: destination ? String(destination).trim() : '', linkedProject: linkedProject ? String(linkedProject).trim() : '' } };
  if (destination) record.destination = String(destination).trim();
  for (const key of ['type', 'kind', 'recordType', 'record_type', 'RECORD TYPE', 'record type', 'DESTINATION', 'destination', 'destinationRef', 'destination_ref', 'LINKED PROJECT', 'linked project', 'linkedProject', 'linked_project', 'linkedProjectId', 'linked_project_id', 'projectId', 'project_id']) delete record[key];
  return { bucket, ref: `${bucket}:${id}`, record };
};
export function parseStructuredImport(text, filename = 'import') {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_IMPORT_BYTES) throw new Error('Choose a file smaller than 5 MB');
  const lower = filename.toLocaleLowerCase();
  let rows;
  if (lower.endsWith('.json')) {
    let value; try { value = JSON.parse(text); } catch { throw new Error('The JSON import is not valid.'); }
    rows = Array.isArray(value) ? value : Array.isArray(value.records) ? value.records.map(entry => entry.record ? { ...entry.record, type: entry.bucket } : entry) : Object.values(value).flatMap(group => Array.isArray(group) ? group : []);
  } else if (lower.endsWith('.csv')) {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (!lines.length) throw new Error('The CSV import is empty.');
    const cells = line => line.split(',').map(value => value.trim().replace(/^"|"$/g, ''));
    const headers = cells(lines.shift()).map(value => value.toLocaleLowerCase());
    rows = lines.map(line => Object.fromEntries(cells(line).map((value, index) => [headers[index] || `field${index + 1}`, value])));
  } else throw new Error('Choose a Markdown, JSON, or CSV knowledge file.');
  const records = rows.filter(row => row && typeof row === 'object').map((row, index) => normalizeImportedRow(row, index, filename));
  if (!records.length) throw new Error('The structured import contains no records.');
  return { format: 'mindforge-pkos-structured', schemaVersion: 1, workspace: 'personal', sourceId: `file:${filename}`, records };
}

export function suggestSupportingTasks(records) {
  return records.flatMap(({ bucket, record, ref }) => {
    if (!['goals', 'plans'].includes(bucket)) return [];
    const explicit = [record.next, record.nextAction, record.next_action, record.supportingTasks, record.supporting_tasks, record.tasks]
      .flatMap(listValue).filter(value => value && value !== record.title);
    const suggested = explicit.length ? explicit : bucket === 'goals'
      ? [`Define a measurable outcome for "${record.title || 'this goal'}"`, `Choose the next concrete action for "${record.title || 'this goal'}"`]
      : [`Review the plan steps for "${record.title || 'this plan'}"`];
    return [...new Set(suggested)].map((title, index) => ({
      sourceRef: ref, title, type: 'Task', confidence: 'high', reason: 'Explicit next action or task supplied by the import', key: `${ref}:suggested-task:${index}`,
    }));
  });
}

export function applySuggestedTasks(staged, suggestions, approvedKeys = []) {
  const next = copy(staged);
  next.data.tasks ||= [];
  const approved = new Set(approvedKeys);
  let created = 0;
  let id = Math.max(Date.now(), ...EXPORT_BUCKETS.flatMap(bucket => (next.data[bucket] || []).map(record => Number(record.id) || 0)));
  for (const suggestion of suggestions || []) {
    if (!approved.has(suggestion.key) || next.data.tasks.some(task => task.pkos?.suggestedFrom === suggestion.key)) continue;
    next.data.tasks.push({ id: ++id, title: suggestion.title, type: 'Task', status: 'Next', priority: 'Medium', tags: [], links: [suggestion.sourceRef],
      pkos: { kind: 'suggested-task', suggestedFrom: suggestion.key, sourceRef: suggestion.sourceRef, schemaVersion: 1 } });
    created++;
  }
  return { ...next, suggestedCreated: created };
}

function entryOrigin(manifest, entry) {
  // New exports carry an installation identity. Older exports use full record
  // contents, avoiding an unsafe match on a coincidentally reused record ID.
  return manifest.sourceId
    ? canonical([manifest.sourceId, manifest.workspace, entry.ref])
    : canonical(['legacy', manifest.workspace, entry.bucket, entry.record]);
}
export function previewPkosImport(manifest, data, workspace) {
  if (!['personal', 'demo'].includes(workspace)) throw new Error('Select a valid workspace');
  const earlier = [];
  const rows = manifest.records.map((entry, index) => {
    const records = data[entry.bucket] || [];
    const origin = entryOrigin(manifest, entry);
    const candidates = records.filter(record => origins(record).includes(origin)
      || origins(entry.record).some(value => origins(record).includes(value))
      || (hasContent(entry.record) && contentSignature(record) === contentSignature(entry.record))
      || (titleKey(entry.record) && titleKey(record) === titleKey(entry.record)));
    const exact = candidates.filter(record => contentSignature(record) === contentSignature(entry.record));
    const sourceDuplicate = earlier.some(previous => previous.bucket === entry.bucket
      && ((hasContent(entry.record) && contentSignature(previous.record) === contentSignature(entry.record))
        || (titleKey(entry.record) && titleKey(previous.record) === titleKey(entry.record))));
    earlier.push(entry);
    return { index, entry: copy(entry), origin, candidates: candidates.map(record => ({ ref: refFor(entry.bucket, record), record: copy(record) })),
      target: exact.length === 1 ? refFor(entry.bucket, exact[0]) : candidates.length === 1 ? refFor(entry.bucket, candidates[0]) : '',
      sourceDuplicate,
      reason: exact.length ? 'Matching content' : candidates.length ? 'Possible duplicate or changed source' : sourceDuplicate ? 'Possible duplicate within this file' : 'New record',
      choice: candidates.length || sourceDuplicate ? 'skip' : 'create' };
  });
  return { workspace, sourceWorkspace: manifest.workspace, sourceId: manifest.sourceId || '', baseline: canonical(data), rows, suggestions: suggestSupportingTasks(manifest.records) };
}

export function stagePkosImport(preview, selections, data, workspace) {
  if (workspace !== preview.workspace || canonical(data) !== preview.baseline) throw new Error('Workspace or records changed. Select the file again for a fresh review.');
  const next = copy(data);
  EXPORT_BUCKETS.forEach(bucket => { next[bucket] ||= []; });
  const refMap = new Map();
  const selectedTargets = new Set();
  const operations = [];
  const warnings = [];
  const resolveDestination = value => {
    if (!value) return '';
    const text = String(value).trim();
    if (/^[a-z]+:.+$/i.test(text)) {
      if (refMap.has(text)) return refMap.get(text);
      const [bucket, rawId] = text.split(':');
      if (EXPORT_BUCKETS.includes(bucket) && next[bucket]?.some(record => String(record.id) === rawId)) return text;
    }
    const project = next.projects.find(record => String(record.id) === text || titleKey(record) === text.toLocaleLowerCase());
    return project ? refFor('projects', project) : '';
  };
  let id = Math.max(Date.now(), ...EXPORT_BUCKETS.flatMap(bucket => next[bucket].map(record => Number(record.id) || 0)),
    ...(next.trash || []).map(item => Number(item.record?.id) || 0));
  if (!Number.isSafeInteger(id) || id >= Number.MAX_SAFE_INTEGER - preview.rows.length) throw new Error('Unable to allocate safe record identities');
  for (const row of preview.rows) {
    const selection = selections[row.index] || { choice: row.choice, target: row.target };
    if (!['skip', 'update', 'create'].includes(selection.choice)) throw new Error('Choose Skip, Update, or Create for each record');
    const target = row.candidates.find(candidate => candidate.ref === selection.target);
    if (selection.choice === 'update' && !target) throw new Error('Choose an existing record for every update');
    if (selection.choice === 'skip') {
      if (target) refMap.set(row.entry.ref, target.ref);
      continue;
    }
    const destRef = selection.choice === 'update' ? target.ref : `${row.entry.bucket}:${++id}`;
    if (selectedTargets.has(destRef)) throw new Error('Two incoming records would update the same destination. Skip one or create a separate record.');
    selectedTargets.add(destRef);
    refMap.set(row.entry.ref, destRef);
    operations.push({ row, choice: selection.choice, target, destRef, id: selection.choice === 'create' ? id : target.record.id });
  }
  for (const operation of operations) {
    const { row, choice, target, destRef } = operation;
    const incoming = copy(row.entry.record);
    const existing = target?.record;
    let record;
    if (choice === 'update') {
      record = copy(existing);
      // Update content only; keep local task status, priority, due date, project
      // membership, and unknown local fields. Existing links are retained.
      for (const field of contentFields) if (incoming[field] !== undefined) record[field] = incoming[field];
      record.tags = [...new Set([...(record.tags || []), ...(incoming.tags || [])])];
    } else {
      record = { ...incoming, id: operation.id, tags: incoming.tags || [], priority: incoming.priority || 'Medium',
        status: incoming.status || (row.entry.bucket === 'tasks' ? 'Next' : 'Raw') };
      delete record.projectId;
    }
    const unresolved = [];
    const mappedLinks = (incoming.links || []).map(ref => {
      const mapped = refMap.get(ref);
      if (!mapped) unresolved.push(ref);
      return mapped;
    }).filter(Boolean);
    record.links = [...new Set([...(choice === 'update' ? existing.links || [] : []), ...mappedLinks])];
    const requestedProject = incoming.pkos?.importMetadata?.linkedProject || incoming['LINKED PROJECT'] || incoming['linked project'] || incoming.projectId || '';
    if (requestedProject != null && requestedProject !== '') {
      const sourceRef = `projects:${requestedProject}`;
      const mapped = incoming.pkos?.importMetadata?.linkedProject || incoming['LINKED PROJECT'] || incoming['linked project']
        ? (refMap.get(sourceRef) || resolveDestination(requestedProject))
        : refMap.get(sourceRef);
      if (mapped) {
        if (choice === 'create' || !existing.projectId) record.projectId = mapped.slice('projects:'.length);
        record.links = [...new Set([...record.links, mapped])];
      } else unresolved.push(sourceRef);
    }
    const destination = resolveDestination(incoming.destination || incoming.DESTINATION || incoming.pkos?.importMetadata?.destination);
    if (destination && destination !== destRef) {
      record.links = [...new Set([...record.links, destination])];
      if (destination.startsWith('projects:') && (choice === 'create' || !existing.projectId)) record.projectId = destination.slice('projects:'.length);
    }
    record.pkos = { ...(incoming.pkos || {}), ...(existing?.pkos || {}), schemaVersion: 1,
      origins: [...new Set([...origins(incoming), ...origins(existing || {}), row.origin])],
      importedFrom: { sourceId: preview.sourceId, workspace: preview.sourceWorkspace, ref: row.entry.ref },
      unresolvedRefs: [...new Set([...(incoming.pkos?.unresolvedRefs || []), ...(existing?.pkos?.unresolvedRefs || []), ...unresolved])] };
    if (unresolved.length) warnings.push({ ref: destRef, sourceRefs: [...new Set(unresolved)] });
    if (choice === 'create') next[row.entry.bucket].push(record);
    else next[row.entry.bucket][next[row.entry.bucket].findIndex(value => String(value.id) === String(existing.id))] = record;
  }
  return { data: next, created: operations.filter(op => op.choice === 'create').length, updated: operations.filter(op => op.choice === 'update').length,
    skipped: preview.rows.length - operations.length, warnings };
}

export function commitPkosImport(storage, workspaces, workspace, staged) {
  const nextStore = { ...workspaces, [workspace]: staged.data };
  const writes = workspace === 'personal' ? [[STORAGE_KEYS.data, JSON.stringify(staged.data)], ['mindforge-data', JSON.stringify(staged.data)]] : [];
  // Write authoritative workspace storage last. Live state is changed by the
  // caller only after every write succeeds. Restore prior values on failure.
  writes.push([STORAGE_KEYS.workspaces, JSON.stringify(nextStore)]);
  const previous = writes.map(([key]) => [key, storage.getItem(key)]);
  try { for (const [key, value] of writes) storage.setItem(key, value); }
  catch {
    let rollbackFailed = false;
    for (const [key, value] of previous) {
      try { value === null ? storage.removeItem(key) : storage.setItem(key, value); } catch { rollbackFailed = true; }
    }
    throw new Error(rollbackFailed ? 'Import could not be saved and storage recovery was incomplete. Keep the app open and back up your records before retrying.' : 'Import could not be saved. Your records were not changed. Free device storage and try again.');
  }
  return nextStore;
}

