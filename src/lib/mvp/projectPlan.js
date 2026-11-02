export const PLAN_CATEGORY='Project plan';
export const FINISH_CATEGORY='Project finish evidence';
export function readPlan(content=''){const value={outcome:'',done:'',mode:'manual',nextTask:''};for(const [key,title] of Object.entries({outcome:'Desired outcome',done:'Definition of done',mode:'Progress mode',nextTask:'Next task'})){const marker=`## ${title}\n`,start=content.indexOf(marker);if(start>=0){const from=start+marker.length,end=content.indexOf('\n\n## ',from);value[key]=content.slice(from,end<0?undefined:end).trim();}}return value;}
export const planContent=values=>Object.entries({outcome:'Desired outcome',done:'Definition of done',mode:'Progress mode',nextTask:'Next task'}).map(([key,label])=>`## ${label}\n${values[key]||''}`).join('\n\n');
export const checklistOf=text=>text.split('\n').map(s=>s.trim().replace(/^[-*]\s*/, '')).filter(Boolean);
