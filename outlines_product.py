#!/usr/bin/env python3
import json
from pathlib import Path

import requests
import cv2
import numpy as np
from PIL import Image

def download_images(json_path, images_dir):
    """
    Reads a JSON array of URLs (strings),
    downloads each image, and saves them as JPGs.
    """
    Path(images_dir).mkdir(exist_ok=True)
    with open(json_path, 'r') as f:
        data = json.load(f)

    for i, item in enumerate(data):
        if isinstance(item, str):
            url = item
        else:
            url = item.get("imageUrl") or item.get("url") or item.get("src")
        if not url:
            print(f"[!] No URL for entry {i}, skipping.")
            continue
        try:
            resp = requests.get(url, timeout=10)
            resp.raise_for_status()
            fname = images_dir / f"{i:03d}.jpg"
            with open(fname, "wb") as out:
                out.write(resp.content)
            print(f"[↓] Downloaded {fname.name}")
        except Exception as e:
            print(f"[!] Failed to download {url}: {e}")

def create_masks(images_dir, masks_dir, threshold=200, kernel_size=(15,15)):
    """
    Converts each image to grayscale, thresholds it to
    separate the dress from a white background, and applies
    closing to fill holes.
    """
    Path(masks_dir).mkdir(exist_ok=True)
    for img_path in sorted(images_dir.glob("*.jpg")):
        img = cv2.imread(str(img_path))
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        _, mask = cv2.threshold(gray, threshold, 255, cv2.THRESH_BINARY_INV)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, kernel_size)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        out_path = masks_dir / f"{img_path.stem}_mask.png"
        cv2.imwrite(str(out_path), mask)
        print(f"[✔] Mask saved: {out_path.name}")

def create_outlines(masks_dir, outlines_dir, low_thresh=50, high_thresh=150):
    """
    Runs Canny edge detection on each mask to get
    a pure outline, then writes out as RGBA PNG
    (white lines on transparent).
    """
    Path(outlines_dir).mkdir(exist_ok=True)
    for mask_path in sorted(masks_dir.glob("*.png")):
        mask = cv2.imread(str(mask_path), cv2.IMREAD_GRAYSCALE)
        edges = cv2.Canny(mask, low_thresh, high_thresh)
        h, w = edges.shape
        rgba = np.zeros((h, w, 4), dtype=np.uint8)
        rgba[..., :3] = 255
        rgba[..., 3] = edges
        out_path = outlines_dir / f"{mask_path.stem}_outline.png"
        cv2.imwrite(str(out_path), rgba)
        print(f"[✔] Outline saved: {out_path.name}")

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
    json_path    = Path("justproduct.json")     # your JSON of URLs
    images_dir   = Path("imagesproducts")
    masks_dir    = Path("masksproducts")
    outlines_dir = Path("outlines")
    output_path  = Path("stacked_silhouettes.png")

    download_images(json_path, images_dir)
    create_masks(images_dir, masks_dir)
    create_outlines(masks_dir, outlines_dir)
    stack_outlines(outlines_dir, output_path)

if __name__ == "__main__":
    main()
