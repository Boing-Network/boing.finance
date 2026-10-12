import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import LinkedNftTokenPanel from '../components/LinkedNftTokenPanel';
import { getLinkedNftTokenRegistryStatus } from '../services/linkedNftTokenRegistry';
import { useBoingNativeDexIntegration } from '../contexts/BoingNativeDexIntegrationContext';
import {
  TradeDeployShell,
  TradeDeployHero,
  StatusBanner,
  TradeDeployButton,
} from '../components/PageLayout';

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

  const ready = status.code === 'ready';

  return (
    <>
      <Helmet>
        <title>Manage links | boing.finance</title>
        <meta
          name="description"
          content="Link or unlink NFT collections and tokens as companions. Prefer Project pack to create both in one flow."
        />
      </Helmet>
      <TradeDeployShell width="medium">
        <TradeDeployHero
          eyebrow="Launch"
          title="Manage links"
          subtitle={
            <>
              Link an existing collection and token as companions, or unlink a pair. Starting fresh? Use{' '}
              <Link to="/project-pack" className="underline" style={{ color: 'var(--finance-primary)' }}>
                Project pack
              </Link>
              .
            </>
          }
        />

        <StatusBanner
          className="mb-6"
          variant={ready ? 'success' : 'warn'}
          title={ready ? 'Companions ready to link' : 'Companions not available yet'}
          actions={
            <>
              <TradeDeployButton as={Link} to="/project-pack" variant="primary">
                Project pack
              </TradeDeployButton>
              <TradeDeployButton as={Link} to="/create-nft" variant="green">
                Create NFT
              </TradeDeployButton>
              <TradeDeployButton as={Link} to="/deploy-token" variant="ghost">
                Deploy token
              </TradeDeployButton>
            </>
          }
        >
          {ready
            ? 'You can claim each side, register companions, or unlink. Links are many-to-many and can change later.'
            : 'Companion linking is not available on this network yet.'}
        </StatusBanner>

        <LinkedNftTokenPanel
          seedCollectionId={collectionQ}
          seedTokenId={tokenQ}
          showHubLink={false}
          hideStatus
          hideIntro
          title="Link or unlink companions"
        />
      </TradeDeployShell>
    </>
  );
}
