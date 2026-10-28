import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

/** Catch-all for unknown URLs, so a typo never shows the home page under the wrong address. */
const LINKS = [
  { to: '/swap', label: 'Swap' },
  { to: '/pools', label: 'Pools' },
  { to: '/bridge', label: 'Bridge' },
  { to: '/docs', label: 'Docs' },
];

export default function NotFound() {
  return (
    <>
      <Helmet>
        <title>Page not found | boing.finance</title>
        <meta name="robots" content="noindex" />
        <meta name="description" content="This page does not exist on boing.finance." />
      </Helmet>
      <div className="relative z-10 container mx-auto px-4 py-16" data-testid="not-found">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-sm font-semibold tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>
            ERROR 404
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Page not found
          </h1>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
            We could not find that page. It may have moved, or the address may have a typo.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/" className="td-btn td-btn--primary px-6 py-3 rounded-lg font-semibold inline-flex items-center justify-center min-h-[44px]">
              Back to home
            </Link>
            {LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="px-4 py-3 rounded-lg border inline-flex items-center justify-center min-h-[44px] underline-offset-4 hover:underline"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
