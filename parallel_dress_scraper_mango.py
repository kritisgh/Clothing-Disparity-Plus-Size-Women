import os
import csv
import asyncio
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError

CATEGORY_URL = 'https://shop.mango.com/us/en/c/women/dresses-and-jumpsuits/short_ec69d6b2'
LINKS_CSV   = 'regular_product_links_mango.csv'
DATA_CSV    = 'regular_product_data_mango.csv'
MAX_CONCURRENT = 5

async def save_links(links):
    with open(LINKS_CSV, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['Product URL'])
        for u in links:
            w.writerow([u])
    print(f"Saved {len(links)} links to {LINKS_CSV}")

async def load_links():
    try:
        with open(LINKS_CSV, 'r', encoding='utf-8') as f:
            r = csv.reader(f)
            next(r, None)
            return [row[0] for row in r if row and row[0].startswith('http')]
    except FileNotFoundError:
        return []

def ensure_data_header():
    if not os.path.exists(DATA_CSV):
        with open(DATA_CSV, 'w', newline='', encoding='utf-8') as f:
            w = csv.writer(f)
            w.writerow(['URL','Reference','Description','Sizes','Inventory','Images'])

def read_existing_refs():
    seen = set()
    try:
        with open(DATA_CSV, 'r', encoding='utf-8') as f:
            r = csv.reader(f)
            next(r, None)
            for row in r:
                seen.add(row[1])
    except FileNotFoundError:
        pass
    return seen

async def append_data(rows):
    ensure_data_header()
    existing = read_existing_refs()
    added = 0
    with open(DATA_CSV, 'a', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        for row in rows:
            if row[1] not in existing:
                w.writerow(row)
                added += 1
                print("Added", row[1])
    print("No new items." if added==0 else f"Appended {added} new items.")

async def scrape_product(context, url):
    page = await context.new_page()
    try:
        await page.goto(url, timeout=60000)
        # Description
        try:
            await page.wait_for_selector("div.TruncateText_textContainer__b_kf_ > p", timeout=5000)
            desc = (await page.locator("div.TruncateText_textContainer__b_kf_ > p").first.text_content()).strip()
        except PlaywrightTimeoutError:
            desc = "N/A"
        # Reference
        ref = url.split("_")[-1].split("?")[0]
        # Sizes & inventory
        await page.wait_for_selector("li.SizesList_listItem___o9_m", timeout=5000)
        sizes_el = page.locator("li.SizesList_listItem___o9_m button")
        sizes, invs = [], []
        count = await sizes_el.count()
        for i in range(count):
            btn = sizes_el.nth(i)
            txt = "N/A"
            try:
                txt = (await btn.locator("span[class*='texts_bodyMRegular']").first.text_content()).strip()
            except:
                pass
            if await btn.locator("span.SizeItemContent_notifyMe__f7VMB").count():
                inv = "Not Available"
            elif await btn.locator("span.SizeItemContent_lastUnits__2lNqZ").count():
                inv = "Last Few Items"
            else:
                inv = "Available"
            sizes.append(txt); invs.append(inv)
        # Images
        images = []
        try:
            await page.wait_for_selector("button.Zoom_imageItemButton__vrCT5 img", timeout=3000)
            imgs = await page.query_selector_all("button.Zoom_imageItemButton__vrCT5 img")
        except PlaywrightTimeoutError:
            imgs = []
        for img in imgs:
            srcset = await img.get_attribute("srcset") or ""
            if srcset:
                parts = srcset.split(", ")
                candidate = next((u.split()[0] for u in parts if "493w" in u), None)
                if candidate:
                    images.append(candidate)
                else:
                    best = max(parts, key=lambda u: int(u.split()[1][:-1]))
                    images.append(best.split()[0])
            else:
                src = await img.get_attribute("src")
                if src:
                    images.append(src)
        return [url, ref, desc, ", ".join(sizes), ", ".join(invs), ", ".join(images)]
    finally:
        await page.close()

async def gather_with_concurrency(n, *tasks):
    semaphore = asyncio.Semaphore(n)
    async def sem_task(task):
        async with semaphore:
            return await task
    return await asyncio.gather(*(sem_task(t) for t in tasks), return_exceptions=True)

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        # 1) get all links
        page = await browser.new_page()
        await page.goto(CATEGORY_URL, timeout=120000, wait_until="domcontentloaded")
        collected = set()
        prev = 0
        while True:
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await page.wait_for_timeout(2000)
            try:
                await page.click("label[title='Show maximum items']", timeout=2000)
                await page.wait_for_timeout(2000)
            except:
                pass
            hrefs = await page.eval_on_selector_all(
                "a[href*='/us/en/p/women/dresses-and-jumpsuits/']",
                "els => els.map(e=>e.href)"
            )
            collected.update(hrefs)
            if len(collected)==prev:
                break
            prev = len(collected)
        await page.close()
        await save_links(sorted(collected))

        # 2) scrape all products concurrently
        links = await load_links()
        context = await browser.new_context()
        tasks = [scrape_product(context, url) for url in links]
        results = await gather_with_concurrency(MAX_CONCURRENT, *tasks)
        await context.close()
        await browser.close()

    # 3) write out results
    # filter out exceptions
    rows = [r for r in results if isinstance(r, list)]
    await append_data(rows)

if __name__ == "__main__":
    asyncio.run(main())
