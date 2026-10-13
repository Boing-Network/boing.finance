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
          content="Connect an NFT collection to its project token, or disconnect a pair. Prefer Project pack to create both in one flow."
        />
      </Helmet>
      <TradeDeployShell width="medium">
        <TradeDeployHero
          eyebrow="Launch"
          title="Link collection & token"
          subtitle={
            <>
              Connect an NFT collection to its project token so apps treat them as one project — or disconnect a pair.
              Starting fresh? Use{' '}
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
          title={ready ? 'Ready to link' : 'Linking not available yet'}
          actions={
            ready ? null : (
              <TradeDeployButton as={Link} to="/project-pack" variant="primary">
                Try Project pack
              </TradeDeployButton>
            )
          }
        >
          {ready
            ? 'Paste your collection and token ids below, then link. Next step after linking: add a pool if you want trading.'
            : 'This network is not set up for linking yet. Create both assets with Project pack when it is available.'}
        </StatusBanner>

        <LinkedNftTokenPanel
          seedCollectionId={collectionQ}
          seedTokenId={tokenQ}
          showHubLink={false}
          hideStatus
          hideIntro
          title="Your collection and token"
        />
      </TradeDeployShell>
    </>
  );
}
