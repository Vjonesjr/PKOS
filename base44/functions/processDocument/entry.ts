import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Only these file types are processed; anything else is rejected server-side.
const ALLOWED = ['application/pdf', 'text/plain', 'image/png', 'image/jpeg'];
const MAX_BYTES = 10 * 1024 * 1024;
const DAILY_LIMIT = 30;
const TYPES = ['note', 'task', 'knowledge', 'decision', 'lesson', 'learning', 'idea'];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { document_id } = await req.json();
    if (!document_id) return Response.json({ error: 'document_id required' }, { status: 400 });

    // User-scoped read: RLS guarantees the caller owns this document.
    const doc = await base44.entities.Document.get(document_id);
    if (!doc) return Response.json({ error: 'Not found' }, { status: 404 });
    if (!ALLOWED.includes(doc.mime_type)) return Response.json({ error: 'Unsupported file type' }, { status: 400 });
    if ((doc.size || 0) > MAX_BYTES) return Response.json({ error: 'File too large (10 MB max)' }, { status: 400 });

    const today = new Date().toISOString().slice(0, 10);
    const used = await base44.entities.Document.count({ created_by_id: user.id, processed_date: today });
    if (used >= DAILY_LIMIT) return Response.json({ error: `Daily limit of ${DAILY_LIMIT} documents reached` }, { status: 429 });

    await base44.entities.Document.update(document_id, { status: 'processing', error: '', processed_date: today });

    try {
      const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: doc.file_uri, expires_in: 600 });
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are processing a document for a personal knowledge system. The file is "${doc.file_name}".
Read the whole file (if it is an image or screenshot, read all visible text and describe what it shows).
Return:
- title: a short descriptive title
- summary: 2-4 sentence summary
- text: the full extracted text (plain text, keep structure with line breaks)
- tags: up to 5 short lowercase tags
- suggestions: up to 8 distinct items worth saving, each with type (one of ${TYPES.join(', ')}), a short title, and content. Only include items actually present in the document.`,
        file_urls: [signed_url],
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            summary: { type: 'string' },
            text: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            suggestions: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, title: { type: 'string' }, content: { type: 'string' } } } },
          },
        },
      });

      const suggestions = (result.suggestions || []).slice(0, 8).map((s) => ({
        type: TYPES.includes(s.type) ? s.type : 'note',
        title: String(s.title || '').slice(0, 200),
        content: String(s.content || '').slice(0, 5000),
      }));
      const updated = await base44.entities.Document.update(document_id, {
        title: doc.title || String(result.title || doc.file_name).slice(0, 200),
        summary: String(result.summary || '').slice(0, 2000),
        extracted_text: String(result.text || '').slice(0, 50000), // cap to keep records small
        tags: (result.tags || []).slice(0, 5).map((t) => String(t).slice(0, 40)),
        suggestions,
        status: 'ready',
      });
      return Response.json({ document: updated });
    } catch (e) {
      await base44.entities.Document.update(document_id, { status: 'failed', error: String(e.message || e).slice(0, 500) });
      return Response.json({ error: 'Processing failed' }, { status: 502 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}