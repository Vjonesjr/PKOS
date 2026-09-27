import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

async function invoke(base44, prompt, schema) {
  return base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: schema,
  });
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const action = body.action;

    if (action === 'project_status') {
      const project = await base44.entities.Project.get(body.projectId);
      const tasks = await base44.entities.Task.filter({ project_id: body.projectId });
      const decisions = await base44.entities.Decision.filter({ project_id: body.projectId });
      const prompt = `You are analyzing a personal project for a knowledge management app.\nProject: ${JSON.stringify(project)}\nTasks: ${JSON.stringify(tasks.slice(0, 30))}\nDecisions: ${JSON.stringify(decisions.slice(0, 10))}\nWrite a short honest status summary (2-3 sentences), then list up to 3 concrete next actions, and state whether the project looks stalled (no clear next action or no recent progress) with a one-sentence reason.`;
      const result = await invoke(base44, prompt, {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          next_actions: { type: 'array', items: { type: 'string' } },
          stalled: { type: 'boolean' },
          stalled_reason: { type: 'string' },
        },
        required: ['summary', 'next_actions', 'stalled'],
      });
      return Response.json(result);
    }

    if (action === 'daily_review' || action === 'weekly_review') {
      const days = action === 'daily_review' ? 1 : 7;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const [tasks, captures, projects, decisions, lessons] = await Promise.all([
        base44.entities.Task.list('-updated_date', 100),
        base44.entities.Capture.list('-created_date', 50),
        base44.entities.Project.list('-updated_date', 50),
        base44.entities.Decision.list('-updated_date', 20),
        base44.entities.Lesson.list('-created_date', 20),
      ]);
      const recentTasks = tasks.filter((t) => t.updated_date >= since);
      const recentCaptures = captures.filter((c) => c.created_date >= since);
      const recentDecisions = decisions.filter((d) => d.updated_date >= since);
      const recentLessons = lessons.filter((l) => l.created_date >= since);
      const prompt = `Prepare a ${action === 'daily_review' ? 'daily' : 'weekly'} review for a personal knowledge system.\nRecently updated tasks: ${JSON.stringify(recentTasks.slice(0, 40))}\nNew captures: ${JSON.stringify(recentCaptures.slice(0, 30))}\nActive projects: ${JSON.stringify(projects.filter((p) => p.status === 'Active').slice(0, 20))}\nRecent decisions: ${JSON.stringify(recentDecisions)}\nRecent lessons: ${JSON.stringify(recentLessons)}\nReturn: what was completed, what is unfinished, notable new captures, current priorities to focus on next, and (for weekly only, else empty) which projects look stalled.`;
      const result = await invoke(base44, prompt, {
        type: 'object',
        properties: {
          completed: { type: 'array', items: { type: 'string' } },
          unfinished: { type: 'array', items: { type: 'string' } },
          new_captures: { type: 'array', items: { type: 'string' } },
          priorities: { type: 'array', items: { type: 'string' } },
          stalled_projects: { type: 'array', items: { type: 'string' } },
        },
        required: ['completed', 'unfinished', 'priorities'],
      });
      return Response.json(result);
    }

    if (action === 'notes_to_tasks') {
      const record = await base44.entities[body.entityType === 'capture' ? 'Capture' : 'Knowledge'].get(body.id);
      const prompt = `Extract concrete, actionable tasks from this note. Only include real action items, not general statements.\nTitle: ${record.title}\nContent: ${record.content || ''}`;
      const result = await invoke(base44, prompt, {
        type: 'object',
        properties: { tasks: { type: 'array', items: { type: 'string' } } },
        required: ['tasks'],
      });
      return Response.json(result);
    }

    if (action === 'create_flashcards') {
      const entityName = body.entityType === 'learning' ? 'LearningItem' : 'Knowledge';
      const record = await base44.entities[entityName].get(body.id);
      const prompt = `Create up to 8 flashcards (front = question/prompt, back = concise answer) from this material, useful for spaced-repetition review.\nTitle: ${record.title}\nContent: ${record.content || ''}`;
      const result = await invoke(base44, prompt, {
        type: 'object',
        properties: {
          flashcards: {
            type: 'array',
            items: { type: 'object', properties: { front: { type: 'string' }, back: { type: 'string' } }, required: ['front', 'back'] },
          },
        },
        required: ['flashcards'],
      });
      return Response.json(result);
    }

    if (action === 'organize_inbox') {
      const captures = await base44.entities.Capture.filter({ status: 'inbox' }, '-created_date', 25);
      if (captures.length === 0) return Response.json({ suggestions: [] });
      const prompt = `For each capture below, suggest the best type from [idea, note, task, question, project_thought, learning_note, decision, lesson, reference, prompt] and up to 3 short tags. Captures: ${JSON.stringify(
        captures.map((c) => ({ id: c.id, title: c.title, content: c.content, current_type: c.type }))
      )}`;
      const result = await invoke(base44, prompt, {
        type: 'object',
        properties: {
          suggestions: {
            type: 'array',
            items: {
              type: 'object',
              properties: { id: { type: 'string' }, suggested_type: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } } },
              required: ['id', 'suggested_type'],
            },
          },
        },
        required: ['suggestions'],
      });
      return Response.json(result);
    }

    if (action === 'suggest_relationships') {
      const entityName = body.entityType === 'project' ? 'Project' : 'Knowledge';
      const record = await base44.entities[entityName].get(body.id);
      const [knowledge, projects] = await Promise.all([
        base44.entities.Knowledge.list('-updated_date', 60),
        base44.entities.Project.list('-updated_date', 40),
      ]);
      const candidates = [
        ...knowledge.filter((k) => k.id !== body.id).map((k) => ({ type: 'knowledge', id: k.id, title: k.title })),
        ...projects.filter((p) => p.id !== body.id).map((p) => ({ type: 'project', id: p.id, title: p.title })),
      ];
      const prompt = `Given this record: "${record.title}" - ${(record.content || record.description || '').slice(0, 500)}\nFrom this candidate list, pick up to 5 that are genuinely related: ${JSON.stringify(candidates)}\nReturn only the ids and types of genuinely related ones with a short reason each.`;
      const result = await invoke(base44, prompt, {
        type: 'object',
        properties: {
          related: {
            type: 'array',
            items: { type: 'object', properties: { type: { type: 'string' }, id: { type: 'string' }, title: { type: 'string' }, reason: { type: 'string' } }, required: ['type', 'id'] },
          },
        },
        required: ['related'],
      });
      return Response.json(result);
    }

    if (action === 'summarize_records') {
      const entityName = body.entityType === 'project' ? 'Project' : body.entityType === 'capture' ? 'Capture' : 'Knowledge';
      const ids = (body.ids || []).slice(0, 15);
      const records = await Promise.all(ids.map((id) => base44.entities[entityName].get(id).catch(() => null)));
      const valid = records.filter(Boolean);
      const prompt = `Summarize the key points and any common themes across these records:\n${JSON.stringify(valid.map((r) => ({ title: r.title, content: r.content || r.description })))}`;
      const result = await invoke(base44, prompt, {
        type: 'object',
        properties: { summary: { type: 'string' }, themes: { type: 'array', items: { type: 'string' } } },
        required: ['summary'],
      });
      return Response.json(result);
    }

    if (action === 'stalled_projects') {
      const projects = await base44.entities.Project.filter({ status: 'Active' }, '-updated_date', 50);
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const flagged = projects.filter((p) => p.updated_date < twoWeeksAgo || !p.next_action);
      const prompt = `These active projects may be stalled (no update in 14+ days, or no next action set): ${JSON.stringify(
        flagged.map((p) => ({ id: p.id, title: p.title, next_action: p.next_action, updated_date: p.updated_date }))
      )}\nFor each, give a one-sentence reason it may be stalled and a suggested next action.`;
      if (flagged.length === 0) return Response.json({ stalled: [] });
      const result = await invoke(base44, prompt, {
        type: 'object',
        properties: {
          stalled: {
            type: 'array',
            items: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' }, reason: { type: 'string' }, suggested_next_action: { type: 'string' } }, required: ['id'] },
          },
        },
        required: ['stalled'],
      });
      return Response.json(result);
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}