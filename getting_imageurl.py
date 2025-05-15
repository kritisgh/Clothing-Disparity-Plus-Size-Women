import csv
import re
import requests
from bs4 import BeautifulSoup

# input/output filenames
LINKS_CSV   = "regular_product_links_mango.csv"
OUTPUT_CSV  = "regular_product_image_urls_mango.csv"

# mimic a real browser to avoid 403s
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}

def get_best_image_url(soup):
    """
    Find the first <img> under the main image grid,
    pick the 493w source if present, else fall back to the first srcset entry,
    else use the plain src attribute.
    """
    img = soup.select_one("ul.ImageGrid_imageGrid__0lrrn img")
    if not img:
        return ""

    # Try srcset (lowercase) then srcSet (camelCase)
    srcset = img.get("srcset") or img.get("srcSet") or ""
    if srcset:
        parts = [p.strip() for p in srcset.split(",") if p.strip()]
        # prefer the 493w width
        for entry in parts:
            if "493w" in entry:
                return entry.split()[0]
        # otherwise first entry
        first = parts[0].split()[0]
        if first:
            return first

    # fallback to plain src
    return img.get("src", "")


def main():
    # 1) load product URLs
    with open(LINKS_CSV, newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        next(reader, None)  # skip header
        urls = [row[0] for row in reader if row]

    # 2) open output CSV
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as out:
        writer = csv.writer(out)
        writer.writerow(["Product URL", "Image URL"])

        for url in urls:
            try:
                resp = requests.get(url, headers=HEADERS, timeout=30)
                resp.raise_for_status()
                soup = BeautifulSoup(resp.text, "html.parser")


                img_url = get_best_image_url(soup)
                writer.writerow([url, img_url])
                print(f"✅ {url} → {img_url}")

            except Exception as e:
                # on error, still write the URL with empty image, and log
                writer.writerow([url, ""])
                print(f"❌ {url} → ERROR: {e}")

    print(f"\nDone! Wrote image URLs to {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
