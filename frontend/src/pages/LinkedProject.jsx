import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import LinkedNftTokenPanel from '../components/LinkedNftTokenPanel';
import { getLinkedNftTokenRegistryStatus } from '../services/linkedNftTokenRegistry';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';

export default function LinkedProject() {
  const [searchParams] = useSearchParams();
  const collectionQ = searchParams.get('collection') || '';
  const tokenQ = searchParams.get('token') || '';
  const dexIntegration = useBoingNativeDexIntegration();
  const defaults = dexIntegration?.defaults || null;
  const endUser = defaults?.endUser || defaults?.end_user || null;
  const networkInfo = defaults?.networkInfo || null;
  const status = useMemo(
    () => getLinkedNftTokenRegistryStatus({ endUser, networkInfo }),
    [endUser, networkInfo]
  );

  return (
    <>
      <Helmet>
        <title>Manage links | boing.finance</title>
        <meta
          name="description"
          content="Link or unlink NFT collections and tokens as companions. Prefer Project pack to create both in one flow."
        />
      </Helmet>
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <p
              className="text-xs font-semibold tracking-wide uppercase mb-2"
              style={{ color: 'var(--finance-primary)' }}
            >
              Launch
            </p>
            <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Manage links
            </h1>
            <p className="text-theme-tertiary max-w-xl mx-auto">
              Link an existing collection and token as companions, or unlink a pair. Starting fresh? Use{' '}
              <Link to="/project-pack" className="underline" style={{ color: 'var(--finance-primary)' }}>
                Project pack
              </Link>
              .
            </p>
          </div>

          <div
            className="rounded-2xl border p-4 sm:p-5 mb-6 space-y-3"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex flex-wrap gap-4 justify-between items-center">
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Companions:{' '}
                <strong style={{ color: 'var(--text-primary)' }}>
                  {status.code === 'ready' ? 'Ready to link' : 'Not available yet'}
                </strong>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/project-pack"
                  className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: 'var(--finance-primary)', color: '#041018' }}
                >
                  Project pack
                </Link>
                <Link
                  to="/create-nft"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: 'var(--finance-green-mid)' }}
                >
                  Create NFT
                </Link>
                <Link
                  to="/deploy-token"
                  className="px-4 py-2 rounded-lg text-sm font-medium border"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  Deploy token
                </Link>
              </div>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {status.code === 'ready'
                ? 'You can claim each side, register companions, or unlink. Links are many-to-many and can change later.'
                : 'Companion linking is not available on this network yet.'}
            </p>
          </div>

          <LinkedNftTokenPanel
            seedCollectionId={collectionQ}
            seedTokenId={tokenQ}
            showHubLink={false}
            title="Link or unlink companions"
          />
        </div>
      </div>
    </>
  );
}
