import React, { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

// Free-form tag editor matching the tag arrays used across Smart PKOS.
export default function TagInput({ tags, onChange, placeholder = "Add tag and press Enter" }) {
  const [value, setValue] = useState("");
  const add = () => {
    const t = value.trim().toLowerCase();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setValue("");
  };
  return (
    <div className="space-y-1.5">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((t) => (
            <span key={t} className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs">
              {t}
              <button type="button" aria-label={`Remove tag ${t}`} onClick={() => onChange(tags.filter((x) => x !== t))}><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}
      <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} className="h-8 text-xs"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }} onBlur={add} />
    </div>
  );
}