#!/usr/bin/env python3
"""
Modify boing_background_dark.png with different colors and shapes.
Output: boing_background_dark_modified.png (used by frontend when present).

Usage (from repo root):
  python scripts/modify_background.py
  # or
  pip install -r scripts/requirements.txt && python scripts/modify_background.py
"""
from pathlib import Path
import sys

try:
    from PIL import Image, ImageEnhance, ImageFilter
    import numpy as np
except ImportError:
    print("Install deps: pip install -r scripts/requirements.txt", file=sys.stderr)
    sys.exit(1)

# Paths relative to repo root
REPO_ROOT = Path(__file__).resolve().parent.parent
IMAGES_DIR = REPO_ROOT / "frontend" / "public" / "images"
SOURCE = IMAGES_DIR / "boing_background_dark.png"
OUTPUT = IMAGES_DIR / "boing_background_dark_modified.png"


def main():
    if not SOURCE.exists():
        print(f"Source not found: {SOURCE}", file=sys.stderr)
        sys.exit(1)
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    img = Image.open(SOURCE).convert("RGBA")
    w, h = img.size
    arr = np.array(img, dtype=np.float32)
    r, g, b, a = arr[..., 0], arr[..., 1], arr[..., 2], arr[..., 3]

    # Global color shift (modified palette feel): cooler shadows, brighter teal/blue nodes
    r_out = np.clip(r * 1.02 + 2, 0, 255)
    g_out = np.clip(g * 0.98 + 1, 0, 255)
    b_out = np.clip(b * 1.05 + 3, 0, 255)
    # Slight hue shift toward violet in midtones (where hex nodes glow)
    mask = (r + g + b) > 80
    r_out[mask] = np.clip(r_out[mask] * 0.98 + 5, 0, 255)
    b_out[mask] = np.clip(b_out[mask] * 1.03, 0, 255)
    out = np.stack([r_out, g_out, b_out, a], axis=-1).astype(np.uint8)
    img_out = Image.fromarray(out)

    # Optional: subtle shape overlay — very faint extra "circuit" glow (different shape feel)
    # Draw a few soft radial gradients as additional nodes (different from original hex grid)
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    from PIL import ImageDraw
    draw = ImageDraw.Draw(overlay)
    # Soft circles at different positions (simulate alternate "node" shapes)
    for cx, cy, radius in [(w // 4, h // 3, 120), (3 * w // 4, 2 * h // 3, 100), (w // 2, h // 2, 80)]:
        for r in range(radius, 0, -4):
            alpha = 3 if r < 30 else 1
            draw.ellipse(
                [cx - r, cy - r, cx + r, cy + r],
                fill=(0, 229, 210, alpha),
                outline=None,
            )
    img_out = Image.alpha_composite(img_out, overlay)

    # Slight contrast/sharpness so "shapes" read a bit differently
    enhancer = ImageEnhance.Contrast(img_out)
    img_out = enhancer.enhance(1.08)
    img_out = img_out.filter(ImageFilter.UnsharpMask(radius=0.5, percent=50, threshold=3))

    img_out.save(OUTPUT, "PNG", optimize=True)
    print(f"Saved modified background: {OUTPUT}")


if __name__ == "__main__":
    main()
