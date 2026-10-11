import React from "react";
import ReactMarkdown from "react-markdown";
import ToolCallRow from "@/components/agent/ToolCallRow";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${isUser ? "bg-primary text-primary-foreground" : "border border-border bg-card/60"}`}>
        {message.content && (isUser
          ? <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          : <ReactMarkdown className="prose prose-sm prose-invert max-w-none text-sm">{message.content}</ReactMarkdown>)}
        {message.tool_calls?.map((tc, i) => <ToolCallRow key={i} toolCall={tc} />)}
      </div>
    </div>
  );
}