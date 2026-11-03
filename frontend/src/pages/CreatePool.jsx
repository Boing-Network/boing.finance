import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useWallet } from '../contexts/WalletContext';
import NativeBoingCreatePoolPanel from '../components/NativeBoingCreatePoolPanel';
import EmptyState from '../components/EmptyState';
import { TradeDeployShell, PageCard } from '../components/PageLayout';
import BoingOnlyGate, { useConnectBoingExpress } from '../components/BoingOnlyGate';

const CreatePool = () => {
  const { isConnected } = useWallet();
  const { connect } = useConnectBoingExpress();
  return (
    <>
      <Helmet>
        <title>Create Pool | boing.finance — Boing Network liquidity pools</title>
        <meta name="description" content="Create a native Boing liquidity pool and earn swap fees on boing.finance." />
      </Helmet>
      <BoingOnlyGate>
        {!isConnected ? (
          <TradeDeployShell width="medium">
            <h1 className="sr-only">Create a liquidity pool</h1>
            <PageCard>
              <EmptyState
                variant="pools"
                title="Connect Boing Express"
                description="Connect to create a pool on Boing Network."
                action={connect}
                actionLabel="Connect Boing Express"
                secondaryLabel="Browse pools"
                secondaryHref="/pools"
              />
            </PageCard>
          </TradeDeployShell>
        ) : (
          <div className="relative w-full min-w-0">
            <h1 className="sr-only">Create a liquidity pool</h1>
            <div className="relative z-10 container mx-auto px-4 py-8">
              <div className="mx-auto td-mint-form max-w-3xl">
                <NativeBoingCreatePoolPanel />
              </div>
            </div>
          </div>
        )}
      </BoingOnlyGate>
    </>
  );
};

export default CreatePool;
