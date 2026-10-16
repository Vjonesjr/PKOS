import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// Daily cap on AI goal generations per user. Change here only.
const GOAL_DRAFT_DAILY_LIMIT = 10;

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

    const workspace = body.workspace || 'personal';

    if (action === 'project_status') {
      const project = await base44.entities.Project.get(body.projectId);
      if (!project || project.workspace !== workspace) return Response.json({ error: 'Project not found' }, { status: 404 });
      const tasks = await base44.entities.Task.filter({ project_id: body.projectId, workspace });
      const decisions = await base44.entities.Decision.filter({ project_id: body.projectId, workspace });
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
        base44.entities.Task.filter({ workspace }, '-updated_date', 100),
        base44.entities.Capture.filter({ workspace }, '-created_date', 50),
        base44.entities.Project.filter({ workspace }, '-updated_date', 50),
        base44.entities.Decision.filter({ workspace }, '-updated_date', 20),
        base44.entities.Lesson.filter({ workspace }, '-created_date', 20),
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
      if (!record || record.workspace !== workspace) return Response.json({ error: 'Record not found' }, { status: 404 });
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
      if (!record || record.workspace !== workspace) return Response.json({ error: 'Record not found' }, { status: 404 });
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
      const captures = await base44.entities.Capture.filter({ status: 'inbox', workspace }, '-created_date', 25);
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
      const captureIds = new Set(captures.map((c) => c.id));
      const allowedTypes = new Set(['idea', 'note', 'task', 'question', 'project_thought', 'learning_note', 'decision', 'lesson', 'reference', 'prompt']);
      result.suggestions = (result.suggestions || [])
        .filter((s) => captureIds.has(s.id) && allowedTypes.has(s.suggested_type))
        .map((s) => ({
          id: s.id,
          suggested_type: s.suggested_type,
          tags: (s.tags || []).filter((tag) => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean).slice(0, 3),
        }));
      return Response.json(result);
    }

    if (action === 'route_task') {
      const task = String(body.task || '').slice(0, 1000);
      const [tools, devices] = await Promise.all([
        base44.entities.Tool.filter({ workspace }, '-updated_date', 100),
        base44.entities.Device.filter({ workspace }, '-updated_date', 50),
      ]);
      if (!tools.length && !devices.length) return Response.json({ error: 'Add some tools or devices first.' }, { status: 400 });
      const strip = ({ created_by_id, created_by, created_date, updated_date, workspace: _w, ...r }) => r;
      const result = await invoke(
        base44,
        `Route this task to a workflow using ONLY the user's saved tools and devices below: "${task}".\nNo tool or device is permanently "best" — decide for this task based on saved capabilities, ratings, user notes/experience, cost, privacy, local/cloud, hardware requirements and task type. Every explanation must cite specific saved fields (e.g. "coding ability 5/5", "RAM 32GB", "notes say ..."). If saved info is missing or insufficient, say so. Build 3-6 stages (e.g. PLAN, IMPLEMENT, BUILD, VERIFY, QUICK REVIEW). Each stage uses a tool_id and/or device_id (exact ids) or null. Also give machine_fit for each relevant device: good_for and poor_for for THIS task, based on its hardware.\nTOOLS: ${JSON.stringify(tools.map(strip))}\nDEVICES: ${JSON.stringify(devices.map(strip))}`,
        {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            stages: { type: 'array', items: { type: 'object', properties: { stage: { type: 'string' }, tool_id: { type: 'string' }, device_id: { type: 'string' }, action: { type: 'string' }, explanation: { type: 'string' } }, required: ['stage', 'explanation'] } },
            machine_fit: { type: 'array', items: { type: 'object', properties: { device_id: { type: 'string' }, good_for: { type: 'array', items: { type: 'string' } }, poor_for: { type: 'array', items: { type: 'string' } } }, required: ['device_id'] } },
            missing_info: { type: 'string' },
          },
          required: ['summary', 'stages', 'machine_fit'],
        }
      );
      const tIds = new Set(tools.map((t) => t.id));
      const dIds = new Set(devices.map((d) => d.id));
      result.stages = (result.stages || []).map((s) => ({ ...s, tool_id: tIds.has(s.tool_id) ? s.tool_id : null, device_id: dIds.has(s.device_id) ? s.device_id : null }));
      result.machine_fit = (result.machine_fit || []).filter((m) => dIds.has(m.device_id));
      return Response.json(result);
    }

    if (action === 'daily_brief') {
      const today = /^\d{4}-\d{2}-\d{2}$/.test(body.today) ? body.today : new Date().toISOString().slice(0, 10);
      const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
      const [projects, tasks, captures, cards, learning] = await Promise.all([
        base44.entities.Project.filter({ workspace, status: 'Active' }, '-updated_date', 50),
        base44.entities.Task.filter({ workspace }, '-updated_date', 300),
        base44.entities.Capture.filter({ workspace, status: 'inbox' }, '-created_date', 30),
        base44.entities.Flashcard.filter({ workspace }, 'next_review_date', 300),
        base44.entities.LearningItem.filter({ workspace, status: 'in_progress' }, '-updated_date', 20),
      ]);
      const open = tasks.filter((t) => t.status !== 'done');
      const projTitle = Object.fromEntries(projects.map((p) => [p.id, p.title]));
      // Candidates carry only facts read from records; the AI may only choose among them.
      const cands = [];
      open.forEach((t) => {
        const facts = [`status ${t.status}`, `priority ${t.priority || 'medium'}`];
        if (t.due_date && t.due_date < today) facts.push(`overdue (due ${t.due_date})`);
        else if (t.due_date === today) facts.push('due today');
        else if (t.due_date) facts.push(`due ${t.due_date}`);
        if (projTitle[t.project_id]) facts.push(`in active project "${projTitle[t.project_id]}"`);
        if (t.today_date === today) facts.push('already on Today list');
        cands.push({ key: `task:${t.id}`, type: 'task', id: t.id, title: t.title, priority: t.priority || 'medium', project_id: t.project_id, facts });
      });
      projects.forEach((p) => {
        const overdue = open.filter((t) => t.project_id === p.id && t.due_date && t.due_date < today).length;
        const facts = [`status Active`, `priority ${p.priority || 'medium'}`];
        if (p.next_action) facts.push(`next action: "${p.next_action}"`); else facts.push('no next action set');
        if (p.blockers) facts.push(`blocker: "${p.blockers}"`);
        if (overdue) facts.push(`${overdue} overdue task(s)`);
        cands.push({ key: `project:${p.id}`, type: 'project', id: p.id, title: p.title, priority: p.priority || 'medium', facts });
      });
      captures.filter((c) => c.created_date >= weekAgo).forEach((c) => cands.push({ key: `capture:${c.id}`, type: 'capture', id: c.id, title: c.title || String(c.content).slice(0, 60), facts: ['unprocessed in inbox', `captured ${c.created_date.slice(0, 10)}`, c.important ? 'marked important' : ''].filter(Boolean) }));
      const due = cards.filter((c) => !c.next_review_date || c.next_review_date <= today).length;
      if (due) cands.push({ key: 'review:flashcards', type: 'review', id: 'flashcards', title: `Review ${due} flashcard(s)`, facts: [`${due} flashcard(s) due for review`] });
      learning.forEach((l) => cands.push({ key: `learning:${l.id}`, type: 'learning', id: l.id, title: l.title, facts: ['learning item in progress'] }));

      if (!cands.length) return Response.json({ sections: {}, candidates: 0 });
      const byKey = new Map(cands.map((c) => [c.key, c]));
      const itemSchema = { type: 'array', items: { type: 'object', properties: { key: { type: 'string' }, reason: { type: 'string' } }, required: ['key', 'reason'] } };
      const secs = ['top_focus', 'secondary_tasks', 'quick_win', 'blocker_to_resolve', 'learning_review', 'optional_items'];
      const ai = await invoke(
        base44,
        `Build a concise TODAY BRIEF for ${today}. Choose ONLY from the candidate keys below. Never invent deadlines, priorities or facts — each reason must cite the listed facts (e.g. "shown because it is Active and has 2 overdue tasks"). Do not repeat a key across sections. top_focus: 1 item. secondary_tasks: up to 4. quick_win: 1 small, easy item. blocker_to_resolve: 0-1 item that has a blocker fact. learning_review: 0-2 review/learning items. optional_items: up to 3.\nCANDIDATES: ${JSON.stringify(cands.map(({ key, title, facts }) => ({ key, title, facts })))}`,
        { type: 'object', properties: Object.fromEntries(secs.map((s) => [s, itemSchema])), required: secs }
      );
      const seen = new Set();
      const sections = Object.fromEntries(secs.map((s) => [s, (ai[s] || []).filter((i) => byKey.has(i.key) && !seen.has(i.key) && seen.add(i.key)).map((i) => {
        const { facts, ...c } = byKey.get(i.key);
        return { ...c, reason: i.reason, facts };
      })]));
      return Response.json({ sections, candidates: cands.length });
    }

    if (action === 'context_chat' || action === 'context_suggest') {
      const ENT = { capture: 'Capture', knowledge: 'Knowledge', project: 'Project', task: 'Task', decision: 'Decision', lesson: 'Lesson', learning: 'LearningItem' };
      const pack = await base44.entities.ContextPack.get(body.packId);
      if (!pack || pack.workspace !== workspace) return Response.json({ error: 'Context pack not found' }, { status: 404 });
      const items = (pack.items || []).filter((i) => ENT[i.type]).slice(0, 60);
      const loaded = (
        await Promise.all(items.map(async (i) => ({ type: i.type, rec: await base44.entities[ENT[i.type]].get(i.id).catch(() => null) })))
      ).filter((x) => x.rec && x.rec.workspace === workspace);
      const label = (r) => r.title || r.decision || r.learned || 'Untitled';
      const summarize = ({ type, rec }) => {
        const { id, created_by_id, created_by, workspace: _w, ...fields } = rec;
        return { type, ...fields, content: fields.content ? String(fields.content).slice(0, 1500) : undefined };
      };

      if (action === 'context_chat') {
        const question = String(body.question || '').slice(0, 1000);
        const history = (body.history || []).slice(-6).map((m) => `${m.role}: ${String(m.content).slice(0, 600)}`).join('\n');
        const prompt = `Answer using ONLY the context pack "${pack.name}" below plus the user's question. If the pack doesn't contain the needed information, say so rather than guessing.\nCONTEXT PACK: ${JSON.stringify(loaded.map(summarize))}\n\nConversation so far:\n${history}\n\nUser: ${question}`;
        const result = await invoke(base44, prompt, { type: 'object', properties: { answer: { type: 'string' } }, required: ['answer'] });
        return Response.json(result);
      }

      // Suggestions: records tied to the pack's projects (deterministic), plus AI-picked knowledge.
      const included = new Set(items.map((i) => `${i.type}:${i.id}`));
      const projectIds = loaded.filter((x) => x.type === 'project').map((x) => x.rec.id);
      const byProject = [];
      for (const pid of projectIds) {
        const lists = await Promise.all(
          ['task', 'decision', 'lesson', 'knowledge', 'learning', 'capture'].map(async (t) => (await base44.entities[ENT[t]].filter({ project_id: pid, workspace }, '-updated_date', 30)).map((rec) => ({ type: t, rec })))
        );
        byProject.push(...lists.flat());
      }
      const suggestions = new Map();
      byProject.forEach(({ type, rec }) => {
        const key = `${type}:${rec.id}`;
        if (!included.has(key)) suggestions.set(key, { type, id: rec.id, title: label(rec), reason: 'Belongs to a project in this pack' });
      });
      const knowledge = (await base44.entities.Knowledge.filter({ workspace }, '-updated_date', 80)).filter((k) => !included.has(`knowledge:${k.id}`) && !suggestions.has(`knowledge:${k.id}`));
      if (knowledge.length && loaded.length) {
        const ai = await invoke(
          base44,
          `Context pack "${pack.name}" (${pack.description || ''}) contains: ${JSON.stringify(loaded.map((x) => ({ type: x.type, title: label(x.rec) })))}.\nFrom these knowledge candidates, pick up to 6 that are genuinely relevant. Use exact ids: ${JSON.stringify(knowledge.map((k) => ({ id: k.id, title: k.title })))}`,
          { type: 'object', properties: { picks: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, reason: { type: 'string' } }, required: ['id'] } } }, required: ['picks'] }
        );
        const kMap = new Map(knowledge.map((k) => [k.id, k]));
        (ai.picks || []).forEach((p) => {
          const k = kMap.get(p.id);
          if (k) suggestions.set(`knowledge:${k.id}`, { type: 'knowledge', id: k.id, title: k.title, reason: p.reason || 'Related knowledge' });
        });
      }
      return Response.json({ suggestions: [...suggestions.values()].slice(0, 30) });
    }

    if (action === 'project_brief' || action === 'project_chat') {
      const project = await base44.entities.Project.get(body.projectId);
      if (!project || project.workspace !== workspace) return Response.json({ error: 'Project not found' }, { status: 404 });
      const pid = project.id;
      const [tasks, decisions, lessons, captures, linksOut, linksIn, allKnowledge] = await Promise.all([
        base44.entities.Task.filter({ project_id: pid, workspace }, '-updated_date', 60),
        base44.entities.Decision.filter({ project_id: pid, workspace }, '-updated_date', 30),
        base44.entities.Lesson.filter({ project_id: pid, workspace }, '-created_date', 30),
        base44.entities.Capture.filter({ project_id: pid, workspace }, '-created_date', 30),
        base44.entities.Link.filter({ source_type: 'project', source_id: pid, workspace }),
        base44.entities.Link.filter({ target_type: 'project', target_id: pid, workspace }),
        base44.entities.Knowledge.filter({ workspace }, '-updated_date', 100),
      ]);
      const linkedIds = new Set([
        ...linksOut.filter((l) => l.target_type === 'knowledge').map((l) => l.target_id),
        ...linksIn.filter((l) => l.source_type === 'knowledge').map((l) => l.source_id),
      ]);
      const linkedKnowledge = allKnowledge.filter((k) => linkedIds.has(k.id) || k.project_id === pid);
      const otherKnowledge = allKnowledge.filter((k) => !linkedKnowledge.includes(k)).map((k) => ({ id: k.id, title: k.title }));
      const today = new Date().toISOString().slice(0, 10);
      const overdue = tasks.filter((t) => t.status !== 'done' && t.due_date && t.due_date < today);
      const lastActivity = [project.updated_date, ...tasks.map((t) => t.updated_date), ...decisions.map((d) => d.updated_date)].sort().pop();
      const daysIdle = Math.floor((Date.now() - new Date(lastActivity).getTime()) / 86400000);
      const signals = [];
      if (daysIdle >= 14) signals.push(`No activity in ${daysIdle} days`);
      if (!project.next_action) signals.push('No next action set');
      if (overdue.length) signals.push(`${overdue.length} overdue task(s)`);
      if (project.blockers) signals.push('Unresolved blocker');
      if ((project.milestones || []).some((m) => !m.done && m.due_date && m.due_date < today)) signals.push('Incomplete milestone past due');

      const context = `Today: ${today}
PROJECT: ${JSON.stringify({ title: project.title, description: project.description, status: project.status, priority: project.priority, next_action: project.next_action, blockers: project.blockers, progress: project.progress, milestones: project.milestones, updated_date: project.updated_date })}
TASKS: ${JSON.stringify(tasks.map((t) => ({ title: t.title, status: t.status, priority: t.priority, due_date: t.due_date, updated_date: t.updated_date })))}
DECISIONS: ${JSON.stringify(decisions.map((d) => ({ title: d.title, decision: d.decision, status: d.status, date: d.date, reasoning: d.reasoning, actual_result: d.actual_result })))}
LESSONS: ${JSON.stringify(lessons.map((l) => ({ title: l.title, learned: l.learned, next_time: l.next_time })))}
PROJECT NOTES / CAPTURES: ${JSON.stringify(captures.map((c) => ({ title: c.title, content: (c.content || '').slice(0, 300), created_date: c.created_date })))}
LINKED KNOWLEDGE: ${JSON.stringify(linkedKnowledge.map((k) => ({ id: k.id, title: k.title, content: (k.content || '').slice(0, 400) })))}
ATTENTION SIGNALS (computed): ${JSON.stringify(signals)}`;

      if (action === 'project_chat') {
        const question = String(body.question || '').slice(0, 500);
        const history = (body.history || []).slice(-6).map((m) => `${m.role}: ${String(m.content).slice(0, 500)}`).join('\n');
        const prompt = `You are a project copilot. Answer ONLY using the records of this single project below. If the records don't contain the answer, say so plainly. Be concise and reference specific records by title. Never describe a project as failed; say it "may need attention" if relevant.\n${context}\n\nConversation so far:\n${history}\n\nUser question: ${question}`;
        const result = await invoke(base44, prompt, { type: 'object', properties: { answer: { type: 'string' } }, required: ['answer'] });
        return Response.json(result);
      }

      const prompt = `You are a project copilot. Produce a briefing for this ONE project using only the records below. Never call the project failed; if attention signals exist, use language like "This project may need attention."
Also propose up to 6 concrete suggestions. Types: task, milestone, note, research_question, knowledge_link, decision. For knowledge_link, knowledge_id MUST be one of these ids: ${JSON.stringify(otherKnowledge)}. Don't suggest things that already exist.
${context}`;
      const list = { type: 'array', items: { type: 'string' } };
      const result = await invoke(base44, prompt, {
        type: 'object',
        properties: {
          current_state: { type: 'string' },
          next_best_action: { type: 'string' },
          blockers: list,
          unfinished_work: list,
          recent_progress: list,
          relevant_knowledge: list,
          open_decisions: list,
          risks_questions: list,
          attention_note: { type: 'string' },
          suggestions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['task', 'milestone', 'note', 'research_question', 'knowledge_link', 'decision'] },
                title: { type: 'string' },
                detail: { type: 'string' },
                knowledge_id: { type: 'string' },
                reason: { type: 'string' },
              },
              required: ['type', 'title'],
            },
          },
        },
        required: ['current_state', 'next_best_action', 'suggestions'],
      });
      const validK = new Map(otherKnowledge.map((k) => [k.id, k.title]));
      result.suggestions = (result.suggestions || [])
        .filter((s) => s.type !== 'knowledge_link' || validK.has(s.knowledge_id))
        .map((s, i) => ({ ...s, key: `${i}`, ...(s.type === 'knowledge_link' ? { title: validK.get(s.knowledge_id) } : {}) }));
      result.signals = signals;
      return Response.json(result);
    }

    if (action === 'triage_inbox') {
      const ids = (body.ids || []).slice(0, 15);
      const captures = (await Promise.all(ids.map((id) => base44.entities.Capture.get(id).catch(() => null)))).filter(
        (c) => c && c.workspace === workspace && c.status === 'inbox'
      );
      if (captures.length === 0) return Response.json({ suggestions: [] });
      const [projects, knowledge, learning, decisions] = await Promise.all([
        base44.entities.Project.filter({ workspace }, '-updated_date', 60),
        base44.entities.Knowledge.filter({ workspace }, '-updated_date', 80),
        base44.entities.LearningItem.filter({ workspace }, '-updated_date', 40),
        base44.entities.Decision.filter({ workspace }, '-updated_date', 40),
      ]);
      const candidates = [
        ...knowledge.map((r) => ({ type: 'knowledge', id: r.id, title: r.title })),
        ...learning.map((r) => ({ type: 'learning', id: r.id, title: r.title })),
        ...decisions.map((r) => ({ type: 'decision', id: r.id, title: r.title || r.decision })),
      ];
      const projectList = projects.map((p) => ({ id: p.id, title: p.title }));
      const prompt = `You triage raw inbox captures in a personal knowledge system. For each capture, suggest ONE action from: keep, knowledge, task, learning, decision, lesson, archive.
Also suggest: a clean title, up to 4 short tags, an existing project id ONLY from the project list (or empty), up to 3 related existing records ONLY from the candidate list (use exact ids), an optional follow-up task title (or empty), and a one-sentence reason.
Never invent ids. If nothing fits, leave empty.
Projects: ${JSON.stringify(projectList)}
Candidate records: ${JSON.stringify(candidates)}
Captures: ${JSON.stringify(captures.map((c) => ({ id: c.id, title: c.title, content: (c.content || '').slice(0, 800), type: c.type, tags: c.tags })))}`;
      const result = await invoke(base44, prompt, {
        type: 'object',
        properties: {
          suggestions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                action: { type: 'string', enum: ['keep', 'knowledge', 'task', 'learning', 'decision', 'lesson', 'archive'] },
                title: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                project_id: { type: 'string' },
                related: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, id: { type: 'string' } }, required: ['type', 'id'] } },
                task_title: { type: 'string' },
                reason: { type: 'string' },
              },
              required: ['id', 'action', 'reason'],
            },
          },
        },
        required: ['suggestions'],
      });
      // Keep only real records: drop invented captures, projects, and related items.
      const captureIds = new Set(captures.map((c) => c.id));
      const projectIds = new Set(projects.map((p) => p.id));
      const candidateMap = new Map(candidates.map((c) => [`${c.type}:${c.id}`, c]));
      const suggestions = (result.suggestions || [])
        .filter((s) => captureIds.has(s.id))
        .map((s) => ({
          ...s,
          project_id: projectIds.has(s.project_id) ? s.project_id : '',
          related: (s.related || []).map((r) => candidateMap.get(`${r.type}:${r.id}`)).filter(Boolean),
        }));
      return Response.json({ suggestions, projects: projectList });
    }

    if (action === 'suggest_relationships') {
      const entityName = body.entityType === 'project' ? 'Project' : 'Knowledge';
      const record = await base44.entities[entityName].get(body.id);
      if (!record || record.workspace !== workspace) return Response.json({ error: 'Record not found' }, { status: 404 });
      const [knowledge, projects] = await Promise.all([
        base44.entities.Knowledge.filter({ workspace }, '-updated_date', 60),
        base44.entities.Project.filter({ workspace }, '-updated_date', 40),
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
      const candidateMap = new Map(candidates.map((candidate) => [`${candidate.type}:${candidate.id}`, candidate]));
      result.related = (result.related || [])
        .map((item) => {
          const candidate = candidateMap.get(`${item.type}:${item.id}`);
          return candidate ? { ...candidate, reason: item.reason || 'Related record' } : null;
        })
        .filter(Boolean);
      return Response.json(result);
    }

    if (action === 'summarize_records') {
      const entityName = body.entityType === 'project' ? 'Project' : body.entityType === 'capture' ? 'Capture' : body.entityType === 'learning' ? 'LearningItem' : 'Knowledge';
      const ids = (body.ids || []).slice(0, 15);
      const records = await Promise.all(ids.map((id) => base44.entities[entityName].get(id).catch(() => null)));
      const valid = records.filter((r) => r && r.workspace === workspace);
      const prompt = `Summarize the key points and any common themes across these records:\n${JSON.stringify(valid.map((r) => ({ title: r.title, content: r.content || r.description })))}`;
      const result = await invoke(base44, prompt, {
        type: 'object',
        properties: { summary: { type: 'string' }, themes: { type: 'array', items: { type: 'string' } } },
        required: ['summary'],
      });
      return Response.json(result);
    }

    if (action === 'automation_draft') {
      const request = String(body.request || '').slice(0, 1000);
      if (!request.trim()) return Response.json({ error: 'Empty request' }, { status: 400 });
      const catalog = body.catalog || {};
      const [projects, learning, knowledge] = await Promise.all([
        base44.entities.Project.filter({ workspace }, '-updated_date', 50),
        base44.entities.LearningItem.filter({ workspace }, '-updated_date', 50),
        base44.entities.Knowledge.filter({ workspace }, '-updated_date', 50),
      ]);
      const targets = [...learning.map((l) => ({ id: l.id, title: l.title, type: 'learning' })), ...knowledge.map((k) => ({ id: k.id, title: k.title, type: 'knowledge' }))];
      const prompt = `Turn the user's request into ONE simple automation rule for a personal knowledge app.\nRequest: "${request}"\nAvailable triggers: ${JSON.stringify(catalog.triggers)}\nAvailable conditions (field keys; value is a string, empty for no-value conditions): ${JSON.stringify(catalog.conditions)}\nAvailable actions (with required params): ${JSON.stringify(catalog.actions)}\nProjects: ${JSON.stringify(projects.map((p) => ({ id: p.id, title: p.title })))}\nLearning/knowledge targets: ${JSON.stringify(targets)}\nUse only the keys and ids listed. For "project" params set action_params.project_id. For "target" params set action_params.target_id and target_type. For "tag"/"text" set those. Pick the closest match; prefer the "text" condition for topics. Give a short name, a one-sentence description, and a one-sentence explanation.`;
      const d = await invoke(base44, prompt, {
        type: 'object',
        properties: {
          name: { type: 'string' }, description: { type: 'string' }, explanation: { type: 'string' },
          trigger: { type: 'string' }, action: { type: 'string' },
          conditions: { type: 'array', items: { type: 'object', properties: { field: { type: 'string' }, value: { type: 'string' } } } },
          action_params: { type: 'object', properties: { tag: { type: 'string' }, text: { type: 'string' }, project_id: { type: 'string' }, target_id: { type: 'string' }, target_type: { type: 'string' } } },
        },
        required: ['name', 'trigger', 'action'],
      });
      const p = d.action_params || {};
      const proj = projects.find((x) => x.id === p.project_id);
      const tgt = targets.find((x) => x.id === p.target_id);
      d.action_params = { tag: p.tag || '', text: p.text || '', ...(proj ? { project_id: proj.id, target_label: proj.title } : {}), ...(tgt ? { target_id: tgt.id, target_type: tgt.type, target_label: tgt.title } : {}) };
      if (d.explanation) d.description = d.description || d.explanation;
      return Response.json(d);
    }

    if (action === 'stalled_projects') {
      const projects = await base44.entities.Project.filter({ status: 'Active', workspace }, '-updated_date', 50);
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
      const flaggedMap = new Map(flagged.map((project) => [project.id, project]));
      result.stalled = (result.stalled || [])
        .map((item) => {
          const project = flaggedMap.get(item.id);
          return project ? { ...item, title: project.title } : null;
        })
        .filter(Boolean);
      return Response.json(result);
    }

    if (action === 'goal_draft_usage') {
      // Read-only: never counts toward the limit. `today` is the client's local calendar day.
      const today = /^\d{4}-\d{2}-\d{2}$/.test(body.today || '') ? body.today : new Date().toISOString().slice(0, 10);
      const used = user.goal_drafts_date === today ? (user.goal_drafts_count || 0) : 0;
      return Response.json({ used, limit: GOAL_DRAFT_DAILY_LIMIT });
    }

    if (action === 'draft_goal') {
      // Inputs are bounded; context is titles/ids only so cost stays flat as data grows.
      const text = String(body.text || '').slice(0, 1000).trim();
      const answer = String(body.answer || '').slice(0, 500).trim();
      if (!text) return Response.json({ error: 'Describe the goal first' }, { status: 400 });
      const today = /^\d{4}-\d{2}-\d{2}$/.test(body.today || '') ? body.today : new Date().toISOString().slice(0, 10);

      // Daily cap per user, tracked server-side on the user record so it can't be bypassed from the client.
      const DAILY_LIMIT = GOAL_DRAFT_DAILY_LIMIT;
      const used = user.goal_drafts_date === today ? (user.goal_drafts_count || 0) : 0;
      if (used >= DAILY_LIMIT) return Response.json({ error: `Daily limit reached (${DAILY_LIMIT} AI goal drafts). Try again tomorrow.` }, { status: 429 });
      await base44.asServiceRole.entities.User.update(user.id, { goal_drafts_date: today, goal_drafts_count: used + 1 });
      const remaining = DAILY_LIMIT - used - 1;

      const [goals, projects, habits] = await Promise.all([
        base44.entities.Goal.filter({ workspace, status: { $in: ['Active', 'Draft', 'Paused'] } }, '-updated_date', 15),
        base44.entities.Project.filter({ workspace, goal_id: null, status: { $in: ['Idea', 'Planned', 'Active'] } }, '-updated_date', 30),
        base44.entities.Habit.filter({ workspace, active: true, goal_id: null }, '-created_date', 30),
      ]);
      const ctx = {
        existing_goals: goals.map((g) => ({ id: g.id, title: g.title, area: g.area })),
        unlinked_projects: projects.map((p) => ({ id: p.id, title: p.title, status: p.status })),
        unlinked_habits: habits.map((h) => ({ id: h.id, title: h.title })),
      };
      const prompt = `You are a pragmatic goal coach inside a personal productivity app. Today is ${today}.
Turn the user's intent into ONE well-formed outcome goal (not an activity), with 1-4 measurable key results (each with a numeric target and a unit; current starts at 0).
Rules:
- If the intent is too vague to define a measurable outcome, set clarity="vague" and ask exactly one short clarifying_question; still return your best-guess draft.
- target_date must be in the future (yyyy-MM-dd). If the user's timeline looks unrealistic, keep it but add a warning.
- Only link projects/habits from the provided lists, using their exact ids, and only when clearly relevant. Never invent ids.
- Keep it practical and proportional: a simple goal gets a simple plan. Don't turn it into a big project plan.
- Also give: desired outcome (one sentence), 1-4 success criteria, priority (low/medium/high), up to 4 milestones (title + optional due_date in the future), ONE concrete first next action, up to 5 small suggested tasks, and up to 3 possible blockers.
- Suggest at most 3 new projects and 3 new habits, only if they materially help. Suggest a new project only when the goal is large enough to need one.
- If an existing goal overlaps, list it in overlaps with a short note.
- Answer in the user's language.
Hints: area=${body.area || 'none'}, target_date=${body.target_date || 'none'}
User intent: """${text}"""${answer ? `\nAnswer to your clarifying question: """${answer}"""` : ''}
Workspace context: ${JSON.stringify(ctx)}`;
      const r = await invoke(base44, prompt, {
        type: 'object',
        properties: {
          clarity: { type: 'string', enum: ['clear', 'vague'] },
          clarifying_question: { type: 'string' },
          goal: { type: 'object', properties: { title: { type: 'string' }, why: { type: 'string' }, outcome: { type: 'string' }, area: { type: 'string' }, target_date: { type: 'string' }, priority: { type: 'string', enum: ['low', 'medium', 'high'] }, next_action: { type: 'string' } } },
          success_criteria: { type: 'array', items: { type: 'string' } },
          milestones: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, due_date: { type: 'string' } } } },
          suggested_tasks: { type: 'array', items: { type: 'string' } },
          blockers: { type: 'array', items: { type: 'string' } },
          key_results: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, target: { type: 'number' }, unit: { type: 'string' } } } },
          link_projects: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, reason: { type: 'string' } } } },
          new_projects: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, next_action: { type: 'string' } } } },
          link_habits: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, reason: { type: 'string' } } } },
          new_habits: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, schedule_type: { type: 'string', enum: ['daily', 'weekdays', 'per_week'] }, per_week_target: { type: 'number' } } } },
          overlaps: { type: 'array', items: { type: 'object', properties: { goal_id: { type: 'string' }, note: { type: 'string' } } } },
          warnings: { type: 'array', items: { type: 'string' } },
        },
        required: ['clarity', 'goal', 'key_results'],
      });

      // Validate everything against real records before returning.
      const AREAS = ['Career', 'Health', 'Learning', 'Finance', 'Relationships', 'Personal', 'Other'];
      const byId = (list) => new Map(list.map((x) => [x.id, x]));
      const pMap = byId(ctx.unlinked_projects), hMap = byId(ctx.unlinked_habits), gMap = byId(ctx.existing_goals);
      const g = r.goal || {};
      return Response.json({
        clarity: r.clarity,
        clarifying_question: r.clarity === 'vague' ? r.clarifying_question || '' : '',
        goal: {
          title: String(g.title || text).slice(0, 200),
          why: String(g.why || '').slice(0, 1000),
          area: AREAS.includes(g.area) ? g.area : 'Personal',
          target_date: /^\d{4}-\d{2}-\d{2}$/.test(g.target_date || '') && g.target_date > today ? g.target_date : '',
          outcome: String(g.outcome || '').slice(0, 500),
          priority: ['low', 'medium', 'high'].includes(g.priority) ? g.priority : 'medium',
          next_action: String(g.next_action || '').slice(0, 200),
          success_criteria: (r.success_criteria || []).filter(Boolean).slice(0, 4).map((s) => String(s).slice(0, 200)),
          blockers: (r.blockers || []).filter(Boolean).slice(0, 3).map((s) => String(s).slice(0, 200)),
          milestones: (r.milestones || []).filter((m) => m?.title).slice(0, 4).map((m) => ({ title: String(m.title).slice(0, 200), done: false, due_date: /^\d{4}-\d{2}-\d{2}$/.test(m.due_date || '') && m.due_date > today ? m.due_date : '' })),
        },
        suggested_tasks: (r.suggested_tasks || []).filter(Boolean).slice(0, 5).map((s) => String(s).slice(0, 200)),
        key_results: (r.key_results || []).slice(0, 4).filter((k) => k.title && k.target > 0).map((k) => ({ title: k.title, current: 0, target: k.target, unit: k.unit || '' })),
        link_projects: (r.link_projects || []).filter((x) => pMap.has(x.id)).map((x) => ({ ...x, title: pMap.get(x.id).title })),
        new_projects: (r.new_projects || []).slice(0, 3).filter((x) => x.title),
        link_habits: (r.link_habits || []).filter((x) => hMap.has(x.id)).map((x) => ({ ...x, title: hMap.get(x.id).title })),
        new_habits: (r.new_habits || []).slice(0, 3).filter((x) => x.title),
        overlaps: (r.overlaps || []).filter((x) => gMap.has(x.goal_id)).map((x) => ({ ...x, title: gMap.get(x.goal_id).title })),
        warnings: (r.warnings || []).slice(0, 3),
        remaining,
        used: used + 1,
        limit: DAILY_LIMIT,
      });
    }

    if (action === 'weekly_goal_summary') {
      const week = /^\d{4}-\d{2}-\d{2}$/.test(body.week_start || '') ? body.week_start : null;
      if (!week) return Response.json({ error: 'week_start required' }, { status: 400 });
      const [checkins, goals, doneCount] = await Promise.all([
        base44.entities.GoalCheckin.filter({ workspace, week_start: week }, '-updated_date', 20),
        base44.entities.Goal.filter({ workspace, status: 'Active' }, '-updated_date', 20),
        base44.entities.Task.count({ workspace, status: 'done', updated_date: { $gte: `${week}T00:00:00` } }),
      ]);
      const titles = new Map(goals.map((g) => [g.id, g.title]));
      const data = checkins.map((c) => ({ goal: titles.get(c.goal_id) || 'Goal', status: c.status, progress: c.progress_snapshot, note: c.note || '' }));
      const prompt = `You are reviewing a user's week in a personal productivity app. Be encouraging but honest ("progress over judgment").
Goal check-ins this week: ${JSON.stringify(data)}
Active goals without a check-in: ${JSON.stringify(goals.filter((g) => !checkins.some((c) => c.goal_id === g.id)).map((g) => g.title))}
Tasks completed this week: ${doneCount}
Return 3-5 short, specific insights and one suggested focus for next week (one sentence).`;
      const r = await invoke(base44, prompt, {
        type: 'object',
        properties: { insights: { type: 'array', items: { type: 'string' } }, focus: { type: 'string' } },
        required: ['insights', 'focus'],
      });
      return Response.json({ insights: (r.insights || []).slice(0, 5), focus: r.focus || '' });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}