export const SUPPORT_CATEGORY = 'Support strategies';
export const SUPPORT_PRESETS = [
 {name:'Paperwork feels overwhelming',blocker:'Paperwork or phone calls feel overwhelming.',helps:'Gather one document, choose a quiet time, and ask someone I trust for practical support if I want it.',action:'Find the insurance contact details and write down one question.',reminder:'One small paperwork step',cadence:'once'},
 {name:'Too many projects',blocker:'I start more projects than I finish.',helps:'Choose one priority for this session, park new ideas in Capture, and define a small finish line before switching.',action:'Choose one project and finish one clearly defined task.',reminder:'Return to my chosen priority',cadence:'daily'},
 {name:'Distractions',blocker:'I lose track of the task when distractions appear.',helps:'Close unrelated tabs, put the next action in view, and use a short focus session.',action:'Clear one distraction and start a 10-minute focus session.',reminder:'My next focused step',cadence:'daily'},
 {name:'Burnout / energy',blocker:'I push too long and run out of energy.',helps:'Plan a short work interval and a real break. Adjust the timing based on what works for me.',action:'Work for 15 minutes, then take a 5-minute break.',reminder:'Pause and check my energy',cadence:'once'},
 {name:'Build a practice routine',blocker:'I need consistent practice to feel more confident.',helps:'Practice one small skill, note what improved, and use that note in the next session.',action:'Practice one skill for 10 minutes and write down one improvement.',reminder:'A short practice session',cadence:'twice'},
 {name:'Remember my routine',blocker:'I forget a routine I chose for myself.',helps:'Use a neutral reminder and a simple checklist for the routine I already follow.',action:'Review my routine checklist.',reminder:'My routine check-in',cadence:'daily'},
];
export const emptySupport = () => ({blocker:'',helps:'',action:'',reminder:'My next small step',cadence:'once',date:new Date().toLocaleDateString('en-CA'),time:'09:00',secondTime:'18:00',history:''});
const FIELDS = {blocker:'What gets in the way',helps:'What helps me',action:'My next small action',reminder:'Reminder label',cadence:'Reminder frequency',date:'First reminder day',time:'First reminder time',secondTime:'Second reminder time',history:'What I learned'};
const FREQUENCY = {once:'Once',daily:'Every day',twice:'Twice a day'};
export function supportContent(values, type, record) {
 const path=`/${type==='task'?'task-detail':'project-detail'}?id=${encodeURIComponent(record.id)}`;
 return `## Connected item\n[${record.title}](${path})\n\n`+Object.entries(FIELDS).map(([key,label])=>`## ${label}\n${key==='cadence'?FREQUENCY[values[key]]||'Once':values[key]||''}`).join('\n\n');
}
export function readSupport(content='') {
 const result=emptySupport();
 for(const [key,label] of Object.entries(FIELDS)){
  const marker=`## ${label}\n`,start=content.indexOf(marker);
  if(start>=0){const from=start+marker.length,end=content.indexOf('\n\n## ',from);result[key]=content.slice(from,end<0?undefined:end).trim();}
 }
 result.cadence=Object.entries(FREQUENCY).find(([,label])=>label===result.cadence)?.[0]||'once';
 return result;
}
export const belongsTo = (plan,type,id) => plan.content?.includes(`](/${type==='task'?'task-detail':'project-detail'}?id=${encodeURIComponent(id)})`);
export async function saveSupportTask(client, plan, type, record, workspace, values, reminder=false) {
 const title=(reminder?values.reminder:values.action).trim();
 if(!title)throw Error(reminder?'Add a reminder label first.':'Write a small next action first.');
 if(reminder&&(!/^\d{4}-\d{2}-\d{2}$/.test(values.date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(values.time)||(values.cadence==='twice'&&(!/^([01]\d|2[0-3]):[0-5]\d$/.test(values.secondTime)||values.time===values.secondTime))))throw Error('Choose a date and distinct valid reminder times.');
 const reference=`/knowledge-detail?id=${plan.id}`,times=reminder?(values.cadence==='twice'?[values.time,values.secondTime]:[values.time]):[''];
 const rows=await client.entities.Task.filter({workspace,title},'-created_date',100),saved=[];
 for(const time of times){
  const known=rows.find(t=>t.description?.includes(reference)&&(t.scheduled_time||'')===time&&(!reminder||t.due_date>=values.date));
  if(known){saved.push(known);continue;}
  const task=await client.entities.Task.create({title,description:`${reminder?'Reminder for':'Next action from'} my support plan.\n${values.helps}\n\nSupport plan: ${reference}`,workspace,status:'todo',priority:'medium',...(type==='task'?{parent_task_id:record.id}:{}),...(type==='project'||record.project_id?{project_id:type==='project'?record.id:record.project_id}:{}),...(reminder?{due_date:values.date,today_date:values.date,scheduled_time:time,recurrence:values.cadence==='once'?'none':'daily'}:{})});
  if(!task?.id)throw Error('The task could not be confirmed. Check your queue before retrying.');
  saved.push(task);rows.push(task);
 }
 return saved;
}
export function supportConnection(content='') {
 const match=content.match(/\[([^\]]+)\]\((\/(?:task|project)-detail\?id=[^)\s]+)\)/);
 return match?{title:match[1],path:match[2]}:null;
}
export function supportEvidence(content='') {
 const history=readSupport(content).history;
 const outcomes=history.split('\n').filter(line=>line.startsWith('• ')).map(line=>line.match(/: (Helped a little|Helped|Try a different approach)(?: — |$)/)?.[1]).filter(Boolean);
 const helped=outcomes.filter(v=>v==='Helped').length,partly=outcomes.filter(v=>v==='Helped a little').length,different=outcomes.filter(v=>v==='Try a different approach').length,total=outcomes.length;
 return {helped,partly,different,total,next:!total?'Try one small action, then record what helped.':total<3?'Keep collecting check-ins before treating this as a pattern.':helped>=2&&helped/total>=0.6?'Repeat what helped, then compare the next attempt.':different>=2?'Change one part of the approach, then compare your next check-in.':'Keep the useful parts and test one small change.'};
}
export function remapSupportReferences(text, idMaps) {
 if(typeof text!=='string')return text;
 const types={'task-detail':'Task','project-detail':'Project','knowledge-detail':'Knowledge'};
 return text.replace(/\/(task-detail|project-detail|knowledge-detail)\?id=([^\s)\]#]+)/g,(full,type,id)=>{let decoded;try{decoded=decodeURIComponent(id);}catch{return full;}const mapped=idMaps[types[type]]?.[decoded];return mapped?`/${type}?id=${encodeURIComponent(mapped)}`:full;});
}
