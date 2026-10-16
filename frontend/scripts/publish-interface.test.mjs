import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { predictCreate2ContractAddress, interfaceRegistryClaimerStorageKeyHex } from 'boing-sdk';
import {
  nonceDerivedAddress, verifyDeployer, inspectContract, validateInterfaceDoc, canonicalInterfaceText,
  interfaceHashOfText, draftFromObserver, checkUri, planPublish, recordMatches, observerContractUrl, INTERFACE_REGISTRY_ID,
} from '../src/utils/publishInterface.js';
import { flowTxsToBatchTx } from '../src/utils/linkedNftLinkBatch.js';

const DEX = '8079f30559c02c5fe087c9ad1bc3b751a29de35992f3f8431734243e825f696e';
const POOL = '2ad75c2e11b1e93761f4f8df39502deecbe7148324e5a80a951798142b2c5b61';
const ME = 'd6'.repeat(32);
const HASH = 'ab'.repeat(32);
const ZERO = `0x${'0'.repeat(64)}`;

test('nonce-derived address matches the live v9 pool (DEX deployer nonce 20)', () => {
  assert.equal(nonceDerivedAddress(DEX, 20), POOL);
});

test('verifyDeployer: nonce scan', async () => {
  const rpc = async (m) => (m === 'boing_getAccount' ? { nonce: 25 } : { transactions: [] });
  assert.deepEqual(await verifyDeployer(rpc, `0x${DEX}`, `0x${POOL}`), { ok: true, method: 'nonce', nonce: 20 });
  const r = await verifyDeployer(rpc, `0x${ME}`, `0x${POOL}`);
  assert.equal(r.ok, false);
});

test('verifyDeployer: CREATE2 deploy found in history', async () => {
  const salt = new Uint8Array(32).fill(7);
  const bytecode = Uint8Array.from([0x60, 0x00, 0x00]);
  const addr = predictCreate2ContractAddress(`0x${ME}`, salt, bytecode).replace(/^0x/, '');
  const rpc = async (m, p) => {
    if (m === 'boing_getAccount') return { nonce: 3 };
    if (m === 'boing_getAccountTransactions') {
      return { transactions: [{ direction: 'out', block_height: 9, tx_index: 0, payload: { kind: 'contract_deploy_with_purpose' } }], next_cursor: null };
    }
    if (m === 'boing_getBlockByHeight') {
      assert.equal(p[0], 9);
      return { transactions: [{ sender: ME, payload: { ContractDeployWithPurpose: { bytecode: [...bytecode], create2_salt: [...salt] } } }] };
    }
    throw new Error(m);
  };
  assert.deepEqual(await verifyDeployer(rpc, ME, addr), { ok: true, method: 'create2', height: 9 });
});

test('inspectContract: code, deployer, unclaimed registry', async () => {
  const rpc = async (m, p) => {
    if (m === 'boing_getContractCode') return { bytecode: '0x6000', code_hash: '0x' + 'ee'.repeat(32), size: 2 };
    if (m === 'boing_getAccount') return { nonce: 21 };
    if (m === 'boing_getContractStorage') {
      assert.equal(p[0].toLowerCase(), INTERFACE_REGISTRY_ID.toLowerCase());
      return { value: ZERO };
    }
    return { transactions: [] };
  };
  const r = await inspectContract(rpc, { wallet: `0x${DEX}`, contract: `0x${POOL}` });
  assert.equal(r.ok, true);
  assert.equal(r.deployer.ok, true);
  assert.equal(r.claimer, null);
  assert.equal(r.record, null);
  const none = await inspectContract(async (m) => (m === 'boing_getContractCode' ? null : {}), { wallet: `0x${DEX}`, contract: `0x${POOL}` });
  assert.equal(none.code, 'not_contract');
});

test('inspectContract: flags a claim held by another account', async () => {
  const claimKey = interfaceRegistryClaimerStorageKeyHex(`0x${POOL}`).toLowerCase();
  const rpc = async (m, p) => {
    if (m === 'boing_getContractCode') return { bytecode: '0x6000', code_hash: '0x' + 'ee'.repeat(32), size: 2 };
    if (m === 'boing_getAccount') return { nonce: 21 };
    if (m === 'boing_getContractStorage') return { value: p[1].toLowerCase() === claimKey ? `0x${ME}` : ZERO };
    return { transactions: [] };
  };
  const r = await inspectContract(rpc, { wallet: `0x${DEX}`, contract: `0x${POOL}` });
  assert.equal(r.claimer, ME);
  assert.equal(r.claimedByOther, true);
});

