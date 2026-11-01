# Smart PKOS — Task list density and limits (approved direction)

User reports excessive scrolling, confusing repeated task entries, and requests a practical display limit.

## Proposed next implementation
- Initially display at most 5 task rows per group; Show 5 more and Show fewer controls. This is a presentation limit, never a storage or task-count limit.
- Today expanded by default; Upcoming and Someday collapsible; empty groups use compact single-line headers.
- Remember expansion preferences locally.
- Investigate repeated 'Gospel of John in 14 Days — Day 11' tasks by record identity, import provenance, and recurrence generation; flag suspected duplicates for review, do not auto-delete or merge.
- Keep Cards/List/Compact, remove Grid per user decision.
- Test on narrow Android screen with many tasks, including performance, scroll position, accessibility, and preserving all records.

Status: implementation specification recorded; no source code or APK changed.
