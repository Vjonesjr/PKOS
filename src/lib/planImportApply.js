import { base44 } from "@/api/base44Client";
import { buildInitialOccurrence } from "@/lib/recurringTasks";

const norm=(t)=>String(t||"").trim().toLowerCase();
const rows=(r)=>Array.isArray(r)?r:r?.items||[];
const cleanMilestones=(ms)=>(ms||[]).filter((m)=>m.title?.trim()).map((m)=>({title:m.title.trim(),done:!!m.done,...(m.due_date?{due_date:m.due_date}:{})}));
const mapByTitle=(items)=>new Map(items.map((x)=>[norm(x.title||x.decision),x.id]));

export async function findExisting(workspace,plan){
  const [goals,projects,tasks,repeats,knowledge,decisions,lessons]=await Promise.all([
    base44.entities.Goal.filter({workspace},{limit:1000,fields:["title"]}),
    base44.entities.Project.filter({workspace},{limit:1000,fields:["title"]}),
    base44.entities.Task.filter({workspace,archived:{$ne:true}},{limit:5000,fields:["title"]}),
    base44.entities.RecurringTask.filter({workspace},{limit:1000,fields:["title"]}),
    base44.entities.Knowledge.filter({workspace},{limit:2000,fields:["title"]}),
    base44.entities.Decision.filter({workspace},{limit:1000,fields:["title","decision"]}),
    base44.entities.Lesson.filter({workspace},{limit:1000,fields:["title"]}),
  ]);
  return {goals:mapByTitle(rows(goals)),projects:mapByTitle(rows(projects)),tasks:new Set(rows(tasks).map((x)=>norm(x.title))),recurring_tasks:new Set(rows(repeats).map((x)=>norm(x.title))),knowledge:new Set(rows(knowledge).map((x)=>norm(x.title))),decisions:new Set(rows(decisions).map((x)=>norm(x.title||x.decision))),lessons:new Set(rows(lessons).map((x)=>norm(x.title)))};
}

