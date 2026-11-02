import {useCallback,useEffect,useState} from 'react';
import {base44} from '@/api/base44Client';
import {useWorkspace} from '@/lib/WorkspaceContext';
import {actionSaved} from '@/lib/taskStatus';
import {Dialog,DialogContent,DialogHeader,DialogTitle} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';

const KEY='pkos_pending_share';
const urlFrom=text=>String(text||'').match(/https?:\/\/[^\s]+/)?.[0]||'';
const provider=url=>{try{const h=new URL(url).hostname.toLowerCase();if(h.includes('chatgpt')||h.includes('openai'))return 'ChatGPT';if(h.includes('claude'))return 'Claude';if(h.includes('gemini')||h.includes('google'))return 'Gemini';if(h.includes('grok')||h.includes('x.ai'))return 'Grok';if(h.includes('perplexity'))return 'Perplexity';}catch{}return 'Other';};

export default function IncomingShare(){const {workspace}=useWorkspace(),[open,setOpen]=useState(false),[title,setTitle]=useState(''),[content,setContent]=useState(''),[saving,setSaving]=useState(false);
 const pull=useCallback(()=>{try{const raw=localStorage.getItem(KEY);if(!raw)return;const item=JSON.parse(raw);setTitle(String(item.subject||'').trim());setContent(String(item.text||''));setOpen(true);}catch{}},[]);
 useEffect(()=>{pull();window.addEventListener('pkos:native-share',pull);return()=>window.removeEventListener('pkos:native-share',pull);},[pull]);
 const clear=()=>{localStorage.removeItem(KEY);setOpen(false);};
 const saveCapture=async()=>{if(!content.trim())return;setSaving(true);try{await base44.entities.Capture.create({type:urlFrom(content)?'reference':'note',title:title.trim(),content:content.trim(),status:'inbox',workspace});window.dispatchEvent(new Event('pkos:capture-changed'));localStorage.removeItem(KEY);setOpen(false);actionSaved('Shared content saved to Capture.');}finally{setSaving(false);}};
 const saveSource=async()=>{if(!content.trim())return;setSaving(true);try{const url=urlFrom(content);await base44.entities.ChatLink.create({title:title.trim()||url||content.trim().slice(0,80)||'Shared source',provider:provider(url),url,original_text:content.trim(),notes:'',tags:[],status:'active',workspace});localStorage.removeItem(KEY);setOpen(false);actionSaved('Shared content saved to Chats & links.');}finally{setSaving(false);}};
 return <Dialog open={open} onOpenChange={v=>{if(!v)clear();else setOpen(true);}}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>Shared with Smart PKOS</DialogTitle></DialogHeader><div className="space-y-4"><p className="text-sm text-muted-foreground">Review and edit the message or link before anything is saved.</p><label className="block space-y-1 text-sm"><span>Title</span><Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Appointment, chat thread, reference…"/></label><label className="block space-y-1 text-sm"><span>Shared text</span><Textarea rows={9} value={content} onChange={e=>setContent(e.target.value)}/></label><div className="grid grid-cols-1 gap-2 sm:grid-cols-2"><Button variant="outline" disabled={saving||!content.trim()} onClick={saveCapture}>Save to Capture</Button><Button disabled={saving||!content.trim()} onClick={saveSource}>Save as chat/link source</Button></div></div></DialogContent></Dialog>;}
