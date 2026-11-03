import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import BoingPoolsSection from '../components/BoingPoolsSection';
import BoingOnlyGate from '../components/BoingOnlyGate';
import { useWallet } from '../contexts/WalletContext';

const Pools = () => {
  const { isConnected, account } = useWallet();
  const [searchParams] = useSearchParams();
  // `?pool=0x…` (e.g. redirected from the old Swap → Pools tab link) pre-fills the Boing pools search.
  const poolParamRaw = (searchParams.get('pool') || '').trim();
  const boingPoolQuery = /^0x[0-9a-fA-F]{64}$/.test(poolParamRaw) ? poolParamRaw.toLowerCase() : '';
  return (
    <>
      <Helmet>
        <title>Pools | boing.finance — Boing Network liquidity pools</title>
        <meta name="description" content="Browse Boing pools, swap, add liquidity and earn a share of swap fees on boing.finance." />
      </Helmet>
      <BoingOnlyGate>
        <div className="relative w-full min-w-0">
          <h1 className="sr-only">Liquidity pools</h1>
          <div className="relative z-10 container mx-auto px-4 py-8">
            <div className="max-w-5xl mx-auto">
              {/* Boing pools are public: browse, search and open a swap without a wallet. */}
              <BoingPoolsSection account={isConnected && account ? account : null} initialQuery={boingPoolQuery} />
            </div>
          </div>
        </div>
      </BoingOnlyGate>
    </>
  );
};

export default Pools;
