import {currentOwner,readPreferences,localDay} from './preferences';
const AI_FUNCTIONS=new Set(['aiAssist','processDocument','draftGoal','generateContextPack']);
const flights=new Map();
export function guardClient(client){
 const serial=(scope,fn)=>{const key=(currentOwner()||'signed-out')+':'+scope,previous=flights.get(key)||Promise.resolve();const next=previous.catch(()=>{}).then(fn);flights.set(key,next);next.finally(()=>{if(flights.get(key)===next)flights.delete(key);}).catch(()=>{});return next;};
 const consent=()=>{if(!readPreferences().aiConsent)throw Error('AI is off. Enable cloud AI in Settings before requesting this action.');};
 const ownerQuery=q=>{const owner=currentOwner();if(!owner)throw Error('Your account is still loading. Please retry.');return {...q,created_by_id:owner};};
 const owned=row=>{if(row?.created_by_id&&row.created_by_id!==currentOwner())throw Error('This item belongs to a different account.');return row;};
 const array=rows=>Array.isArray(rows)?rows:rows?.items||[];
 const checkCapacity=async(type,data,id)=>{
  const prefs=readPreferences(),old=id?owned(await client.entities[type].get(id)):null,workspace=data.workspace||old?.workspace;
  if(type==='Project'&&(data.status||old?.status)==='Completed'&&data.progress!==undefined&&data.progress!==100)throw Error('A finished project stays at 100%. Reopen it before changing progress.');
  if(type==='Project'&&data.status==='Active'&&old?.status!=='Active'){
   if(!old)throw Error('New projects start in Later. Set a finish line before activating.');
   const plans=array(await client.entities.Knowledge.filter(ownerQuery({workspace,project_id:id,category:'Project plan'}),'-updated_date',20));
   const plan=plans[0]?.content||'',marker='## Definition of done\n',from=plan.indexOf(marker),end=plan.indexOf('\n\n## ',from+marker.length);
   if(from<0||!plan.slice(from+marker.length,end<0?undefined:end).trim())throw Error('Save a definition of done in the project plan before activating.');
   const active=array(await client.entities.Project.filter(ownerQuery({workspace,status:'Active'}),'-updated_date',500));
   if(active.length>=prefs.maxProjects)throw Error(`Project capacity is ${prefs.maxProjects}. Pause an active project before starting another.`);
  }
  if(type==='Project'&&data.status==='Completed'&&old?.status!=='Completed'){
   const pending=array(await client.entities.Task.filter(ownerQuery({workspace,project_id:id,status:{$ne:'done'},archived:{$ne:true}}),'-updated_date',500));
   if(pending.length)throw Error('Review and move or cancel unfinished tasks before finishing this project.');
   const evidence=array(await client.entities.Knowledge.filter(ownerQuery({workspace,project_id:id,category:'Project finish evidence'}),'-updated_date',20));
   if(!evidence.length)throw Error('Use Finish Project to confirm its checklist and save the result.');
  }
  if(type==='Task'){
   const date=data.today_date!==undefined?data.today_date:old?.today_date,status=data.status||old?.status||'todo',archived=data.archived!==undefined?data.archived:old?.archived;
   if(date===localDay()&&status!=='done'&&!archived&&!(old?.today_date===date&&old.status!=='done'&&!old.archived)){
    const today=array(await client.entities.Task.filter(ownerQuery({workspace,today_date:date,status:{$ne:'done'},archived:{$ne:true}}),'-updated_date',500));
    if(today.filter(t=>t.id!==id).length>=prefs.maxToday)throw Error(`Today has room for ${prefs.maxToday} unfinished tasks. Remove or finish one first.`);
   }
  }
 };
 const entities=new Proxy(client.entities,{get(target,type){const entity=target[type];if(!entity||type==='User')return entity;return new Proxy(entity,{get(e,method){const fn=e[method];if(typeof fn!=='function')return fn;if(method==='subscribe')return callback=>fn.call(e,event=>{if(event.data?.created_by_id===currentOwner())callback(event);});if(method==='get')return async id=>owned(await fn.call(e,id));if(method==='filter')return (query={},...rest)=>fn.call(e,ownerQuery(query),...rest);if(method==='list')return (...rest)=>e.filter(ownerQuery({}),...rest);if(method==='create'||method==='update')return (...args)=>serial('writes',async()=>{const id=method==='update'?args[0]:null,data=method==='update'?args[1]:args[0];if(id)owned(await e.get(id));await checkCapacity(type,data,id);if(type==='Task'&&(data.parent_task_id||id&&data.project_id!==undefined)){const old=id?await e.get(id):null,parentId=data.parent_task_id!==undefined?data.parent_task_id:old?.parent_task_id;let parent=parentId?owned(await client.entities.Task.get(parentId)):null,seen=new Set(id?[id]:[]);const project=data.project_id!==undefined?data.project_id:old?.project_id;const workspace=data.workspace||old?.workspace;if(parent&&(parent.workspace!==workspace||(parent.project_id||null)!==(project||null)))throw Error('A subtask must stay in its parent’s workspace and project.');while(parent){if(seen.has(parent.id))throw Error('Subtasks cannot form a loop.');seen.add(parent.id);parent=parent.parent_task_id?owned(await client.entities.Task.get(parent.parent_task_id)):null;}}return fn.apply(e,args);});return fn.bind(e);}});}});
 const integrations=new Proxy(client.integrations,{get(target,name){const value=target[name];if(name!=='Core')return value;return new Proxy(value,{get(core,key){const fn=core[key];if(['InvokeLLM','GenerateImage'].includes(key))return async (...args)=>{consent();return fn.apply(core,args);};return typeof fn==='function'?fn.bind(core):fn;}});}});
 const functions=new Proxy(client.functions,{get(target,key){const fn=target[key];if(key==='invoke')return async (name,...args)=>{if(AI_FUNCTIONS.has(name))consent();return fn.call(target,name,...args);};return typeof fn==='function'?fn.bind(target):fn;}});
 const agents=new Proxy(client.agents||{},{get(target,key){const fn=target[key];if(typeof fn!=='function')return fn;return (...args)=>{if(['createConversation','addMessage','sendMessage'].includes(key))consent();return fn.apply(target,args);};}});
 return new Proxy(client,{get(target,key){if(key==='entities')return entities;if(key==='integrations')return integrations;if(key==='functions')return functions;if(key==='agents')return agents;const value=target[key];return typeof value==='function'?value.bind(target):value;}});
}
