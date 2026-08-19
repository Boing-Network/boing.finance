# Boing asset scripts (Python)

Optional tools to generate hero/background PNGs into `frontend/public/images/`. **They are not part of the live visual shell** (that is `ColosseumReferenceBackdrop` — see `frontend/docs/DESIGN.md`).

## Setup

From the repo root:

```bash
pip install -r scripts/requirements.txt
```

## 1. Enhance hero

```bash
python scripts/enhance_hero.py
```

Writes `hero_optimized.png`, `hero_thumb.png`, and a local manifest next to `boing_robot_hero.png`.

## 2. Modified background

```bash
python scripts/modify_background.py
```

Writes `frontend/public/images/boing_background_dark_modified.png`.

## 3. Extract hero elements

```bash
python scripts/extract_robot_hero_elements.py
```

Writes `frontend/public/images/hero_elements/` for experimental layouts.
