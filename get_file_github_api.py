import urllib.request
import json
import base64
import os
import time

def fetch_file(repo, path, ref):
    url = f"https://api.github.com/repos/{repo}/contents/{path}?ref={ref}"
    headers = {"User-Agent": "Mozilla/5.0"}
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"token {token}"

    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            content = base64.b64decode(data["content"]).decode()
            return content
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

# We can find out which fork has this commit by checking the network
content = fetch_file("Mercor-Intelligence/frontend-repository", "packages/corpuscheck/src/corpuscheck/canonical/e2e/e2e.playwright.config.mjs", "839f9a194d06a64210244526ace4ad80ad580960")
if content:
    with open("tasks/frontend-productivity-md-uy/solution/app/e2e.playwright.config.mjs", "w") as f:
        f.write(content)

content2 = fetch_file("Mercor-Intelligence/frontend-repository", "packages/corpuscheck/src/corpuscheck/canonical/e2e/oracle.e2e.mjs", "839f9a194d06a64210244526ace4ad80ad580960")
if content2:
    with open("tasks/frontend-productivity-md-uy/solution/app/e2e.spec.mjs", "w") as f:
        f.write(content2)
