import requests
import json
import re
import csv
import time
import sys
import concurrent.futures

# Constraints & Scope
TARGET_COUNT = 5000
LIST_PAGE_DELAY = 0.5
MAX_WORKERS = 25 # Concurrent connections for rapid fetching
OUTPUT_FILE = 'data/raw/land_data_final.csv'

# Headers - Updated with separate District and City columns
HEADERS = [
    'Listing title',
    'Total price (LKR)',
    'Land size',
    'Price per perch',
    'District',
    'City',
    'Road access type',
    'Availability of electricity',
    'Availability of tap water',
    'Posted date',
    'Listing URL'
]

HEADERS_REQ = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
    'Accept-Language': 'en-US,en;q=0.9',
}

def clean_text(text):
    if not text:
        return 'unknown'
    return str(text).strip().replace('\r', ' ').replace('\n', ' ')

def extract_size_in_perches(size_str):
    if not size_str:
        return None
    size_str = size_str.lower()
    match = re.search(r'([\d,\.]+)\s*(perch|perches|acre|acres)', size_str)
    if not match: return None
    val_str = match.group(1).replace(',', '')
    try: val = float(val_str)
    except: return None
    unit = match.group(2)
    if 'acre' in unit: val *= 160.0
    return round(val, 2)

def extract_price(price_str):
    if not price_str: return None
    price_str = price_str.upper().replace('RS', '').replace(',', '').replace('LKR', '').strip()
    match = re.search(r'([\d\.]+)', price_str)
    if match:
        try: return float(match.group(1))
        except: pass
    return None

def check_utilities(description_text):
    if not description_text: return 0, 0
    text = str(description_text).lower()
    water_keywords = ['නළ ජලය', 'ජලය', 'වතුර', 'water', 'pipe', 'nla jala']
    has_water = 1 if any(word in text for word in water_keywords) else 0
    elec_keywords = ['විදුලිය', 'තෙකලා', 'කරන්ට්', 'electricity', 'current', 'phase', 'viduliya']
    has_electricity = 1 if any(word in text for word in elec_keywords) else 0
    return has_water, has_electricity

# We encapsulate the ad fetching into a single worker function
def process_ad(ad):
    ad_url = f"https://ikman.lk/en/ad/{ad.get('slug')}"
    
    has_water = 0
    has_electricity = 0
    district = clean_text(ad.get('location', 'null'))
    city = 'null'
    try:
        if ad.get('area'):
            city = clean_text(ad.get('area') if isinstance(ad.get('area'), str) else ad.get('area', {}).get('name', 'null'))
    except: pass
    
    # Try fetching individual ad
    try:
        ad_resp = requests.get(ad_url, headers=HEADERS_REQ, timeout=5)
        if ad_resp.status_code == 200:
            ad_m = re.search(r'window\.initialData\s*=\s*(\{.*?\})\s*(?:</script>|;)', ad_resp.text, re.DOTALL)
            if ad_m:
                ad_data = json.loads(ad_m.group(1))
                detail = ad_data.get('adDetail', {}).get('data', {}).get('ad', {})
                description = detail.get('description', '')
                has_water, has_electricity = check_utilities(description)
                try:
                    loc_name = detail.get('location', {}).get('name', '')
                    if loc_name:
                        city = clean_text(loc_name)
                    area_name = detail.get('area', {}).get('name', '')
                    if area_name:
                        district = clean_text(area_name)
                except: pass
    except:
        pass # Fallback defaults

    size_perches = extract_size_in_perches(ad.get('details', ''))
    
    total_price = None
    price_per_perch = None
    p_text = str(ad.get('price', ''))
    val = extract_price(p_text)
    if val:
        if 'per perch' in p_text.lower() or 'perch' in p_text.lower(): price_per_perch = val
        elif 'per acre' in p_text.lower(): price_per_perch = round(val / 160.0, 2)
        else: total_price = val
    
    if total_price and size_perches and size_perches > 0 and not price_per_perch:
        price_per_perch = round(total_price / size_perches, 2)
    elif price_per_perch and size_perches and size_perches > 0 and not total_price:
        total_price = round(price_per_perch * size_perches, 2)
        
    posted_date = clean_text(ad.get('timeStamp', ''))

    return {
        'Listing title': clean_text(ad.get('title', '')) or 'null',
        'Total price (LKR)': total_price or 'null',
        'Land size': size_perches or 'null',
        'Price per perch': price_per_perch or 'null',
        'District': district,
        'City': city,
        'Road access type': 'unknown',
        'Availability of electricity': has_electricity,
        'Availability of tap water': has_water,
        'Posted date': posted_date or 'null',
        'Listing URL': ad_url
    }

def run_scraper():
    collected = 0
    seen_urls = set()
    
    try:
        f = open(OUTPUT_FILE, 'w', encoding='utf-8-sig', newline='')
        writer = csv.DictWriter(f, fieldnames=HEADERS)
        writer.writeheader()
    except Exception as e:
        print(f"Failed to open output file: {e}")
        return

    page = 1
    # We maintain a ThreadPool for making concurrent HTTP requests
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        while collected < TARGET_COUNT:
            ads = []
            for attempt in range(5):
                url = f"https://ikman.lk/en/ads/sri-lanka/land?page={page}"
                if attempt == 0:
                    sys.stdout.write(f"\nFetching List Page {page}...")
                else:
                    sys.stdout.write(f" [Retry {attempt}]")
                sys.stdout.flush()
                
                try:
                    resp = requests.get(url, headers=HEADERS_REQ, timeout=15)
                    if resp.status_code == 403 or 'cloudflare' in resp.text.lower():
                        time.sleep(5)
                        continue
                    if resp.status_code != 200:
                        time.sleep(2)
                        continue
                        
                    m = re.search(r'window\.initialData\s*=\s*(\{.*?\})\s*(?:</script>|;)', resp.text, re.DOTALL)
                    if not m:
                        time.sleep(2)
                        continue
                    
                    data = json.loads(m.group(1))
                    ads_node = data.get('serp', {}).get('ads', {})
                    if 'data' not in ads_node:
                        time.sleep(3)
                        continue
                        
                    ads_list = ads_node['data'].get('ads', [])
                    if ads_list:
                        ads = ads_list
                        break
                except Exception as e:
                    time.sleep(3)
                    
            if not ads:
                print(f"\nFailed to fetch ads on page {page} after 5 attempts. Skipping to next page.")
                page += 1
                continue
            
            # Submit valid new ads to the executor
            futures = []
            for ad in ads:
                if collected + len(futures) >= TARGET_COUNT: break
                slug = ad.get('slug')
                if not slug or slug in seen_urls: continue
                seen_urls.add(slug)
                futures.append(executor.submit(process_ad, ad))
            
            # Retrieve completed items sequentially
            for future in concurrent.futures.as_completed(futures):
                row = future.result()
                writer.writerow(row)
                collected += 1
                sys.stdout.write(f"\r  Scraped: {collected}/{TARGET_COUNT} ads (Latest City: {row['City']}, Elec: {row['Availability of electricity']})")
                sys.stdout.flush()

            f.flush()
            page += 1
            time.sleep(LIST_PAGE_DELAY)

    print(f"\n\nScraping completed. Extracted {collected} records into {OUTPUT_FILE}.")
    f.close()

if __name__ == "__main__":
    run_scraper()