# Boing asset scripts (Python)

Scripts to enhance and optimize assets for the outerspace-oceanic theme and hero presence across the webapp.

## Setup

From the repo root:

```bash
pip install -r scripts/requirements.txt
```

## 1. Enhance hero (robot + environment)

Optimizes the full Boing hero robot + environment PNG for use across the app.  
Output: `hero_optimized.png` (hero/background), `hero_thumb.png` (mascot, footer), `hero_manifest.json`.

```bash
python scripts/enhance_hero.py
```

Run this after updating `boing_robot_hero.png` so the mascot, background scene, and footer use the latest asset.

## 2. Modified background

Produces a variant of the dark background with different colors and shapes.  
Output: `frontend/public/images/boing_background_dark_modified.png` (used when present).

```bash
python scripts/modify_background.py
```

## 3. Extract hero elements (optional)

Splits `boing_robot_hero.png` into separate PNGs for 3D motion.  
Output: `frontend/public/images/hero_elements/` and `manifest.json`.  
The app uses the **full** hero (from enhance_hero.py) by default; this script is optional for alternative layouts.

```bash
python scripts/extract_robot_hero_elements.py
```
