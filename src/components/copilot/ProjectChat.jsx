import React, { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const EXAMPLES = ["What was the last major decision?", "What is blocking this?", "What knowledge do I already have about this?", "What should I work on for 30 minutes?", "What changed recently?"];

export default function ProjectChat({ projectId, workspace }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async (question) => {
    if (!question.trim() || loading) return;
    const history = messages;
    setMessages([...history, { role: "user", content: question }]);
    setInput("");
    setLoading(true);
    const res = await base44.functions.invoke("aiAssist", { action: "project_chat", projectId, workspace, question, history }).catch(() => null);
    setMessages((m) => [...m, { role: "assistant", content: res?.data?.answer || "Sorry, I couldn't answer that. Please try again." }]);
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((q) => (
            <button key={q} onClick={() => ask(q)} className="rounded-full border border-primary/25 bg-secondary/50 px-3 py-1 text-xs text-foreground/80 transition-colors hover:border-primary/40">{q}</button>
          ))}
        </div>
      )}
      <div className="max-h-96 space-y-2 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "ml-auto max-w-[85%] rounded-xl bg-primary/15 px-3 py-2 text-sm text-foreground" : "max-w-[90%] rounded-xl border border-dashed border-accent/40 bg-accent/5 px-3 py-2 text-sm text-foreground/85"}>
            {m.role === "user" ? m.content : <div className="prose prose-sm prose-invert max-w-none"><ReactMarkdown>{m.content}</ReactMarkdown></div>}
          </div>
        ))}
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about this project..." />
        <Button type="submit" size="icon" disabled={loading || !input.trim()} aria-label="Send question"><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}