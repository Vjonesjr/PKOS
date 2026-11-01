"""Pass 5 visible native scrollbar for real scroll containers.

Run after restoring source, before Vite build. Uses native browser scrollbars
so the thumb reflects actual scroll position, not an estimated percentage.
"""
from pathlib import Path

root = Path("app/src")
styles = [p for p in root.rglob("*.css") if "node_modules" not in p.parts]
assert styles, "No CSS source found; refusing to patch"
preferred = [p for p in styles if p.name in ("index.css", "globals.css", "global.css")]
assert preferred, "Cannot identify app-global stylesheet; refusing to patch"
target = sorted(preferred, key=lambda p: (p.name != "index.css", len(p.parts)))[0]
marker = "/* PKOS PASS 5 VISIBLE SCROLLBAR */"
css = """
/* PKOS PASS 5 VISIBLE SCROLLBAR */
html { overflow-y: scroll; scrollbar-gutter: stable; }
html, body, #root, main, [data-radix-scroll-area-viewport] {
  scrollbar-width: thin;
  scrollbar-color: var(--primary, #6aa9c8) transparent;
}
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background-color: var(--primary, #6aa9c8);
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: 999px;
}
::-webkit-scrollbar-thumb:hover { background-color: var(--foreground, #64748b); }
"""
original = target.read_text(encoding="utf-8")
assert marker not in original, "Scrollbar patch already present"
target.write_text(original + "\n" + css, encoding="utf-8")
print(f"Added native scrollbar styling to {target}")
