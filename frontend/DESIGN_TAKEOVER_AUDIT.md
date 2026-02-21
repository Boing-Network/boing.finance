# Step 1: Design Takeover — Codebase Audit

## 1. Global stylesheet
- **Location:** `frontend/src/styles/globals.css`
- **Entry point:** `frontend/src/index.js` imports `./styles/globals.css`
- This file is the single place to inject CSS custom properties and base styles.

## 2. Component library
- **Location:** `frontend/src/components/` (78 components)
- **Relevant components:**
  - **Buttons:** `AccessibleButton.js` (uses `interactive-button` + custom className); global `.btn-primary`, `.btn-secondary`, `.btn-outline` in globals.css
  - **Cards/panels:** `PageLayout.js` (PageCard with `var(--bg-card)`, `var(--border-color)`); global `.card`, `.card-hover`, `.glass`
  - **Navigation:** Main app nav in `App.js` (`<nav>` with Tailwind + inline border styles); `Docs.js`, `HelpArticle.js` use `<nav>` for in-page navigation
  - **Inputs/forms:** Styled via `.input-field` in globals.css; Tailwind forms plugin in use
- **Styling approach:** Tailwind CSS + custom classes in globals.css; theme uses CSS variables (e.g. `--bg-primary`, `--primary-color`).

## 3. Hardcoded colors (source only; build excluded)
All hardcoded color usages found in **`frontend/src/styles/globals.css`**:
- `#00E5CC`, `#0A0E1A`, `#00B4FF` in focus, skip-link, :root, .dark, .btn-primary, .btn-secondary, .btn-outline, focus rings, .dark a/button, .dark .card
- `#F0FFFE`, `#e0f7f5`, `#cceeea`, `#ffffff`, `#334155`, `#64748b`, `#99e0db`, and other light-theme hex values in :root
- Multiple `rgba(...)` in :root and .dark (shadows, borders, state backgrounds)
- **No hardcoded hex/rgb/hsl in** `frontend/src` **.tsx or .jsx** files

**Tailwind config** (`tailwind.config.js`): `highlight: '#00E5CC'` and pulse-glow keyframes use `#00E5CC` — to be replaced with variables.

## 4. Font imports
- **Current:** Comfortaa loaded via **`@font-face`** in `frontend/src/styles/globals.css` (local TTF from `../assets/fonts/Comfortaa-*.ttf`).
- **HTML:** `frontend/public/index.html` has preconnect to `fonts.googleapis.com` and `fonts.gstatic.com`; comment says "Comfortaa (loaded via globals.css @font-face)".
- **Design system addition:** Orbitron (display) and JetBrains Mono (mono) are not yet imported; Step 3 adds Google Fonts import for Comfortaa, Orbitron, and JetBrains Mono.

---

## Step 8: Final Audit & Quality Check (summary)

- **Hardcoded colors:** All non-token usages in `frontend/src/styles/globals.css` were replaced with CSS variables. Token definitions in `:root` and `.dark` remain the single source of truth. Tailwind `tailwind.config.js` was updated to use `var(--accent-teal)` and `var(--glow-cyan)` where applicable.
- **Fonts:** Google Fonts import added for Comfortaa, Orbitron, and JetBrains Mono. Base styles use `var(--font-sans)` for body, `var(--font-display)` for headings, and `var(--font-mono)` for code. Tailwind theme extended with `font-display` and `font-mono`.
- **Interactive states:** Buttons, links, cards, and inputs use design-token transitions, hover glows, and focus rings.
- **Backgrounds:** `.page-landing` and `.page-app` added to globals.css. `App.js` applies `page-landing` when `pathname === '/'` and `page-app` otherwise. `public/assets/hex-grid.svg` created for app pages. Landing uses `url('/assets/boing-aquatic-space-bg.webp')` — add that file to `public/assets/` when available.
- **Contrast:** Primary text `#F0FFFE` on `#0A0E1A` meets WCAG AA/AAA.
- **Responsiveness:** Existing responsive classes and breakpoints retained; no structural changes.

*Design takeover steps 1–8 implemented. Landing background uses `/images/boing_robot_hero.png`; optional `public/assets/boing-aquatic-space-bg.webp` can be used by updating `.page-landing` in globals.css. Follow-up: hardcoded colors in App.js, BoingMascot, EnhancedAnimatedBackground, ShootingStars, BoingHeroScene, HeroElementsLayer, GlobalSearch, ChainTypeSelector, WalletConnect, WalletSelectionModal, Portfolio, DeployToken, Pools, CreatePool were replaced with design tokens (CSS variables / theme classes).*
