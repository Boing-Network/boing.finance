/**
 * BOING sent with contract calls needs Boing Express 0.1.19+: capability detection, the signed-bytes check that
 * catches a wallet dropping `value`, and human text for the VM's generic revert.
 * Run: node --test scripts/boing-wallet-native-value.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeSignedTransaction, bytesToHex, boingTxToExpressRequest, planBoingNativeSwap } from '@boing-network/boing-sdk';
import {
  NATIVE_VALUE_WALLET_UPDATE_MESSAGE,
  explainContractRevert,
  expressTxNativeValue,
  expressTxValueCalls,
  signedTxCarriesValues,
  versionAtLeast,
  walletNativeValueSupport,
} from '../src/services/boingWalletNativeValue.js';
import { WBOING_HEX, swapButtonState } from '../src/services/boingSwapQuote.js';
import { buildNativeAddLiquidityRequest } from '../src/services/boingLiquidityTx.js';
import { formatBoingExpressRpcError } from '../src/utils/boingExpressRpcError.js';

const POOL = '0xf53a856083e615e20257707ede47acdd79b63a058733ba9694b2268e141f573a';
const TBOING = '0x6fce9d3e3f13df9fc17e3fd947148a4e6ce6966538b7dd9bf2a891d3b9699c6b';
const NICO = '0xd692627aaedf987f8854e84ab3c4d581d73f6adc13a3d86b512dc9f0d3635237';
const E18 = 10n ** 18n;
// The live BOING/tBOING pool after the Oct 18 deepening: 5 BOING -> 498 tBOING, min 495 (0.5%).
const state = { reserveA: 10010n * E18, reserveB: 1001000n, storedFeeBps: 30n, tokenAHex: WBOING_HEX, tokenBHex: TBOING };
const plan = planBoingNativeSwap({ poolHex: POOL, wboingHex: WBOING_HEX, state, assetIn: 'native', assetOut: TBOING, amountIn: 5n * E18, slippageBps: 50n, senderHex: NICO, nonce: 18n, poolVersion: 10 });
const sig = new Uint8Array(64);

test('plan: 5 BOING -> 498 tBOING (min 495), step 0 = wBOING deposit carrying 5e18', () => {
  assert.equal(plan.amountOut, 498n);
  assert.equal(plan.minOut, 495n);
  const req = boingTxToExpressRequest(plan.tx);
  assert.equal(req.type, 'batch');
  assert.equal(req.calls[0].value, String(5n * E18));
  assert.equal(req.calls[0].contract.toLowerCase(), WBOING_HEX.toLowerCase());
  assert.equal(req.calls[0].calldata.slice(-2), '20'); // deposit selector
  const calls = expressTxValueCalls(req);
  assert.deepEqual(calls.map((c) => [c.index, c.value]), [[0, 5n * E18]]);
  assert.equal(expressTxNativeValue(req), 5n * E18);
});

test('signed bytes: value present (0.1.19) passes, value dropped (0.1.18 / store 0.1.17) is caught', () => {
  const req = boingTxToExpressRequest(plan.tx);
  const calls = expressTxValueCalls(req);
  const good = bytesToHex(encodeSignedTransaction(plan.tx, sig));
  assert.equal(signedTxCarriesValues(good, calls), true);
  const s0 = plan.tx.payload.calls[0];
  const dropped = { ...plan.tx, payload: { kind: 'batch', calls: [{ kind: 'contractCall', contract: s0.contract, calldata: s0.calldata }, ...plan.tx.payload.calls.slice(1)] } };
  assert.equal(signedTxCarriesValues(bytesToHex(encodeSignedTransaction(dropped, sig)), calls), false);
  // a different amount is not accepted either
  const wrong = { ...plan.tx, payload: { kind: 'batch', calls: [{ ...s0, value: 4n * E18 }, ...plan.tx.payload.calls.slice(1)] } };
  assert.equal(signedTxCarriesValues(bytesToHex(encodeSignedTransaction(wrong, sig)), calls), false);
  assert.equal(signedTxCarriesValues('0xzz', calls), false);
  assert.equal(signedTxCarriesValues(good, []), true);
});

test('native liquidity add request carries the BOING value on the deposit step', () => {
  const req = buildNativeAddLiquidityRequest({ poolHex: POOL, tokenAHex: WBOING_HEX, tokenBHex: TBOING, amountA: E18, amountB: 100n, minLp: 1n, senderHex: NICO });
  assert.deepEqual(expressTxValueCalls(req).map((c) => [c.index, c.value]), [[0, E18]]);
});

test('wallet capability: provider flags, boing_getCapabilities, web wallet, legacy', async () => {
  const legacy = { request: async ({ method }) => { throw new Error(`Unsupported method: ${method}`); } };
  assert.deepEqual(await walletNativeValueSupport(legacy), { supported: false, version: null, source: 'legacy' });
  assert.equal((await walletNativeValueSupport({ ...legacy, features: ['nativeValue'], version: '0.1.19' })).supported, true);
  assert.equal((await walletNativeValueSupport({ ...legacy, features: [], version: '0.1.19' })).supported, false);
  assert.equal((await walletNativeValueSupport({ ...legacy, version: '0.1.18' })).supported, false);
  assert.equal((await walletNativeValueSupport({ ...legacy, version: '0.2.0' })).supported, true);
  const caps = { request: async ({ method }) => (method === 'boing_getCapabilities' ? { version: '0.1.19', features: ['nativeValue'] } : null) };
  assert.deepEqual(await walletNativeValueSupport(caps), { supported: true, version: '0.1.19', source: 'capabilities' });
  assert.equal((await walletNativeValueSupport({ isBoingWeb: true, request: async () => null })).supported, true);
  assert.equal((await walletNativeValueSupport(null)).supported, false);
  assert.equal(versionAtLeast('0.1.19', '0.1.19'), true);
  assert.equal(versionAtLeast('0.1.9', '0.1.19'), false);
});

test('revert text: value step -> update wallet; other steps -> slippage / balance hint', () => {
  const raw = 'Batch step 0 failed: Invalid jump destination (whole batch reverted)';
  assert.match(explainContractRevert(raw, { valueStepIndexes: [0] }), /Update Boing Express to 0\.1\.19/);
  assert.match(explainContractRevert('Batch step 2 failed: Invalid jump destination (whole batch reverted)', { valueStepIndexes: [0], stepLabels: ['Wrap BOING', 'Approve pool', 'Swap'] }), /^Step 3 \(Swap\) was rejected by the contract/);
  assert.match(explainContractRevert('Invalid jump destination', {}), /contract rejected this call/);
  assert.equal(explainContractRevert('Insufficient balance', {}), null);
  // the toast formatter uses it (error thrown by the sign/simulate helper carries valueStepIndexes)
  const e = Object.assign(new Error(raw), { valueStepIndexes: [0] });
  assert.match(formatBoingExpressRpcError(e), /can't send BOING with contract calls/);
  const w = Object.assign(new Error(NATIVE_VALUE_WALLET_UPDATE_MESSAGE), { code: 'BOING_WALLET_NO_NATIVE_VALUE' });
  assert.equal(formatBoingExpressRpcError(w), NATIVE_VALUE_WALLET_UPDATE_MESSAGE);
});

test('swap button: update_wallet when paying BOING with an old wallet', () => {
  const base = { connected: true, wrongNetwork: false, amountIn: 5n * E18, balance: 168n * E18, hasRoute: true, needsApproval: false, busyLabel: null, symbolIn: 'BOING' };
  assert.deepEqual(swapButtonState({ ...base, walletNeedsUpdate: true }), { kind: 'update_wallet', label: 'Update Boing Express to swap BOING', disabled: true });
  assert.equal(swapButtonState(base).kind, 'swap');
});
