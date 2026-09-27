import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";

export default function SectionCard({ title, icon: Icon, viewAllTo, items, renderItem, emptyIcon, emptyText }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-border bg-card/60 p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-primary" />}
          <h3 className="text-sm font-semibold text-foreground/90">{title}</h3>
        </div>
        {viewAllTo && (
          <Link to={viewAllTo} className="flex items-center text-xs text-muted-foreground transition-colors hover:text-primary">
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      {items.length === 0 ? (
        <EmptyState icon={emptyIcon} title={emptyText || "Nothing here yet"} />
      ) : (
        <div className="space-y-1.5">{items.map(renderItem)}</div>
      )}
    </motion.div>
  );
}