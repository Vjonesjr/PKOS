export async function workspaceRecords(entity, workspace, query = {}) {
  const records = []; let cursor = null; const seen = new Set();
  do {
    const page = await entity.filter({ ...query, workspace }, { sort: '-updated_date', limit: 500, cursor });
    if (!Array.isArray(page?.items)) throw new Error('Could not read records. Please retry.');
    records.push(...page.items.filter(record => record.workspace === workspace)); cursor = page.next_cursor;
    if (cursor && seen.has(cursor)) throw new Error('Could not finish loading records. Please retry.');
    if (cursor) seen.add(cursor);
  } while (cursor);
  return records;
}
