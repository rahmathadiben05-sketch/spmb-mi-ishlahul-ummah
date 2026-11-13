#!/usr/bin/env python3
"""Regenerate lib/gas-generator.ts from the canonical Code.gs (v2.9).

The generator embeds the canonical code verbatim inside a template literal,
with only the two CONFIG IDs replaced by ${cleanSsId} / ${cleanFolderId}
placeholders. The header comment is bumped to the current version.
"""
CANON = '/home/hatch/workspace/spmb-mi-ishlahul-ummah/Code.gs'
GEN = '/home/hatch/workspace/spmb-mi-ishlahul-ummah/export-aistudio/lib/gas-generator.ts'

with open(CANON, encoding='utf-8') as f:
    code = f.read()

assert code.count("'1zKaJCofRuj_BahnLz8i-3bdvsMVFRcs7oej8sbw1RU4'") == 1
assert code.count("'1m4dOsMUJQR1L52JnD-5gTEItnOO7_kua'") == 1
assert '`' not in code and '${' not in code, 'code contains backtick/${ - unsafe for template literal'

embedded = code.replace(
    "'1zKaJCofRuj_BahnLz8i-3bdvsMVFRcs7oej8sbw1RU4'", "'${cleanSsId}'")
embedded = embedded.replace(
    "'1m4dOsMUJQR1L52JnD-5gTEItnOO7_kua'", "'${cleanFolderId}'")

with open(GEN, encoding='utf-8') as f:
    old = f.read()

# Prefix = everything up to and including the line "  const cleanFolderId ...\n"
marker = "  const cleanFolderId = (driveFolderId || '').trim();\n"
idx = old.index(marker) + len(marker)
prefix = old[:idx]
import re
prefix = re.sub(r'// Generator for Google Apps Script Code\.gs \u2014 TERPADU v[\d.]+ \(',
                '// Generator for Google Apps Script Code.gs \u2014 TERPADU v2.9 (', prefix)

new = prefix + '  return `' + embedded + '`;\n}\n'

with open(GEN, 'w', encoding='utf-8') as f:
    f.write(new)

print('old bytes:', len(old), 'new bytes:', len(new))
print('has v2.9 header:', 'v2.9 (2026-11-11)' in new)
print('has age check:', "dob > '2021-07-01'" in new)
print('has inden actions:', all(x in new for x in ['createInden', 'confirmDp', 'completeInden', 'extendInden', 'markIndenExpired']))
print('has listRegistrations:', 'listRegistrations' in new and 'rowToRecord' in new)
print('has getRegistration:', 'getRegistration' in new and 'normalizeWa' in new)
print('has settings actions:', 'getSettings' in new and 'saveSettings' in new)
print('placeholders:', new.count('${cleanSsId}'), new.count('${cleanFolderId}'))
print('real IDs leaked:', new.count('1zKaJCofRuj') + new.count('1m4dOsMUJQR1L52'))
