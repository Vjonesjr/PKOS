import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const W = 'demo';

    // Dates: the demo story was authored around ANCHOR; shift every date so it stays
    // relative to "today" (user timezone) and the demo never looks stale.
    const TZ = 'America/New_York';
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
    const DAY = 864e5;
    const addDays = (s, n) => new Date(Date.parse(`${s}T12:00:00Z`) + n * DAY).toISOString().slice(0, 10);
    const ANCHOR = '2026-09-28';
    const offset = Math.round((Date.parse(`${today}T12:00:00Z`) - Date.parse(`${ANCHOR}T12:00:00Z`)) / DAY);
    const shift = (s) => (s ? addDays(s, offset) : s);

    await Promise.all([
      base44.entities.Goal.deleteMany({ workspace: W }),
      base44.entities.Habit.deleteMany({ workspace: W }),
      base44.entities.HabitLog.deleteMany({ workspace: W }),
      base44.entities.GoalCheckin.deleteMany({ workspace: W }),
      base44.entities.Capture.deleteMany({ workspace: W }),
      base44.entities.Knowledge.deleteMany({ workspace: W }),
      base44.entities.Project.deleteMany({ workspace: W }),
      base44.entities.Task.deleteMany({ workspace: W }),
      base44.entities.Decision.deleteMany({ workspace: W }),
      base44.entities.Lesson.deleteMany({ workspace: W }),
      base44.entities.LearningItem.deleteMany({ workspace: W }),
      base44.entities.Flashcard.deleteMany({ workspace: W }),
      base44.entities.ReviewEntry.deleteMany({ workspace: W }),
      base44.entities.Link.deleteMany({ workspace: W }),
      base44.entities.ContextPack.deleteMany({ workspace: W }),
      base44.entities.Tool.deleteMany({ workspace: W }),
      base44.entities.Device.deleteMany({ workspace: W }),
      base44.entities.AutomationRun.deleteMany({ workspace: W }),
      base44.entities.AutomationRecipe.deleteMany({ workspace: W }),
      base44.entities.DailyDigest.deleteMany({ workspace: W }),
    ]);

    // ---------- Projects ----------
    const projectsData = [
      {
        title: 'Personal Portfolio Website',
        description: 'A responsive personal site showcasing case studies, resume, and contact info.',
        status: 'Active',
        priority: 'high',
        progress: 65,
        next_action: "Finish the case study write-up for the analytics dashboard project",
        blockers: 'Waiting on final headshot photos from the photographer',
        milestones: [
          { title: 'Design mockups approved', done: true },
          { title: 'Homepage built', done: true },
          { title: 'Case studies written', done: false },
          { title: 'Deploy to custom domain', done: false },
        ],
      },
      {
        title: 'Data Analytics Job Search',
        description: 'Structured search for a data analyst role: applications, networking, interview prep.',
        status: 'Active',
        priority: 'high',
        progress: 45,
        next_action: "Follow up with three recruiters from last week's networking event",
        blockers: '',
        milestones: [
          { title: 'Resume rewritten', done: true },
          { title: 'LinkedIn optimized', done: true },
          { title: '20 applications sent', done: false },
          { title: 'First interview', done: false },
        ],
      },
      {
        title: 'Home Office Upgrade',
        description: 'Ergonomic and productivity improvements to the home office setup.',
        status: 'Planned',
        priority: 'low',
        progress: 15,
        next_action: 'Measure desk space and order a monitor arm',
        blockers: 'Budget approval pending',
        milestones: [
          { title: 'Budget set', done: true },
          { title: 'Desk chosen', done: false },
          { title: 'Monitor arm installed', done: false },
        ],
      },
      {
        title: 'Learn Python for Data Analysis',
        description: 'Build practical Python skills for data cleaning, analysis, and visualization.',
        status: 'Active',
        priority: 'medium',
        progress: 55,
        next_action: 'Finish the Pandas groupby exercises',
        blockers: '',
        milestones: [
          { title: 'Python basics', done: true },
          { title: 'Pandas fundamentals', done: true },
          { title: 'Data visualization', done: false },
          { title: 'Capstone project', done: false },
        ],
      },
      {
        title: 'Small Business Launch',
        description: 'Launching a freelance data consulting side business.',
        status: 'Waiting',
        priority: 'medium',
        progress: 30,
        next_action: 'Waiting on LLC registration confirmation from the state',
        blockers: 'State filing backlog — 3 week wait',
        milestones: [
          { title: 'Business plan drafted', done: true },
          { title: 'LLC filed', done: true },
          { title: 'Website live', done: false },
          { title: 'First client', done: false },
        ],
      },
      {
        title: 'Personal Knowledge System Research',
        description: 'Researching methods and tools for building a durable personal knowledge system.',
        status: 'Active',
        priority: 'high',
        progress: 70,
        next_action: 'Write up findings on the Zettelkasten method',
        blockers: '',
        milestones: [
          { title: 'Survey existing tools', done: true },
          { title: 'Read core PKM books', done: true },
          { title: 'Draft personal methodology', done: false },
          { title: 'Build first working system', done: false },
        ],
      },
      {
        title: 'Mobile App Prototype',
        description: 'Early exploration of a mobile app idea for habit tracking.',
        status: 'Idea',
        priority: 'low',
        progress: 10,
        next_action: 'Sketch the core screens on paper',
        blockers: '',
        milestones: [
          { title: 'Idea validated with 3 people', done: false },
          { title: 'Wireframes sketched', done: false },
        ],
      },
      {
        title: '10K Training Plan',
        description: 'Eight-week plan to go from 5K to a comfortable 10K.',
        status: 'Active',
        priority: 'medium',
        progress: 50,
        next_action: 'Run the 7.5 km long run on Sunday',
        blockers: '',
        milestones: [
          { title: 'Run 5K without stopping', done: true },
          { title: 'Long run of 7 km', done: true },
          { title: 'Long run of 9 km', done: false },
          { title: 'Race day', done: false },
        ],
      },
      {
        title: 'Resume & LinkedIn Refresh',
        description: 'Rewrite resume and LinkedIn profile around data analytics outcomes.',
        status: 'Completed',
        priority: 'high',
        progress: 100,
        next_action: '',
        blockers: '',
        milestones: [
          { title: 'Resume rewritten', done: true },
          { title: 'LinkedIn headline and about updated', done: true },
          { title: 'Reviewed by 2 mentors', done: true },
        ],
      },
    ];
    const projects = await base44.entities.Project.bulkCreate(projectsData.map((p) => ({ ...p, workspace: W })));
    const proj = {};
    projects.forEach((p, i) => { proj[projectsData[i].title] = p.id; });

    // ---------- Knowledge ----------
    const knowledgeData = [
      { title: 'AI Model Routing', type: 'concept', tags: ['ai', 'architecture', 'routing'], category: 'AI', favorite: true, content: 'Model routing sends each request to the cheapest model capable of handling it well, reserving expensive models for complex reasoning. A good router considers task complexity, latency needs, and cost per token.', project: 'Personal Knowledge System Research' },
      { title: 'Local vs Cloud AI', type: 'concept', tags: ['ai', 'infrastructure'], category: 'AI', content: 'Local models trade raw capability for privacy, offline access, and zero marginal cost. Cloud models win on capability and ease of scaling but add latency and per-call cost. Most production systems end up hybrid.', project: 'Personal Knowledge System Research' },
      { title: 'Dashboard Design Principles', type: 'reference', tags: ['dashboard', 'design', 'ui'], category: 'Design', content: 'Good dashboards answer one clear question per view, use a consistent visual hierarchy, and avoid more than 5-7 key metrics on a single screen. Group related metrics; use color sparingly and meaningfully.', project: 'Personal Portfolio Website' },
      { title: 'Mobile-First UI Design', type: 'reference', tags: ['ui', 'design', 'mobile'], category: 'Design', content: 'Designing for the smallest screen first forces prioritization. Thumb-reachable zones, single-column layouts, and generous tap targets translate well back up to desktop.', project: 'Mobile App Prototype' },
      { title: 'Retrieval Practice', type: 'concept', tags: ['learning', 'memory', 'search'], category: 'Learning Science', content: 'Actively recalling information — rather than re-reading it — strengthens memory far more effectively. Flashcards and self-quizzing beat highlighting and re-reading.', project: 'Personal Knowledge System Research' },
      { title: 'Search UX Principles', type: 'reference', tags: ['search', 'ux', 'dashboard'], category: 'Design', favorite: true, content: 'Good search surfaces results instantly, highlights matched terms, and groups results by type. Search-as-you-type with debounced queries feels responsive without overwhelming the backend.', project: 'Personal Portfolio Website' },
      { title: 'SQL Window Functions', type: 'note', tags: ['sql', 'analytics', 'python'], category: 'Data', content: 'Window functions like ROW_NUMBER(), RANK(), and LAG()/LEAD() let you compute values across a set of rows related to the current row, without collapsing the result set like GROUP BY does.', project: 'Learn Python for Data Analysis' },
      { title: 'Power BI DAX Basics', type: 'note', tags: ['powerbi', 'analytics'], category: 'Data', content: "DAX measures are calculated on the fly based on filter context, while calculated columns are computed once at load. CALCULATE() is the core function for modifying filter context.", project: 'Learn Python for Data Analysis' },
      { title: 'Python Pandas Tips', type: 'note', tags: ['python', 'analytics'], category: 'Data', content: "groupby().agg() with a dict lets you apply different aggregations per column in one pass. merge() with how='left' preserves the left dataframe's rows even without a match.", project: 'Learn Python for Data Analysis' },
      { title: 'Prompt Engineering Patterns', type: 'concept', tags: ['ai', 'prompt', 'project'], category: 'AI', content: 'Few-shot examples, explicit output format instructions, and asking the model to reason step-by-step before answering all reliably improve output quality on complex tasks.' },
      { title: 'AI Agents Architecture', type: 'concept', tags: ['ai', 'agents', 'architecture'], category: 'AI', content: 'An agent loop typically consists of: perceive (gather context), plan (decide next action), act (call a tool), and observe (read the result) — repeated until the goal is met or a limit is hit.' },
      { title: 'Product Design Heuristics', type: 'reference', tags: ['design', 'product'], category: 'Design', content: "Nielsen's 10 usability heuristics remain the fastest checklist for a design review: visibility of system status, user control, consistency, error prevention, recognition over recall, and more.", project: 'Personal Portfolio Website' },
      { title: 'Personal Finance Basics', type: 'personal', tags: ['finance', 'project'], category: 'Finance', content: 'Pay yourself first: automate a fixed percentage of income into savings before it hits your checking account. A 3-6 month expense buffer removes most financial decision-making stress.', project: 'Small Business Launch' },
      { title: 'Networking for Job Search', type: 'reference', tags: ['job-search', 'networking'], category: 'Career', content: 'Informational interviews — asking about someone\'s role rather than for a job — open more doors than cold applications. Aim for 3-5 genuine conversations per week during an active search.', project: 'Data Analytics Job Search' },
      { title: 'Resume Optimization', type: 'reference', tags: ['job-search', 'resume'], category: 'Career', content: "Lead each bullet with the result, not the task: 'Reduced report generation time by 40%' beats 'Built automated reports.' Quantify wherever possible.", project: 'Data Analytics Job Search' },
      { title: 'Portfolio Case Study Structure', type: 'reference', tags: ['portfolio', 'design', 'project'], category: 'Career', content: 'A strong case study covers: the problem, constraints, your process, the decision points and why, and the measurable outcome. Skip the visual tour — lead with the thinking.', project: 'Personal Portfolio Website' },
      { title: 'Home Office Ergonomics', type: 'note', tags: ['home-office', 'health'], category: 'Productivity', status: 'archived', content: 'Monitor top at eye level, elbows at roughly 90 degrees, feet flat on the floor. A monitor arm is often the highest-leverage single purchase for a home office.', project: 'Home Office Upgrade' },
      { title: 'Small Business Legal Structures', type: 'reference', tags: ['business', 'legal'], category: 'Business', status: 'archived', content: 'An LLC separates personal and business liability with minimal paperwork compared to a corporation, and profits pass through to personal tax returns, avoiding double taxation.', project: 'Small Business Launch' },
      { title: 'Second Brain Methodology', type: 'concept', tags: ['pkm', 'project', 'dashboard'], category: 'PKM', favorite: true, content: 'CODE — Capture, Organize, Distill, Express — describes the lifecycle of a personal knowledge system: gather raw material, file it usefully, compress it to its essence, and ship it as output.', project: 'Personal Knowledge System Research' },
      { title: 'Zettelkasten Method', type: 'concept', tags: ['pkm', 'learning'], category: 'PKM', content: 'Each note stands alone with a single idea, links explicitly to related notes, and gets an identifier rather than a folder. The network of links becomes more valuable than any single note.', project: 'Personal Knowledge System Research' },
      { title: 'Spaced Repetition Science', type: 'concept', tags: ['learning', 'memory'], category: 'Learning Science', content: "Reviewing material at increasing intervals — right before you'd otherwise forget it — is dramatically more efficient than cramming. The forgetting curve flattens with each successful review." },
      { title: 'Scanned Article Notes: Deep Work', type: 'reference', tags: ['focus', 'productivity', 'scanned'], category: 'Productivity', source: 'Scanned PDF (OCR)', content: "Key points extracted from a scanned article: deep work is focused, distraction-free effort that pushes cognitive limits. Schedule it in fixed blocks, batch shallow work, and track deep hours weekly. Rule of thumb: 90-minute blocks, phone in another room." },
      { title: 'Data Visualization Principles', type: 'reference', tags: ['analytics', 'dashboard', 'design'], category: 'Data', favorite: true, content: "Use position and length before color and area — they're perceived most accurately. Start bar charts at zero. Remove any element that doesn't help answer the chart's question.", project: 'Personal Portfolio Website' },
    ];
    const knowledge = await base44.entities.Knowledge.bulkCreate(
      knowledgeData.map((k) => ({
        title: k.title, content: k.content, type: k.type, tags: k.tags, category: k.category, source: k.source,
        favorite: !!k.favorite, status: k.status || 'active',
        project_id: k.project ? proj[k.project] : undefined,
        workspace: W,
      }))
    );
    const know = {};
    knowledge.forEach((k, i) => { know[knowledgeData[i].title] = k.id; });

    // ---------- Tasks ----------
    const tasksData = [
      { title: 'Write case study for analytics dashboard project', status: 'in_progress', priority: 'high', due_date: '2026-10-05', project: 'Personal Portfolio Website' },
      { title: 'Get headshot photos from photographer', status: 'todo', priority: 'medium', due_date: '2026-10-10', project: 'Personal Portfolio Website' },
      { title: 'Build contact form', status: 'done', priority: 'low', project: 'Personal Portfolio Website' },
      { title: 'Optimize images for web', status: 'todo', priority: 'low', project: 'Personal Portfolio Website' },
      { title: 'Set up custom domain DNS', status: 'todo', priority: 'medium', due_date: '2026-09-20', project: 'Personal Portfolio Website' },
      { title: "Follow up with recruiters from networking event", status: 'todo', priority: 'high', due_date: '2026-09-29', project: 'Data Analytics Job Search' },
      { title: 'Apply to 5 more data analyst roles', status: 'in_progress', priority: 'high', due_date: '2026-10-02', project: 'Data Analytics Job Search' },
      { title: 'Update LinkedIn headline', status: 'done', priority: 'medium', project: 'Data Analytics Job Search' },
      { title: 'Practice SQL interview questions', status: 'in_progress', priority: 'medium', due_date: '2026-10-01', project: 'Data Analytics Job Search' },
      { title: 'Prepare answers for behavioral interview questions', status: 'todo', priority: 'medium', project: 'Data Analytics Job Search' },
      { title: 'Send thank-you note after Tuesday interview', status: 'todo', priority: 'high', due_date: '2026-09-25', project: 'Data Analytics Job Search' },
      { title: 'Measure desk space', status: 'done', priority: 'low', project: 'Home Office Upgrade' },
      { title: 'Order monitor arm', status: 'todo', priority: 'medium', due_date: '2026-10-15', project: 'Home Office Upgrade' },
      { title: 'Get budget approval from partner', status: 'in_progress', priority: 'low', due_date: '2026-09-24', project: 'Home Office Upgrade' },
      { title: 'Finish Pandas groupby exercises', status: 'in_progress', priority: 'medium', due_date: '2026-09-30', project: 'Learn Python for Data Analysis' },
      { title: 'Complete data visualization module', status: 'todo', priority: 'medium', due_date: '2026-10-08', project: 'Learn Python for Data Analysis' },
      { title: 'Practice merging and joining dataframes', status: 'done', priority: 'low', project: 'Learn Python for Data Analysis' },
      { title: 'Start capstone project dataset selection', status: 'todo', priority: 'high', project: 'Learn Python for Data Analysis' },
      { title: 'Review NumPy array basics', status: 'done', priority: 'low', project: 'Learn Python for Data Analysis' },
      { title: 'Check on LLC filing status', status: 'todo', priority: 'high', due_date: '2026-09-28', project: 'Small Business Launch' },
      { title: 'Draft pricing page copy', status: 'todo', priority: 'medium', project: 'Small Business Launch' },
      { title: 'Pick invoicing software', status: 'done', priority: 'low', project: 'Small Business Launch' },
      { title: 'Write up Zettelkasten findings', status: 'in_progress', priority: 'high', due_date: '2026-10-03', project: 'Personal Knowledge System Research' },
      { title: 'Compare Notion vs Obsidian for PKM', status: 'done', priority: 'medium', project: 'Personal Knowledge System Research' },
      { title: 'Draft personal methodology doc', status: 'todo', priority: 'high', due_date: '2026-10-12', project: 'Personal Knowledge System Research' },
      { title: "Read 'How to Take Smart Notes'", status: 'done', priority: 'medium', project: 'Personal Knowledge System Research' },
      { title: 'Sketch core app screens', status: 'todo', priority: 'low', project: 'Mobile App Prototype' },
      { title: 'Talk to 3 people about habit tracking pain points', status: 'todo', priority: 'medium', due_date: '2026-10-20', project: 'Mobile App Prototype' },
      { title: 'Renew passport', status: 'todo', priority: 'medium', due_date: '2026-11-01' },
      { title: 'Schedule annual physical', status: 'todo', priority: 'low', due_date: '2026-09-22' },
      { title: 'Easy 5 km recovery run', status: 'todo', priority: 'medium', due_date: ANCHOR, project: '10K Training Plan', today: true },
      { title: 'Buy proper running shoes', status: 'done', priority: 'medium', project: '10K Training Plan' },
      { title: 'Long run: 7 km', status: 'done', priority: 'high', project: '10K Training Plan' },
      { title: 'Rewrite resume bullets with outcomes', status: 'done', priority: 'high', project: 'Resume & LinkedIn Refresh' },
      { title: 'Ask two mentors for resume feedback', status: 'done', priority: 'medium', project: 'Resume & LinkedIn Refresh' },
    ];
    // A few tasks are pinned to Today so the Today page has work on first open.
    const TODAY_TASKS = new Set(['Write case study for analytics dashboard project', 'Follow up with recruiters from networking event', 'Easy 5 km recovery run']);
    await base44.entities.Task.bulkCreate(
      tasksData.map((t) => ({
        title: t.title, status: t.status, priority: t.priority, due_date: shift(t.due_date),
        today_date: TODAY_TASKS.has(t.title) ? today : undefined,
        project_id: t.project ? proj[t.project] : undefined, workspace: W,
      }))
    );

    // ---------- Captures ----------
    const capturesData = [
      { type: 'idea', title: 'Add dark mode toggle to portfolio site', content: 'Could let visitors switch themes; shows attention to UX detail.', tags: ['portfolio', 'project'], status: 'inbox', important: true, project: 'Personal Portfolio Website' },
      { type: 'note', title: 'Recruiter mentioned they value SQL heavily', content: 'During the networking event, the recruiter from a fintech startup said SQL fluency matters more than a specific BI tool.', tags: ['job-search', 'analytics'], status: 'inbox', project: 'Data Analytics Job Search' },
      { type: 'task', title: 'Buy standing desk mat', content: 'For the home office upgrade — cheap ergonomic win.', tags: ['home-office'], status: 'processed', converted_to_type: 'task', project: 'Home Office Upgrade' },
      { type: 'question', title: 'Should I use TypeScript for the app prototype?', content: 'Weigh dev speed vs type safety for a solo prototype.', tags: ['mobile', 'project'], status: 'inbox', project: 'Mobile App Prototype' },
      { type: 'project_thought', title: 'Portfolio should lead with the dashboard case study', content: "It's the most impressive piece — put it first, not buried.", tags: ['portfolio', 'dashboard'], status: 'inbox', important: true, project: 'Personal Portfolio Website' },
      { type: 'learning_note', title: 'CALCULATE() changes filter context, not row context', content: 'Kept confusing DAX row vs filter context — CALCULATE is specifically for the latter.', tags: ['powerbi', 'analytics'], status: 'processed', converted_to_type: 'knowledge' },
      { type: 'decision', title: 'Decided to use Tailwind instead of styled-components', content: 'Faster iteration, smaller bundle, consistent with the rest of the stack.', tags: ['portfolio', 'project'], status: 'processed', converted_to_type: 'decision', project: 'Personal Portfolio Website' },
      { type: 'lesson', title: "Cramming SQL right before an interview doesn't stick", content: 'Spaced practice over two weeks worked far better than the day before.', tags: ['job-search', 'learning'], status: 'inbox' },
      { type: 'reference', title: 'Article: how routers pick between GPT and Claude', content: 'Good breakdown of cost/latency tradeoffs in production LLM routing.', tags: ['ai', 'routing'], status: 'inbox', important: true },
      { type: 'prompt', title: "'Explain like I'm reviewing this for the first time'", content: 'Reframing prompts as a review request produces more critical, less agreeable output.', tags: ['ai', 'prompt'], status: 'inbox' },
      { type: 'idea', title: 'Weekly review could auto-flag stalled projects', content: 'AI already checks 14-day inactivity — surface it more prominently.', tags: ['dashboard', 'ai', 'project'], status: 'inbox' },
      { type: 'note', title: 'LLC filing backlog is state-wide right now', content: "Called the state office — 3 week wait is normal right now, not just us.", tags: ['business'], status: 'inbox', project: 'Small Business Launch' },
      { type: 'task', title: 'Email photographer about reschedule', content: '', tags: ['portfolio'], status: 'archived', project: 'Personal Portfolio Website' },
      { type: 'question', title: 'Is Zettelkasten overkill for a solo non-researcher?', content: 'Worth trying lightweight version before committing to full method.', tags: ['pkm', 'learning'], status: 'inbox', project: 'Personal Knowledge System Research' },
      { type: 'project_thought', title: 'Small business site should launch before LLC finishes', content: "No legal requirement to wait — site copy doesn't need the LLC number.", tags: ['business', 'project'], status: 'inbox', project: 'Small Business Launch' },
      { type: 'learning_note', title: 'LEFT JOIN keeps unmatched left rows with NULLs', content: 'Finally clicked after drawing it out with sample tables.', tags: ['sql', 'analytics'], status: 'processed', converted_to_type: 'knowledge' },
      { type: 'decision', title: 'Decided against a native mobile framework for the prototype', content: 'React Native chosen for prototype speed over native Swift/Kotlin.', tags: ['mobile', 'project'], status: 'inbox', project: 'Mobile App Prototype' },
      { type: 'lesson', title: 'Applying without tailoring the resume wastes time', content: 'Generic applications got zero responses; tailored ones got replies.', tags: ['job-search', 'resume'], status: 'inbox' },
      { type: 'reference', title: 'Nielsen Norman Group: search UX patterns', content: 'Good source for the search-as-you-type debounce timing question.', tags: ['search', 'ux', 'dashboard'], status: 'inbox' },
      { type: 'prompt', title: "'List assumptions before answering'", content: "Forces the model to surface what it's guessing at, easy to correct.", tags: ['ai', 'prompt'], status: 'inbox', important: true },
      { type: 'idea', title: 'Turn the case study template into a reusable knowledge doc', content: 'Would speed up writing future case studies.', tags: ['portfolio', 'pkm'], status: 'inbox' },
      { type: 'note', title: 'Monitor arm needs a desk without a lip on the back edge', content: 'Checked compatibility before ordering — some desks won\'t clamp.', tags: ['home-office'], status: 'inbox', project: 'Home Office Upgrade' },
      { type: 'task', title: 'Cancel unused SaaS trial before it charges', content: '', tags: ['finance'], status: 'inbox', important: true, due_date: '2026-09-29' },
      { type: 'question', title: 'Fixed price or hourly for first consulting client?', content: 'Fixed feels safer for a first client relationship.', tags: ['business', 'finance'], status: 'inbox', project: 'Small Business Launch' },
      { type: 'project_thought', title: 'Capstone dataset should be something I actually care about', content: "Motivation matters more than dataset 'impressiveness' for finishing it.", tags: ['python', 'project'], status: 'inbox', project: 'Learn Python for Data Analysis' },
      { type: 'learning_note', title: 'Groupby + agg with a dict applies different functions per column', content: "e.g. {'sales':'sum','date':'max'} — saves a lot of chained calls.", tags: ['python', 'analytics'], status: 'processed', converted_to_type: 'knowledge' },
      { type: 'reference', title: "Book: 'Building a Second Brain' by Tiago Forte", content: 'Source for the CODE framework (Capture, Organize, Distill, Express).', tags: ['pkm', 'project'], status: 'inbox', project: 'Personal Knowledge System Research' },
      { type: 'idea', title: 'Dashboard widget for flashcards due today', content: 'Would make the review habit more visible on the home screen.', tags: ['dashboard', 'learning'], status: 'inbox', important: true },
      { type: 'idea', title: 'Run a 10K before winter', content: 'Turned into a goal with key results and a training project.', tags: ['health'], status: 'processed', converted_to_type: 'goal' },
    ];
    await base44.entities.Capture.bulkCreate(
      capturesData.map((c) => ({
        type: c.type, title: c.title, content: c.content, tags: c.tags, status: c.status,
        important: !!c.important, due_date: shift(c.due_date), converted_to_type: c.converted_to_type,
        project_id: c.project ? proj[c.project] : undefined,
        workspace: W,
      }))
    );

    // ---------- Decisions ----------
    const decisionsData = [
      { decision: 'Use Tailwind instead of styled-components for the portfolio site', context: 'Needed to pick a styling approach before building pages.', alternatives: 'styled-components, plain CSS modules, Tailwind', reasoning: 'Tailwind gave the fastest iteration speed and kept bundle size predictable.', expected_result: 'Faster page building with consistent spacing/typography.', actual_result: 'Pages went together noticeably faster; only downside was verbose class lists.', project: 'Personal Portfolio Website', date: '2026-07-14', status: 'reviewed' },
      { decision: 'Apply broadly first, then tailor for top-choice roles', context: 'Limited time each week for the job search.', alternatives: 'Tailor every single application; apply broadly with generic resume', reasoning: 'Broad applications build interview reps while tailored ones target the roles that matter most.', expected_result: 'More total interviews without sacrificing quality on top targets.', actual_result: '', project: 'Data Analytics Job Search', date: '2026-08-02', status: 'made' },
      { decision: 'Delay Home Office Upgrade purchases until budget approved', context: 'Multiple desk/chair options identified but no budget sign-off yet.', alternatives: 'Buy now on a credit card; wait for approval', reasoning: 'Avoiding debt for a non-urgent upgrade.', expected_result: 'Purchases happen within a few weeks once approved.', actual_result: '', project: 'Home Office Upgrade', date: '2026-09-10', status: 'pending' },
      { decision: 'Learn Pandas before Power BI', context: 'Both are useful for the data analyst path, limited study time.', alternatives: 'Power BI first; Pandas first; both in parallel', reasoning: 'Pandas skills transfer to more tools and are commonly tested in interviews.', expected_result: 'Stronger interview performance on take-home SQL/Python tests.', actual_result: 'Passed two take-home exercises since prioritizing Pandas.', project: 'Learn Python for Data Analysis', date: '2026-07-28', status: 'reviewed' },
      { decision: 'Register the business as an LLC, not a sole proprietorship', context: 'Starting the consulting business with personal liability concerns.', alternatives: 'Sole proprietorship, LLC, S-corp', reasoning: 'LLC gives liability protection with much less overhead than an S-corp.', expected_result: 'Personal assets protected if a client dispute arises.', actual_result: '', project: 'Small Business Launch', date: '2026-08-20', status: 'made' },
      { decision: 'Adopt a lightweight Zettelkasten instead of a full folder system', context: 'Existing notes were scattered across folders with no clear method.', alternatives: 'Folders by topic, tags-only, full Zettelkasten with IDs', reasoning: 'Link-first note-taking matched how ideas actually connect for this use case.', expected_result: 'Easier to resurface old notes when starting new projects.', actual_result: 'Already found 3 old notes worth reusing in the last two weeks.', project: 'Personal Knowledge System Research', date: '2026-09-01', status: 'reviewed' },
      { decision: 'Use React Native for the mobile prototype', context: 'Deciding on a framework before building any screens.', alternatives: 'Native Swift/Kotlin, Flutter, React Native', reasoning: 'Fastest path to a testable prototype given existing React experience.', expected_result: 'Working prototype within 2-3 weekends.', actual_result: '', project: 'Mobile App Prototype', date: '2026-09-20', status: 'made' },
      { decision: 'Prioritize case studies over adding more portfolio projects', context: 'Portfolio has enough projects but weak written case studies.', alternatives: 'Add 2 more projects; deepen case studies on existing ones', reasoning: 'Recruiters said depth of thinking matters more than project count.', expected_result: 'Stronger interview conversion from portfolio views.', actual_result: '', project: 'Personal Portfolio Website', date: '2026-09-15', status: 'made' },
      { decision: 'Route simple classification tasks to a cheaper model', context: 'AI costs were climbing as usage grew across features.', alternatives: 'Use one premium model everywhere; route by task complexity', reasoning: "Most classification tasks don't need premium reasoning quality.", expected_result: 'Lower per-request cost without a quality drop on simple tasks.', actual_result: 'Costs dropped noticeably with no complaints about quality.', date: '2026-06-25', status: 'reviewed' },
    ];
    const decisions = await base44.entities.Decision.bulkCreate(
      decisionsData.map((d) => ({ ...d, project: undefined, date: shift(d.date), project_id: d.project ? proj[d.project] : undefined, workspace: W }))
    );
    const dec = {};
    decisions.forEach((d, i) => { dec[decisionsData[i].decision] = d.id; });

    // ---------- Lessons ----------
    const lessonsData = [
      { title: 'Networking beats cold applications', project: 'Data Analytics Job Search', what_happened: 'Sent 40 cold applications over a month with almost no responses, then attended one networking event.', what_worked: 'Informational interviews led to two warm introductions.', what_didnt: 'Cold applications through job boards had under a 2% response rate.', learned: 'Warm introductions convert far better than cold applications.', next_time: 'Prioritize networking events and referrals over job board volume.' },
      { title: 'Tailwind class lists get unreadable fast', project: 'Personal Portfolio Website', what_happened: 'Component files grew hard to scan once class lists passed ~15 utilities.', what_worked: 'Extracting repeated combos into small components kept things readable.', what_didnt: 'Inline everything approach made review painful.', learned: 'Componentize early instead of waiting for the file to get messy.', next_time: 'Set a personal rule: extract a component past 10 utility classes.' },
      { title: 'Should have gotten budget approval before shopping', project: 'Home Office Upgrade', what_happened: 'Spent hours comparing desks and chairs before confirming budget with partner.', what_worked: '', what_didnt: 'Wasted research time on options later ruled out by budget.', learned: 'Confirm constraints before doing detailed comparison shopping.', next_time: 'Get budget sign-off as the very first step next time.' },
      { title: 'Spaced practice outperformed cramming for SQL', project: 'Learn Python for Data Analysis', what_happened: 'Crammed SQL the night before one interview, spaced practice over two weeks for another.', what_worked: 'Two weeks of 20-minute daily sessions felt much more solid.', what_didnt: 'Cramming led to blanking on a window function question.', learned: "Spaced repetition genuinely outperforms cramming, even for 'simple' technical review.", next_time: 'Start interview prep material at least 2 weeks out.' },
      { title: 'LLC paperwork takes longer than expected', project: 'Small Business Launch', what_happened: 'Assumed LLC filing would take about a week; state backlog pushed it to three.', what_worked: 'Drafting the website and pricing page in parallel kept momentum.', what_didnt: 'Blocking the website launch on the LLC number delayed things unnecessarily.', learned: 'Legal paperwork timelines are often outside your control — plan parallel work.', next_time: 'Identify which launch steps truly require the LLC number vs. which don\'t.' },
      { title: 'Full Zettelkasten was more setup than needed at first', project: 'Personal Knowledge System Research', decisionKey: 'Adopt a lightweight Zettelkasten instead of a full folder system', what_happened: 'Tried to set up the complete ID-and-link system before writing any real notes.', what_worked: "Starting with just 'one idea per note, always link something' was enough to get value.", what_didnt: 'Spent a full weekend on ID schemes instead of capturing actual ideas.', learned: 'Start with the core principle, add structure only once needed.', next_time: 'Begin any new system with the minimum viable version.' },
      { title: 'React Native prototype found UX issues early', project: 'Mobile App Prototype', what_happened: 'Built a rough clickable prototype in a weekend to test the core habit-tracking flow.', what_worked: 'Testing with 3 people surfaced a confusing onboarding step immediately.', what_didnt: 'Polishing visuals before testing the flow would have wasted time.', learned: 'Test the core flow before investing in visual polish.', next_time: 'Get a clickable version in front of people within the first weekend.' },
      { title: 'Case study depth mattered more than portfolio breadth', project: 'Personal Portfolio Website', decisionKey: 'Prioritize case studies over adding more portfolio projects', what_happened: 'Portfolio had 6 shallow projects; feedback consistently asked for more depth on fewer.', what_worked: 'Rewriting the dashboard case study with real decision points got noticeably better feedback.', what_didnt: 'Adding a 7th project instead of deepening existing ones would have repeated the mistake.', learned: 'Depth of thinking shown beats sheer project count.', next_time: 'Cap the portfolio at 3-4 projects with full case studies.' },
      { title: 'Outcome bullets got 3x more recruiter replies', project: 'Resume & LinkedIn Refresh', what_happened: 'Rewrote every resume bullet to lead with a measurable result, then re-applied to similar roles.', what_worked: 'Quantified bullets and a focused headline.', what_didnt: 'The old task-list style resume was invisible to recruiters.', learned: 'Lead with outcomes; numbers make experience legible.', next_time: 'Keep a running "wins log" so numbers are ready when needed.' },
      { title: 'Too many goals at once diluted everything', what_happened: 'Added "Learn Mandarin basics" on top of the job search, consulting launch and PKM work. Practice stopped within three weeks.', what_worked: 'Dropping it explicitly freed real time for the job search.', what_didnt: 'Hoping willpower would cover a fifth active goal.', learned: 'Three or four active goals is the realistic ceiling; drop goals deliberately instead of letting them rot.', next_time: 'Before adding a goal, pause or drop one.' },
      { title: 'Cheap model routing needed monitoring, not just setup', what_happened: 'Set up cost-based routing and assumed it was done.', what_worked: 'Cost dropped as expected in the first week.', what_didnt: 'A model version update silently degraded quality on one route for two weeks before anyone noticed.', learned: 'Routing rules need ongoing quality monitoring, not just initial setup.', next_time: 'Add a weekly spot-check on output quality per route.' },
    ];
    const lessons = await base44.entities.Lesson.bulkCreate(
      lessonsData.map((l) => ({
        title: l.title, what_happened: l.what_happened, what_worked: l.what_worked, what_didnt: l.what_didnt,
        learned: l.learned, next_time: l.next_time,
        project_id: l.project ? proj[l.project] : undefined,
        decision_id: l.decisionKey ? dec[l.decisionKey] : undefined,
        workspace: W,
      }))
    );

    // ---------- Learning Items ----------
    const learningData = [
      { type: 'topic', title: 'SQL Window Functions', content: 'ROW_NUMBER, RANK, LAG/LEAD, and partitioning — practicing on sample sales data.', status: 'in_progress', project: 'Learn Python for Data Analysis', knowledgeKey: 'SQL Window Functions' },
      { type: 'topic', title: 'Power BI DAX Fundamentals', content: 'CALCULATE, filter context vs row context, common time-intelligence measures.', status: 'in_progress', project: 'Learn Python for Data Analysis', knowledgeKey: 'Power BI DAX Basics' },
      { type: 'course', title: 'Python for Data Analysis (Pandas Deep Dive)', content: 'Working through groupby, merge, pivot tables, and reshaping data.', status: 'in_progress', project: 'Learn Python for Data Analysis', knowledgeKey: 'Python Pandas Tips' },
      { type: 'topic', title: 'Data Visualization with Matplotlib & Seaborn', content: 'Choosing the right chart type and cleaning up default styling.', status: 'not_started', project: 'Learn Python for Data Analysis', knowledgeKey: 'Data Visualization Principles' },
      { type: 'skill', title: 'Prompt Engineering for Structured Output', content: 'Getting reliable JSON output from LLMs with few-shot examples and schema hints.', status: 'completed', knowledgeKey: 'Prompt Engineering Patterns' },
      { type: 'topic', title: 'AI Agent Design Patterns', content: 'Perceive-plan-act-observe loops, tool calling, and when to add guardrails.', status: 'in_progress', knowledgeKey: 'AI Agents Architecture' },
      { type: 'resource', title: 'Product Design Heuristics Refresher', content: "Re-reading Nielsen's heuristics with real examples from current projects.", status: 'completed', project: 'Personal Portfolio Website', knowledgeKey: 'Product Design Heuristics' },
      { type: 'topic', title: 'Advanced SQL Joins & Subqueries', content: 'Practicing correlated subqueries and self-joins on messy datasets.', status: 'not_started', project: 'Learn Python for Data Analysis' },
      { type: 'certificate', title: 'Google Data Analytics Certificate', content: 'Working through the capstone case study module.', status: 'in_progress', project: 'Data Analytics Job Search' },
      { type: 'skill', title: 'Technical Interview Communication', content: 'Practicing thinking out loud while solving SQL/Python problems.', status: 'in_progress', project: 'Data Analytics Job Search' },
      { type: 'topic', title: 'Zettelkasten & Note Linking Practices', content: 'Studying how atomic notes and backlinks compound over time.', status: 'completed', project: 'Personal Knowledge System Research', knowledgeKey: 'Zettelkasten Method' },
      { type: 'resource', title: 'Spaced Repetition Scheduling Algorithms', content: 'Reading about SM-2 and simpler interval schedules for flashcard apps.', status: 'not_started', knowledgeKey: 'Spaced Repetition Science' },
    ];
    const learningItems = await base44.entities.LearningItem.bulkCreate(
      learningData.map((l) => ({
        type: l.type, title: l.title, content: l.content, status: l.status,
        project_id: l.project ? proj[l.project] : undefined,
        knowledge_id: l.knowledgeKey ? know[l.knowledgeKey] : undefined,
        workspace: W,
      }))
    );
    const learn = {};
    learningItems.forEach((l, i) => { learn[learningData[i].title] = l.id; });

    // ---------- Flashcards ----------
    const flashcardsData = [
      { learn: 'SQL Window Functions', front: 'What does ROW_NUMBER() do?', back: 'Assigns a unique sequential integer to rows within a partition, based on the ORDER BY.', confidence: 'high', review_count: 3, last_reviewed: '2026-09-20', next_review_date: '2026-09-30' },
      { learn: 'SQL Window Functions', front: 'Difference between RANK() and DENSE_RANK()?', back: 'RANK() leaves gaps after ties; DENSE_RANK() does not.', confidence: 'medium', review_count: 2, last_reviewed: '2026-09-18', next_review_date: '2026-09-21' },
      { learn: 'SQL Window Functions', front: 'What does LAG() return?', back: 'The value from a previous row in the same result set, based on a specified offset.', confidence: 'low', review_count: 1, last_reviewed: '2026-09-15', next_review_date: '2026-09-16' },
      { learn: 'Power BI DAX Fundamentals', front: 'What does CALCULATE() do in DAX?', back: 'Evaluates an expression in a modified filter context.', confidence: 'medium', review_count: 2, last_reviewed: '2026-09-19', next_review_date: '2026-09-26' },
      { learn: 'Power BI DAX Fundamentals', front: 'Row context vs filter context?', back: 'Row context applies to a single row during iteration; filter context applies to the whole table via applied filters.', confidence: 'low', review_count: 1, last_reviewed: '2026-09-12', next_review_date: '2026-09-14' },
      { learn: 'Power BI DAX Fundamentals', front: "What's a calculated column vs a measure?", back: 'Calculated columns compute at data load and take storage; measures compute dynamically at query time.', confidence: 'high', review_count: 4, last_reviewed: '2026-09-22', next_review_date: '2026-10-05' },
      { learn: 'Python for Data Analysis (Pandas Deep Dive)', front: 'How do you apply different aggregations per column with groupby?', back: "Pass a dict to .agg(), e.g. {'sales':'sum','date':'max'}.", confidence: 'high', review_count: 3, last_reviewed: '2026-09-21', next_review_date: '2026-10-01' },
      { learn: 'Python for Data Analysis (Pandas Deep Dive)', front: "What does merge(how='left') preserve?", back: 'All rows from the left dataframe, with NaN for unmatched right-side columns.', confidence: 'medium', review_count: 2, last_reviewed: '2026-09-17', next_review_date: '2026-09-24' },
      { learn: 'Python for Data Analysis (Pandas Deep Dive)', front: 'How do you pivot a long dataframe to wide?', back: 'Use .pivot_table() with index, columns, and values arguments.', confidence: 'low', review_count: 0 },
      { learn: 'Prompt Engineering for Structured Output', front: "What's a few-shot prompt?", back: 'A prompt that includes a small number of example input/output pairs before the real task.', confidence: 'high', review_count: 5, last_reviewed: '2026-09-23', next_review_date: '2026-10-10' },
      { learn: 'Prompt Engineering for Structured Output', front: 'Why ask a model to reason step-by-step?', back: 'It improves accuracy on complex tasks by giving the model room to work through logic before committing to an answer.', confidence: 'high', review_count: 4, last_reviewed: '2026-09-20', next_review_date: '2026-10-03' },
      { learn: 'AI Agent Design Patterns', front: 'What are the 4 stages of a typical agent loop?', back: 'Perceive, plan, act, observe — repeated until the goal is met.', confidence: 'medium', review_count: 2, last_reviewed: '2026-09-19', next_review_date: '2026-09-26' },
      { learn: 'AI Agent Design Patterns', front: 'Why add guardrails to an agent loop?', back: 'To cap cost/time and prevent runaway or unsafe actions when a plan goes wrong.', confidence: 'low', review_count: 1, last_reviewed: '2026-09-10', next_review_date: '2026-09-12' },
      { learn: 'Product Design Heuristics Refresher', front: "What's 'visibility of system status'?", back: 'The system should always keep users informed about what\'s happening through appropriate feedback.', confidence: 'high', review_count: 2, last_reviewed: '2026-09-15', next_review_date: '2026-09-29' },
      { learn: 'Product Design Heuristics Refresher', front: "What's 'recognition over recall'?", back: 'Minimize memory load by making options, actions, and information visible rather than requiring users to remember them.', confidence: 'medium', review_count: 1, last_reviewed: '2026-09-10', next_review_date: '2026-09-13' },
      { learn: 'Google Data Analytics Certificate', front: "What's a capstone case study meant to demonstrate?", back: "End-to-end application of the whole course's skills on one realistic dataset/problem.", confidence: 'low', review_count: 0 },
      { learn: 'Technical Interview Communication', front: 'Why think out loud during a technical interview?', back: "It lets the interviewer follow your reasoning and helps them help you if you're stuck, instead of silently failing.", confidence: 'medium', review_count: 1, last_reviewed: '2026-09-19', next_review_date: '2026-09-23' },
      { learn: 'Zettelkasten & Note Linking Practices', front: "What makes a note 'atomic' in Zettelkasten?", back: 'It contains exactly one idea, so it can be linked precisely from many places.', confidence: 'high', review_count: 3, last_reviewed: '2026-09-22', next_review_date: '2026-10-06' },
      { learn: 'Zettelkasten & Note Linking Practices', front: 'Why use links instead of folders?', back: 'Ideas often relate to multiple topics at once; links model that better than a single folder location.', confidence: 'medium', review_count: 2, last_reviewed: '2026-09-18', next_review_date: '2026-09-25' },
      { learn: null, front: "What's the forgetting curve?", back: 'A model of how memory retention drops over time without review, flattening with each successful recall.', confidence: 'medium', review_count: 1, last_reviewed: '2026-09-14', next_review_date: '2026-09-17' },
      { learn: null, front: "What's the CODE framework in PKM?", back: 'Capture, Organize, Distill, Express — the lifecycle of turning raw input into usable output.', confidence: 'high', review_count: 2, last_reviewed: '2026-09-16', next_review_date: '2026-09-28' },
    ];
    await base44.entities.Flashcard.bulkCreate(
      flashcardsData.map((f) => ({
        front: f.front, back: f.back, confidence: f.confidence, review_count: f.review_count,
        last_reviewed: shift(f.last_reviewed), next_review_date: shift(f.next_review_date),
        learning_item_id: f.learn ? learn[f.learn] : undefined,
        workspace: W,
      }))
    );

    // ---------- Review Entries ----------
    const reviewData = [
      { type: 'daily', date: '2026-09-21', summary: 'Solid progress on portfolio case study and SQL practice.', content: 'Finished a full draft of the dashboard case study. Did 30 minutes of SQL window function practice. Recruiter follow-up still pending.' },
      { type: 'daily', date: '2026-09-22', summary: 'Job search focus day.', content: 'Sent 3 tailored applications, updated LinkedIn headline, reviewed behavioral interview questions.' },
      { type: 'daily', date: '2026-09-23', summary: 'Learning-heavy day.', content: 'Completed the prompt engineering learning item, reviewed 8 flashcards, read about AI agent guardrails.' },
      { type: 'daily', date: '2026-09-24', summary: 'Home office and small business admin.', content: 'Called the state office about the LLC backlog. Measured desk space for the monitor arm order.' },
      { type: 'daily', date: '2026-09-25', summary: 'Quiet day, mostly captures.', content: 'Mostly inbox captures today — no time for deep work, jotted down 4 ideas to process later.' },
      { type: 'daily', date: '2026-09-26', summary: 'PKM research day.', content: 'Read two chapters on Zettelkasten, drafted notes on atomic note-taking, linked 3 existing knowledge records.' },
      { type: 'daily', date: '2026-09-27', summary: 'Mixed progress across projects.', content: 'Reviewed flashcards, followed up on the recruiter email, sketched two mobile app screens.' },
      { type: 'weekly', date: '2026-09-07', summary: 'Week 1: Job search ramp-up.', content: 'Rewrote resume, sent first 10 applications, started SQL review plan. Portfolio work paused this week.' },
      { type: 'weekly', date: '2026-09-14', summary: 'Week 2: Portfolio momentum.', content: 'Finished homepage redesign, drafted 2 case studies, attended 1 networking event with 2 good leads.' },
      { type: 'weekly', date: '2026-09-21', summary: 'Week 3: Learning systems focus.', content: 'Made strong progress on Pandas and DAX. Started the PKM research project. LLC filing submitted.' },
      { type: 'weekly', date: '2026-09-27', summary: 'Week 4: Steady across the board.', content: 'No single project dominated — portfolio, job search, and PKM research all moved forward incrementally. Home office upgrade still waiting on budget.' },
    ];
    await base44.entities.ReviewEntry.bulkCreate(reviewData.map((r) => ({ ...r, date: shift(r.date), workspace: W })));

    // ---------- Links (knowledge<->knowledge backlinks) ----------
    const kkPairs = [
      ['AI Model Routing', 'Local vs Cloud AI'],
      ['Dashboard Design Principles', 'Mobile-First UI Design'],
      ['Retrieval Practice', 'Search UX Principles'],
      ['Second Brain Methodology', 'Zettelkasten Method'],
      ['Spaced Repetition Science', 'Retrieval Practice'],
      ['Data Visualization Principles', 'Dashboard Design Principles'],
      ['Prompt Engineering Patterns', 'AI Agents Architecture'],
      ['Portfolio Case Study Structure', 'Dashboard Design Principles'],
      ['Scanned Article Notes: Deep Work', 'Second Brain Methodology'],
      ['Scanned Article Notes: Deep Work', 'Spaced Repetition Science'],
    ];
    const links = kkPairs.map(([a, b]) => ({
      source_type: 'knowledge', source_id: know[a], target_type: 'knowledge', target_id: know[b], workspace: W,
    }));

    // Project <-> Knowledge links (so they show in the project's Knowledge section)
    knowledgeData.forEach((k) => {
      if (k.project) {
        links.push({ source_type: 'project', source_id: proj[k.project], target_type: 'knowledge', target_id: know[k.title], workspace: W });
      }
    });

    await base44.entities.Link.bulkCreate(links);

    // ---------- Tool / Device Router demo records ----------
    const demoTools = await base44.entities.Tool.bulkCreate([
      {
        name: 'General AI Assistant', provider: 'Cloud provider', category: 'Chat / reasoning',
        strengths: 'Planning, explanation, synthesis, prompt design', weaknesses: 'Not the final authority for code or factual verification',
        best_uses: 'Architecture, research synthesis, planning, review', poor_uses: 'Deterministic build verification',
        cost: 'Subscription or usage based', speed: 'fast', privacy: 'medium', deployment: 'cloud',
        coding_ability: 4, reasoning_ability: 5, automation_ability: 3, visual_ability: 4, user_rating: 5,
        notes: 'Use strong reasoning for difficult planning; verify final outputs with tools.', workspace: W,
      },
      {
        name: 'Coding Agent', provider: 'Developer tool', category: 'Coding agent',
        strengths: 'Repository edits, debugging, targeted implementation', weaknesses: 'Can over-edit if scope is vague',
        best_uses: 'Bounded code changes and debugging', poor_uses: 'Open-ended product strategy without constraints',
        cost: 'Subscription or usage based', speed: 'medium', privacy: 'medium', deployment: 'cloud',
        coding_ability: 5, reasoning_ability: 4, automation_ability: 4, visual_ability: 2, user_rating: 5,
        notes: 'Best with exact files, acceptance checks, and stop conditions.', workspace: W,
      },
      {
        name: 'Rapid App Builder', provider: 'App builder', category: 'Full-stack app builder',
        strengths: 'Fast UI, CRUD, entities, working prototypes', weaknesses: 'Large vague prompts can create inconsistent architecture',
        best_uses: 'Rapid product prototypes and iterative UI work', poor_uses: 'Low-level platform-specific debugging',
        cost: 'Credit based', speed: 'fast', privacy: 'medium', deployment: 'cloud',
        coding_ability: 4, reasoning_ability: 3, automation_ability: 4, visual_ability: 4, user_rating: 4,
        notes: 'Build in stages and validate each stage before adding more.', workspace: W,
      },
      {
        name: 'Small Local Model', provider: 'Local runtime', category: 'Local AI',
        strengths: 'Private, offline, low marginal cost', weaknesses: 'Lower capability and slower on modest hardware',
        best_uses: 'Drafting, classification, summaries, simple review', poor_uses: 'Large complex coding or multimodal jobs',
        cost: 'Local compute', speed: 'slow', privacy: 'high', deployment: 'local',
        coding_ability: 2, reasoning_ability: 2, automation_ability: 3, visual_ability: 1, user_rating: 3,
        notes: 'Useful when privacy or cost matters more than maximum capability.', workspace: W,
      },
    ]);

    const demoDevices = await base44.entities.Device.bulkCreate([
      {
        name: 'Windows Development PC', device_type: 'Laptop / Desktop', operating_system: 'Windows',
        ram: '16 GB', storage: 'SSD', cpu: 'Modern multi-core CPU', gpu: 'Integrated graphics',
        development_tools: 'IDE, Node.js, Git, Android tooling', local_ai_capability: 'Small quantized models; CPU-first',
        mobile_capability: 'Limited', voice_capability: 'Microphone available', automation_capability: 'Strong desktop automation',
        good_for: 'Coding, builds, file-heavy work, dashboards, Android development', poor_for: 'Large GPU-heavy local models',
        notes: 'Primary build and validation machine.', workspace: W,
      },
      {
        name: 'Android Phone', device_type: 'Phone', operating_system: 'Android',
        ram: 'Mobile memory', storage: 'Mobile storage', cpu: 'Mobile SoC', gpu: 'Mobile GPU',
        development_tools: 'Testing and browser tools', local_ai_capability: 'Small on-device models where supported',
        mobile_capability: 'Excellent', voice_capability: 'Excellent', automation_capability: 'Good for quick actions and capture',
        good_for: 'Quick capture, mobile QA, reminders, voice notes, lightweight review', poor_for: 'Large builds and repository work',
        notes: 'Use for real-world mobile testing and capture.', workspace: W,
      },
      {
        name: 'Voice Assistant Device', device_type: 'Dedicated assistant', operating_system: 'Embedded / custom',
        ram: 'Limited', storage: 'Limited', cpu: 'Mobile-class', gpu: 'Limited',
        development_tools: 'Command / automation interface', local_ai_capability: 'Limited',
        mobile_capability: 'Portable', voice_capability: 'Primary interaction', automation_capability: 'Good trigger / command surface',
        good_for: 'Voice capture, quick commands, automation triggers', poor_for: 'Coding, large local inference, long-form editing',
        notes: 'Best used as an input and orchestration surface.', workspace: W,
      },
    ]);

    // ---------- Context Pack demo ----------
    const demoPacks = await base44.entities.ContextPack.bulkCreate([
      {
        name: 'PKOS Architecture',
        description: 'Focused context for thinking about the personal knowledge system without unrelated records.',
        items: [
          { type: 'project', id: proj['Personal Knowledge System Research'] },
          { type: 'knowledge', id: know['AI Model Routing'] },
          { type: 'knowledge', id: know['Local vs Cloud AI'] },
          { type: 'knowledge', id: know['Search UX Principles'] },
        ],
        workspace: W,
      },
    ]);

    // ---------- Automation Recipe demos ----------
    const demoRecipes = await base44.entities.AutomationRecipe.bulkCreate([
      {
        name: 'High priority task watch',
        description: 'Overdue high-priority tasks show up in Today.',
        enabled: true,
        trigger: 'task_overdue',
        conditions: [{ field: 'priority', value: 'high' }],
        action: 'surface_today',
        action_params: {},
        workspace: W,
      },
      {
        name: 'Project completion review',
        description: 'Reflect when a project is completed.',
        enabled: true,
        trigger: 'project_status_changed',
        conditions: [{ field: 'status', value: 'Completed' }],
        action: 'review_prompt',
        action_params: { text: 'What did you learn from {title}?' },
        workspace: W,
      },
      {
        name: 'Stalled project watch',
        description: 'Projects without a next action go to Review.',
        enabled: true,
        trigger: 'project_updated',
        conditions: [{ field: 'no_next_action', value: '' }],
        action: 'add_review',
        action_params: {},
        workspace: W,
      },
      {
        name: 'Celebrate goal check-ins',
        description: 'Each weekly check-in surfaces a reflection prompt.',
        enabled: true, trigger: 'goal_checkin_saved', conditions: [], action: 'review_prompt',
        action_params: { text: 'What moved this goal forward this week?' }, workspace: W,
      },
      {
        name: 'Goal deadline watch',
        description: 'Nightly: goals due within a week show in Today.',
        enabled: true, trigger: 'goal_due_soon', conditions: [], action: 'surface_today', action_params: {}, workspace: W,
      },
      {
        name: 'Pause neglected habits',
        description: 'Nightly: when a streak breaks, propose pausing the habit (needs approval).',
        enabled: true, trigger: 'habit_streak_broken', conditions: [], action: 'propose_status', action_params: { status: 'Paused' }, workspace: W,
      },
      {
        name: 'Process interview captures',
        description: 'Connect Interview captures to the job-search project after approval.',
        enabled: false,
        trigger: 'capture_created',
        conditions: [{ field: 'tag', value: 'Interview' }],
        action: 'connect_project',
        action_params: {
          project_id: proj['Data Analytics Job Search'],
          target_label: 'Data Analytics Job Search',
        },
        workspace: W,
      },
      {
        name: 'Learning organizer',
        description: 'Suggest a useful knowledge link for Python-related knowledge.',
        enabled: false,
        trigger: 'knowledge_created',
        conditions: [{ field: 'tag', value: 'Python' }],
        action: 'suggest_link',
        action_params: {
          target_id: know['Retrieval Practice'],
          target_type: 'knowledge',
          target_label: 'Retrieval Practice',
        },
        workspace: W,
      },
    ]);

    const goalCounts = await seedGoalsAndHabits(base44, {
      W, today, addDays, ownerId: user.id, proj,
      lessonIds: { achieved: lessons.find((l) => l.title.startsWith('Outcome bullets'))?.id, dropped: lessons.find((l) => l.title.startsWith('Too many goals'))?.id },
    });

    // Sample nightly history: one flagged deadline + one pending status proposal, dated yesterday (demo digests are never emailed).
    const yesterday = addDays(today, -1);
    const byName = Object.fromEntries(demoRecipes.map((r) => [r.name, r]));
    const goalPage = await base44.entities.Goal.filter({ workspace: W, status: 'Active' }, { sort: 'target_date', limit: 1 });
    const habitPage = await base44.entities.Habit.filter({ workspace: W, active: true }, { limit: 1 });
    const g = goalPage.items[0], h = habitPage.items[0];
    const sampleRuns = [];
    if (g) sampleRuns.push({ recipe_id: byName['Goal deadline watch'].id, recipe_name: 'Goal deadline watch', trigger: 'goal_due_soon', action: 'surface_today', record_type: 'goal', record_id: g.id, record_title: g.title, status: 'success', message: `Target date ${g.target_date} is coming up`, flag: 'today', flag_open: true, source: 'nightly', digest_date: yesterday, owner_id: user.id, run_key: `demo:${g.id}:${yesterday}`, workspace: W });
    if (h) sampleRuns.push({ recipe_id: byName['Pause neglected habits'].id, recipe_name: 'Pause neglected habits', trigger: 'habit_streak_broken', action: 'propose_status', record_type: 'habit', record_id: h.id, record_title: h.title, status: 'pending_review', message: `Change status to Paused · Streak broken on ${yesterday}`, flag: 'none', flag_open: false, source: 'nightly', digest_date: yesterday, owner_id: user.id, run_key: `demo:${h.id}:${yesterday}`, workspace: W });
    if (sampleRuns.length) {
      await base44.entities.AutomationRun.bulkCreate(sampleRuns);
      await base44.asServiceRole.entities.DailyDigest.create({
        digest_key: `${user.id}:${W}:${yesterday}`, owner_id: user.id, date: yesterday, total: sampleRuns.length,
        pending: sampleRuns.filter((r) => r.status === 'pending_review').length, emailed: false, workspace: W,
        items: sampleRuns.map((r) => ({ recipe_name: r.recipe_name, record_type: r.record_type, record_id: r.record_id, record_title: r.record_title, status: r.status, message: r.message, source: 'nightly' })),
      });
    }

    return Response.json({
      success: true,
      counts: {
        ...goalCounts,
        projects: projects.length,
        knowledge: knowledge.length,
        tasks: tasksData.length,
        captures: capturesData.length,
        decisions: decisions.length,
        lessons: lessonsData.length,
        learningItems: learningItems.length,
        flashcards: flashcardsData.length,
        reviewEntries: reviewData.length,
        links: links.length,
        tools: demoTools.length,
        devices: demoDevices.length,
        contextPacks: demoPacks.length,
        automationRecipes: demoRecipes.length,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Goals, habits, ~6 weeks of habit history and 4 weeks of goal check-ins.
 * History is deterministic (pattern-based), relative to today, and leaves
 * today + the current week open so Today check-ins and the weekly check-in
 * are immediately actionable.
 */
async function seedGoalsAndHabits(base44, { W, today, addDays, ownerId, proj, lessonIds }) {
  const E = base44.entities;
  const goalsData = [
    { key: 'role', title: 'Land a Data Analyst Role', why: 'Move into work that uses analysis daily, with a clear growth path.', area: 'Career', target_date: addDays(today, 75), status: 'Active', progress_mode: 'key_results',
      key_results: [{ title: 'Tailored applications', current: 14, target: 25, unit: 'apps' }, { title: 'Interviews', current: 2, target: 5, unit: 'interviews' }, { title: 'Offer accepted', current: 0, target: 1, unit: 'offer' }] },
    { key: 'consult', title: 'Launch Freelance Data Consulting', why: 'Build an income stream that compounds independent of one employer.', area: 'Finance', target_date: addDays(today, 120), status: 'Active', progress_mode: 'rollup' },
    { key: 'pkm', title: 'Build a Personal Knowledge System', why: 'Stop losing good ideas; turn notes into output.', area: 'Learning', target_date: addDays(today, 45), status: 'Active', progress_mode: 'manual', manual_progress: 60 },
    { key: 'run', title: 'Run a 10K', why: 'Energy and focus for everything else.', area: 'Health', target_date: addDays(today, 35), status: 'Active', progress_mode: 'key_results',
      key_results: [{ title: 'Longest run', current: 7, target: 10, unit: 'km' }, { title: 'Training runs', current: 18, target: 30, unit: 'runs' }] },
    { key: 'resume', title: 'Rebuild Resume & LinkedIn', why: 'A strong profile is the entry ticket for the job search.', area: 'Career', target_date: addDays(today, -30), status: 'Achieved', progress_mode: 'rollup' },
    { key: 'mandarin', title: 'Learn Mandarin Basics', why: 'Curiosity, and travel someday.', area: 'Personal', target_date: addDays(today, 90), status: 'Dropped', progress_mode: 'manual', manual_progress: 10 },
  ];
  const goals = await E.Goal.bulkCreate(goalsData.map(({ key, ...g }) => ({ ...g, workspace: W })));
  const gid = Object.fromEntries(goals.map((g, i) => [goalsData[i].key, g.id]));

  // One goal per project.
  const projectGoal = {
    'Data Analytics Job Search': 'role', 'Learn Python for Data Analysis': 'role', 'Personal Portfolio Website': 'role',
    'Small Business Launch': 'consult', 'Home Office Upgrade': 'consult',
    'Personal Knowledge System Research': 'pkm', 'Mobile App Prototype': 'pkm',
    '10K Training Plan': 'run', 'Resume & LinkedIn Refresh': 'resume',
  };
  await E.Project.bulkUpdate(Object.entries(projectGoal).filter(([t]) => proj[t]).map(([t, k]) => ({ id: proj[t], goal_id: gid[k] })));

  // Lessons tied to the achieved and dropped goals.
  await E.Link.bulkCreate([
    lessonIds.achieved && { source_type: 'goal', source_id: gid.resume, target_type: 'lesson', target_id: lessonIds.achieved, label: 'lesson', workspace: W },
    lessonIds.dropped && { source_type: 'goal', source_id: gid.mandarin, target_type: 'lesson', target_id: lessonIds.dropped, label: 'lesson', workspace: W },
  ].filter(Boolean));

  // Habits. `pattern(i)` returns the status i days ago (i >= 1), or null for no log.
  const start = addDays(today, -45);
  const habitsData = [
    { title: 'Deep Work 90 min', goal: 'role', schedule_type: 'weekdays', weekdays: [1, 2, 3, 4, 5], pattern: () => 'done' }, // unbroken streak
    { title: 'SQL practice 20 min', goal: 'role', schedule_type: 'daily', pattern: (i) => (i <= 2 ? 'missed' : 'done') }, // streak just broke
    { title: 'Read 20 pages', goal: 'pkm', schedule_type: 'daily', pattern: (i) => (i % 5 === 1 ? 'missed' : 'done') }, // recent misses, still going
    { title: 'Client outreach', goal: 'consult', schedule_type: 'weekdays', weekdays: [1, 3, 5], pattern: (i) => (i === 3 || i === 12 ? 'skipped' : 'done') }, // skips keep streak
    { title: 'Run', goal: 'run', schedule_type: 'per_week', per_week_target: 3, pattern: (i) => (i % 7 === 1 || i % 7 === 3 || i % 7 === 5 ? 'done' : null) },
  ];
  const habits = await E.Habit.bulkCreate(habitsData.map((h) => ({
    title: h.title, goal_id: gid[h.goal], schedule_type: h.schedule_type, weekdays: h.weekdays || [], per_week_target: h.per_week_target || 3,
    active: true, start_date: start, best_streak: 0, workspace: W,
  })));

  const weekday = (s) => new Date(`${s}T12:00:00Z`).getUTCDay();
  const logs = [];
  habits.forEach((habit, idx) => {
    const h = habitsData[idx];
    for (let i = 1; i <= 42; i++) {
      const date = addDays(today, -i);
      if (h.schedule_type === 'weekdays' && !h.weekdays.includes(weekday(date))) continue;
      const status = h.pattern(i);
      if (status) logs.push({ habit_id: habit.id, date, status, owner_id: ownerId, workspace: W });
    }
  });
  await E.HabitLog.bulkCreate(logs);

  // Goal check-ins for the previous 4 ISO weeks (current week left open).
  const dow = weekday(today) || 7;
  const thisMonday = addDays(today, 1 - dow);
  const history = {
    role: [['on_track', 30, 'Resume live, first applications out'], ['on_track', 38, 'Two recruiter calls'], ['at_risk', 41, 'Slow week, few applications'], ['on_track', 48, 'Second interview booked']],
    consult: [['on_track', 20, 'Business plan done'], ['on_track', 26, 'LLC filed'], ['at_risk', 28, 'State backlog on LLC'], ['at_risk', 30, 'Still waiting; drafting site in parallel']],
    pkm: [['on_track', 40, 'Tool survey done'], ['on_track', 48, 'Zettelkasten notes'], ['on_track', 55, 'Linked old notes'], ['on_track', 60, 'Methodology draft started']],
    run: [['on_track', 25, 'Ran 5K non-stop'], ['on_track', 35, 'Long run 6 km'], ['at_risk', 38, 'Missed two runs, sore knee'], ['at_risk', 47, 'Back on track, 7 km long run']],
  };
  const checkins = [];
  Object.entries(history).forEach(([key, weeks]) => {
    weeks.forEach(([status, progress, note], w) => {
      checkins.push({ goal_id: gid[key], week_start: addDays(thisMonday, -7 * (4 - w)), status, progress_snapshot: progress, note, workspace: W });
    });
  });
  await E.GoalCheckin.bulkCreate(checkins);

  // Last week's saved AI-style summary for the Weekly Review.
  await E.ReviewEntry.create({
    type: 'weekly', date: addDays(thisMonday, -7), workspace: W,
    summary: 'Protect two deep-work blocks for applications, and keep the consulting site moving while the LLC is pending.',
    content: '- Job search rebounded: a second interview is booked.\n- Consulting has been "at risk" two weeks running, blocked by paperwork you do not control.\n- Knowledge system is steadily on track.\n- 10K training recovered after a sore-knee week.',
  });

  return { goals: goals.length, habits: habits.length, habitLogs: logs.length, goalCheckins: checkins.length };
}