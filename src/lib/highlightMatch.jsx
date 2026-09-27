import React from "react";

// Wraps the first case-insensitive occurrence of `query` inside `text` in a highlight span.
export function highlightMatch(text, query) {
  if (!text) return "";
  const str = String(text);
  if (!query) return str;
  const idx = str.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return str;
  return (
    <>
      {str.slice(0, idx)}
      <span className="bg-primary/25 text-primary font-semibold rounded-sm">{str.slice(idx, idx + query.length)}</span>
      {str.slice(idx + query.length)}
    </>
  );
}