import urllib.request
import json
import base64
import os

repo = "Kurry/frontend-repository"
url = f"https://api.github.com/repos/{repo}/commits"
headers = {"User-Agent": "Mozilla/5.0"}
token = os.environ.get("GITHUB_TOKEN")
if token:
    headers["Authorization"] = f"token {token}"

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        for commit in data:
            print(f"{commit['sha']} - {commit['commit']['message'].splitlines()[0]}")
except Exception as e:
    pass
