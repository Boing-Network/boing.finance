import React from 'react';
import { Link } from 'react-router-dom';
import { RESEARCH_PAGE_BRIEFS } from '../../utils/researchIntelligence';

const RELATED_LINKS = [
  { href: '/analytics', label: 'Analytics' },
  { href: '/activity', label: 'Activity' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/watchlist', label: 'Watchlist' },
];

export default function ResearchBriefBanner({ page = 'analytics', compact = false }) {
  const brief = RESEARCH_PAGE_BRIEFS[page] || RESEARCH_PAGE_BRIEFS.analytics;

  if (compact) {
    return (
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        {brief.description}
      </p>
    );
  }

  return (
    <div
      className="rounded-2xl p-4 sm:p-5 mb-6"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
      }}
    >
      <h2 className="text-lg sm:text-xl font-bold text-white mb-1">{brief.title}</h2>
      <p className="text-sm max-w-3xl mb-3" style={{ color: 'var(--text-secondary)' }}>
        {brief.description}
      </p>
      <details className="text-sm">
        <summary className="cursor-pointer text-gray-400 hover:text-gray-300">
          Related pages
        </summary>
        <div className="flex flex-wrap gap-3 mt-2">
          {RELATED_LINKS.filter((l) => !l.href.startsWith(`/${page}`) && !(page === 'analytics' && l.href === '/analytics')).map(
            ({ href, label }) => (
              <Link key={href} to={href} className="text-cyan-400 hover:text-cyan-300 font-medium">
                {label}
              </Link>
            )
          )}
        </div>
      </details>
    </div>
  );
}
