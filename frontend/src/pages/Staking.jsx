import React from 'react';
import StakingBoingContent from '../components/StakingBoingContent';
import BoingOnlyGate from '../components/BoingOnlyGate';

/** Staking: network total stake (TVL) + wallet stake; Bond/Unbond via Boing Express for now. */
const Staking = () => (
  <BoingOnlyGate>
    <StakingBoingContent />
  </BoingOnlyGate>
);

export default Staking;
