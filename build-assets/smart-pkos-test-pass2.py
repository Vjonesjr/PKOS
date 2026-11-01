from pathlib import Path
p=Path("app/src/components/Layout.jsx")
s=p.read_text()
needle='<nav aria-label="Bottom navigation"'
assert needle in s, "Expected layout navigation not found"
assert 'aria-label="Scroll to top"' not in s
button='<button type="button" aria-label="Scroll to top" title="Scroll to top" onClick={()=>window.scrollTo({top:0,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"})} className="fixed bottom-24 right-4 z-30 rounded-full border border-border bg-card p-3 text-foreground shadow-lg">↑</button>'
s=s.replace(needle,button+needle,1)
p.write_text(s)
gradle=Path("app/android/app/build.gradle")
g=gradle.read_text()
import re
g,n=re.subn(r'versionCode\s+\d+', 'versionCode 20261101',g,count=1)
assert n==1
g,n=re.subn(r'versionName\s+"[^"]+"','versionName "2026.11.01-test2"',g,count=1)
assert n==1
gradle.write_text(g)
print("Added accessible scroll-to-top control and updated test version")
