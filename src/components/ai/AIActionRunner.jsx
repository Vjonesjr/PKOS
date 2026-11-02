import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function AIActionRunner({ title, description, icon: Icon, action, payload, renderResult }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke("aiAssist", { action, ...payload });
      if (res.data?.error) setError(res.data.error);
      else setResult(res.data);
    } catch (e) {
      setError("AI request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card/60 p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground/90">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <Button size="sm" onClick={run} disabled={loading} className="gap-1.5 shrink-0">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {loading ? "Thinking" : "Run"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {result && (
        <div className="mt-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-primary">AI-Generated Suggestion</p>
          {renderResult(result, () => setResult(null))}
        </div>
      )}
    </motion.div>
  );
}