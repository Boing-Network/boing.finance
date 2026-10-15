import React from 'react';

/** Shared "Boing apps" links (same set on boing.network, boing.express, boing.finance, boing.observer). */
export const BOING_APPS = [
  { name: 'Boing Network', desc: 'Home, docs, faucet', href: 'https://boing.network' },
  { name: 'Boing Express', desc: 'Wallet', href: 'https://boing.express' },
  { name: 'Boing Observer', desc: 'Block explorer', href: 'https://boing.observer' },
  { name: 'boing.finance', desc: 'Swap, pools, deploy tokens', href: 'https://boing.finance' },
];

export default function BoingAppsLinks() {
  return (
    <div className="px-3 py-2 border-b mb-2" style={{ borderColor: 'var(--border-color)' }}>
      <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Boing apps</span>
      <ul className="mt-1">
        {BOING_APPS.map((a) => (
          <li key={a.href}>
            <a href={a.href} rel="noopener" className="flex items-baseline gap-2 py-1 text-sm hover:text-cyan-400" style={{ color: 'var(--text-secondary)' }}>
              <span>{a.name}</span>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{a.desc}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}