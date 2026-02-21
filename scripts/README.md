# Boing asset scripts (Python)

Scripts to generate or modify assets for the outerspace-oceanic theme.

## Setup

From the repo root:

```bash
pip install -r scripts/requirements.txt
```

## 1. Modified background

Produces a variant of the dark background with different colors and shapes.  
Output: `frontend/public/images/boing_background_dark_modified.png` (used by the app when present).

```bash
python scripts/modify_background.py
```

## 2. Extract hero elements

Splits `boing_robot_hero.png` into separate transparent PNGs (robot, jellyfish, fish, etc.) for 3D motion in the frontend.  
Output: `frontend/public/images/hero_elements/element_0.png`, `element_1.png`, … and `manifest.json`.

```bash
python scripts/extract_robot_hero_elements.py
```

Uses `rembg` for foreground separation (if installed), then k-means clustering to segment elements. If `rembg` is not installed, falls back to color-only clustering on the full image.
