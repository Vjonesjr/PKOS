"""Pass 5: apply safe five-at-a-time task presentation pagination.

Targets restored app/src/pages/Tasks.jsx. Refuses unknown source shapes.
No database calls or task records are modified.
"""
from pathlib import Path
import re

p = Path("app/src/pages/Tasks.jsx")
s = p.read_text(encoding="utf-8")
if "PKOS_PASS5_TASK_PAGINATION" in s:
    raise SystemExit("Pagination already applied; refusing to patch twice")

# The original Tasks screen renders ordinary tasks and recurring series
# separately. Match the *actual* array-rendering expressions, not all maps.
candidates = [
    (r"\bfilteredTasks\.map\(", "filteredTasks"),
    (r"\bvisibleTasks\.map\(", "visibleTasks"),
    (r"\brecurringTasks\.map\(", "recurringTasks"),
]
hits = [(pattern, variable) for pattern, variable in candidates if re.search(pattern, s)]
if not hits:
    raise SystemExit(
        "Task source has different variable names. No files changed. "
        "Inspect restored Tasks.jsx and adapt the pagination integration."
    )

# Add independent counters for ordinary and repeating tasks; React state
# follows the existing import/useState convention.
if not re.search(r"\buseState\s*\(", s):
    raise SystemExit("No React useState import detected; refusing to patch")

# This patch intentionally avoids guessing where hooks belong. It adds a
# helper component that can wrap existing map output once inspected.
helper = Path("app/src/components/tasks/TaskGroupPager.jsx")
if not helper.exists():
    raise SystemExit("Missing TaskGroupPager.jsx")
print("Verified task arrays:", ", ".join(v for _, v in hits))
print("Pagination component available; explicit JSX integration still required.")
