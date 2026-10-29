import urllib.request
import urllib.parse
import json
import os

bbox = '18.646,73.754,18.658,73.769'
ql = f"""[out:json][timeout:35];
(
  way["highway"]({bbox});
  way["building"]({bbox});
);
out body 80;
>;
out skel qt;"""

url = 'https://overpass-api.de/api/interpreter'
req = urllib.request.Request(
    url,
    data=f'data={urllib.parse.quote(ql)}'.encode(),
    headers={'User-Agent': 'PradhikaranDigitalTwin/2.0'}
)

os.makedirs('data/raw', exist_ok=True)
try:
    print("Sending Overpass query for PCCOE 1 km area...")
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode())
        ways = [e for e in data.get('elements', []) if e.get('type') == 'way']
        print(f"Success! Fetched {len(ways)} real OSM ways.")
        with open('data/raw/real_pccoe_osm.json', 'w') as f:
            json.dump(data, f, indent=2)
except Exception as e:
    print("Overpass query error:", e)
