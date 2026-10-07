"""Copy one family from https://github.com/google/fonts into public/fonts/<family>/ (offline renders).

    python3 scripts/google_font.py "Space Grotesk"        -> public/fonts/spacegrotesk/*.ttf + licence

The repository is several GB: only the requested family is fetched (its METADATA.pb lists the
files). The licence file (OFL / Apache / UFL) is always copied next to the fonts.
"""
import os
import re
import sys
import urllib.request

RAW = 'https://raw.githubusercontent.com/google/fonts/main'
HERE = os.path.dirname(os.path.abspath(__file__))


def get(url):
    with urllib.request.urlopen(url, timeout=60) as r:
        return r.read()


def main(name):
    slug = re.sub(r'[^a-z0-9]', '', name.lower())
    for lic in ('ofl', 'apache', 'ufl'):
        try:
            meta = get(f'{RAW}/{lic}/{slug}/METADATA.pb').decode()
            break
        except Exception:
            meta = None
    if meta is None:
        sys.exit(f'"{name}" not found in google/fonts (tried ofl/, apache/, ufl/{slug})')
    files = sorted(set(re.findall(r'filename:\s*"([^"]+)"', meta)))
    out = os.path.join(HERE, '..', 'public', 'fonts', slug)
    os.makedirs(out, exist_ok=True)
    for f in files:
        with open(os.path.join(out, f), 'wb') as fh:
            fh.write(get(f'{RAW}/{lic}/{slug}/{f}'))
    for licence in ('OFL.txt', 'LICENSE.txt', 'UFL.txt'):
        try:
            with open(os.path.join(out, licence), 'wb') as fh:
                fh.write(get(f'{RAW}/{lic}/{slug}/{licence}'))
            break
        except Exception:
            continue
    with open(os.path.join(out, 'METADATA.pb'), 'w') as fh:
        fh.write(meta)
    print(f'{name}: {len(files)} file(s), licence {lic.upper()} -> public/fonts/{slug}/')
    for f in files:
        print('  ', f)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(' '.join(sys.argv[1:]))
