import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Only these file types are processed; anything else is rejected server-side.
const TEXT_TYPES = ['text/plain', 'text/markdown'];
const ALLOWED = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', ...TEXT_TYPES];
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_TEXT = 50000;
const DAILY_LIMIT = 30;
const TYPES = ['note', 'task', 'knowledge', 'decision', 'lesson', 'learning', 'idea'];

const SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    summary: { type: 'string' },
    text: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
    suggestions: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, title: { type: 'string' }, content: { type: 'string' } } } },
  },
};

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
      const isText = TEXT_TYPES.includes(doc.mime_type);

      // Text/Markdown: read the bytes directly so extracted text is exact, not AI-generated.
      let rawText = '';
      if (isText) {
        const res = await fetch(signed_url, { signal: AbortSignal.timeout(20000) });
        if (!res.ok) throw new Error(`Could not read file (HTTP ${res.status})`);
        rawText = (await res.text()).slice(0, MAX_TEXT);
        if (!rawText.trim()) throw new Error('The file is empty');
      }

      const ask = `Return: title (short), summary (2-4 sentences), ${isText ? '' : 'text (the full extracted text, plain, keep line breaks; empty string if nothing is readable), '}tags (up to 5 short lowercase), suggestions (up to 8 distinct items worth saving, each with type one of ${TYPES.join(', ')}, a short title, and content). Only include items actually present. Never invent content.`;
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: isText
          ? `You are processing "${doc.file_name}" for a personal knowledge system. Its content:\n---\n${rawText}\n---\n${ask}`
          : `You are processing "${doc.file_name}" for a personal knowledge system. Read the whole file (for images, read all visible text and briefly describe what it shows). ${ask}`,
        file_urls: isText ? undefined : [signed_url],
        response_json_schema: SCHEMA,
      });

      const text = isText ? rawText : String(result.text || '').slice(0, MAX_TEXT);
      if (!text.trim()) throw new Error('No readable text could be extracted from this file');

      const suggestions = (result.suggestions || []).slice(0, 8).map((s) => ({
        type: TYPES.includes(s.type) ? s.type : 'note',
        title: String(s.title || '').slice(0, 200),
        content: String(s.content || '').slice(0, 5000),
      }));
      // Keep tags the user added; only append AI tags.
      const aiTags = (result.tags || []).slice(0, 5).map((t) => String(t).toLowerCase().slice(0, 40));
      const tags = [...new Set([...(doc.tags || []), ...aiTags])];
      const updated = await base44.entities.Document.update(document_id, {
        title: doc.title || String(result.title || doc.file_name).slice(0, 200),
        summary: String(result.summary || '').slice(0, 2000),
        extracted_text: text,
        extraction_method: isText ? 'direct' : 'ai',
        tags,
        // Re-processing keeps suggestions that were already sent.
        suggestions: [...(doc.suggestions || []).filter((s) => s.sent_id), ...suggestions],
        status: 'ready',
      });
      return Response.json({ document: updated });
    } catch (e) {
      const message = String(e.message || e).slice(0, 500);
      await base44.entities.Document.update(document_id, { status: 'failed', error: message });
      return Response.json({ error: message }, { status: 502 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}