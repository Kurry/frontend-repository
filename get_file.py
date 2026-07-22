import urllib.request
import json
import base64
import os

token = os.environ.get("GITHUB_TOKEN")
headers = {"User-Agent": "Mozilla/5.0"}
if token:
    headers["Authorization"] = f"token {token}"

def get_file(path, out):
    url = f"https://api.github.com/repos/Kurry/frontend-repository/contents/{path}?ref=839f9a194d06a64210244526ace4ad80ad580960"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            content = base64.b64decode(data["content"]).decode()
            with open(out, "w") as f:
                f.write(content)
            print(f"Success: {out}")
    except Exception as e:
        print(f"Error fetching {path}: {e}")

get_file("packages/corpuscheck/src/corpuscheck/canonical/e2e/e2e.playwright.config.mjs", "tasks/frontend-productivity-md-uy/solution/app/e2e.playwright.config.mjs")
get_file("packages/corpuscheck/src/corpuscheck/canonical/e2e/oracle.e2e.mjs", "tasks/frontend-productivity-md-uy/solution/app/e2e.spec.mjs")
