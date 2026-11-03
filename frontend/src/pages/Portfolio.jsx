import React from 'react';
import PortfolioBoingContent from '../components/PortfolioBoingContent';
import BoingOnlyGate from '../components/BoingOnlyGate';

/** Portfolio: Boing Network only (balances via the Boing RPC, LP values from native Boing pools). */
const Portfolio = () => (
  <BoingOnlyGate>
    <PortfolioBoingContent />
  </BoingOnlyGate>
);

export default Portfolio;
