import { accruePoints } from '../services/boingApi';

/** Planned point rates (must match Boing Points UI). Fire-and-forget; never blocks UX. */
export const POINTS_RATES = {
  swap: 10,
  liquidity_add: 25,
  deploy: 50,
  bridge: 15,
  vote: 20,
};

/**
 * Accrue Boing points after a confirmed on-chain action.
 * Failures are swallowed so UX never depends on the points API.
 */
export function tryAccruePoints({ address, action, txHash, chainId, metadata }) {
  if (!address || !action || !txHash) return;
  const points = POINTS_RATES[action];
  if (!points) return;
  void accruePoints({
    address,
    points,
    action,
    txHash,
    chainId,
    metadata,
  }).catch(() => {
    /* points API optional */
  });
}
