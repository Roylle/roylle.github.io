"""Download the owner's publicly shared Behance artwork for this portfolio.
Run once with python3 scripts/download-assets.py. No authentication is used.
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import Request, urlopen
from PIL import Image
from io import BytesIO

ROOT = Path(__file__).resolve().parent.parent / 'public' / 'projects'
ROOT.mkdir(parents=True, exist_ok=True)
BASE = 'https://mir-s3-cdn-cf.behance.net/'
ASSETS = {
 'soundred.webp': 'projects/max_808_webp/014e73230708601.Y3JvcCwzNzMzLDI5MjAsNTUsMA.png',
 'datablue.webp': 'projects/max_808_webp/64efe3230698403.Y3JvcCwxMTUwNiw5MDAwLDI1Niww.png',
 'tam-yen.webp': 'projects/max_808_webp/a0385c229610067.Y3JvcCwyODYyLDIyMzksNDc0LDQ1Mw.jpg',
 'dai-quoc-viet.webp': 'projects/max_808_webp/2b652e229677019.Y3JvcCw4MjUsNjQ2LDE2MSww.png',
 'greenspace.webp': 'projects/max_808_webp/498eb7230749715.Y3JvcCwzODQwLDMwMDMsMCww.png',
 'metafox.webp': 'projects/max_808_webp/af0172229675567.Y3JvcCwzOTI0LDMwNzAsODcsMA.jpg',
 'healthytrack.webp': 'projects/max_808_webp/3ea219230931797.Y3JvcCwzMDMwLDIzNzAsMCww.png',
 'building-management.webp': 'projects/max_808_webp/753399230073977.Y3JvcCwzODQwLDMwMDMsMCw5.png',
 'solace.webp': 'projects/max_808_webp/c9fc1f144370095.Y3JvcCw1NTk0LDQzNzYsMTAzOCww.jpg',
 'motion.webp': 'projects/max_808_webp/616426234997197.Y3JvcCwxMzA5LDEwMjQsMTEzLDA.png',
 'tries.webp': 'projects/max_808_webp/b6c6a3144376017.Y3JvcCw2MTM2LDQ4MDAsMTM2LDA.png',
 'sheeps-fight.webp': 'projects/max_808_webp/6cacfc144350819.Y3JvcCw1NTIzLDQzMjAsMzAwLDA.jpg',
 'soundred-detail.webp': 'project_modules/1400_webp/598f6d230708601.687ba85132884.png',
 'datablue-detail.webp': 'project_modules/2800_webp/cee5e3230698403.687cced74d70e.png',
 'tam-yen-detail.webp': 'project_modules/1400_webp/8889f6229610067.6867a81f762f6.png',
 'greenspace-detail.webp': 'project_modules/2800_webp/1b936d230749715.687d1365e48b2.png',
 'healthytrack-detail.webp': 'project_modules/2800_webp/191d9c230931797.687fd73a42834.png',
}

def download(item):
    name, path = item
    target = ROOT / name
    if target.exists():
        return f'{name}: exists'
    request = Request(BASE + path, headers={'User-Agent': 'Mozilla/5.0'})
    with urlopen(request, timeout=60) as response:
        data = response.read()
        if not response.headers.get('Content-Type', '').startswith('image/'):
            raise ValueError(f'Not an image: {name}')
    image = Image.open(BytesIO(data))
    image.thumbnail((1400, 18000))
    image.save(target, 'WEBP', quality=87, method=6)
    return f'{name}: {target.stat().st_size:,} bytes'

if __name__ == '__main__':
    with ThreadPoolExecutor(max_workers=5) as pool:
        for result in pool.map(download, ASSETS.items()):
            print(result)
