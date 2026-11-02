// Parsing for Smart PKOS imports. Pure functions, no persistence.
import { GOAL_AREAS } from "@/lib/goals";

export const PLAN_EXTS = ["csv", "json", "txt"];
export const PLAN_MAX_BYTES = 10 * 1024 * 1024;
export const MAX_RECORDS = 250;
export const MAX_TASK_DEPTH = 3;

const PRIORITIES = ["low", "medium", "high"];
const PROJECT_STATUSES = ["Idea", "Planned", "Active", "Waiting", "Completed", "Archived"];
const TASK_STATUSES = ["todo", "in_progress", "waiting", "done"];
const SCHEDULE_TYPES = ["daily", "weekdays", "weekly", "monthly", "interval_days", "after_completion"];
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || "");
const pick = (v, list, fallback) => list.find((x) => x.toLowerCase() === String(v || "").trim().toLowerCase()) || fallback;
let seq = 0;
const key = () => `k${++seq}`;
const title = (v) => String(v || "").trim().slice(0, 200);
const text = (v, max = 4000) => String(v || "").trim().slice(0, max);
const tags = (v) => Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean).slice(0, 30) : String(v || "").split(/[;,]/).map((x) => x.trim()).filter(Boolean).slice(0, 30);

export const CSV_TEMPLATE = `type,title,parent,area,status,priority,target_date,description\ngoal,Run a half marathon,,Health,,high,2027-04-01,Finish under 2 hours\nproject,Training plan,Run a half marathon,,Active,medium,,12-week schedule\ntask,Plan weekly runs,Training plan,,,high,2026-10-25,\nsubtask,Pick a running route,Plan weekly runs,,,,,\ntask,Call the dentist,,,,medium,2026-10-29,Standalone task\nrecurring_task,Weekly finance review,,,,medium,,Review balances and bills every Saturday\nknowledge,Interview notes,,,,,,,Useful notes to keep\ndecision,Use remote-first job search,,,,,,,Focus on remote roles first\nlesson,What improved my interview answers,,,,,,,Short examples work better\n`;

export const JSON_TEMPLATE = JSON.stringify({
  goals: [{ title: "Run a half marathon", area: "Health", priority: "high", target_date: "2027-04-01", why: "Finish under 2 hours", projects: [{ title: "Training plan", status: "Active", tasks: [{ title: "Plan weekly runs", subtasks: [{ title: "Pick a running route" }] }] }] }],
  projects: [{ title: "Standalone project", status: "Idea" }],
  tasks: [{ title: "Call the dentist", priority: "medium", due_date: "2026-10-29", description: "Standalone task" }],
  recurring_tasks: [{ title: "Weekly finance review", schedule_type: "weekly", weekdays: [6], time_of_day: "08:00", priority: "medium" }],
  knowledge: [{ title: "Interview notes", content: "Useful notes to keep", type: "reference", tags: ["career"] }],
  decisions: [{ title: "Use remote-first job search", decision: "Prioritize remote roles first", context: "Current career search" }],
  lessons: [{ title: "Interview answer lesson", learned: "Short, concrete examples work better." }]
}, null, 2);

const milestone = (m) => ({ title: title(m?.title || m), due_date: isDate(m?.due_date) ? m.due_date : "", done: !!m?.done });
const suggestedTasks = (g) => (g.suggested_tasks || g.tasks || []).map((t) => title(t?.title || t)).filter(Boolean).slice(0, 20);

export const normGoal = (g) => ({ key: key(), title: title(g.title), area: pick(g.area, GOAL_AREAS, "Personal"), priority: pick(g.priority, PRIORITIES, "medium"), target_date: isDate(g.target_date) ? g.target_date : "", why: text(g.why || g.description, 1000), milestones: (g.milestones || []).map(milestone).filter((m) => m.title), suggested_tasks: suggestedTasks(g), include: true });

