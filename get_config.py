import urllib.request

try:
    with urllib.request.urlopen("https://raw.githubusercontent.com/Kurry/harbor/main/packages/corpuscheck/src/corpuscheck/canonical/e2e/e2e.playwright.config.mjs") as r:
        with open("e2e.playwright.config.mjs", "wb") as f:
            f.write(r.read())
except Exception as e:
    print(e)
