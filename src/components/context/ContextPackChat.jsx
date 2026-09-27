import React, { useEffect, useState } from "react";
import { Send, Loader2, Layers } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkspace } from "@/lib/WorkspaceContext";

export default function ContextPackChat({ fixedPack }) {
  const { workspace } = useWorkspace();
  const [packs, setPacks] = useState(fixedPack ? [fixedPack] : []);
  const [packId, setPackId] = useState(fixedPack?.id || "");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fixedPack) base44.entities.ContextPack.filter({ workspace }, "-updated_date", 100).then(setPacks);
  }, [workspace, fixedPack]);

  const pack = packs.find((p) => p.id === packId);

  const ask = async (e) => {
    e.preventDefault();
    if (!input.trim() || !pack || loading) return;
    const history = messages;
    setMessages([...history, { role: "user", content: input }]);
    setInput("");
    setLoading(true);
    const res = await base44.functions.invoke("aiAssist", { action: "context_chat", packId, workspace, question: input, history }).catch(() => null);
    setMessages((m) => [...m, { role: "assistant", content: res?.data?.answer || "Sorry, I couldn't answer that. Please try again." }]);
    setLoading(false);
  };

  return (
    <div className="rounded-2xl border border-accent/30 bg-card/60 p-5">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground/90"><Layers className="h-4 w-4 text-accent" /> Ask with a Context Pack</p>
      {!fixedPack && (
        <Select value={packId} onValueChange={(v) => { setPackId(v); setMessages([]); }}>
          <SelectTrigger className="mb-3"><SelectValue placeholder={packs.length ? "Select a context pack..." : "No context packs yet"} /></SelectTrigger>
          <SelectContent>
            {packs.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({(p.items || []).length})</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      {pack && (
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs text-accent">
          Using Context: <span className="font-semibold">{pack.name}</span>
        </p>
      )}
      <div className="mb-3 max-h-96 space-y-2 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "ml-auto max-w-[85%] rounded-xl bg-primary/15 px-3 py-2 text-sm text-foreground" : "max-w-[90%] rounded-xl border border-dashed border-accent/40 bg-accent/5 px-3 py-2 text-sm text-foreground/85"}>
            {m.role === "user" ? m.content : <div className="prose prose-sm prose-invert max-w-none"><ReactMarkdown>{m.content}</ReactMarkdown></div>}
          </div>
        ))}
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      <form onSubmit={ask} className="flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={pack ? "Ask using this context..." : "Select a pack first"} disabled={!pack} />
        <Button type="submit" size="icon" disabled={!pack || loading || !input.trim()} aria-label="Send question"><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}