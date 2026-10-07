"""Reads out/qa.json (scripts/qa.mjs) and prints the real issues grouped by time ranges.
Odometer digits (single digits clipped in their window) are not issues."""
import json, re
r = json.load(open('out/qa.json'))
single = re.compile(r'^\d$')
out = {}
for f, issues in r.items():
    keep = []
    for i in issues:
        names = re.findall(r'"([^"]*)"', i)
        if all(single.match(n) or n == '€' for n in names): continue
        if i.startswith('OVERLAP') and any(single.match(n) for n in names): continue
        keep.append(re.sub(r' \d+%', '', i))
    if keep: out[int(f)] = sorted(set(keep))
rows, prev, start, last = [], None, None, None
for f in sorted(out):
    k = tuple(out[f])
    if k != prev:
        if prev: rows.append((start, last, prev))
        start, prev = f, k
    last = f
if prev: rows.append((start, last, prev))
t = lambda f: f"{f // 1800}:{(f // 30) % 60:02d}"
for a, b, k in rows: print(f"{t(a)}-{t(b)}", ' | '.join(k)[:220])
print(f"{len(out)} frame(s) with real issues")