export const normTask = (t, depth = 1) => ({
  key: key(), title: title(t?.title || t), description: text(t?.description, 2000), priority: pick(t?.priority, PRIORITIES, "medium"), status: pick(t?.status, TASK_STATUSES, "todo"), due_date: isDate(t?.due_date) ? t.due_date : "", project_title: title(t?.project_title || t?.project), goal_title: title(t?.goal_title || t?.goal), include: true,
  subtasks: depth < MAX_TASK_DEPTH ? (t?.subtasks || []).map((s) => normTask(s, depth + 1)).filter((s) => s.title) : [],
});

export const normRecurringTask = (r) => ({ key:key(), title:title(r?.title), description:text(r?.description,2000), active:r?.active !== false, project_title:title(r?.project_title || r?.project), goal_title:title(r?.goal_title || r?.goal), priority:pick(r?.priority || r?.default_priority, PRIORITIES,"medium"), schedule_type:pick(r?.schedule_type,SCHEDULE_TYPES,"weekly"), interval_value:Math.max(1,Number(r?.interval_value)||1), weekdays:Array.isArray(r?.weekdays)?r.weekdays.map(Number).filter((n)=>n>=0&&n<=6):[], day_of_month:Number(r?.day_of_month)||0, time_of_day:/^([01]\d|2[0-3]):[0-5]\d$/.test(r?.time_of_day||"")?r.time_of_day:"09:00", timezone:text(r?.timezone,100), start_date:isDate(r?.start_date)?r.start_date:"", end_date:isDate(r?.end_date)?r.end_date:"", saved_subtasks:(r?.saved_subtasks||[]).map(title).filter(Boolean).slice(0,30), ai_subtask_level:["basic","detailed","step_by_step"].includes(r?.ai_subtask_level)?r.ai_subtask_level:"detailed", include:true });
export const normKnowledge = (r) => ({ key:key(), title:title(r?.title), content:text(r?.content || r?.description,12000), type:text(r?.type,40)||"note", tags:tags(r?.tags), category:text(r?.category,100), source:text(r?.source,500), project_title:title(r?.project_title || r?.project), include:true });
export const normDecision = (r) => ({ key:key(), title:title(r?.title || r?.decision), decision:text(r?.decision || r?.title,2000), context:text(r?.context || r?.description,4000), alternatives:text(r?.alternatives,4000), reasoning:text(r?.reasoning,4000), expected_result:text(r?.expected_result,2000), project_title:title(r?.project_title || r?.project), date:isDate(r?.date)?r.date:"", include:true });
export const normLesson = (r) => ({ key:key(), title:title(r?.title), what_happened:text(r?.what_happened || r?.description,4000), what_worked:text(r?.what_worked,4000), what_didnt:text(r?.what_didnt,4000), learned:text(r?.learned || r?.content || r?.description,4000), next_time:text(r?.next_time,4000), project_title:title(r?.project_title || r?.project), include:true });
export const normProject = (p, goalKey = "") => ({ tasks:(p.tasks||[]).map((t)=>normTask(t)).filter((t)=>t.title), key:key(), title:title(p.title), status:pick(p.status,PROJECT_STATUSES,"Idea"), priority:pick(p.priority,PRIORITIES,"medium"), description:text(p.description,2000), goal_key:goalKey?`new:${goalKey}`:"", goal_title:title(p.goal_title || p.goal), milestones:(p.milestones||[]).map(milestone).filter((m)=>m.title), include:true });

export const countTasks = (tasks) => tasks.reduce((n,t)=>n+1+countTasks(t.subtasks||[]),0);
export const totalPlanRecords = (plan) => ["goals","projects","tasks","recurring_tasks","knowledge","decisions","lessons"].reduce((n,k)=>n+(plan[k]||[]).filter((x)=>x.include!==false).length,0);

