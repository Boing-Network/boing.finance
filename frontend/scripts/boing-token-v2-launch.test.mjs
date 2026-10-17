import test from 'node:test';
import assert from 'node:assert/strict';
import {
  boingTokenBytecodeHex,
  buildBoingTokenDeployTransaction,
  bytesToHex,
  predictNonceDerivedContractAddress,
  resolveReferenceFungibleSecuredTemplateBytecodeHex,
} from 'boing-sdk';
import {
  BOING_TOKEN_V2_DECIMALS,
  BOING_TOKEN_V2_SECURITY,
  BOING_TOKEN_V2_UNSUPPORTED_SECURITY,
  boingTokenV2BytecodeHex,
  buildBoingTokenV2DeployMetaTx,
  buildBoingTokenV2LaunchTxs,
  buildBoingTokenV2MintTx,
  parseBoingTokenV2Supply,
} from '../src/services/boingTokenV2Launch.js';

const ME = '0x8079f30559c02c5fe087c9ad1bc3b751a29de35992f3f8431734243e825f696e';
const word = (n) => BigInt(n).toString(16).padStart(64, '0');

test('deploys the reference fungible template v2, not v1 or the secured template', () => {
  const v2 = boingTokenV2BytecodeHex();
  assert.equal(v2, boingTokenBytecodeHex(2));
  assert.notEqual(v2, boingTokenBytecodeHex(1));
  assert.notEqual(v2, (resolveReferenceFungibleSecuredTemplateBytecodeHex() || '').toLowerCase());
  const tx = buildBoingTokenV2DeployMetaTx({ name: '  My Token ', symbol: 'mtk' });
  assert.equal(tx.type, 'contract_deploy_meta');
  assert.equal(tx.bytecode.toLowerCase(), v2);
  assert.equal(tx.purpose_category, 'token');
  assert.equal(tx.asset_name, 'My Token');
  assert.equal(tx.asset_symbol, 'MTK');
  assert.equal(tx.description_hash, undefined);
});

test('deploy meta matches the SDK / CLI token deploy payload (same bytecode, name, symbol, purpose)', () => {
  const ours = buildBoingTokenV2DeployMetaTx({ name: 'My Token', symbol: 'MTK' });
  const sdk = buildBoingTokenDeployTransaction({ nonce: 7n, senderHex: ME, name: 'My Token', symbol: 'MTK' });
  assert.equal(ours.bytecode.toLowerCase(), bytesToHex(sdk.payload.bytecode).toLowerCase());
  assert.equal(ours.asset_name, sdk.payload.assetName);
  assert.equal(ours.asset_symbol, sdk.payload.assetSymbol);
  assert.equal(ours.purpose_category, sdk.payload.purposeCategory);
});

test('description hash and bytecode override pass through; metadata limits enforced', () => {
  const dh = '0x' + 'ab'.repeat(32);
  const tx = buildBoingTokenV2DeployMetaTx({ name: 'A', symbol: 'B', descriptionHashHex: dh, bytecodeHexOverride: '0xdead' });
  assert.equal(tx.description_hash, dh);
  assert.equal(tx.bytecode, '0xdead');
  assert.throws(() => buildBoingTokenV2DeployMetaTx({ name: '', symbol: 'B' }), /required/);
  assert.throws(() => buildBoingTokenV2DeployMetaTx({ name: 'A', symbol: 'S'.repeat(33) }), /symbol exceeds/);
});

test('mint_first call: selector 0x02, recipient, amount, [sender, token] access list', () => {
  const token = '0x' + '22'.repeat(32);
  const tx = buildBoingTokenV2MintTx({ senderHex: ME, tokenHex: token, amount: 1_000_000n });
  assert.equal(tx.type, 'contract_call');
  assert.equal(tx.contract, token);
  assert.equal(tx.calldata, '0x' + word(2) + ME.slice(2) + word(1_000_000));
  assert.deepEqual(tx.access_list, { read: [ME, token], write: [ME, token] });
  assert.throws(() => buildBoingTokenV2MintTx({ senderHex: ME, tokenHex: token, amount: 0n }));
});

test('launch: nonce-derived token address, deploy at n, mint at n+1 to the deployer', () => {
  const r = buildBoingTokenV2LaunchTxs({ senderHex: ME, nonce: '41', name: 'Launch', symbol: 'lch', supply: '1,000,000' });
  assert.equal(r.tokenHex, predictNonceDerivedContractAddress(ME, 41n).toLowerCase());
  assert.equal(r.deployTx.nonce, '41');
  assert.equal(r.mintTx.nonce, '42');
  assert.equal(r.mintTx.contract, r.tokenHex);
  assert.equal(r.supply, 1_000_000n);
  assert.ok(r.mintTx.calldata.endsWith(word(1_000_000)));
  assert.equal(r.deployTx.asset_symbol, 'LCH');
});

test('supply is a whole number in 1 .. 2^128-1', () => {
  assert.equal(parseBoingTokenV2Supply('1000'), 1000n);
  assert.equal(parseBoingTokenV2Supply(' 1_000 '), 1000n);
  assert.equal(parseBoingTokenV2Supply(5), 5n);
  for (const bad of ['', '0', '-5', '1.5', '1e6', 'abc', (1n << 128n).toString()]) {
    assert.throws(() => parseBoingTokenV2Supply(bad), undefined, bad);
  }
  assert.equal(parseBoingTokenV2Supply(((1n << 128n) - 1n).toString()), (1n << 128n) - 1n);
});

test('v2 facts the deploy form relies on', () => {
  assert.equal(BOING_TOKEN_V2_DECIMALS, 0);
  assert.deepEqual({ ...BOING_TOKEN_V2_SECURITY }, { renounceMint: true, renounceOwnership: true });
  for (const k of ['enableFreezing', 'enableBlacklist', 'maxTxAmount', 'antiBot', 'cooldown', 'antiWhale', 'pauseFunction', 'timelock', 'maxWallet']) {
    assert.ok(BOING_TOKEN_V2_UNSUPPORTED_SECURITY.includes(k), k);
  }
  assert.ok(!BOING_TOKEN_V2_UNSUPPORTED_SECURITY.includes('renounceMint'));
});
