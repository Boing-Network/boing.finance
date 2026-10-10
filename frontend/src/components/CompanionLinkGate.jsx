import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';
import { useWallet } from '../contexts/WalletContext';
import { useCompanionsLinked } from '../hooks/useCompanionsLinked';
import { buildProjectPoolPath } from '../services/linkedNftTokenRegistry';

/**
 * Plain-language lock/unlock UI for actions that need on-chain companions.
 * Does not show registry / selector jargon.
 */
export default function CompanionLinkGate({
  collectionId = '',
  tokenId = '',
  actionLabel = 'Add a pool',
  unlockedHref = null,
  showUnlockLink = true,
  compact = false,
  className = '',
  onStateChange = null,
}) {
  const { account } = useWallet();
  const dexIntegration = useBoingNativeDexIntegration();
  const defaults = dexIntegration?.defaults || null;
  const endUser = defaults?.endUser || defaults?.end_user || null;
  const networkInfo = defaults?.networkInfo || null;
  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  const { state, linked, message, refresh } = useCompanionsLinked({
    collectionId,
    tokenId,
    endUser,
    networkInfo,
    origin: account || null,
    enabled: Boolean(collectionId && tokenId),
  });

  useEffect(() => {
    if (typeof onStateChangeRef.current === 'function') {
      onStateChangeRef.current({ state, linked });
    }
  }, [state, linked]);

  const href =
    unlockedHref ||
    (collectionId && tokenId ? buildProjectPoolPath({ collectionId, tokenId }) : '/create-pool');

  const border =
    state === 'linked'
      ? 'rgba(16, 185, 129, 0.45)'
      : state === 'checking' || state === 'idle'
        ? 'var(--border-color)'
        : state === 'unavailable' || state === 'invalid'
          ? 'rgba(245, 158, 11, 0.5)'
          : 'rgba(239, 68, 68, 0.4)';
  const bg =
    state === 'linked'
      ? 'rgba(16, 185, 129, 0.08)'
      : state === 'unavailable' || state === 'invalid'
        ? 'rgba(245, 158, 11, 0.08)'
        : state === 'not_linked'
          ? 'rgba(239, 68, 68, 0.06)'
          : 'var(--bg-tertiary)';

  let title = 'Companions';
  let body = message || 'Checking whether this collection and token are linked.';
  if (state === 'linked') {
    title = 'Companions linked';
    body = `${actionLabel} is unlocked for this project.`;
  } else if (state === 'not_linked') {
    title = 'Link companions to unlock';
    body = `${actionLabel} stays locked until this collection and token are linked as companions.`;
  } else if (state === 'unavailable') {
    title = 'Could not verify companions';
    body = 'Try again in a moment. Linking still happens from Project pack or Manage links.';
  } else if (state === 'invalid') {
    title = 'Need both ids';
    body = message || 'A collection id and token id are required to check companions.';
  } else if (state === 'checking') {
    title = 'Checking companions…';
    body = 'Reading on-chain links for this project.';
  }

  return (
    <div
      className={`${compact ? 'rounded-lg px-3 py-2.5' : 'rounded-xl px-3 py-3'} border text-sm ${className}`}
      style={{ borderColor: border, backgroundColor: bg, color: 'var(--text-secondary)' }}
      data-testid="companion-link-gate"
      data-gate-state={state}
      role="status"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {title}
          </p>
          <p className="mt-1 text-xs sm:text-sm">{body}</p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="text-xs underline shrink-0"
          style={{ color: 'var(--finance-primary)' }}
        >
          Refresh
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {state === 'linked' && showUnlockLink ? (
          <Link
            to={href}
            className="inline-flex px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold"
            style={{ backgroundColor: 'var(--finance-primary)', color: '#041018' }}
            data-testid="companion-gate-unlocked-cta"
          >
            {actionLabel}
          </Link>
        ) : null}
        {state === 'not_linked' || state === 'invalid' ? (
          <>
            <Link
              to="/project-pack"
              className="inline-flex px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            >
              Project pack
            </Link>
            <Link
              to="/linked-project"
              className="inline-flex px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium underline"
              style={{ color: 'var(--finance-primary)' }}
            >
              Manage links
            </Link>
          </>
        ) : null}
        {state === 'unavailable' ? (
          <Link
            to="/linked-project"
            className="inline-flex px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium underline"
            style={{ color: 'var(--finance-primary)' }}
          >
            Manage links
          </Link>
        ) : null}
      </div>
    </div>
  );
}
