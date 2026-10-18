import React from "react";
import { useNavigate } from "react-router-dom";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PARSE_HANDOFF_KEY } from "@/lib/parseApply";

/** Sends a block of text to Quick Parse (capped at the parser's 1500-char limit). */
export default function ParseTextButton({ text, className = "" }) {
  const navigate = useNavigate();
  if (!text?.trim()) return null;
  const go = () => { sessionStorage.setItem(PARSE_HANDOFF_KEY, text.slice(0, 1500)); navigate("/parse"); };
  return (
    <Button type="button" variant="outline" size="sm" onClick={go} className={`gap-1.5 ${className}`}>
      <Wand2 className="h-3.5 w-3.5" /> Parse into tasks
    </Button>
  );
}