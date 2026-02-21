import requests
from bs4 import BeautifulSoup

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
}

def analyze_ikman():
    # Get a list page
    resp = requests.get('https://ikman.lk/en/ads/sri-lanka/land', headers=headers)
    soup = BeautifulSoup(resp.text, 'html.parser')
    
    # find first ad link
    links = []
    for a in soup.find_all('a', href=True):
        if '/ad/' in a['href']:
            links.append("https://ikman.lk" + a['href'])
    
    if not links:
        print("Ikman: No ad links found.")
        return
        
    print(f"Ikman: found link {links[0]}")
    resp_ad = requests.get(links[0], headers=headers)
    print("Ikman Ad Page Status:", resp_ad.status_code)
    with open('ikman_ad.html', 'w', encoding='utf-8') as f:
        f.write(resp_ad.text)

def analyze_lpw():
    resp = requests.get('https://www.lankapropertyweb.com/land/index.php', headers=headers)
    soup = BeautifulSoup(resp.text, 'html.parser')
    
    links = []
    for a in soup.find_all('a', href=True):
        if 'property/details' in a['href'] or 'land/' in a['href']:
            # lpw format differs, sometimes relative, sometimes absolute
            href = a['href']
            if href.startswith('/'):
                href = "https://www.lankapropertyweb.com" + href
            if 'details' in href or ('land' in href and '-' in href and href.endswith('.html')):
                links.append(href)
                
    if not links:
        print("LPW: No ad links found.")
        return
        
    print(f"LPW: found link {links[0]}")
    resp_ad = requests.get(links[2], headers=headers) # getting 3rd item to be safe
    print("LPW Ad Page Status:", resp_ad.status_code)
    with open('lpw_ad.html', 'w', encoding='utf-8') as f:
        f.write(resp_ad.text)

analyze_ikman()
analyze_lpw()
