import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import LinkedNftTokenPanel from '../components/LinkedNftTokenPanel';
import {
  LINKED_NFT_TOKEN_SCHEMA,
  listLinkedPairs,
  removeLinkedPair,
} from '../utils/linkedNftToken';
import toast from 'react-hot-toast';

/**
 * Unified hub: create/link NFT collections + fungible tokens as mutable many-to-many pairs.
 */
export default function LinkedProject() {
  const [searchParams] = useSearchParams();
  const collectionQ = searchParams.get('collection') || '';
  const tokenQ = searchParams.get('token') || '';
  const [pairs, setPairs] = useState(() => listLinkedPairs());

  useEffect(() => {
    setPairs(listLinkedPairs());
  }, [collectionQ, tokenQ]);

  const refresh = () => setPairs(listLinkedPairs());

  const stats = useMemo(() => {
    const collections = new Set(pairs.map((p) => p.collectionId));
    const tokens = new Set(pairs.map((p) => p.tokenId));
    return { edges: pairs.length, collections: collections.size, tokens: tokens.size };
  }, [pairs]);

  return (
    <>
      <Helmet>
        <title>Linked project | boing.finance</title>
        <meta
          name="description"
          content="Link NFT collections and fungible tokens as mutable many-to-many pairs. Display-only MVP using boing.linked_nft_token.v1."
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
              Connect NFT collections and project tokens without forcing a 1:1. Links are mutable, many-to-many,
              and display-only until a network registry ships.
            </p>
          </div>

          <div
            className="rounded-2xl border p-4 sm:p-5 mb-6 flex flex-wrap gap-4 justify-between items-center"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{stats.edges}</strong> link
              {stats.edges === 1 ? '' : 's'} ·{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{stats.collections}</strong> collection
              {stats.collections === 1 ? '' : 's'} ·{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{stats.tokens}</strong> token
              {stats.tokens === 1 ? '' : 's'}
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
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: 'var(--finance-primary)', color: '#041018' }}
              >
                Deploy token
              </Link>
            </div>
          </div>

          <LinkedNftTokenPanel
            seedCollectionId={collectionQ}
            seedTokenId={tokenQ}
            showHubLink={false}
            title="Create or update a link"
          />

          <section
            className="rounded-2xl border p-5 sm:p-6 mt-6"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              All saved links
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Stored in this browser for display. Schema{' '}
              <code className="text-xs">{LINKED_NFT_TOKEN_SCHEMA}</code>. Soft-gate prefers the same
              wallet/deployer on both sides but does not block.
            </p>
            {pairs.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                No links yet. Paste existing addresses above, or finish a deploy on Create NFT / Deploy Token and
                link from the success panel.
              </p>
            ) : (
              <ul className="space-y-3">
                {pairs.map((row) => (
                  <li
                    key={row.id}
                    className="rounded-xl border px-4 py-3"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    <div className="text-xs font-mono break-all" style={{ color: 'var(--text-secondary)' }}>
                      <div>
                        <span style={{ color: 'var(--text-primary)' }}>Collection</span> {row.collectionId}
                      </div>
                      <div className="mt-1">
                        <span style={{ color: 'var(--text-primary)' }}>Token</span> {row.tokenId}
                      </div>
                    </div>
                    {row.softGateWarning ? (
                      <p className="text-xs mt-2" style={{ color: 'var(--finance-gold)' }}>
                        {row.softGateWarning}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-3 text-sm">
                      <Link
                        to={`/linked-project?collection=${encodeURIComponent(row.collectionId)}&token=${encodeURIComponent(row.tokenId)}`}
                        style={{ color: 'var(--finance-primary)' }}
                        className="underline"
                      >
                        Edit
                      </Link>
                      <Link
                        to={`/create-nft`}
                        style={{ color: 'var(--finance-primary)' }}
                        className="underline"
                      >
                        New collection
                      </Link>
                      <Link
                        to={`/deploy-token`}
                        style={{ color: 'var(--finance-primary)' }}
                        className="underline"
                      >
                        New token
                      </Link>
                      <button
                        type="button"
                        className="underline"
                        style={{ color: 'var(--finance-red-light)' }}
                        onClick={() => {
                          removeLinkedPair(row.collectionId, row.tokenId);
                          toast.success('Link removed');
                          refresh();
                        }}
                      >
                        Unlink
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="text-xs mt-6 text-center" style={{ color: 'var(--text-tertiary)' }}>
            Indexers may later resolve the same schema from metadata /{' '}
            <code className="text-[10px]">description_hash</code>. This page does not submit a registry
            transaction.
          </p>
        </div>
      </div>
    </>
  );
}
