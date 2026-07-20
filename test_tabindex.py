from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:3000")
    page.wait_for_timeout(2000)

    # Dump HTML of buttons with tabindex=-1
    buttons = page.locator("button[tabindex='-1']").all()
    for b in buttons:
        print("FOUND BUTTON:", b.evaluate("el => el.outerHTML"))

    # Open forms modal and check again
    page.get_by_role("button", name="Rescore with new label").first.click()
    page.wait_for_timeout(1000)
    buttons = page.locator("button[tabindex='-1']").all()
    for b in buttons:
        print("FOUND BUTTON IN MODAL:", b.evaluate("el => el.outerHTML"))

    browser.close()