export async function applyPlan(workspace,plan){
  const existing=await findExisting(workspace,plan); const skipped=[],failed=[]; const goalIds={},projectIds=new Map(existing.projects); const seenGoals=new Set(),seenProjects=new Set();
  let milestones=0,projectCount=0,taskCount=0,recurringCount=0,knowledgeCount=0,decisionCount=0,lessonCount=0;

  const newGoals=[];
  (plan.goals||[]).filter((g)=>g.include&&g.title.trim()).forEach((g)=>{const t=norm(g.title);if(existing.goals.has(t)){goalIds[`new:${g.key}`]=existing.goals.get(t);skipped.push({title:g.title,reason:"Goal already exists; linked instead"});}else if(seenGoals.has(t))skipped.push({title:g.title,reason:"Repeated in file"});else{seenGoals.add(t);newGoals.push(g);}});
  if(newGoals.length)try{const saved=await base44.entities.Goal.bulkCreate(newGoals.map((g)=>({title:g.title.trim(),area:g.area,priority:g.priority,why:g.why,status:"Active",workspace,...(g.target_date?{target_date:g.target_date}:{}),milestones:cleanMilestones(g.milestones)})));saved.forEach((s,i)=>{goalIds[`new:${newGoals[i].key}`]=s.id;existing.goals.set(norm(newGoals[i].title),s.id);milestones+=cleanMilestones(newGoals[i].milestones).length;});}catch(e){newGoals.forEach((g)=>failed.push({title:g.title,reason:e.message}));}

  const newProjects=(plan.projects||[]).filter((p)=>{if(!p.include||!p.title.trim())return false;const t=norm(p.title);if(existing.projects.has(t)){skipped.push({title:p.title,reason:"Project already exists; linked instead"});return false;}if(seenProjects.has(t)){skipped.push({title:p.title,reason:"Repeated in file"});return false;}seenProjects.add(t);return true;});
  if(newProjects.length)try{const saved=await base44.entities.Project.bulkCreate(newProjects.map((p)=>{const goal_id=p.goal_key?.startsWith("id:")?p.goal_key.slice(3):goalIds[p.goal_key]||existing.goals.get(norm(p.goal_title));return {title:p.title.trim(),status:p.status,priority:p.priority,description:p.description,workspace,milestones:cleanMilestones(p.milestones),...(goal_id?{goal_id}:{})};}));saved.forEach((s,i)=>{projectIds.set(norm(newProjects[i].title),s.id);existing.projects.set(norm(newProjects[i].title),s.id);milestones+=cleanMilestones(newProjects[i].milestones).length;});projectCount=saved.length;
    let level=newProjects.flatMap((p)=>p.tasks.map((t)=>({t,project_id:projectIds.get(norm(p.title)),parent:null}))); while(level.length){level=level.filter((x)=>{const k=norm(x.t.title);if(!k)return false;if(existing.tasks.has(k)){skipped.push({title:x.t.title,reason:"Task already exists"});return false;}existing.tasks.add(k);return true;});if(!level.length)break;const savedTasks=await base44.entities.Task.bulkCreate(level.map(({t,project_id,parent})=>({title:t.title.trim(),description:t.description||"",priority:t.priority,status:t.status||"todo",project_id,workspace,...(t.due_date?{due_date:t.due_date}:{}),...(parent?{parent_task_id:parent}:{})})));taskCount+=savedTasks.length;level=level.flatMap((x,i)=>(x.t.subtasks||[]).map((s)=>({t:s,project_id:x.project_id,parent:savedTasks[i].id})));}
  }catch(e){newProjects.forEach((p)=>failed.push({title:p.title,reason:e.message}));}

  const goalId=(r)=>existing.goals.get(norm(r.goal_title)); const projectId=(r)=>projectIds.get(norm(r.project_title));
  const standalone=[];
  for(const t of (plan.tasks||[]).filter((x)=>x.include&&x.title.trim())){const k=norm(t.title);if(existing.tasks.has(k)){skipped.push({title:t.title,reason:"Task already exists"});continue;}existing.tasks.add(k);standalone.push(t);}
  for(const t of standalone){try{const created=await base44.entities.Task.create({title:t.title.trim(),description:t.description||"",priority:t.priority,status:t.status||"todo",workspace,...(t.due_date?{due_date:t.due_date}:{}),...(projectId(t)?{project_id:projectId(t)}:{}),...(goalId(t)?{goal_id:goalId(t)}:{})});taskCount++;let level=(t.subtasks||[]).map((s)=>({t:s,parent:created.id}));while(level.length){const next=[];for(const x of level){if(existing.tasks.has(norm(x.t.title)))continue;existing.tasks.add(norm(x.t.title));const child=await base44.entities.Task.create({title:x.t.title.trim(),description:x.t.description||"",priority:x.t.priority,status:x.t.status||"todo",workspace,parent_task_id:x.parent,...(projectId(t)?{project_id:projectId(t)}:{})});taskCount++;(x.t.subtasks||[]).forEach((s)=>next.push({t:s,parent:child.id}));}level=next;}}catch(e){failed.push({title:t.title,reason:`Task: ${e.message}`});}}

  for(const r of (plan.recurring_tasks||[]).filter((x)=>x.include&&x.title.trim())){const k=norm(r.title);if(existing.recurring_tasks.has(k)){skipped.push({title:r.title,reason:"Repeating task already exists"});continue;}try{const payload={title:r.title.trim(),description:r.description||"",active:r.active!==false,default_priority:r.priority,schedule_type:r.schedule_type,interval_value:r.interval_value,weekdays:r.weekdays||[],day_of_month:r.day_of_month||null,time_of_day:r.time_of_day||"09:00",timezone:r.timezone||Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC",start_date:r.start_date||new Date().toISOString().slice(0,10),end_date:r.end_date||null,saved_subtasks:r.saved_subtasks||[],ai_subtask_level:r.ai_subtask_level||"detailed",workspace,...(projectId(r)?{project_id:projectId(r)}:{}),...(goalId(r)?{goal_id:goalId(r)}:{})};await base44.entities.RecurringTask.create({...payload,next_occurrence_at:buildInitialOccurrence(payload)});existing.recurring_tasks.add(k);recurringCount++;}catch(e){failed.push({title:r.title,reason:`Repeating task: ${e.message}`});}}

  for(const r of (plan.knowledge||[]).filter((x)=>x.include&&x.title.trim())){const k=norm(r.title);if(existing.knowledge.has(k)){skipped.push({title:r.title,reason:"Knowledge record already exists"});continue;}try{await base44.entities.Knowledge.create({title:r.title.trim(),content:r.content||"",type:r.type||"note",tags:r.tags||[],category:r.category||"",source:r.source||"",status:"active",workspace,...(projectId(r)?{project_id:projectId(r)}:{})});existing.knowledge.add(k);knowledgeCount++;}catch(e){failed.push({title:r.title,reason:`Knowledge: ${e.message}`});}}
  for(const r of (plan.decisions||[]).filter((x)=>x.include&&x.title.trim())){const k=norm(r.title);if(existing.decisions.has(k)){skipped.push({title:r.title,reason:"Decision already exists"});continue;}try{await base44.entities.Decision.create({title:r.title.trim(),decision:r.decision||r.title,context:r.context||"",alternatives:r.alternatives||"",reasoning:r.reasoning||"",expected_result:r.expected_result||"",date:r.date||new Date().toISOString().slice(0,10),status:"made",workspace,...(projectId(r)?{project_id:projectId(r)}:{})});existing.decisions.add(k);decisionCount++;}catch(e){failed.push({title:r.title,reason:`Decision: ${e.message}`});}}
  for(const r of (plan.lessons||[]).filter((x)=>x.include&&x.title.trim())){const k=norm(r.title);if(existing.lessons.has(k)){skipped.push({title:r.title,reason:"Lesson already exists"});continue;}try{await base44.entities.Lesson.create({title:r.title.trim(),what_happened:r.what_happened||"",what_worked:r.what_worked||"",what_didnt:r.what_didnt||"",learned:r.learned||r.title,next_time:r.next_time||"",workspace,...(projectId(r)?{project_id:projectId(r)}:{})});existing.lessons.add(k);lessonCount++;}catch(e){failed.push({title:r.title,reason:`Lesson: ${e.message}`});}}

  return {goals:newGoals.length,projects:projectCount,tasks:taskCount,recurring_tasks:recurringCount,knowledge:knowledgeCount,decisions:decisionCount,lessons:lessonCount,milestones,skipped,failed};
}
