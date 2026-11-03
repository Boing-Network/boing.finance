import React from 'react';
import { Helmet } from 'react-helmet-async';
import NativeBoingTradeHub from '../components/NativeBoingTradeHub';
import BoingOnlyGate from '../components/BoingOnlyGate';

function readSlippage() {
  try {
    const saved = JSON.parse(localStorage.getItem('swapSettings') || 'null');
    const s = Number(saved?.slippage);
    return Number.isFinite(s) && s > 0 ? s : 0.5;
  } catch {
    return 0.5;
  }
}

const DESC = 'Swap tokens on native Boing pools with Boing Express. Quote details such as minimum received are shown before you confirm.';

const Swap = () => {
  const [slippage] = React.useState(readSlippage);
  return (
    <>
      <Helmet>
        <title>Swap | boing.finance — Trade on Boing Network</title>
        <meta name="description" content={DESC} />
        <meta name="keywords" content="swap tokens, DEX, boing finance, Boing Network, Boing Express" />
        <meta property="og:title" content="Swap | boing.finance" />
        <meta property="og:description" content={DESC} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://boing.finance/swap" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Swap | boing.finance" />
        <meta name="twitter:description" content={DESC} />
      </Helmet>
      <BoingOnlyGate>
        <div className="relative w-full min-w-0">
          <div className="td-shell td-shell--full">
            <div className="mb-6 td-hero" style={{ animationDelay: '0s' }}>
              <span className="td-hero__eyebrow">Trade</span>
              <h1 className="td-hero__title" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>
                Swap
              </h1>
              <p className="td-hero__subtitle">Trade tokens on Boing Network</p>
            </div>
            <NativeBoingTradeHub slippagePercent={slippage} />
          </div>
        </div>
      </BoingOnlyGate>
    </>
  );
};

export default Swap;
