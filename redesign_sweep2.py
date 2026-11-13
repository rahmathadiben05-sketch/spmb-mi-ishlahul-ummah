#!/usr/bin/env python3
"""Redesign sweep round 2: remaining gradient usages."""
import os, re

ROOT = '/home/hatch/workspace/spmb-mi-ishlahul-ummah/export-aistudio'

EXACT = [
    ('bg-gradient-to-b from-[#0D382B] via-[#0A2E23] to-[#061F17]', 'bg-[#0D382B]'),
    ('linear-gradient(135deg, #145C43, #D4A346)', '#B45309'),
    ('bg-gradient-to-tr from-[#145C43] to-[#1E7B5C]', 'bg-[#145C43]'),
    ('bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900',
     'bg-[#065F46] hover:bg-[#064E3B]'),
    ('bg-gradient-to-br from-emerald-50 to-teal-50', 'bg-[#EEF5F0]'),
    ('bg-gradient-to-b from-[#EAF4EF] to-white', 'bg-[#EAF4EF]'),
    ('bg-gradient-to-br from-emerald-50 via-teal-50 to-stone-50', 'bg-[#F7F4EC]'),
]

# h-1.5 top strips: any 3-stop horizontal gradient -> flat deep green strip
STRIP_RE = re.compile(r'bg-gradient-to-r from-\[#[0-9A-Fa-f]{6}\] via-\[#[0-9A-Fa-f]{6}\] to-\[#[0-9A-Fa-f]{6}\]')

changed = []
for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames[:] = [d for d in dirnames if d not in ('node_modules', '.next')]
    for fn in filenames:
        if not (fn.endswith('.tsx') or fn.endswith('.css')):
            continue
        path = os.path.join(dirpath, fn)
        with open(path, encoding='utf-8') as f:
            src = f.read()
        orig = src
        for old, new in EXACT:
            src = src.replace(old, new)
        # strips (only on lines with h-1.5, i.e. the thin top bars)
        lines = src.split('\n')
        for i, ln in enumerate(lines):
            if 'h-1.5' in ln and 'bg-gradient-to-r' in ln:
                lines[i] = STRIP_RE.sub('bg-[#0D3B2E]', ln)
        src = '\n'.join(lines)
        if src != orig:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(src)
            changed.append(os.path.relpath(path, ROOT))

print('files changed:', changed)
left = []
for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames[:] = [d for d in dirnames if d not in ('node_modules', '.next')]
    for fn in filenames:
        if not (fn.endswith('.tsx') or fn.endswith('.css')):
            continue
        path = os.path.join(dirpath, fn)
        with open(path, encoding='utf-8') as f:
            t = f.read()
        if 'linear-gradient' in t or 'bg-gradient-to-' in t:
            for j, ln in enumerate(t.split('\n'), 1):
                if ('linear-gradient' in ln or 'bg-gradient-to-' in ln) and 'radial-gradient(#1c1917' not in ln:
                    left.append(f"{os.path.relpath(path, ROOT)}:{j}: {ln.strip()[:120]}")
print('remaining (excluding dot texture):')
for l in left:
    print(' ', l)