export function parseCsv(textValue) {
  const rows=[]; let row=[],cell="",q=false;
  for(let i=0;i<textValue.length;i++){const c=textValue[i];if(q){if(c==='"'&&textValue[i+1]==='"'){cell+='"';i++;}else if(c==='"')q=false;else cell+=c;}else if(c==='"')q=true;else if(c===','){row.push(cell);cell="";}else if(c==='\n'||c==='\r'){if(c==='\r'&&textValue[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell="";}else cell+=c;}
  if(cell||row.length){row.push(cell);rows.push(row);} return rows.filter((r)=>r.some((c)=>c.trim()));
}

function blankPlan(){return {goals:[],projects:[],tasks:[],recurring_tasks:[],knowledge:[],decisions:[],lessons:[],warnings:[]};}

function fromCsv(textValue){
  const [head,...rows]=parseCsv(textValue); const cols=(head||[]).map((h)=>h.trim().toLowerCase()); if(!cols.includes("type")||!cols.includes("title"))return null;
  const recs=rows.map((r)=>Object.fromEntries(cols.map((c,i)=>[c,(r[i]||"").trim()]))); const plan=blankPlan();
  const byTitle=(list,t)=>list.find((x)=>x.title.toLowerCase()===String(t||"").toLowerCase());
  recs.filter((r)=>r.type.toLowerCase()==="goal").forEach((r)=>plan.goals.push(normGoal(r)));
  recs.filter((r)=>r.type.toLowerCase()==="project").forEach((r)=>{const g=r.parent&&byTitle(plan.goals,r.parent); if(r.parent&&!g)plan.warnings.push(`Project "${r.title}": goal "${r.parent}" not found; project kept unlinked.`); const p=normProject(r,g?.key||""); if(!g)p.goal_title=r.parent||""; plan.projects.push(p);});
  const taskIndex=[];
  recs.forEach((r,i)=>{const type=String(r.type||"").toLowerCase(); if(!["task","subtask"].includes(type))return; const parentName=r.parent||""; const parentTask=taskIndex.find((x)=>x.title===parentName.toLowerCase()); const proj=!parentTask&&byTitle(plan.projects,parentName); const goal=!parentTask&&!proj&&byTitle(plan.goals,parentName); if(type==="subtask"&&!parentTask)return plan.warnings.push(`Row ${i+2}: subtask "${r.title}" has no matching parent task "${parentName}"; skipped.`); const depth=parentTask?parentTask.depth+1:1; if(depth>MAX_TASK_DEPTH)return plan.warnings.push(`Row ${i+2}: "${r.title}" is nested more than ${MAX_TASK_DEPTH} levels; skipped.`); const node=normTask({...r,project_title:proj?.title||"",goal_title:goal?.title||""},depth); if(parentTask)parentTask.node.subtasks.push(node); else if(proj)proj.tasks.push(node); else plan.tasks.push(node); taskIndex.push({title:node.title.toLowerCase(),node,depth}); if(parentName&&!parentTask&&!proj&&!goal)plan.warnings.push(`Row ${i+2}: task "${r.title}" parent "${parentName}" not found; imported as standalone.`);});
  recs.forEach((r,i)=>{const t=String(r.type||"").toLowerCase(); if(["goal","project","task","subtask"].includes(t))return; if(t==="milestone"){const parent=r.parent&&(byTitle(plan.projects,r.parent)||byTitle(plan.goals,r.parent)); if(!parent)plan.warnings.push(`Row ${i+2}: milestone "${r.title}" has no matching parent "${r.parent}"; skipped.`); else parent.milestones.push(milestone({title:r.title,due_date:r.due_date||r.target_date}));} else if(["recurring_task","recurring","repeat"].includes(t))plan.recurring_tasks.push(normRecurringTask({...r,description:r.description,project_title:r.parent})); else if(t==="knowledge")plan.knowledge.push(normKnowledge({...r,content:r.description,project_title:r.parent})); else if(t==="decision")plan.decisions.push(normDecision({...r,decision:r.description||r.title,project_title:r.parent})); else if(t==="lesson")plan.lessons.push(normLesson({...r,learned:r.description,project_title:r.parent})); else plan.warnings.push(`Row ${i+2}: unknown type "${r.type}"; skipped.`);});
  return plan;
}

function fromJson(textValue){
  const data=JSON.parse(textValue); if(!data||typeof data!=="object")return null; const recognized=["goals","projects","tasks","recurring_tasks","knowledge","decisions","lessons"].some((k)=>Array.isArray(data[k])); if(!recognized)return null; const plan=blankPlan();
  (data.goals||[]).forEach((g)=>{const goal=normGoal(g);plan.goals.push(goal);(g.projects||[]).forEach((p)=>plan.projects.push(normProject(p,goal.key)));});
  (data.projects||[]).forEach((p)=>plan.projects.push(normProject(p)));
  (data.tasks||[]).forEach((t)=>plan.tasks.push(normTask(t)));
  (data.recurring_tasks||data.recurringTasks||[]).forEach((r)=>plan.recurring_tasks.push(normRecurringTask(r)));
  (data.knowledge||[]).forEach((r)=>plan.knowledge.push(normKnowledge(r)));
  (data.decisions||[]).forEach((r)=>plan.decisions.push(normDecision(r)));
  (data.lessons||[]).forEach((r)=>plan.lessons.push(normLesson(r)));
  return plan;
}

export function parseTemplate(ext,textValue){if(ext==="csv"){const plan=fromCsv(textValue);return plan?{plan}:{raw:textValue};}if(ext==="json"){try{const plan=fromJson(textValue);return plan?{plan}:{raw:textValue};}catch{throw new Error("This JSON file is malformed. Fix it or use the JSON template.");}}return {raw:textValue};}

export function finalizePlan(plan){
  const warnings=[...(plan.warnings||[])]; const clean=(list)=>(list||[]).filter((x)=>x.title); const next={...blankPlan(),...plan,warnings};
  for(const k of ["goals","projects","tasks","recurring_tasks","knowledge","decisions","lessons"]){const before=(next[k]||[]).length; next[k]=clean(next[k]).slice(0,MAX_RECORDS); const dropped=before-clean(next[k]).length; if(dropped)warnings.push(`${dropped} ${k.replace('_',' ')} record(s) without a title were skipped.`);}
  const nested=next.projects.reduce((n,p)=>n+countTasks(p.tasks||[]),0); const top=next.tasks.reduce((n,t)=>n+1+countTasks(t.subtasks||[]),0); if(nested+top>500)warnings.push(`${nested+top} tasks found; large imports may take a while.`);
  if(totalPlanRecords(next)>MAX_RECORDS)warnings.push(`Large import detected. Review carefully before saving.`); return next;
}

export function fromDetected(r){const plan=blankPlan(); plan.goals=(r.goals||[]).map(normGoal); const byTitle=new Map(plan.goals.map((g)=>[g.title.toLowerCase(),g.key])); plan.projects=(r.projects||[]).map((p)=>normProject(p,byTitle.get(String(p.goal_title||"").toLowerCase())||"")); plan.tasks=(r.tasks||[]).map(normTask); plan.recurring_tasks=(r.recurring_tasks||[]).map(normRecurringTask); plan.knowledge=(r.knowledge||[]).map(normKnowledge); plan.decisions=(r.decisions||[]).map(normDecision); plan.lessons=(r.lessons||[]).map(normLesson); plan.warnings=["Structure was detected by AI. Check titles, dates, links and recurrence rules carefully."]; return plan;}

export function downloadTemplate(kind){const [body,type]=kind==="csv"?[CSV_TEMPLATE,"text/csv"]:[JSON_TEMPLATE,"application/json"];const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([body],{type}));a.download=`smart-pkos-import-template.${kind}`;a.click();URL.revokeObjectURL(a.href);}
