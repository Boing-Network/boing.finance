import React from 'react';
import { Link } from 'react-router-dom';
import { RESEARCH_PAGE_BRIEFS } from '../../utils/researchIntelligence';

const WORKFLOW_LINKS = [
  { href: '/analytics?section=intelligence', label: 'Intelligence' },
  { href: '/activity', label: 'Wallet flow' },
  { href: '/portfolio', label: 'Exposure' },
  { href: '/watchlist', label: 'Narratives' },
];

export default function ResearchBriefBanner({ page = 'analytics', compact = false }) {
  const brief = RESEARCH_PAGE_BRIEFS[page] || RESEARCH_PAGE_BRIEFS.analytics;

  if (compact) {
    return (
      <div
        className="rounded-xl p-4 mb-6"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400 mb-1">{brief.eyebrow}</p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{brief.description}</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-5 sm:p-6 mb-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(6,182,212,0.08) 0%, rgba(139,92,246,0.08) 50%, rgba(15,23,42,0.4) 100%)',
        border: '1px solid rgba(6,182,212,0.25)',
      }}
    >
      <div className="relative z-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-2">{brief.eyebrow}</p>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{brief.title}</h2>
        <p className="text-sm sm:text-base max-w-3xl mb-4" style={{ color: 'var(--text-secondary)' }}>
          {brief.description}
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {brief.capabilities.map((cap) => (
            <span
              key={cap}
              className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
            >
              {cap}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
          <span className="text-gray-500 self-center">Research workflow:</span>
          {WORKFLOW_LINKS.map(({ href, label }) => (
            <Link key={href} to={href} className="text-cyan-400 hover:text-cyan-300 font-medium">
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
