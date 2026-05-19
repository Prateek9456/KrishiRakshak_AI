import os
import urllib.request

try:
    from duckduckgo_search import DDGS
except ImportError:
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "duckduckgo-search"])
    from duckduckgo_search import DDGS

with DDGS() as ddgs:
    results = list(ddgs.images('ICAR logo png official', max_results=2))
    if results:
        # Try to download the first one
        for res in results:
            url = res['image']
            print(f"Downloading from {url}")
            try:
                urllib.request.urlretrieve(url, 'c:/Users/user/Documents/Projects/SWC-AI-ENGINE-MAIN/web/public/images/icar-logo.png')
                print("Downloaded successfully.")
                break
            except Exception as e:
                print(f"Failed to download from {url}: {e}")
    else:
        print('No images found')
