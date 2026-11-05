import React from 'react';
import CreateTokenBoingContent from '../components/CreateTokenBoingContent';
import BoingOnlyGate from '../components/BoingOnlyGate';

/** Create Token: Boing Network fungible deploy (Standard only). */
const CreateToken = () => (
  <BoingOnlyGate>
    <CreateTokenBoingContent />
  </BoingOnlyGate>
);

export default CreateToken;
