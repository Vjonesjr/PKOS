import React from "react";
import AIActionRunner from "@/components/ai/AIActionRunner";

function PeriodReviewResult({ result }) {
  const Section = ({ title, list }) =>
    list?.length > 0 && (
      <div className="mb-3">
        <p className="text-xs font-semibold text-foreground/80 mb-1">{title}</p>
        <ul className="list-disc list-inside space-y-0.5">
          {list.map((item, i) => (
            <li key={i} className="text-sm text-foreground/80">
              {item}
            </li>
          ))}
        </ul>
      </div>
    );
  return (
    <div>
      <Section title="Completed" list={result.completed} />
      <Section title="Unfinished" list={result.unfinished} />
      <Section title="New Captures" list={result.new_captures} />
      <Section title="Priorities" list={result.priorities} />
      <Section title="Stalled Projects" list={result.stalled_projects} />
    </div>
  );
}

export default function PeriodReviewCard({ title, description, icon, action, workspace }) {
  return (
    <AIActionRunner title={title} description={description} icon={icon} action={action} payload={{ workspace }} renderResult={(r) => <PeriodReviewResult result={r} />} />
  );
}