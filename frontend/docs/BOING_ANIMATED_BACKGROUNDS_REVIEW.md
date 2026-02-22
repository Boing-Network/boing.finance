# Boing Animated Backgrounds — Folder Review & Migration

**Source folder:** `c:\Users\chiku\Desktop\boing assets\boing-animated-backgrounds\boing-backgrounds`  
**Goal:** Migrate away from the single static `boing-aquatic-space-bg.webp` used across all Boing sites and use **per-site, per-page** animated Canvas + CSS backgrounds instead.

---

## 1. Folder Contents Summary

| Item | Purpose |
|------|--------|
| **ELEMENT_LIBRARY.md** | Design doc: layers (stars, nebula, shooting stars, waterline, bubbles, jellyfish, coral, fish, data particles, grid), opacity budget, per-site/per-page variant specs. |
| **boing-bg-engine.js** | Single Canvas + config-driven engine: `BoingBackground(canvas, config)`. Renders all layers; config controls colors, counts, and which layers are on. |
| **BOING_BG_CONFIGS** (inside engine) | Predefined configs for **express**, **finance**, **network** and multiple **page types** per site (e.g. finance: landing, trade, analytics, governance, portfolio). |
| **index.html** | Master showcase: blended config demo + links to express/finance/network demos. |
| **express/index.html** | boing.express “Aqua Personal” demo with page switcher (Landing, Wallet, Security, Faucet, Docs). |
| **finance/index.html** | boing.finance “Deep Trade” demo with page switcher (Landing, Trade, Analytics, Governance, Portfolio). |
| **network/index.html** | boing.network “Cosmic Foundation” demo with page switcher (Landing, Pillars, Tokenomics, Roadmap, Developers). |

---

## 2. Why Move Away from the Static .webp

From **ELEMENT_LIBRARY.md**:

- Full-colour illustration at high brightness **competes with text**.
- No dark overlay — content sits directly on a busy image.
- **Static** — no depth or life after load.

The new system:

- Keeps elements at **~5–20% opacity** (dark-first, readability).
- Uses **layered** Canvas + CSS (stars, nebula, waterline, bubbles, jellyfish, coral, fish, optional data particles + grid).
- Is **parameterised**: each site and page type gets its own config (accent colours, layer on/off, density).

---

## 3. How the Engine Works

- **One class:** `BoingBackground(canvasElement, config)`.
- **Config** keys: `baseBg`, `accentColor`, `starCount`, `nebulaClouds`, `shootingStar*`, `waterline*`, `bubbles*`, `jellyfish*`, `coral*`, `fish*`, `particlesEnabled`, `gridEnabled`, etc.
- **Usage:** `const bg = new BoingBackground(document.getElementById('bgCanvas'), BOING_BG_CONFIGS.finance.landing); bg.start();`
- On route/page change, call `bg.stop()` then create a new instance with the config for that page and call `bg.start()`.

---

## 4. Per-Site Variants (from ELEMENT_LIBRARY + engine configs)

| Site | Variant | Accent | Notable layers |
|------|--------|--------|----------------|
| **boing.express** | Aqua Personal | #00e8c8 teal-cyan | Full ocean: jellyfish, coral, fish, bubbles, waterline; warm nebula. |
| **boing.finance** | Deep Trade | #00e5ff + #00ff88 | Data particles + grid (finance-only); 2 jellyfish; sparse coral; no fish; higher shooting-star frequency. |
| **boing.network** | Cosmic Foundation | #7c3aed + #06b6d4 | Denser stars, richest nebula, 4 jellyfish; violet/magenta/cyan; more “space” than ocean. |

---

## 5. Per-Page Variants (finance example)

Inside `BOING_BG_CONFIGS.finance`:

- **landing** — Full scene: stars, nebula, shooting stars, waterline, bubbles, jellyfish, coral, **data particles**, **grid**.
- **trade** — Minimal: stars, light nebula, **data particles**, **grid** only (no waterline, jellyfish, coral, fish).
- **analytics** — Same idea: particles + grid + stars + nebula.
- **governance** — Violet accent, violet nebula + jellyfish + particles + grid.
- **portfolio** — Green accent, green nebula/particles/grid.

So you can switch config by route (e.g. `/` → landing, `/swap` → trade, `/analytics` → analytics, `/governance/*` → governance, `/portfolio` → portfolio).

---

## 6. Current boing.finance Usage of the Static Background

- **globals.css**  
  - `.page-landing` sets `background-image: url('../assets/boing-aquatic-space-bg.webp')` and a dark overlay `::before`.
- **App.js**  
  - Landing page gets classes `page-landing deep-trade-bg`; app pages get `page-app` (hex grid from `hex-grid.svg`).
- **EnhancedAnimatedBackground**  
  - Used on some pages (e.g. DeployToken, Blog, DeveloperTools); separate from the landing background.

To migrate:

1. **Landing:** Replace the `.page-landing` background image with a full-screen canvas driven by `BoingBackground` and `BOING_BG_CONFIGS.finance.landing`.
2. **App pages (Swap, Pools, etc.):** Use a canvas with the appropriate config (e.g. `BOING_BG_CONFIGS.finance.trade` for swap/trade, or a shared “app” config with particles + grid).
3. Optionally unify or replace **EnhancedAnimatedBackground** with the same engine and a suitable config so one system drives both landing and in-app backgrounds.

---

## 7. Recommended Migration Steps for boing.finance

1. **Copy engine and configs into the repo**  
   - Add `boing-bg-engine.js` (or port to a React component that uses the same logic and `BOING_BG_CONFIGS`).
2. **Add a React wrapper**  
   - e.g. `<BoingAnimatedBackground variant="landing" />` or `<BoingAnimatedBackground page="trade" />` that:
   - Renders a full-viewport `<canvas>` (position fixed, z-index 0, pointer-events none).
   - Instantiates `BoingBackground(canvas, config)` with the right finance config.
   - Calls `start()` on mount and `stop()` on unmount (and on variant/page change).
3. **Route → config mapping**  
   - `/` → `BOING_BG_CONFIGS.finance.landing`  
   - `/swap`, `/liquidity`, `/bridge`, `/tokens`, `/deploy-token`, etc. → `BOING_BG_CONFIGS.finance.trade` (or a shared “app” config)  
   - `/analytics` → `BOING_BG_CONFIGS.finance.analytics`  
   - `/governance/*` → `BOING_BG_CONFIGS.finance.governance`  
   - `/portfolio` → `BOING_BG_CONFIGS.finance.portfolio`
4. **Remove static background for landing**  
   - In `globals.css`, remove or override `background-image` for `.page-landing` when the canvas is active (e.g. body or a wrapper gets the canvas; base dark gradient can stay in CSS or be drawn by the engine).
5. **Optional: prefer-reduced-motion**  
   - If the engine supports it, reduce or disable animations when `prefers-reduced-motion: reduce`; otherwise keep opacity/low motion as in the doc.

---

## 8. File Checklist (from the attached folder)

- [x] **ELEMENT_LIBRARY.md** — Design and layer specs.
- [x] **boing-bg-engine.js** — Engine + `BOING_BG_CONFIGS` (express, finance, network + all page types).
- [x] **index.html** — Showcase and links to demos.
- [x] **express/index.html** — Express demo and page switcher.
- [x] **finance/index.html** — Finance demo and page switcher (matches Deep Trade design).
- [x] **network/index.html** — Network demo and page switcher.

Once the engine is integrated and the canvas is used for the landing (and optionally for app pages), you can stop using `boing-aquatic-space-bg.webp` for boing.finance and, later, reuse the same approach for express and network with their own configs.
