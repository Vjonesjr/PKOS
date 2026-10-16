import React from "react";
import ReactMarkdown from "react-markdown";
import ToolCallRow from "@/components/agent/ToolCallRow";
import ProposalCard from "@/components/agent/ProposalCard";

// Agent proposals arrive as ```proposal {json}``` blocks; split them out of the markdown.
function parse(content) {
  const proposals = [];
  const text = content.replace(/```proposal\s*([\s\S]*?)```/g, (_, json) => {
    try { const p = JSON.parse(json); (Array.isArray(p) ? p : [p]).forEach((x) => proposals.push(x)); } catch { /* ignore malformed */ }
    return "";
  });
  return { text, proposals };
}

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const { text, proposals } = !isUser && message.content ? parse(message.content) : { text: message.content, proposals: [] };
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${isUser ? "bg-primary text-primary-foreground" : "border border-border bg-card/60"}`}>
        {text && (isUser
          ? <p className="whitespace-pre-wrap text-sm">{text}</p>
          : <ReactMarkdown className="prose prose-sm prose-invert max-w-none text-sm">{text}</ReactMarkdown>)}
        {proposals.map((p, i) => <ProposalCard key={i} proposal={p} />)}
        {message.tool_calls?.map((tc, i) => <ToolCallRow key={i} toolCall={tc} />)}
      </div>
    </div>
  );
}