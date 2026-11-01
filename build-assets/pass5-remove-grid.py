"""Smart PKOS Pass 5: fail-closed task view cleanup.

Run against restored source at app/src/pages/Tasks.jsx AFTER Pass 4 patch.
This only removes the unneeded Grid mode; task pagination requires a separate
source-aware implementation after inspecting the actual component.
"""
from pathlib import Path

p = Path("app/src/pages/Tasks.jsx")
original = p.read_text(encoding="utf-8")
assert '["cards", "Cards"]' in original
assert '["list", "List"]' in original
assert '["compact", "Compact"]' in original
assert '["grid", "Grid"]' in original

updated = original.replace(', ["grid", "Grid"]', '', 1)
assert updated != original, "Grid selector has unexpected structure; no changes made"

old_layout = 'view === "grid" ? "grid grid-cols-1 gap-3 p-3 min-[430px]:grid-cols-2" : '
assert old_layout in updated, "Grid layout differs; no changes made"
updated = updated.replace(old_layout, '', 1)

assert '["grid", "Grid"]' not in updated
assert 'min-[430px]:grid-cols-2' not in updated
assert all(s in updated for s in ['["cards", "Cards"]', '["list", "List"]', '["compact", "Compact"]'])
p.write_text(updated, encoding="utf-8")
print("Removed Grid selector/layout. Cards, List, Compact preserved.")
