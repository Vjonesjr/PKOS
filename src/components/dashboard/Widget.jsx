import React from "react";

export default function Widget({ title, icon: Icon, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-border bg-card/60 p-4 ${className}`}>
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />} {title}
      </p>
      {children}
    </div>
  );
}