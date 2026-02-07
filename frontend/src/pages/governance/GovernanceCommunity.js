import React from 'react';
import { Helmet } from 'react-helmet-async';
import { PageHeader, PageCard } from '../../components/PageLayout';

const SOCIAL_LINKS = [
  { name: 'Discord', icon: '💬', url: 'https://discord.gg/7RDtQtQvBW', description: 'Join our community chat, get support, and discuss governance.' },
  { name: 'Twitter', icon: '🐦', url: 'https://twitter.com/boing_finance', description: 'Follow for updates, announcements, and governance discussions.' },
  { name: 'Telegram', icon: '✈️', url: 'https://t.me/boing_finance', description: 'Real-time chat and community coordination.' },
  { name: 'Forum', icon: '📋', url: 'https://forum.boing.finance', description: 'Governance discussions and proposal drafts. (Coming soon)' },
];

export default function GovernanceCommunity() {
  return (
    <>
      <Helmet>
        <title>Governance Community | boing.finance</title>
        <meta name="description" content="Join the boing.finance community. Discord, Twitter, Telegram, and governance forum." />
      </Helmet>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <PageHeader title="Governance Community" subtitle="Connect with the community, discuss proposals, and participate in governance." />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {SOCIAL_LINKS.map((link) => (
            <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className="block">
              <PageCard className="hover:border-cyan-400/40 transition-colors h-full">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{link.icon}</div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{link.name}</h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{link.description}</p>
                  </div>
                </div>
              </PageCard>
            </a>
          ))}
        </div>

        <PageCard>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Community Guidelines</h3>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li>• Be respectful and constructive in all discussions.</li>
            <li>• Proposals should be thoroughly discussed before submission.</li>
            <li>• Vote based on the long-term health of the protocol.</li>
            <li>• Report spam or malicious behavior to moderators.</li>
          </ul>
        </PageCard>
      </div>
    </>
  );
}
