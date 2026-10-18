import React from "react";
import { Volume2, Type, Contrast, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportParsed } from "@/lib/parseApply";

/** Read-aloud, view options and export for a reviewed parse. */
export default function ParseToolbar({ items, view, setView }) {
  const readAloud = () => {
    speechSynthesis.cancel();
    const open = items.filter((i) => i.include && !i.done);
    const text = open.map((i) => `${i.title}.${i.next_action ? ` First step: ${i.next_action}.` : ""}`).join(" ");
    speechSynthesis.speak(new SpeechSynthesisUtterance(text || "No open tasks."));
  };
  const toggle = (k) => setView({ ...view, [k]: !view[k] });
  const btn = "h-8 gap-1 px-2 text-xs";
  return (
    <div className="flex flex-wrap gap-1.5">
      <Button variant="outline" className={btn} onClick={readAloud}><Volume2 className="h-3.5 w-3.5" />Read aloud</Button>
      <Button variant={view.large ? "default" : "outline"} className={btn} onClick={() => toggle("large")} aria-pressed={view.large}><Type className="h-3.5 w-3.5" />Large text</Button>
      <Button variant={view.contrast ? "default" : "outline"} className={btn} onClick={() => toggle("contrast")} aria-pressed={view.contrast}><Contrast className="h-3.5 w-3.5" />High contrast</Button>
      <Button variant="outline" className={btn} onClick={() => exportParsed(items, "json")}><Download className="h-3.5 w-3.5" />JSON</Button>
      <Button variant="outline" className={btn} onClick={() => exportParsed(items, "csv")}><Download className="h-3.5 w-3.5" />CSV</Button>
    </div>
  );
}