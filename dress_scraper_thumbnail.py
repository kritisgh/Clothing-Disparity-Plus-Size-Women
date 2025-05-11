import json
from playwright.sync_api import sync_playwright

CATEGORY_URL = 'https://shop.mango.com/us/en/c/women/plus-sizes/dresses-and-jumpsuits_4d2c529c'
OUTPUT_JSON  = 'category_with_details.json'

def scrape_category_with_details(category_url):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page    = context.new_page()

        # 1) Load category page
        page.goto(category_url, timeout=120000, wait_until="domcontentloaded")
        page.wait_for_selector(
            "a[href*='/us/en/p/women/dresses-and-jumpsuits/'] img",
            timeout=15000
        )

        # 2) Click "Show maximum items" to reveal all products
        try:
            page.click("label[title='Show maximum items']", timeout=5000)
            page.wait_for_timeout(5000)
        except:
            # If the button isn't present, continue anyway
            pass

        # 3) Scroll until all thumbnails are loaded
        prev_count = 0
        while True:
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(3000)
            imgs = page.query_selector_all(
                "a[href*='/us/en/p/women/dresses-and-jumpsuits/'] img"
            )
            if len(imgs) == prev_count:
                break
            prev_count = len(imgs)

        # 4) Gather product tile anchors (deduplicated)
        anchors = page.query_selector_all("a[href*='/us/en/p/women/dresses-and-jumpsuits/']")
        seen    = set()
        items   = []

        for a in anchors:
            href = a.get_attribute("href")
            if not href or href in seen:
                continue
            seen.add(href)

            # Build absolute URL
            product_url = a.evaluate("el => new URL(el.href, document.baseURI).href")

            # Extract thumbnail URL
            img = a.query_selector("img")
            srcset = img.get_attribute("srcset") or ""
            if srcset:
                thumb = srcset.split(",")[0].split()[0]
            else:
                thumb = img.get_attribute("src") or ""

            # 5) Visit product page for title + description
            detail_page = context.new_page()
            detail_page.goto(product_url, timeout=90000, wait_until="domcontentloaded")
            detail_page.wait_for_timeout(3000)

            try:
                title = detail_page.inner_text("h1").strip()
            except:
                title = "N/A"

            try:
                description = detail_page.inner_text("div.Description_description__IDgi6 p").strip()
            except:
                description = "N/A"

            detail_page.close()

            items.append({
                "productUrl":  product_url,
                "imageUrl":    thumb,
                "title":       title,
                "description": description
            })

        browser.close()
        return items

def save_to_json(data, filename):
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(data)} items to {filename}")

if __name__ == "__main__":
    catalog = scrape_category_with_details(CATEGORY_URL)
    save_to_json(catalog, OUTPUT_JSON)
