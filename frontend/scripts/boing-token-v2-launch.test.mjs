import test from 'node:test';
import assert from 'node:assert/strict';
import {
  boingTokenBytecodeHex,
  buildBoingTokenDeployTransaction,
  buildLinkedNftTokenClaimSelfInitSnippetHex,
  bytesToHex,
  predictNonceDerivedContractAddress,
  resolveReferenceFungibleSecuredTemplateBytecodeHex,
} from '@boing-network/boing-sdk';
import {
  BOING_TOKEN_V2_DECIMALS,
  BOING_TOKEN_V2_SECURITY,
  BOING_TOKEN_V2_UNSUPPORTED_SECURITY,
  boingTokenV2BytecodeHex,
  buildBoingTokenV2DeployMetaTx,
  buildBoingTokenV2LaunchTx,
  buildBoingTokenV2MintAtDeployBytecodeHex,
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

test('launch: ONE deploy tx at nonce n with the nonce-derived address; supply, admin and claim are in its init', () => {
  const REG = '0x' + 'f7'.repeat(32);
  const r = buildBoingTokenV2LaunchTx({ senderHex: ME, nonce: '41', name: 'Launch', symbol: 'lch', supply: '1,000,000', claimRegistryHex: REG });
  assert.deepEqual(Object.keys(r).sort(), ['deployTx', 'supply', 'tokenHex'], 'no separate mint transaction');
  assert.equal(r.tokenHex, predictNonceDerivedContractAddress(ME, 41n).toLowerCase());
  assert.equal(r.deployTx.type, 'contract_deploy_meta');
  assert.equal(r.deployTx.nonce, '41');
  assert.equal(r.supply, 1_000_000n);
  assert.equal(r.deployTx.asset_symbol, 'LCH');
  assert.equal(r.deployTx.purpose_category, 'token');
  assert.equal(r.deployTx.create2_salt ?? null, null, 'nonce-derived, not CREATE2');
  assert.equal(r.deployTx.bytecode, buildBoingTokenV2MintAtDeployBytecodeHex({ supply: 1_000_000n, claimRegistryHex: REG }));
  const code = r.deployTx.bytecode.toLowerCase();
  assert.ok(code.startsWith('0xfd33'), '0xFD init, first op CALLER (admin = deployer)');
  assert.ok(code.includes(word(1_000_000)), 'supply word in the init');
  assert.ok(code.includes(buildLinkedNftTokenClaimSelfInitSnippetHex(REG).slice(2).toLowerCase()), 'claim_self call in the init');
  // The runtime chunks follow the claim; the stored code is the v2 runtime (its first 32 bytes are pushed first).
  const runtime = boingTokenV2BytecodeHex().slice(2);
  const firstChunk = `7f${runtime.slice(0, 64).padEnd(64, '0')}7f${'00'.repeat(32)}52`; // MSTORE(0, runtime[0..32])
  const at = code.indexOf(firstChunk);
  assert.ok(at > 0, 'runtime copy present');
  assert.ok(code.indexOf(buildLinkedNftTokenClaimSelfInitSnippetHex(REG).slice(2).toLowerCase()) < at, 'claim before the runtime copy');
});

test('launch: Advanced runtime override is wrapped too; init code is refused as a runtime', () => {
  const r = buildBoingTokenV2LaunchTx({ senderHex: ME, nonce: 0, name: 'A', symbol: 'B', supply: 1, runtimeHexOverride: boingTokenBytecodeHex(1) });
  assert.equal(r.deployTx.bytecode, buildBoingTokenV2MintAtDeployBytecodeHex({ supply: 1n, runtimeHex: boingTokenBytecodeHex(1) }));
  assert.throws(
    () => buildBoingTokenV2LaunchTx({ senderHex: ME, nonce: 0, name: 'A', symbol: 'B', supply: 1, runtimeHexOverride: r.deployTx.bytecode }),
    /not deploy init code/
  );
  assert.throws(() => buildBoingTokenV2LaunchTx({ senderHex: ME, nonce: 0, name: 'A', symbol: 'B', supply: '0' }), /greater than 0/);
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
