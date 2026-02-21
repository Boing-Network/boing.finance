#!/usr/bin/env python3
"""
Enhance and optimize the Boing hero robot + environment PNG for use across
the webapp. Produces resized, sharpened variants and an optional manifest.

Usage (from repo root):
  pip install -r scripts/requirements.txt
  python scripts/enhance_hero.py
"""
from pathlib import Path
import json
import sys

try:
    from PIL import Image, ImageEnhance, ImageFilter
except ImportError:
    print("Install deps: pip install -r scripts/requirements.txt", file=sys.stderr)
    sys.exit(1)

REPO_ROOT = Path(__file__).resolve().parent.parent
IMAGES_DIR = REPO_ROOT / "frontend" / "public" / "images"
SOURCE = IMAGES_DIR / "boing_robot_hero.png"
OUTPUT_DIR = IMAGES_DIR

# Sizes for presence across the app: hero section, background layer, thumb (footer/mascot)
MAX_HERO_WIDTH = 1200   # main hero / background use
MAX_THUMB_WIDTH = 380   # mascot, footer, small placements
QUALITY = 88
SHARPEN_RADIUS = 0.4
SHARPEN_PERCENT = 60


def main():
    if not SOURCE.exists():
        print(f"Source not found: {SOURCE}", file=sys.stderr)
        sys.exit(1)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    img = Image.open(SOURCE).convert("RGBA")
    w, h = img.size

    manifest = []

    # Full hero optimized (for hero section + background layer)
    if w > MAX_HERO_WIDTH:
        ratio = MAX_HERO_WIDTH / w
        new_w = MAX_HERO_WIDTH
        new_h = int(h * ratio)
        hero = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    else:
        hero = img.copy()
        new_w, new_h = w, h
    hero = hero.filter(ImageFilter.UnsharpMask(radius=SHARPEN_RADIUS, percent=SHARPEN_PERCENT, threshold=2))
    hero_path = OUTPUT_DIR / "hero_optimized.png"
    hero.save(hero_path, "PNG", optimize=True)
    manifest.append({"id": "hero", "file": hero_path.name, "width": new_w, "height": new_h, "use": "hero, background"})
    print(f"  {hero_path.name} ({new_w}x{new_h})")

    # Thumb for mascot, footer, small placements
    if w > MAX_THUMB_WIDTH:
        ratio = MAX_THUMB_WIDTH / w
        tw = MAX_THUMB_WIDTH
        th = int(h * ratio)
        thumb = img.resize((tw, th), Image.Resampling.LANCZOS)
    else:
        thumb = img.copy()
        tw, th = w, h
    thumb = thumb.filter(ImageFilter.UnsharpMask(radius=0.3, percent=40, threshold=2))
    thumb_path = OUTPUT_DIR / "hero_thumb.png"
    thumb.save(thumb_path, "PNG", optimize=True)
    manifest.append({"id": "thumb", "file": thumb_path.name, "width": tw, "height": th, "use": "mascot, footer"})
    print(f"  {thumb_path.name} ({tw}x{th})")

    manifest_path = OUTPUT_DIR / "hero_manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2))
    print(f"Saved manifest: {manifest_path}")


if __name__ == "__main__":
    main()
