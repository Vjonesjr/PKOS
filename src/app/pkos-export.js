// A readable, portable snapshot of one workspace. Never mutates live records.
export const EXPORT_BUCKETS = ['captures', 'ideas', 'notes', 'outlines', 'projects', 'goals', 'plans', 'tasks'];
const labels = { captures: 'Captures', ideas: 'Ideas', notes: 'Notes', outlines: 'Outlines', projects: 'Projects', goals: 'Goals', plans: 'Plans', tasks: 'Actions' };
const refFor = (bucket, record) => `${bucket}:${record.id}`;
export const exportAnchor = (ref) => 'record-' + [...new TextEncoder().encode(ref)].map(byte => byte.toString(16).padStart(2, '0')).join('');
const inline = value => String(value ?? '').replace(/[\r\n]+/g, ' ').replace(/([\\`*_{}\[\]<>#!|])/g, '\\$1');
function fenced(value, language = '') {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  const runs = text.match(/`+/g) || [];
  const fence = '`'.repeat(Math.max(3, ...runs.map(run => run.length + 1)));
  return `${fence}${language}\n${text}\n${fence}`;
}

export function buildPkosMarkdown(data, { workspace, version, sourceId, exportedAt = new Date().toISOString() }) {
  if (!['personal', 'demo'].includes(workspace)) throw new Error('Select a valid workspace');
  const records = EXPORT_BUCKETS.flatMap(bucket => (data[bucket] || []).map(record => ({ bucket, record })));
  const references = new Map();
  for (const { bucket, record } of records) {
    if (record.id == null) throw new Error('A record is missing its identity');
    const ref = refFor(bucket, record);
    if (references.has(ref)) throw new Error('Duplicate record identity');
    references.set(ref, record);
  }
  const lines = [
    '# MindForge knowledge export', '',
    `Workspace: **${workspace === 'demo' ? 'Demo (fictional)' : 'Personal'}**`,
    `Exported: ${inline(exportedAt)}`, `MindForge version: ${inline(version)}`, '',
    `${records.length} active records. Recently Deleted is excluded.`, '',
    'This readable export does not replace Back Up MindForge. Keep a JSON backup for recovery. No records were changed by this export.', '',
    '## Contents', '',
  ];
  for (const { bucket, record } of records) {
    lines.push(`- [${inline(record.title || record.name || 'Untitled')}](#${exportAnchor(refFor(bucket, record))}) — ${labels[bucket]}`);
  }
  if (!records.length) lines.push('This workspace has no active records.');
  for (const bucket of EXPORT_BUCKETS) {
    const entries = records.filter(entry => entry.bucket === bucket);
    if (!entries.length) continue;
    lines.push('', `## ${labels[bucket]}`, '');
    for (const { record } of entries) {
      lines.push(`<a id="${exportAnchor(refFor(bucket, record))}"></a>`, '', `### ${inline(record.title || record.name || 'Untitled')}`, '', `Reference: ${inline(refFor(bucket, record))}`, '');
      for (const field of ['status', 'priority', 'created', 'added', 'due', 'category']) {
        if (record[field] !== undefined && record[field] !== '') lines.push(`- ${field}: ${inline(record[field])}`);
      }
      if (record.tags?.length) lines.push(`- Tags: ${record.tags.map(inline).join(', ')}`);
      for (const field of ['description', 'content', 'next']) {
        if (record[field]) lines.push('', `#### ${field === 'next' ? 'Next action' : field === 'content' ? 'Content' : 'Description'}`, '', fenced(String(record[field])));
      }
      const links = [...new Set([...(record.links || []), ...(record.projectId != null && record.projectId !== '' ? [`projects:${record.projectId}`] : [])])];
      if (links.length) {
        lines.push('', '#### Connections', '');
        for (const ref of links) {
          const target = references.get(ref);
          lines.push(target ? `- [${inline(target.title || target.name || ref)}](#${exportAnchor(ref)})` : `- ${inline(ref)} — not included in this export`);
        }
      }
      lines.push('');
    }
  }
  const manifest = { format: 'mindforge-pkos-markdown', schemaVersion: 1, appVersion: version, workspace, sourceId, exportedAt,
    records: records.map(({ bucket, record }) => ({ bucket, ref: refFor(bucket, record), anchor: exportAnchor(refFor(bucket, record)), record })) };
  lines.push('', '## Portability manifest', '', 'The manifest retains original fields, IDs, and references. Use Import Knowledge to review this export before merging it into a workspace. Edits to the readable sections do not change the manifest.', '', fenced(manifest, 'json'), '');
  return lines.join('\n');
}

export async function exportPkosWorkspace(data, options, saveFile) {
  // Capture workspace identity and contents before the user opens a save dialog.
  const workspace = options.workspace;
  const exportedAt = options.exportedAt || new Date().toISOString();
  const markdown = buildPkosMarkdown(data, { ...options, workspace, exportedAt });
  const result = await saveFile(markdown, `mindforge-${workspace}-knowledge-${exportedAt.slice(0, 10)}.md`, 'text/markdown');
  return result.cancelled ? 'Knowledge export cancelled. Your records are unchanged.'
    : result.native ? 'Knowledge export saved.' : 'Knowledge export download requested. Check your Downloads folder.';
}

