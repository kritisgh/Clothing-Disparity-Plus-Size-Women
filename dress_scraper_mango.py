import csv
from playwright.sync_api import sync_playwright
import requests
from bs4 import BeautifulSoup

CATEGORY_URL = 'https://shop.mango.com/us/en/c/women/plus-sizes/dresses-and-jumpsuits_4d2c529c'

def get_product_links():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Go to the category page
        page.goto(CATEGORY_URL, timeout=120000, wait_until="domcontentloaded")

        # Wait for the product grid to load
        page.wait_for_selector("a[href*='/us/en/p/women/dresses-and-jumpsuits/']", timeout=10000)

        all_links = set()

        previous_links_count = 0
        scrolling = True

        while scrolling:
            # Scroll down and trigger page loading
            print(f"Scrolling...")

            # Scroll to the bottom of the page
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(5000)  # Wait for new products to load

            # Click the "Show maximum items" button if available
            try:
                page.click("label[title='Show maximum items']", timeout=5000)  # Try to trigger "Show maximum items"
                print("Clicked 'Show maximum items' button.")
                page.wait_for_timeout(5000)  # Wait for items to load
            except:
                print("'Show maximum items' button not found or not clickable.")

            # Scrape the current batch of product links
            product_links = page.eval_on_selector_all("a[href*='/us/en/p/women/dresses-and-jumpsuits/']", 
                                                      "elements => elements.map(e => e.href)")

            # Check how many links were found
            print(f"Found {len(product_links)} links after scrolling...")

            # Check if new links have been added since last scroll
            if len(product_links) == previous_links_count:
                print("No new links found after scrolling.")
                scrolling = False  # Stop scrolling if no new products are found
            else:
                previous_links_count = len(product_links)

            # Log the first few product links to see if they're updating
            print("\nFirst few product links found after this scroll:")
            print("\n".join(product_links[:5]))

            # Add new links to the set
            all_links.update(product_links)

            # # Check if we've loaded enough products (optional) or continue scrolling
            # if len(all_links) > 50:  # Example: stop when you have over 50 products
            #     scrolling = False
            #     print("Enough products loaded, stopping.")
        
        # Close the browser after scraping
        browser.close()

        return list(all_links)

def save_links_to_csv(links, filename="product_links.csv"):
    """Saves a list of product URLs to a CSV file."""
    with open(filename, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["Product URL"])  # CSV header
        for link in links:
            writer.writerow([link])

    print(f"Saved {len(links)} links to {filename}")

# Run the scraper and get all product links
product_links = get_product_links()
save_links_to_csv(product_links)

# Print the total number of links found
print(f"Total number of product links found: {len(product_links)}")

# Print all the links scraped
print("\nAll product links found:")
print("\n".join(product_links))  # Print all the links



# Read product links from CSV
with open("product_links.csv", "r", encoding="utf-8") as file:
    reader = csv.reader(file)
    next(reader, None)  # Skip header row
    product_links = [row[0].strip() for row in reader if row and row[0].startswith("http")]

def scrape_product(url):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, timeout=90000)
        page.wait_for_timeout(5000)  # Allow time for content to load

        # Extract description
        description = page.inner_text("div.Description_description__IDgi6 p") if page.locator("div.Description_description__IDgi6 p").count() > 0 else "N/A"

        # Extract reference number from URL
        ref_number = url.split("_")[-1].split("?")[0]

        # Extract sizes and inventory
        sizes = []
        inventory_status = []

        size_elements = page.locator("li.SizesList_listItem___o9_m button")
        for i in range(size_elements.count()):
            # Extract first span inside button (avoiding strict mode errors)
            size_text = size_elements.nth(i).locator("span.texts_bodyMRegular__j0yfK").first.inner_text().strip()

            # Check for inventory status
            if size_elements.nth(i).locator("span.SizeItemContent_notifyMe__f7VMB").count() > 0:
                inventory = "Not Available"
            elif size_elements.nth(i).locator("span.SizeItemContent_lastUnits__2lNqZ").count() > 0:
                inventory = "Last Few Items"
            else:
                inventory = "Available"

            sizes.append(size_text)
            inventory_status.append(inventory)

        # Extract image URLs that are width 493 and fallback to highest quality when not found
        image_elements = page.query_selector_all("button.Zoom_imageItemButton__vrCT5 img")
        image_urls = []
        for img in image_elements:
            srcset = img.get_attribute('srcset')
            if srcset:
                # Extract the URL with width 493 if available
                srcset_urls = srcset.split(", ")
                url_493 = next((url.split()[0] for url in srcset_urls if "493w" in url), None)
                if url_493:
                    image_urls.append(url_493)
                else:
                    # Fallback to the highest width available
                    highest_quality_url = max(srcset_urls, key=lambda url: int(url.split()[1][:-1])).split()[0]
                    image_urls.append(highest_quality_url)
            else:
                # Fallback to src attribute if srcset is not available
                src = img.get_attribute('src')
                if src:
                    image_urls.append(src)


       # image_urls = page.eval_on_selector_all("img[src]", "elements => elements.map(e => e.src)") use this if u need the best quality 2048 image
       # image_urls = ", ".join(image_urls) use this if u need the best quality 2048 image


        browser.close()
        return [url, ref_number, description, ", ".join(sizes), ", ".join(inventory_status), ", ".join(image_urls)]   


def read_existing_csv(file_path):
    existing_data = {}
    try:
        with open(file_path, mode='r', encoding='utf-8') as file:
            reader = csv.reader(file)
            next(reader)  # Skip header
            for row in reader:
                ref_number = row[1]
                existing_data[ref_number] = row
    except FileNotFoundError:
        pass
    return existing_data

def append_new_data_to_csv(file_path, new_data, existing_data):
    new_entries = 0
    with open(file_path, mode='a', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        for data in new_data:
            ref_number = data[1]
            if ref_number not in existing_data:
                writer.writerow(data)
                new_entries += 1
                print(f"New reference number found and added: {ref_number}")
    if new_entries == 0:
        print("No new reference numbers found.")

# Read existing CSV data
existing_data = read_existing_csv("product_data.csv")
# existing_data is a dictionary with reference numbers as keys and rows as values

# Scrape all valid products
product_data = [scrape_product(link) for link in product_links if link]
# product_data is a list of new data scraped from the URLs in product_links

# Append new data to CSV
append_new_data_to_csv("product_data.csv", product_data, existing_data)
# This function appends new data to the CSV file, ensuring no duplicates based on reference numbers
print("Scraping complete. Data saved to product_data.csv")