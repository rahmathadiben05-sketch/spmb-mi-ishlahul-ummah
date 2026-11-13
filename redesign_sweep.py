#!/usr/bin/env python3
"""Redesign sweep: remove gradients / AI-slop tells from the SPMB frontend.

Order matters: gradient strings FIRST (they contain the hexes), then plain
hex replacements, then radii. Applies to app/ + components/ (*.tsx, *.css),
excluding node_modules and .next. Prints per-replacement counts.
"""
import os

ROOT = '/home/hatch/workspace/spmb-mi-ishlahul-ummah/export-aistudio'

# (old, new) — gradients first, then hexes, then radii.
REPLACEMENTS = [
    # --- gradients -> flat ---
    ('linear-gradient(135deg, #059669, #0d9488)', '#065F46'),
    ('linear-gradient(135deg, #059669, #0D9488)', '#065F46'),
    ('linear-gradient(135deg, #047857, #0f766e)', '#064E3B'),
    ('linear-gradient(135deg, #f59e0b, #d97706)', '#B45309'),
    ('linear-gradient(135deg, #d97706, #b45309)', '#92400E'),
    ('linear-gradient(90deg, #059669, #f59e0b)', '#B45309'),
    ('linear-gradient(135deg, #0D3B2E 0%, #145C43 50%, #0A2E23 100%)', '#0D3B2E'),
    ('linear-gradient(90deg, #145C43, #D4A346)', '#145C43'),
    ('bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900', 'bg-[#0D3B2E]'),
    ('bg-gradient-to-r from-teal-900 via-emerald-800 to-emerald-950', 'bg-[#0D3B2E]'),
    ('bg-gradient-to-r from-[#145C43] via-[#1A6E51] to-[#0D3B2E]', 'bg-[#0D3B2E]'),
    ('bg-gradient-to-r from-[#0D382B] via-[#145C43] to-[#0A2E23]', 'bg-[#0D382B]'),
    ('bg-gradient-to-br from-emerald-50/80 via-white to-amber-50/60', 'bg-white'),
    ('bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40', 'bg-white'),
    ('bg-gradient-to-br from-teal-50/60 via-white to-emerald-50/40', 'bg-white'),
    ('bg-gradient-to-br from-[#EEFAF4] via-[#FAF8F5] to-[#FFFBEB]', 'bg-white'),
    ('bg-gradient-to-br from-emerald-50 via-teal-50/70 to-amber-50/40', 'bg-[#F7F4EC]'),
    ('bg-gradient-to-br from-[#FAF8F5] via-emerald-50/40 to-teal-50/40', 'bg-white'),
    ('radial-gradient(circle, #EEFAF4, white)', '#F7F4EC'),
    # --- glow shadows -> neutral ---
    ('0 10px 24px -4px rgba(5, 150, 105, 0.35)', '0 4px 12px -2px rgba(28, 25, 23, 0.10)'),
    ('0 14px 30px -4px rgba(5, 150, 105, 0.45)', '0 6px 16px -4px rgba(28, 25, 23, 0.12)'),
    ('0 10px 24px -4px rgba(245, 158, 11, 0.35)', '0 4px 12px -2px rgba(28, 25, 23, 0.10)'),
    ('0 14px 30px -4px rgba(245, 158, 11, 0.45)', '0 6px 16px -4px rgba(28, 25, 23, 0.12)'),
    ('0 6px 18px -3px rgba(5, 150, 105, 0.3)', '0 2px 8px -2px rgba(28, 25, 23, 0.10)'),
    ('0 10px 24px -4px rgba(5, 150, 105, 0.4)', '0 4px 12px -2px rgba(28, 25, 23, 0.10)'),
    ('0 6px 18px -3px rgba(245, 158, 11, 0.3)', '0 2px 8px -2px rgba(28, 25, 23, 0.10)'),
    ('0 10px 24px -4px rgba(245, 158, 11, 0.4)', '0 4px 12px -2px rgba(28, 25, 23, 0.10)'),
    ('0 4px 14px rgba(5, 150, 105, 0.25)', '0 2px 8px rgba(28, 25, 23, 0.12)'),
    # --- color tokens (hex) ---
    ('#059669', '#065F46'),
    ('#0d9488', '#0F766E'),
    ('#f59e0b', '#B45309'),
    ('#FAF8F5', '#F7F4EC'),
    ('#faf8f5', '#f7f4ec'),
    ('rgba(5, 150, 105, 0.15)', 'rgba(6, 95, 70, 0.15)'),
    # --- radii: less bubbly ---
    ('rounded-3xl', 'rounded-xl'),
    ('rounded-[20px]', 'rounded-xl'),
]

counts = {old: 0 for old, _ in REPLACEMENTS}
changed_files = []
for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames[:] = [d for d in dirnames if d not in ('node_modules', '.next')]
    for fn in filenames:
        if not (fn.endswith('.tsx') or fn.endswith('.css')):
            continue
        path = os.path.join(dirpath, fn)
        with open(path, encoding='utf-8') as f:
            src = f.read()
        orig = src
        for old, new in REPLACEMENTS:
            n = src.count(old)
            if n:
                counts[old] += n
                src = src.replace(old, new)
        if src != orig:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(src)
            changed_files.append(os.path.relpath(path, ROOT))

for old, _ in REPLACEMENTS:
    if counts[old]:
        print(f'{counts[old]:3d} x {old[:70]}')
print('---')
print('files changed:', len(changed_files))
for p in changed_files:
    print(' ', p)
# sanity: no gradients left?
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
            left.append(os.path.relpath(path, ROOT))
print('files still containing gradients:', left if left else 'NONE')
