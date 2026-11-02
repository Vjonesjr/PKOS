import React from "react";
import ReviewList from "./ReviewList";

export default function ReviewSection({ title, items }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <ReviewList items={items} />
    </div>
  );
}