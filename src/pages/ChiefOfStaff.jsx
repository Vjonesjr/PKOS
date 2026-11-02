import { useWorkspace } from '@/lib/WorkspaceContext';
import DemoAssistant from '@/components/workspace/DemoAssistant';
import React, { useEffect, useRef, useState } from "react";
import { Send, Plus, Loader2, Briefcase } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import MessageBubble from "@/components/agent/MessageBubble";

const AGENT = "chief_of_staff";
const STARTERS = ["Triage my inbox and documents", "Which projects are stalled?", "How are my goals tracking?", "Give me a weekly review"];

export default function ChiefOfStaff() {
  const { workspace } = useWorkspace();
  return workspace === 'demo' ? <DemoAssistant /> : <PersonalChiefOfStaff />;
}
function PersonalChiefOfStaff() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottom = useRef(null);

  const startNew = async () => {
    const c = await base44.agents.createConversation({ agent_name: AGENT, metadata: { name: "Chief of Staff" } });
    setConversation(c);
    setMessages([]);
  };

  // Resume the most recent conversation, or start one.
  // If resuming fails, fall back to a fresh conversation so the chat is never stuck loading.
  useEffect(() => {
    (async () => {
      try {
        const list = await base44.agents.listConversations({ agent_name: AGENT });
        if (list?.length) {
          const c = await base44.agents.getConversation(list[0].id);
          setConversation(c);
          setMessages(c.messages || []);
          return;
        }
      } catch (e) { console.error("Resume failed", e); }
      await startNew();
    })();
  }, []);

  useEffect(() => {
    if (!conversation?.id) return;
    return base44.agents.subscribeToConversation(conversation.id, (data) => setMessages(data.messages || []));
  }, [conversation?.id]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    setInput("");
    setSending(true);
    try {
      // Create a conversation on demand if initialization hasn't finished.
      let c = conversation;
      if (!c) {
        c = await base44.agents.createConversation({ agent_name: AGENT, metadata: { name: "Chief of Staff" } });
        setConversation(c);
      }
      setMessages((prev) => [...prev, { role: "user", content }]);
      await base44.agents.addMessage(c, { role: "user", content });
    }
    finally { setSending(false); }
  };

  const last = messages[messages.length - 1];
  const thinking = sending || last?.role === "user";

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight"><Briefcase className="h-5 w-5 text-primary" /> Chief of Staff</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ask anything across your data. It reads only and suggests changes for you to apply.</p>
        </div>
        <Button size="sm" variant="outline" onClick={startNew}><Plus className="h-4 w-4" /> New chat</Button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-primary/20 bg-card/40 pk-glass/30 p-4">
        {!conversation && messages.length > 0 && <p className="py-10 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />Loading...</p>}
        {messages.length === 0 && (
          <div className="flex flex-wrap justify-center gap-2 py-10">
            {STARTERS.map((s) => <Button key={s} size="sm" variant="secondary" onClick={() => send(s)}>{s}</Button>)}
          </div>
        )}
        {messages.map((m, i) => <MessageBubble key={i} message={m} />)}
        {thinking && <p className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Thinking...</p>}
        <div ref={bottom} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-3 flex gap-2">
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} rows={2} placeholder="Ask your Chief of Staff..."
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} className="resize-none" />
        <Button type="submit" disabled={!input.trim() || sending} aria-label="Send message" className="h-auto"><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}