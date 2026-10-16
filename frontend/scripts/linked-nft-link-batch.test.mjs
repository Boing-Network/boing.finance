import test from 'node:test';
import assert from 'node:assert/strict';
import {
  planLinkSteps, buildLinkBatchTx, decodeClaimerReturnData, isWalletBatchUnsupportedError, shouldUseLinkBatch, flowTxsToBatchTx,
} from '../src/utils/linkedNftLinkBatch.js';

const ME = '0x' + 'd6'.repeat(32);
const REG = '0x' + 'eb'.repeat(32);
const COL = '0x' + '63'.repeat(32);
const TOK = '0x' + '98'.repeat(32);
const enc = { encodeClaim: (a) => 'c:' + a, encodeRegister: (c, t) => 'r:' + c + t };

test('unknown claimers → claim, claim, register (3 steps)', () => {
  const r = planLinkSteps({ linker: ME, registryId: REG, collection: COL, token: TOK, ...enc });
  assert.equal(r.ok, true);
  assert.deepEqual(r.steps.map((s) => s.label), ['Claim collection', 'Claim token', 'Register link']);
});

test('already-claimed assets are skipped', () => {
  const r = planLinkSteps({ linker: ME, registryId: REG, collection: COL, token: TOK, claimers: { [COL]: ME, [TOK]: null }, ...enc });
  assert.deepEqual(r.steps.map((s) => s.label), ['Claim token', 'Register link']);
});

test('asset claimed by someone else is refused before any prompt', () => {
  const r = planLinkSteps({ linker: ME, registryId: REG, collection: COL, token: TOK, claimers: { [TOK]: '0x' + '11'.repeat(32) }, ...enc });
  assert.equal(r.ok, false);
  assert.equal(r.code, 'claimed_by_other');
});

test('batch tx shape', () => {
  const { steps } = planLinkSteps({ linker: ME, registryId: REG, collection: COL, token: TOK, ...enc });
  const tx = buildLinkBatchTx({ linker: ME, registryId: REG, steps, assets: [COL, TOK] });
  assert.equal(tx.type, 'batch');
  assert.equal(tx.calls.length, 3);
  assert.ok(tx.calls.every((c) => c.type === 'contract_call' && c.contract === REG));
  assert.deepEqual(new Set(tx.access_list.write), new Set([ME, REG, COL, TOK]));
  assert.throws(() => buildLinkBatchTx({ linker: ME, registryId: REG, steps: Array(17).fill(steps[0]) }), /16/);
});

test('helpers', () => {
  assert.equal(decodeClaimerReturnData('0x' + '00'.repeat(32)), null);
  assert.equal(decodeClaimerReturnData('0x' + 'd6'.repeat(32)), ME);
  assert.equal(isWalletBatchUnsupportedError(new Error('Unsupported transaction type: batch')), true);
  assert.equal(isWalletBatchUnsupportedError(new Error('User rejected')), false);
  assert.equal(shouldUseLinkBatch(3, { nodeBatch: true, maxSteps: 16 }), true);
  assert.equal(shouldUseLinkBatch(1, { nodeBatch: true }), false);
  assert.equal(shouldUseLinkBatch(3, { nodeBatch: false }), false);
  assert.equal(shouldUseLinkBatch(17, { nodeBatch: true, maxSteps: 16 }), false);
});
test('flowTxsToBatchTx merges SDK flow txs', () => {
  const flow = [
    { type: 'contract_call', contract: REG, calldata: '0x01', access_list: { read: [ME, REG, COL], write: [ME, REG, COL] } },
    { type: 'contract_call', contract: REG, calldata: '0x02', access_list: { read: [ME, REG, TOK], write: [ME, REG, TOK] } },
    { type: 'contract_call', contract: REG, calldata: '0x03', access_list: { read: [ME, REG], write: [ME, REG] } },
  ];
  const b = flowTxsToBatchTx(flow);
  assert.equal(b.type, 'batch');
  assert.deepEqual(b.calls.map((c) => c.calldata), ['0x01', '0x02', '0x03']);
  assert.deepEqual(new Set(b.access_list.write), new Set([ME, REG, COL, TOK]));
  assert.throws(() => flowTxsToBatchTx([{ type: 'transfer' }]), /only contract calls/);
});