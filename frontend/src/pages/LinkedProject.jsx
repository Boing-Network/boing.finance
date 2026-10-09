import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import LinkedNftTokenPanel from '../components/LinkedNftTokenPanel';
import { LINKED_NFT_TOKEN_SCHEMA } from '../utils/linkedNftToken';
import { getLinkedNftTokenRegistryStatus } from '../services/linkedNftTokenRegistry';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';

/**
 * Unified hub: create/link NFT collections + fungible tokens via the on-chain registry.
 */
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
        <title>Linked project | boing.finance</title>
        <meta
          name="description"
          content="Register NFT collections and fungible tokens as mutable many-to-many pairs on the Boing on-chain registry."
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
              Linked project
            </h1>
            <p className="text-theme-tertiary max-w-xl mx-auto">
              Connect NFT collections and project tokens without forcing a 1:1. Links are mutable,
              many-to-many, and <strong style={{ color: 'var(--text-primary)' }}>enforced on-chain</strong> via
              the linked NFT↔token registry.
            </p>
          </div>

          <div
            className="rounded-2xl border p-4 sm:p-5 mb-6 space-y-3"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex flex-wrap gap-4 justify-between items-center">
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Status:{' '}
                <strong style={{ color: 'var(--text-primary)' }}>
                  {status.code === 'ready' ? 'Registry ready' : status.code.replace(/_/g, ' ')}
                </strong>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/create-nft"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: 'var(--finance-green-mid)' }}
                >
                  Create NFT
                </Link>
                <Link
                  to="/deploy-token"
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: 'var(--finance-primary)', color: '#041018' }}
                >
                  Deploy token
                </Link>
              </div>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {status.message} Schema companion: <code className="text-[10px]">{LINKED_NFT_TOKEN_SCHEMA}</code>.
              Waiting on boing.network PR #42 follow-up for registry calldata helpers when not yet in the SDK.
            </p>
          </div>

          <LinkedNftTokenPanel
            seedCollectionId={collectionQ}
            seedTokenId={tokenQ}
            showHubLink={false}
            title="Register or unlink on-chain"
          />

          <section
            className="rounded-2xl border p-5 sm:p-6 mt-6"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              How linking works now
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <li>Deploy (or paste) a collection and a fungible token AccountId.</li>
              <li>
                When the registry AccountId is published and boing-sdk exposes register/unlink helpers, submit
                the registry transaction from this page (or from Create NFT / Deploy Token after deploy).
              </li>
              <li>
                Soft-gate may warn if deployers differ — acknowledge to proceed; the registry contract still
                enforces who may write.
              </li>
              <li>Unlink is supported (mutable). Many peers per side are allowed (many-to-many).</li>
            </ol>
            <p className="text-xs mt-4" style={{ color: 'var(--text-tertiary)' }}>
              Display-only browser drafts are paused. Env override while ops bootstraps:{' '}
              <code className="text-[10px]">REACT_APP_BOING_LINKED_NFT_TOKEN_REGISTRY</code>.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
