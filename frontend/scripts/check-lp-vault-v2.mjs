#!/usr/bin/env node
/** Read-only check of the LP vault v2 UI service against the public testnet: state, deposit plan, withdraw plan. */
import { BoingClient } from '@boing-network/boing-sdk';
import { loadLpVaultV2, planLpVaultV2Deposit, planLpVaultV2Withdraw } from '../src/services/nativeLpVaultV2.js';

const holder = process.argv[2] || '0x8079f30559c02c5fe087c9ad1bc3b751a29de35992f3f8431734243e825f696e';
const client = new BoingClient(process.env.BOING_RPC_URL || 'https://testnet-rpc.boing.network/');
const s = await loadLpVaultV2(client, holder);
const j = (o) => JSON.stringify(o, (_, v) => (typeof v === 'bigint' ? v.toString() : v));
console.log('vault', j(s.vault));
console.log('holder', j(s.holder));
const d = planLpVaultV2Deposit(s, holder, 10n);
console.log('deposit 10 A ->', j({ amountB: d.amountB, shares: d.shares, minShares: d.minShares, steps: d.steps.map((x) => x.label) }));
if (s.holder.shares > 0n) {
  const w = planLpVaultV2Withdraw(s, holder, s.holder.shares);
  console.log(`withdraw ${s.holder.shares} ->`, j({ outA: w.outA, outB: w.outB }));
}