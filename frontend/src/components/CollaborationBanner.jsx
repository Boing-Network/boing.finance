import React from 'react';

const EMAIL = 'nico.builds@boing.network';

/** Site-wide invitation for anyone who wants to collaborate on Boing Network. */
export default function CollaborationBanner() {
  return (
    <aside
      className="collaboration-banner w-full flex-shrink-0 px-3 py-2 text-center text-xs sm:text-sm sm:px-4"
      role="note"
      aria-label="Collaboration"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--finance-primary, #00e5ff) 10%, transparent)',
        borderBottom: '1px solid color-mix(in srgb, var(--finance-primary, #00e5ff) 24%, var(--border-color))',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-sans, Comfortaa, system-ui, sans-serif)',
      }}
    >
      <p className="m-0 leading-snug">
        Want to collaborate on the Boing Network? Email Nico at{' '}
        <a
          href={`mailto:${EMAIL}`}
          className="font-semibold underline underline-offset-2"
          style={{ color: 'var(--finance-primary, #00e5ff)' }}
        >
          {EMAIL}
        </a>
        .
      </p>
    </aside>
  );
}
