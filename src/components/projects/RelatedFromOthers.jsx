import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useWorkspace } from "@/lib/WorkspaceContext";

/** Surfaces decisions, lessons, and knowledge from other projects that share tags or are linked. */
export default function RelatedFromOthers({ projectId, projectTags = [] }) {
  const { workspace } = useWorkspace();
  const [related, setRelated] = useState({ decisions: [], lessons: [], knowledge: [] });

  useEffect(() => {
    if (!workspace || !projectId) return;
    (async () => {
      const [decisions, lessons, knowledge, links] = await Promise.all([
        base44.entities.Decision.filter({ workspace }, "-date", 50),
        base44.entities.Lesson.filter({ workspace }, "-created_date", 50),
        base44.entities.Knowledge.filter({ workspace }, "-updated_date", 100),
        base44.entities.Link.filter({ workspace }, "-created_date", 200),
      ]);
      const tagSet = new Set([...projectTags, ...knowledge.filter(k => k.project_id === projectId).flatMap(k => k.tags || [])].map(t => t.toLowerCase()));
      const linked = new Set();
      (links || []).forEach(link => {
        if (link.source_type === "project" && link.source_id === projectId) linked.add(`${link.target_type}:${link.target_id}`);
        if (link.target_type === "project" && link.target_id === projectId) linked.add(`${link.source_type}:${link.source_id}`);
      });
      const matches = (type) => (item) => {
        if (item.project_id === projectId) return false;
        const itemTags = (item.tags || []).map((t) => t.toLowerCase());
        return linked.has(`${type}:${item.id}`) || itemTags.some((t) => tagSet.has(t));
      };
      setRelated({
        decisions: (decisions || []).filter(matches("decision")).slice(0, 5),
        lessons: (lessons || []).filter(matches("lesson")).slice(0, 5),
        knowledge: (knowledge || []).filter(matches("knowledge")).slice(0, 5),
      });
    })().catch(() => {});
  }, [workspace, projectId, projectTags.join("|")]);

  const total = related.decisions.length + related.lessons.length + related.knowledge.length;
  if (total === 0) return null;

  return (
    <div className="rounded-2xl border border-primary/25 bg-card/40 pk-glass p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Related from other projects</p>
      <div className="space-y-3 text-sm">
        {related.decisions.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-primary">Decisions</p>
            {related.decisions.map((d) => (
              <Link key={d.id} to={`/decision-detail?id=${d.id}`} className="block truncate text-foreground/80 hover:text-primary">
                {d.title || d.decision}
              </Link>
            ))}
          </div>
        )}
        {related.lessons.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-primary">Lessons</p>
            {related.lessons.map((l) => (
              <Link key={l.id} to={`/lesson-detail?id=${l.id}`} className="block truncate text-foreground/80 hover:text-primary">
                {l.learned || l.title}
              </Link>
            ))}
          </div>
        )}
        {related.knowledge.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-primary">Knowledge</p>
            {related.knowledge.map((k) => (
              <Link key={k.id} to={`/knowledge-detail?id=${k.id}`} className="block truncate text-foreground/80 hover:text-primary">
                {k.title}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
