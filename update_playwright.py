import urllib.request
import hashlib

def get_file(url, expected_hash, output_file):
    print(f"Downloading {url}")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            data = response.read()
            h = hashlib.sha256(data).hexdigest()
            print(f"Hash: {h}")
            with open(output_file, 'wb') as f:
                f.write(data)
            print("Written successfully")
    except Exception as e:
        print(f"Error: {e}")

get_file("https://raw.githubusercontent.com/Mercor-Intelligence/frontend-repository/839f9a194d06a64210244526ace4ad80ad580960/packages/corpuscheck/src/corpuscheck/canonical/e2e/e2e.playwright.config.mjs", "873818770cc75dec9dfa288f4b279cd8340594b03387eb7626020f351b255b21", "tasks/frontend-game-feltrun/solution/app/e2e.playwright.config.mjs")
