import csv
import re
import requests
from bs4 import BeautifulSoup

# input/output filenames
LINKS_CSV  = "regular_product_links_mango.csv"
OUTPUT_CSV = "regular_product_image_urls_mango.csv"

# Use a realistic UA to avoid being blocked
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}

def get_all_image_urls(soup):
    """
    From the <ul class="ImageGrid_imageGrid__..."> gallery,
    for each <img> pick the 493w URL if present,
    else fall back to the first srcset entry,
    else the src attribute.
    """
    urls = []
    for img in soup.select("ul.ImageGrid_imageGrid__0lrrn img"):
        # try lowercase/camelCase srcset
        srcset = img.get("srcset") or img.get("srcSet") or ""
        if srcset:
            parts = [p.strip() for p in srcset.split(",") if p.strip()]
            # look for the 493w entry
            chosen = None
            for entry in parts:
                if "493w" in entry:
                    chosen = entry.split()[0]
                    break
            # fallback to first entry if no 493w
            if not chosen and parts:
                chosen = parts[0].split()[0]
            if chosen:
                urls.append(chosen)
                continue
        # if no srcset at all, fallback to src
        src = img.get("src") or ""
        if src:
            urls.append(src)
    return urls

def main():
    # 1) load product URLs
    with open(LINKS_CSV, newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        next(reader, None)  # skip header
        product_urls = [row[0] for row in reader if row]

    # 2) open output CSV
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as out:
        writer = csv.writer(out)
        writer.writerow(["Product URL", "Image URLs", "Second Last Image URL"])

        for url in product_urls:
            try:
                resp = requests.get(url, headers=HEADERS, timeout=30)
                resp.raise_for_status()
                soup = BeautifulSoup(resp.text, "html.parser")

                all_imgs = get_all_image_urls(soup)
                # join all image URLs into one cell
                joined = ",".join(all_imgs)
                # pick the second-last URL if it exists
                second_last = all_imgs[-2] if len(all_imgs) >= 2 else ""

                writer.writerow([url, joined, second_last])
                print(f"✅ {url} → {len(all_imgs)} images, 2nd-last: {second_last or '[none]'}")

            except Exception as e:
                # on error, write empty image-cells and log
                writer.writerow([url, "", ""])
                print(f"❌ {url} → ERROR: {e}")

    print(f"\nDone! Wrote image URLs (and second-last) to {OUTPUT_CSV}")

if __name__ == "__main__":
    main()
