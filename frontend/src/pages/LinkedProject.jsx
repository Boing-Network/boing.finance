import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import LinkedNftTokenPanel from '../components/LinkedNftTokenPanel';
import { LINKED_NFT_TOKEN_SCHEMA } from '../utils/linkedNftToken';
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
        <title>Linked project | boing.finance</title>
        <meta
          name="description"
          content="Claim and register NFT collection ↔ fungible token links on the Boing on-chain registry."
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
              On-chain registry: <code className="text-xs">claim_asset</code> →{' '}
              <code className="text-xs">register_link</code> / <code className="text-xs">unlink_at</code>.
              Many-to-many and mutable. Auth = claimer of both sides.
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
              {status.message} Selectors 0xE0–0xE6 · CREATE2 salt{' '}
              <code className="text-[10px]">BOING_NFT_TOKEN_LINK_REG_V1</code>. Metadata schema{' '}
              <code className="text-[10px]">{LINKED_NFT_TOKEN_SCHEMA}</code> is cache-only.
            </p>
          </div>

          <LinkedNftTokenPanel
            seedCollectionId={collectionQ}
            seedTokenId={tokenQ}
            showHubLink={false}
            title="Claim, register, or unlink"
          />

          <section
            className="rounded-2xl border p-5 sm:p-6 mt-6"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Operator notes
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <li>
                Publish registry AccountId via{' '}
                <code className="text-xs">REACT_APP_BOING_LINKED_NFT_TOKEN_REGISTRY</code> (or network{' '}
                <code className="text-xs">end_user.canonical_linked_nft_token_registry</code>).
              </li>
              <li>
                Claim assets in the same session as deploy so a third party cannot front-run{' '}
                <code className="text-xs">claim_asset</code>.
              </li>
              <li>
                Link queries need{' '}
                <code className="text-xs">REACT_APP_BOING_RPC_UNSIGNED_SIMULATE_METHOD=boing_simulateContractCall</code>{' '}
                when the node supports it.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
