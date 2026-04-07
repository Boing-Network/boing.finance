import React from 'react';
import ColosseumReferenceBackdrop from './ColosseumReferenceBackdrop';

/**
 * Global background shell — Colosseum hackathon–style stone + engraved veins + neon
 * (see https://colloseum-hackathon.vercel.app/). Used on main app, mini-app load, errors.
 */
function AppShellVisualLayer({ reducedMotion }) {
  return <ColosseumReferenceBackdrop reducedMotion={reducedMotion} />;
}

export default AppShellVisualLayer;
