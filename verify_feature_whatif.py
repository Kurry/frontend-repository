from playwright.sync_api import sync_playwright
import time
import os

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto('http://localhost:3000')

    # Wait for app to render by checking for stage status indicator
    page.wait_for_selector('.stage-status')

    # 1. Start re-run to verify spinner and loading
    page.click('text=Start re-run')
    # Let it run for a bit
    time.sleep(1)
    page.screenshot(path='/home/jules/verification/verify_rerun.png')

    # Wait for rerun to finish
    time.sleep(10)

    # 2. Enter what-if mode and click a failing gate (like hardening's S2 which fails sometimes or just click anything)
    # The first run's test generation passed. Let's flip one to failing.
    page.click('input[type="checkbox"]') # Click what-if toggle
    time.sleep(0.5)

    # Find the TST-301 Specification coverage gate (which is passing) and click it
    page.click('text=Specification coverage')
    time.sleep(0.5)

    page.screenshot(path='/home/jules/verification/verify_whatif_flip.png')
    browser.close()
