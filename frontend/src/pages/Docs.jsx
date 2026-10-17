import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { DOC_SECTIONS, LEGACY_SECTION_IDS } from '../components/docs/docsContent';

/** Old `?section=` ids (before the one-page docs) map onto the current sections. */
function resolveSectionId(raw) {
  if (!raw) return null;
  if (DOC_SECTIONS.some((s) => s.id === raw)) return raw;
  return LEGACY_SECTION_IDS[raw] || null;
}

const GAP = 16; // px between the sticky header and the table of contents

/** Height of the sticky site header (nav + ticker), kept current as it resizes. */
function useHeaderHeight() {
  const [h, setH] = useState(100);
  useEffect(() => {
    const el = document.querySelector('header.site-header');
    if (!el) return undefined;
    const update = () => setH(Math.round(el.getBoundingClientRect().height));
    update();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return h;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function TocList({ activeId, onPick, idPrefix }) {
  return (
    <ul className="space-y-0.5">
      {DOC_SECTIONS.map((s) => {
        const active = s.id === activeId;
        return (
          <li key={s.id}>
            <a
              href={`?section=${s.id}`}
              data-testid={`${idPrefix}-${s.id}`}
              data-toc-id={s.id}
              aria-current={active ? 'location' : undefined}
              onClick={(e) => {
                e.preventDefault();
                onPick(s.id);
              }}
              className={`block rounded-lg px-3 py-1.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                active ? 'font-semibold' : 'hover:bg-white/5'
              }`}
              style={{
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: active ? 'linear-gradient(135deg, rgba(0,229,255,0.18), rgba(37,99,235,0.28))' : undefined,
                boxShadow: active ? 'inset 3px 0 0 var(--finance-primary, #00e5ff)' : undefined,
              }}
            >
              {s.title}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

const Docs = () => {
  const [searchParams] = useSearchParams();
  const headerH = useHeaderHeight();
  const offset = headerH + GAP;
  const [activeId, setActiveId] = useState(() => resolveSectionId(searchParams.get('section')) || DOC_SECTIONS[0].id);
  const [mobileOpen, setMobileOpen] = useState(false);
  const tocScrollRef = useRef(null);
  const lockUntil = useRef(0); // ignore scrollspy while a click-scroll is animating

  const scrollToSection = useCallback(
    (id, { smooth = true } = {}) => {
      const el = document.getElementById(`doc-${id}`);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      lockUntil.current = Date.now() + (smooth ? 900 : 0);
      window.scrollTo({ top: Math.max(0, top), behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto' });
      setActiveId(id);
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('section', id);
        window.history.replaceState(window.history.state, '', url);
      } catch {
        /* ignore */
      }
    },
    [offset]
  );

  // Deep link (?section=…) on first load and when the query changes from a link elsewhere in the app.
  const sectionParam = searchParams.get('section');
  useEffect(() => {
    const id = resolveSectionId(sectionParam);
    if (!id) return undefined;
    const t = setTimeout(() => scrollToSection(id, { smooth: false }), 50);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionParam]);

  // Scrollspy: the active section is the last one whose top has passed the header line.
  useEffect(() => {
    let raf = 0;
    const compute = () => {
      raf = 0;
      if (Date.now() < lockUntil.current) return;
      const line = offset + 24;
      let current = DOC_SECTIONS[0].id;
      for (const s of DOC_SECTIONS) {
        const el = document.getElementById(`doc-${s.id}`);
        if (el && el.getBoundingClientRect().top <= line) current = s.id;
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) current = DOC_SECTIONS[DOC_SECTIONS.length - 1].id;
      setActiveId((prev) => (prev === current ? prev : current));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    compute();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [offset]);

  // Keep the active entry visible inside the TOC's own scroll area.
  useEffect(() => {
    const box = tocScrollRef.current;
    const item = box?.querySelector(`[data-toc-id="${activeId}"]`);
    if (!box || !item) return;
    const b = box.getBoundingClientRect();
    const r = item.getBoundingClientRect();
    if (r.top < b.top + 8) box.scrollTop -= b.top + 8 - r.top;
    else if (r.bottom > b.bottom - 8) box.scrollTop += r.bottom - (b.bottom - 8);
  }, [activeId]);

  return (
    <>
      <Helmet>
        <title>Documentation | boing.finance — Guides for Swap, Liquidity, Bridge & Deploy</title>
        <meta
          name="description"
          content="How to use boing.finance: swap, pools and liquidity, bridge, token and NFT deployment on EVM, Solana and Boing L1, Boing Express, .boing names, and more."
        />
        <meta name="keywords" content="boing.finance documentation, DeFi guides, DEX tutorial, liquidity, bridge, deploy token, Boing Express" />
        <meta property="og:title" content="Documentation | boing.finance" />
        <meta property="og:description" content="Plain-language guides for every boing.finance feature." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/docs" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Documentation - boing.finance" />
        <meta name="twitter:description" content="Plain-language guides for every boing.finance feature." />
      </Helmet>
      <div className="relative w-full min-w-0">
        <div className="relative z-10 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 mt-8 sm:mt-12">
            <h1 className="text-3xl sm:text-4xl font-normal mb-3 sm:mb-4" style={{ color: 'var(--text-primary)' }}>
              boing.finance Documentation
            </h1>
            <p className="text-lg sm:text-xl max-w-3xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              How to swap, bridge, add liquidity, and launch tokens or NFTs
            </p>
          </div>

          {/* Narrow screens: a collapsible, non-sticky contents list above the docs. */}
          <div className="lg:hidden mb-6 rounded-xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left font-semibold"
              style={{ color: 'var(--text-primary)' }}
              aria-expanded={mobileOpen}
              aria-controls="docs-toc-mobile"
              data-testid="docs-toc-mobile-toggle"
              onClick={() => setMobileOpen((o) => !o)}
            >
              <span>
                Table of Contents
                <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-tertiary)' }}>
                  {DOC_SECTIONS.find((s) => s.id === activeId)?.title}
                </span>
              </span>
              <span aria-hidden="true">{mobileOpen ? '▴' : '▾'}</span>
            </button>
            {mobileOpen && (
              <div id="docs-toc-mobile" className="px-2 pb-3">
                <TocList
                  activeId={activeId}
                  idPrefix="docs-toc-mobile"
                  onPick={(id) => {
                    setMobileOpen(false);
                    scrollToSection(id);
                  }}
                />
              </div>
            )}
          </div>

          <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(0,1fr)] lg:items-start gap-8 pb-8 sm:pb-12">
            {/* Wide screens: sticky contents (sits below the sticky header, scrolls internally when long). */}
            <aside
              className="hidden lg:flex lg:flex-col lg:sticky rounded-xl border p-4"
              style={{
                top: offset,
                maxHeight: `calc(100vh - ${offset + GAP}px)`,
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
              }}
              data-testid="docs-toc"
              aria-label="Table of Contents"
            >
              <h3 className="mb-3 px-3 text-lg font-semibold flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
                Table of Contents
              </h3>
              <div ref={tocScrollRef} role="navigation" aria-label="Documentation sections" className="min-h-0 flex-1 overflow-y-auto pr-1">
                <TocList activeId={activeId} idPrefix="docs-toc" onPick={(id) => scrollToSection(id)} />
              </div>
            </aside>

            <div className="min-w-0 rounded-xl border p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              {DOC_SECTIONS.map(({ id, title, Body }, i) => (
                <section
                  key={id}
                  id={`doc-${id}`}
                  data-testid={`docs-section-${id}`}
                  aria-labelledby={`doc-${id}-title`}
                  className={i > 0 ? 'mt-12 border-t pt-10' : ''}
                  style={{ borderColor: 'var(--border-color)', scrollMarginTop: offset }}
                >
                  <h2 id={`doc-${id}-title`} className="mb-4 text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {title}
                  </h2>
                  <Body />
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Docs;
