import {user} from './context';
const day = date => [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
const today=day(new Date()),future=day(new Date(Date.now()+7*86400000));
const tasks=Array.from({length:52},(_,i)=>({id:`qa-${i}`,title:`QA task ${i+1}`,status:'todo',workspace:'personal',priority:'medium',sort_order:i*10,created_by_id:user.id,updated_date:new Date().toISOString(),...(i<32?{due_date:today,today_date:today}:i<44?{due_date:future}:{})}));
const templates=Array.from({length:9},(_,i)=>({id:`repeat-${i}`,title:`QA repeat ${i+1}`,active:false,workspace:'personal',schedule_type:'daily',next_occurrence_at:new Date(Date.now()+86400000).toISOString()}));
const data={Task:tasks,RecurringTask:templates,Project:[{id:'project-1',title:'QA project',workspace:'personal',status:'Active',progress:20,updated_date:new Date().toISOString()}]};
window.__qaMutations=[];window.__qaData=data;
function matches(row,q){return Object.entries(q||{}).every(([k,v])=>typeof v==='object'&&v!==null?('$ne'in v?row[k]!==v.$ne:'$in'in v?v.$in.includes(row[k]):true):row[k]===v);}
export const base44 = {
  auth: { me: async()=>user, updateMe: async()=>user },
  app: { getPublicSettings: async()=>({id:'qa',public_settings:{}}) },
  entities: new Proxy({}, {
    get(_, name) {
      return {
        filter: async q => { const found=(data[name]||[]).filter(r=>matches(r,q)); found.items=[...found]; return found; },
        list: async () => data[name]||[],
        get: async id => (data[name]||[]).find(r=>r.id===id),
        update: async (id,patch) => { window.__qaMutations.push({name,id,patch}); const row=(data[name]||[]).find(r=>r.id===id); Object.assign(row,patch); return row; },
        create: async patch => { throw new Error('Unexpected QA create '+name+JSON.stringify(patch)); },
        subscribe: () => () => {}
      };
    }
  })
};