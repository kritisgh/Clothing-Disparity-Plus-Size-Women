#!/usr/bin/env python3
import json
from pathlib import Path
from urllib.parse import urlparse

import requests
import cv2
import numpy as np
from PIL import Image

def download_images(json_path, images_dir):
    """
    Reads a JSON array of URLs (strings),
    filters to image URLs, downloads each image, and saves them as JPGs.
    """
    Path(images_dir).mkdir(exist_ok=True)
    with open(json_path, 'r') as f:
        data = json.load(f)

    for i, item in enumerate(data):
        # Determine URL from string or object
        if isinstance(item, str):
            url = item
        else:
            url = item.get("imageUrl") or item.get("url") or item.get("src")
        if not url:
            print(f"[!] No URL for entry {i}, skipping.")
            continue

        # Filter: only process URLs with image file extensions
        parsed = urlparse(url)
        ext = Path(parsed.path).suffix.lower()
        if ext not in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']:
            print(f"[!] Skipping non-image URL: {url}")
            continue

        try:
            resp = requests.get(url, timeout=10)
            resp.raise_for_status()
            fname = images_dir / f"{i:03d}{ext}"
            with open(fname, "wb") as out:
                out.write(resp.content)
            print(f"[↓] Downloaded {fname.name}")
        except Exception as e:
            print(f"[!] Failed to download {url}: {e}")

def create_masks(images_dir, masks_dir, threshold=200, kernel_size=(15,15)):
    """
    Converts each downloaded image to grayscale, applies thresholding
    to separate the dress from a white background, and performs
    morphological closing to fill holes.
    """
    Path(masks_dir).mkdir(exist_ok=True)
    for img_path in sorted(images_dir.glob("*.*")):
        img = cv2.imread(str(img_path))
        if img is None:
            print(f"[!] Failed to read image, skipping: {img_path.name}")
            continue
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        _, mask = cv2.threshold(gray, threshold, 255, cv2.THRESH_BINARY_INV)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, kernel_size)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        out_path = masks_dir / f"{img_path.stem}_mask.png"
        cv2.imwrite(str(out_path), mask)
        print(f"[✔] Mask saved: {out_path.name}")

def create_outlines(masks_dir, outlines_dir, low_thresh=50, high_thresh=150, grey_val=180, opacity=0.8):
    """
    Runs Canny edge detection on each mask to extract
    a pure outline, then writes out as RGBA PNG
    using grey lines at given opacity.
    """
    Path(outlines_dir).mkdir(exist_ok=True)
    alpha_val = int(255 * opacity)
    for mask_path in sorted(masks_dir.glob("*_mask.png")):
        mask = cv2.imread(str(mask_path), cv2.IMREAD_GRAYSCALE)
        if mask is None:
            print(f"[!] Failed to read mask, skipping: {mask_path.name}")
            continue
        # detect edges
        edges = cv2.Canny(mask, low_thresh, high_thresh)
        h, w = edges.shape
        # prepare RGBA canvas with grey lines
        rgba = np.zeros((h, w, 4), dtype=np.uint8)
        rgba[..., :3] = grey_val  # grey color
        # edges are 255 where line; convert to opacity
        line_mask = edges > 0
        rgba[..., 3] = line_mask.astype(np.uint8) * alpha_val
        out_path = outlines_dir / f"{mask_path.stem}_outline.png"
        cv2.imwrite(str(out_path), rgba)
        print(f"[✔] Outline saved: {out_path.name} (grey, {int(opacity*100)}% opacity)")

def stack_outlines(outlines_dir, output_path, canvas_size=None):
    """
    Alpha-composites all outline PNGs into one image.
    """
    files = sorted(outlines_dir.glob("*_outline.png"))
    if not files:
        print("[!] No outlines found, aborting.")
        return

    first = Image.open(files[0])
    w, h = canvas_size or first.size
    base = Image.new("RGBA", (w, h), (255,255,255,0))
    for path in files:
        img = Image.open(path).convert("RGBA")
        if img.size != (w, h):
            img = img.resize((w, h), Image.BILINEAR)
        base = Image.alpha_composite(base, img)
    base.save(output_path)
    print(f"[★] Stacked silhouettes saved to {output_path}")

def main():
    json_path    = Path("plusimg.json")    # JSON array of URLs
    images_dir   = Path("imagespeople")
    masks_dir    = Path("maskspeople")
    outlines_dir = Path("outlines_people")
    output_path  = Path("stacked_silhouettespeople.png")

    download_images(json_path, images_dir)
    create_masks(images_dir, masks_dir)
    create_outlines(masks_dir, outlines_dir)
    stack_outlines(outlines_dir, output_path)

if __name__ == "__main__":
    main()
