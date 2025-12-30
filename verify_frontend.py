from playwright.sync_api import sync_playwright

def verify_responsiveness():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # Desktop
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})
        page.goto('file:///app/index.html')
        page.wait_for_timeout(2000) # Wait for animations/LiquidEther
        page.screenshot(path='/home/jules/verification/desktop.png')
        print("Desktop screenshot taken.")

        # Mobile
        page_mobile = browser.new_page(viewport={'width': 375, 'height': 667}) # iPhone SE size
        page_mobile.goto('file:///app/index.html')
        page_mobile.wait_for_timeout(2000)
        page_mobile.screenshot(path='/home/jules/verification/mobile.png')
        print("Mobile screenshot taken.")

        browser.close()

if __name__ == "__main__":
    verify_responsiveness()
