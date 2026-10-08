"""Search Wikimedia Commons for licensed photos (bible SRC-01 / SRC-02 / MED-08).

    python3 scripts/find_photos.py <out_dir> "<search>" [n=8]

Keeps only landscape photos >= 1600 px wide under a licence that allows commercial use
(public domain, CC0, CC BY, CC BY-SA), downloads a 1920 px version of each into <out_dir>,
and appends one line per file to <out_dir>/manifest.jsonl: source page, file URL, author,
licence, licence URL, whether attribution is required. Nothing without a verified licence is kept.
"""
import html
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

API = 'https://commons.wikimedia.org/w/api.php'
UA = 'PlugMotion/1.0 (documentary episode; licensed media only)'
OK = re.compile(r'^(public domain|pd|cc0|cc by( |-)?[0-9.]*|cc by-sa( |-)?[0-9.]*)', re.I)


def get(url, tries=5):
    # Commons rate-limits: a pause before each request, and a back-off on 429.
    for k in range(tries):
        time.sleep(3)
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code != 429 or k == tries - 1:
                raise
            time.sleep(10 * (k + 1))


def text(v):
    return html.unescape(re.sub(r'<[^>]+>', '', v or '')).strip()


def main():
    out, query = sys.argv[1], sys.argv[2]
    n = int(sys.argv[3]) if len(sys.argv) > 3 else 8
    os.makedirs(out, exist_ok=True)
    params = {
        'action': 'query', 'format': 'json', 'generator': 'search', 'gsrnamespace': 6,
        'gsrsearch': f'{query} filetype:bitmap', 'gsrlimit': 40,
        'prop': 'imageinfo', 'iiprop': 'url|extmetadata|size|mime',
    }
    data = json.loads(get(API + '?' + urllib.parse.urlencode(params)))
    pages = sorted(data.get('query', {}).get('pages', {}).values(), key=lambda p: p.get('index', 0))
    kept = 0
    with open(os.path.join(out, 'manifest.jsonl'), 'a') as man:
        for p in pages:
            if kept >= n:
                break
            ii = p['imageinfo'][0]
            m = ii.get('extmetadata', {})
            lic = text(m.get('LicenseShortName', {}).get('value'))
            if ii.get('mime') != 'image/jpeg' or ii['width'] < 1600 or ii['width'] < ii['height'] * 1.2 or not OK.match(lic):
                continue
            slug = re.sub(r'[^a-z0-9]+', '-', query.lower()).strip('-')
            name = f'{slug}-{kept + 1:02d}.jpg'
            if os.path.exists(os.path.join(out, name)) or any(json.loads(l)['title'] == p['title'] for l in open(os.path.join(out, 'manifest.jsonl')) if l.strip()):
                kept += 1
                continue
            # A standard thumbnail size on upload.wikimedia.org (what Commons asks bots to use),
            # resized here to exactly 1920 px wide.
            raw = os.path.join(out, name + '.orig')
            base = ii['url'].split('?')[0].rsplit('/', 1)
            thumb = base[0].replace('/commons/', '/commons/thumb/') + '/' + base[1] + '/1920px-' + base[1]
            with open(raw, 'wb') as f:
                f.write(get(thumb))
            ok = subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', raw, '-vf', 'scale=1920:-2', '-q:v', '3', os.path.join(out, name)]).returncode == 0
            os.remove(raw)
            if not ok:
                continue
            rec = {
                'file': name, 'query': query, 'title': p['title'], 'page': ii['descriptionurl'], 'url': ii['url'],
                'author': text(m.get('Artist', {}).get('value')), 'licence': lic,
                'licence_url': text(m.get('LicenseUrl', {}).get('value')),
                'attribution_required': text(m.get('AttributionRequired', {}).get('value')) != 'false',
                'commercial_use': True, 'width': ii['width'], 'height': ii['height'],
            }
            man.write(json.dumps(rec, ensure_ascii=False) + '\n')
            kept += 1
            print(name, lic, '|', rec['author'][:50])


if __name__ == '__main__':
    main()
