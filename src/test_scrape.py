import requests
from bs4 import BeautifulSoup

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
}

def check_ikman():
    url = "https://ikman.lk/en/ads/sri-lanka/land"
    response = requests.get(url, headers=headers)
    print(f"Ikman status: {response.status_code}")
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')
        ads = soup.find_all('li', class_='normal--2QYVk')
        if not ads:
            print("Ikman ads not found by class normal--2QYVk, checking other list items")
            ads = soup.find_all('li')
        print(f"Found {len(ads)} potential ads on Ikman page 1")
    else:
        print(response.text[:500])

def check_lpw():
    url = "https://www.lankapropertyweb.com/land/index.php"
    response = requests.get(url, headers=headers)
    print(f"LPW status: {response.status_code}")
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')
        ads = soup.find_all('div', class_='listing-item')
        if not ads:
            print("LPW ads not found by class listing-item, checking other list items")
            ads = soup.find_all('div')
        print(f"Found {len(ads)} potential ads on LPW page 1")
        
        for a in soup.find_all('a', href=True):
            if 'property' in a['href'] or 'land' in a['href']:
                pass
    else:
        print(response.text[:500])

check_ikman()
print("===============")
check_lpw()
