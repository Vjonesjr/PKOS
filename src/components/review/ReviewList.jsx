import React from "react";
import { Link } from "react-router-dom";

export default function ReviewList({ items }) {
  if (!items || items.length === 0) {
    return <p className="text-xs text-muted-foreground">Nothing here.</p>;
  }
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item.id}>
          {item.link ? (
            <Link to={item.link} className="text-sm text-foreground/85 hover:text-primary hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className="text-sm text-foreground/85">{item.label}</span>
          )}
        </li>
      ))}
    </ul>
  );
}