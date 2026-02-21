#!/usr/bin/env python3
"""
Extract 3D objects/elements from boing_robot_hero.png into separate PNGs with
transparency, for use in the frontend with 3D motion animations.

Output: frontend/public/images/hero_elements/element_0.png, element_1.png, ...
        frontend/public/images/hero_elements/manifest.json

Usage (from repo root):
  pip install -r scripts/requirements.txt
  python scripts/extract_robot_hero_elements.py
"""
from pathlib import Path
import json
import sys

try:
    from PIL import Image
    import numpy as np
except ImportError:
    print("Install deps: pip install -r scripts/requirements.txt", file=sys.stderr)
    sys.exit(1)

REPO_ROOT = Path(__file__).resolve().parent.parent
IMAGES_DIR = REPO_ROOT / "frontend" / "public" / "images"
SOURCE = IMAGES_DIR / "boing_robot_hero.png"
OUTPUT_DIR = IMAGES_DIR / "hero_elements"
NUM_CLUSTERS = 8  # number of distinct elements to try to extract
MIN_PIXELS = 500   # ignore clusters smaller than this (noise)


def extract_with_rembg():
    """Return (RGBA PIL Image of foreground, mask as 2D bool array) or (None, None)."""
    try:
        from rembg import remove
    except ImportError:
        return None, None
    img = Image.open(SOURCE).convert("RGBA")
    fg = remove(img)
    arr = np.array(fg)
    mask = arr[:, :, 3] > 32
    return fg, mask


def cluster_foreground(rgba: Image.Image, mask: np.ndarray):
    """Segment foreground into NUM_CLUSTERS by color + position (k-means)."""
    arr = np.array(rgba)
    h, w = arr.shape[:2]
    ys, xs = np.where(mask)
    if len(xs) < MIN_PIXELS * NUM_CLUSTERS:
        return []
    r = arr[ys, xs, 0].astype(np.float32)
    g = arr[ys, xs, 1].astype(np.float32)
    b = arr[ys, xs, 2].astype(np.float32)
    # Normalize position to 0..1 so color dominates but position helps separate
    xn = xs / max(w - 1, 1)
    yn = ys / max(h - 1, 1)
    # Weight color more than position
    features = np.stack([
        r / 255.0, g / 255.0, b / 255.0,
        0.3 * xn, 0.3 * yn,
    ], axis=1)
    from numpy.random import default_rng
    rng = default_rng(42)
    centers = features[rng.choice(len(features), size=NUM_CLUSTERS, replace=False)]
    for _ in range(25):
        dist = np.linalg.norm(features[:, None, :] - centers[None, :, :], axis=2)
        labels = np.argmin(dist, axis=1)
        for k in range(NUM_CLUSTERS):
            sel = labels == k
            if sel.sum() > 0:
                centers[k] = features[sel].mean(axis=0)
    labels = np.argmin(
        np.linalg.norm(features[:, None, :] - centers[None, :, :], axis=2), axis=1
    )
    # Build per-cluster mask in full image
    out_masks = []
    for k in range(NUM_CLUSTERS):
        cluster_mask = np.zeros((h, w), dtype=bool)
        cluster_mask[ys[labels == k], xs[labels == k]] = True
        if cluster_mask.sum() >= MIN_PIXELS:
            out_masks.append(cluster_mask)
    return out_masks


def extract_without_rembg():
    """Fallback: segment by color only (no background removal)."""
    img = Image.open(SOURCE).convert("RGBA")
    arr = np.array(img)
    h, w = arr.shape[:2]
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    # Opaque-ish pixels only
    mask = (a > 128) & ((r + g + b) > 30)
    ys, xs = np.where(mask)
    if len(xs) < MIN_PIXELS:
        return [], img
    features = np.stack([
        r[mask] / 255.0, g[mask] / 255.0, b[mask] / 255.0,
        0.2 * xs / max(w - 1, 1), 0.2 * ys / max(h - 1, 1),
    ], axis=1).astype(np.float32)
    from numpy.random import default_rng
    rng = default_rng(42)
    centers = features[rng.choice(len(features), size=NUM_CLUSTERS, replace=False)]
    for _ in range(20):
        dist = np.linalg.norm(features[:, None, :] - centers[None, :, :], axis=2)
        labels = np.argmin(dist, axis=1)
        for k in range(NUM_CLUSTERS):
            sel = labels == k
            if sel.sum() > 0:
                centers[k] = features[sel].mean(axis=0)
    labels = np.argmin(
        np.linalg.norm(features[:, None, :] - centers[None, :, :], axis=2), axis=1
    )
    out_masks = []
    for k in range(NUM_CLUSTERS):
        cluster_mask = np.zeros((h, w), dtype=bool)
        cluster_mask[ys[labels == k], xs[labels == k]] = True
        if cluster_mask.sum() >= MIN_PIXELS:
            out_masks.append(cluster_mask)
    return out_masks, img


def mask_to_bbox(mask: np.ndarray, padding: int = 4):
    ys, xs = np.where(mask)
    if len(xs) == 0:
        return 0, 0, 0, 0
    xmin, xmax = xs.min() - padding, xs.max() + 1 + padding
    ymin, ymax = ys.min() - padding, ys.max() + 1 + padding
    return max(0, xmin), max(0, ymin), min(mask.shape[1], xmax), min(mask.shape[0], ymax)


def main():
    if not SOURCE.exists():
        print(f"Source not found: {SOURCE}", file=sys.stderr)
        sys.exit(1)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    fg, fg_mask = extract_with_rembg()
    if fg is not None and fg_mask is not None:
        masks = cluster_foreground(fg, fg_mask)
        img = fg
        print("Using rembg foreground + k-means clustering.")
    else:
        print("rembg not available; using color-only clustering on full image.")
        masks, img = extract_without_rembg()

    if not masks:
        print("No segments found. Try adjusting NUM_CLUSTERS or MIN_PIXELS.", file=sys.stderr)
        sys.exit(1)

    arr = np.array(img)
    manifest = []
    for i, mask in enumerate(masks):
        x1, y1, x2, y2 = mask_to_bbox(mask)
        crop_mask = mask[y1:y2, x1:x2]
        crop_rgba = arr[y1:y2, x1:x2].copy()
        crop_rgba[~crop_mask] = [0, 0, 0, 0]
        out_path = OUTPUT_DIR / f"element_{i}.png"
        Image.fromarray(crop_rgba).save(out_path, "PNG", optimize=True)
        manifest.append({
            "file": out_path.name,
            "width": int(x2 - x1),
            "height": int(y2 - y1),
        })
        print(f"  {out_path.name} ({x2 - x1}x{y2 - y1})")

    (OUTPUT_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print(f"Saved {len(manifest)} elements and manifest to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