test('validateInterfaceDoc mirrors the observer rules', () => {
  assert.equal(validateInterfaceDoc('{').ok, false);
  assert.equal(validateInterfaceDoc({}).ok, false);
  const bad = validateInterfaceDoc({ functions: [{ selector: 300, name: '' }, { selector: 1, name: 'x', params: [{ name: 'a', type: 'uint256' }] }] });
  assert.equal(bad.ok, false);
  assert.equal(bad.errors.length, 3);
  const ok = validateInterfaceDoc({ functions: [{ selector: 1, name: 'transfer', params: [{ name: 'to', type: 'account' }], kind: 'write' }, { selector: 1, name: 'dup' }] });
  assert.equal(ok.ok, true);
  assert.match(ok.warnings[0], /twice/);
});

test('canonical text + hash equal the hosted canonical file hash recorded on-chain', () => {
  const url = new URL(`../../../boing.network/website/public/interfaces/testnet/0x${POOL}.json`, import.meta.url);
  let text;
  try {
    text = readFileSync(url, 'utf8');
  } catch {
    return; // boing.network checkout not beside boing.finance
  }
  const v = validateInterfaceDoc(text);
  assert.equal(v.ok, true);
  assert.equal(canonicalInterfaceText(v.doc), text);
  assert.equal(interfaceHashOfText(text), '6a9589f955dd5d7afacc6e598dd437a3350f28cc8c98de9eb4f4af363d37daee');
});

test('draftFromObserver keeps names and adds placeholders for undescribed selectors', () => {
  const d = draftFromObserver(`0x${POOL}`, {
    label: 'Pool', summary: 's',
    functions: [{ selector: 16, name: 'swap', params: [{ name: 'direction', type: 'u128' }], kind: 'write', description: 'd', access: 'a' }],
    decodedSelectors: [16, 5],
  });
  assert.deepEqual(d.functions.map((f) => [f.selector, f.name]), [[5, 'fn_0x05'], [16, 'swap']]);
  assert.equal(d.schema, 'boing-interface/v1');
  assert.equal(validateInterfaceDoc(d).ok, true);
});

test('checkUri enforces https and 192 bytes', () => {
  assert.equal(checkUri('http://x').ok, false);
  assert.equal(checkUri(`https://${'a'.repeat(200)}`).ok, false);
  assert.equal(checkUri(' https://example.com/i.json ').uri, 'https://example.com/i.json');
});

test('planPublish: claim + set as one batch; set only when already claimed; refusals', () => {
  const base = { wallet: `0x${DEX}`, contract: `0x${POOL}`, interfaceHash: HASH, uri: 'https://example.com/i.json', deployerOk: true };
  const p = planPublish({ ...base, claimer: null });
  assert.equal(p.ok, true);
  assert.equal(p.txs.length, 2);
  assert.equal(p.txs[0].calldata.slice(2 + 62, 2 + 64), 'd0');
  assert.equal(p.txs[1].calldata.slice(2 + 62, 2 + 64), 'd1');
  const batch = flowTxsToBatchTx(p.txs);
  assert.equal(batch.type, 'batch');
  assert.equal(batch.calls.length, 2);
  assert.ok(batch.access_list.write.includes(INTERFACE_REGISTRY_ID.toLowerCase()));
  assert.equal(planPublish({ ...base, claimer: DEX }).txs.length, 1);
  assert.equal(planPublish({ ...base, claimer: ME }).code, 'claimed_by_other');
  assert.equal(planPublish({ ...base, claimer: null, deployerOk: false }).code, 'not_deployer');
  assert.equal(planPublish({ ...base, claimer: null, uri: 'ftp://x' }).code, 'bad_uri');
});

test('recordMatches and observer link', () => {
  const rec = { interfaceHash: `0x${HASH}`, uri: 'https://e/i.json', publisher: `0x${DEX}` };
  assert.equal(recordMatches(rec, { interfaceHash: HASH, uri: 'https://e/i.json', wallet: DEX }), true);
  assert.equal(recordMatches(rec, { interfaceHash: HASH, uri: 'https://e/j.json', wallet: DEX }), false);
  assert.equal(observerContractUrl('https://boing.observer/', POOL), `https://boing.observer/account/0x${POOL}?network=testnet`);
});