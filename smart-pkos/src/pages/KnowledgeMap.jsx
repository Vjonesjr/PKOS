import React,{useEffect,useMemo,useState} from "react";
import {Link} from "react-router-dom";
import {Network,Search,Layers,ArrowUpRight} from "lucide-react";
import {base44} from "@/api/base44Client";
import {ENTITY_CONFIG,recordLabel} from "@/lib/entityConfig";
import {useWorkspace} from "@/lib/WorkspaceContext";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";

const TYPES=["project","goal","task","knowledge","decision","lesson","learning","capture"];
const resolveUrl=(type,record)=>{
 const cfg=ENTITY_CONFIG[type];if(!cfg)return "/";
 if(cfg.detail)return `${cfg.route}?id=${encodeURIComponent(record.id)}`;
 if(cfg.param)return `${cfg.route}?${cfg.param}=${encodeURIComponent(record.id)}`;
 return cfg.route;
};
const key=(type,id)=>`${type}:${id}`;
export default function KnowledgeMap(){
 const {workspace,isSeeding}=useWorkspace();
 const [links,setLinks]=useState([]),[records,setRecords]=useState([]),[query,setQuery]=useState("");
 const [selected,setSelected]=useState(""),[type,setType]=useState("all"),[view,setView]=useState("list");
 const [expanded,setExpanded]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState("");
 useEffect(()=>{
  let active=true;setLoading(true);setSelected("");setExpanded(false);setError("");
  if(isSeeding)return ()=>{active=false;};
  (async()=>{
   const groups=await Promise.all(TYPES.map(async t=>{
    const cfg=ENTITY_CONFIG[t] || (t==="goal"?{entity:base44.entities.Goal}:null);
    if(!cfg?.entity)return [];
    try{return (await cfg.entity.filter({workspace},"-updated_date",300)).map(r=>({...r,_type:t,_key:key(t,r.id)}));}catch{return [];}
   }));
   const list=await base44.entities.Link.filter({workspace},"-created_date",1000);
   if(active){setRecords(groups.flat());setLinks(list);setLoading(false);}
  })().catch(()=>{if(active){setError("Map couldn't load. Try reopening this page.");setLoading(false);}});
  return ()=>{active=false;};
 },[workspace,isSeeding]);
 const byKey=useMemo(()=>new Map(records.map(r=>[r._key,r])),[records]);
 const edges=useMemo(()=>links.filter(l=>byKey.has(key(l.source_type,l.source_id))&&byKey.has(key(l.target_type,l.target_id))),[links,byKey]);
 const matches=useMemo(()=>records.filter(r=>(type==="all"||r._type===type)&&[recordLabel(r._type,r),r.description].join(" ").toLowerCase().includes(query.toLowerCase())).slice(0,100),[records,type,query]);
 const focus=byKey.get(selected);
 const oneHop=useMemo(()=>focus?edges.filter(l=>key(l.source_type,l.source_id)===selected||key(l.target_type,l.target_id)===selected):[],[edges,focus,selected]);
 const neighborKeys=useMemo(()=>new Set(oneHop.flatMap(l=>[key(l.source_type,l.source_id),key(l.target_type,l.target_id)])),[oneHop]);
 const shown=useMemo(()=>!focus?matches:(expanded?records.filter(r=>neighborKeys.has(r._key)):records.filter(r=>neighborKeys.has(r._key))).filter(r=>type==="all"||r._type===type),[focus,matches,records,neighborKeys,expanded,type]);
 const choose=(r)=>{setSelected(r._key);setQuery("");};
 const display=(r)=> <div key={r._key} className={`min-w-0 rounded-xl border p-4 ${selected===r._key?"border-primary bg-primary/10":"border-border bg-card/70"}`}>
   <button type="button" className="w-full text-left" onClick={()=>choose(r)}>
    <span className="text-xs text-primary">{r._type.toUpperCase()}</span>
    <span className="mt-1 block break-words text-base font-semibold leading-6">{recordLabel(r._type,r)}</span>
   </button>
   <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
    <span>{edges.filter(l=>key(l.source_type,l.source_id)===r._key||key(l.target_type,l.target_id)===r._key).length} connections</span>
    <Link className="inline-flex min-h-11 items-center gap-1 text-primary" to={resolveUrl(r._type,r)}>Open record <ArrowUpRight className="h-4 w-4"/></Link>
   </div>
 </div>;
 return <div className="mx-auto max-w-6xl space-y-5">
  <header><div className="flex items-center gap-2"><Network className="text-primary"/><h1 className="text-2xl font-semibold">Knowledge Map</h1></div>
   <p className="mt-1 text-sm text-muted-foreground">Find a record, select it, and explore only its real connections—without a wall of tiny nodes.</p></header>
  <div className="pk-panel flex flex-wrap gap-3 p-4">
   <div className="relative min-w-[180px] flex-1"><Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground"/><Input value={query} onChange={e=>{setQuery(e.target.value);setSelected("");}} className="h-11 pl-10" placeholder="Search records to focus..."/></div>
   <select aria-label="Filter record type" className="h-11 min-w-32 rounded-lg border border-border bg-card px-3" value={type} onChange={e=>setType(e.target.value)}><option value="all">All types</option>{TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select>
   <Button variant="outline" onClick={()=>{setSelected("");setQuery("");setType("all");setExpanded(false);}}>Reset</Button>
  </div>
  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground"><span>{records.length} loaded records · {edges.length} confirmed connections</span><span>· {focus?`Focused: ${recordLabel(focus._type,focus)}`:"Choose a record to see its links"}</span></div>
  <div className="flex flex-wrap gap-2">{[["list","List"],["grid","Grid"],["graph","Graph"]].map(([v,label])=><Button key={v} variant={view===v?"default":"outline"} onClick={()=>setView(v)}>{label}</Button>)}</div>
  {error&&<p role="alert" className="text-destructive">{error}</p>}
  {loading?<p className="py-12 text-center text-muted-foreground">Loading map…</p>:
   <>{focus&&<div className="pk-panel p-5"><div className="flex flex-wrap items-center justify-between gap-3">
     <div><p className="text-xs font-semibold uppercase text-primary">Selected record</p><h2 className="mt-1 break-words text-xl font-semibold">{recordLabel(focus._type,focus)}</h2><p className="text-sm text-muted-foreground">{oneHop.length} direct links</p></div>
     <Link to={resolveUrl(focus._type,focus)} className="rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">Open details</Link>
    </div>{oneHop.length>0?<div className="mt-4 space-y-2">{oneHop.map(l=>{const other=key(l.source_type,l.source_id)===selected?byKey.get(key(l.target_type,l.target_id)):byKey.get(key(l.source_type,l.source_id));return other?<button type="button" key={l.id} onClick={()=>choose(other)} className="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border border-border bg-secondary/60 p-3 text-left"><span className="min-w-0 break-words">{recordLabel(other._type,other)}</span><span className="shrink-0 text-xs text-primary">{other._type} →</span></button>:null})}</div>:<p className="mt-3 text-sm text-muted-foreground">No direct connections yet.</p>}</div>}
   {view==="graph"&&focus?<div className="pk-panel space-y-3 p-5 text-center"><div className="mx-auto max-w-md rounded-xl border border-primary/50 bg-primary/10 p-4 font-semibold">{recordLabel(focus._type,focus)}</div><div className="mx-auto h-6 w-px bg-primary/60"/><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{shown.filter(r=>r._key!==selected).map(display)}</div></div>:
   <div className={view==="grid"?"grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3":"space-y-3"}>{shown.slice(0,100).map(display)}</div>}
   {!focus&&shown.length===0&&<p className="py-12 text-center text-muted-foreground">No matching records found.</p>}
   {view==="graph"&&!focus&&<p className="text-xs text-muted-foreground">Select a record to see a focused connection diagram instead of hundreds of unreadable nodes.</p>}</>}
 </div>;
}