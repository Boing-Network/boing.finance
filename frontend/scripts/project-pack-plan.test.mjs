import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REFERENCE_FUNGIBLE_BALANCE_XOR,
  boingTokenBytecodeHex,
  bytesToHex,
  descriptionHashHexFromLinkedNftToken,
  encodeLinkedNftTokenClaimAssetCalldataHex,
  encodeLinkedNftTokenRegisterLinkCalldataHex,
  hexToBytes,
  predictCreate2ContractAddress,
} from 'boing-sdk';
import {
  BOING_TOKEN_ADMIN_SLOT_HEX,
  BOING_TOKEN_MINT_ONCE_SLOT_HEX,
  buildBoingTokenV2MintAtDeployBytecodeHex,
  parseBoingTokenV2Supply,
} from '../src/services/boingTokenV2Launch.js';
import { PROJECT_PACK_SUBMIT_ORDER, PROJECT_PACK_TOKEN_TEMPLATE, planProjectPack } from '../src/services/projectPackPlan.js';
import { PROJECT_PACK_DEFAULT_TOKEN_SUPPLY, formatPackSupply } from '../src/config/projectPack.js';

const DEPLOYER = `0x${'a1'.repeat(32)}`;
const REGISTRY = `0x${'e7'.repeat(32)}`;
const SALT = `0x${'5a'.repeat(32)}`;
const base = {
  deployerHex: DEPLOYER,
  collectionName: 'Neon Garden',
  collectionSymbol: 'NG',
  tokenName: 'Neon Garden Token',
  tokenSymbol: 'NGT',
  registryHex32: REGISTRY,
  collectionSaltHex: SALT,
};

const word = (v) => hexToBytes(`0x${BigInt(v).toString(16).padStart(64, '0')}`);
const eqBytes = (a, b) => bytesToHex(a) === bytesToHex(b);

/** Decode the 0xFD init into its three SSTOREs and the RETURNed runtime. */
function decodeInit(hex) {
  const b = hexToBytes(hex);
  let i = 0;
  const take = (n) => {
    const out = b.subarray(i, i + n);
    i += n;
    return out;
  };
  const op = (code) => assert.equal(b[i++], code, `opcode 0x${code.toString(16)} at ${i - 1}`);
  const push32 = () => {
    op(0x7f);
    return take(32);
  };
  op(0xfd);
  op(0x33); // CALLER
  const adminSlot = push32();
  op(0x55);
  const amount = push32();
  op(0x33);
  const mask = push32();
  op(0x18); // XOR
  op(0x55);
  const once = push32();
  const onceSlot = push32();
  op(0x55);
  const mem = [];
  while (b[i] === 0x7f && b[i + 33] === 0x7f && b[i + 66] === 0x52) {
    const chunk = push32();
    const off = Number(BigInt(bytesToHex(push32())));
    op(0x52);
    mem.push([off, chunk]);
  }
  const len = Number(BigInt(bytesToHex(push32())));
  const retOff = Number(BigInt(bytesToHex(push32())));
  op(0xf3);
  op(0x00);
  assert.equal(i, b.length, 'no trailing bytes');
  const memory = new Uint8Array(mem.length * 32);
  for (const [off, chunk] of mem) memory.set(chunk, off);
  return { adminSlot, amount, mask, once, onceSlot, runtime: memory.subarray(retOff, retOff + len) };
}

test('mint-at-deploy bytecode: admin, balance and mint-once slots, then the exact v2 runtime', () => {
  const hex = buildBoingTokenV2MintAtDeployBytecodeHex({ supply: '123456789' });
  const d = decodeInit(hex);
  assert.equal(bytesToHex(d.adminSlot), BOING_TOKEN_ADMIN_SLOT_HEX);
  assert.equal(bytesToHex(d.onceSlot), BOING_TOKEN_MINT_ONCE_SLOT_HEX);
  assert.ok(eqBytes(d.amount, word(123456789n)));
  assert.ok(eqBytes(d.once, word(1n)));
  assert.ok(eqBytes(d.mask, REFERENCE_FUNGIBLE_BALANCE_XOR));
  assert.equal(bytesToHex(d.runtime), boingTokenBytecodeHex(2), 'runtime is the unchanged v2 template');
  assert.ok(hexToBytes(hex).length < 32 * 1024, 'under the QA bytecode size limit');
});

test('mint-at-deploy bytecode: max supply fits, invalid supplies are rejected like the solo deploy', () => {
  const max = (1n << 128n) - 1n;
  assert.ok(eqBytes(decodeInit(buildBoingTokenV2MintAtDeployBytecodeHex({ supply: max })).amount, word(max)));
  for (const bad of ['', '0', '-5', '1.5', '1e6', (1n << 128n).toString(), 'abc']) {
    assert.throws(() => buildBoingTokenV2MintAtDeployBytecodeHex({ supply: bad }), (e) => {
      assert.throws(() => parseBoingTokenV2Supply(bad), { message: e.message });
      return true;
    });
  }
});

test('plan: default supply, v2 template, submit order and recipient', () => {
  const plan = planProjectPack(base);
  assert.equal(plan.tokenSupply, PROJECT_PACK_DEFAULT_TOKEN_SUPPLY);
  assert.equal(PROJECT_PACK_DEFAULT_TOKEN_SUPPLY, 1_000_000_000n);
  assert.equal(formatPackSupply(plan.tokenSupply), '1,000,000,000');
  assert.equal(plan.tokenTemplate, PROJECT_PACK_TOKEN_TEMPLATE);
  assert.equal(plan.tokenSupplyRecipient, DEPLOYER);
  assert.deepEqual([...plan.submitOrder], [...PROJECT_PACK_SUBMIT_ORDER]);
  assert.deepEqual([...plan.submitOrder], ['collectionDeploy', 'tokenDeploy', 'claimCollection', 'claimToken', 'registerLink']);
  assert.equal(plan.tokenDeployTx.type, 'contract_deploy_meta');
  assert.equal(plan.tokenDeployTx.purpose_category, 'token');
  assert.equal(plan.tokenDeployTx.asset_symbol, 'NGT');
  assert.equal(plan.tokenDeployTx.bytecode, buildBoingTokenV2MintAtDeployBytecodeHex({ supply: PROJECT_PACK_DEFAULT_TOKEN_SUPPLY }));
  assert.ok(eqBytes(decodeInit(plan.tokenDeployTx.bytecode).amount, word(1_000_000_000n)));
});

test('plan: CREATE2 addresses match the deploy bytecode and salts; links name each other', () => {
  const plan = planProjectPack(base);
  assert.equal(plan.collectionSaltHex, SALT);
  assert.equal(plan.tokenDeployTx.create2_salt, plan.tokenSaltHex);
  assert.equal(plan.collectionDeployTx.create2_salt, SALT);
  const predictedToken = predictCreate2ContractAddress(DEPLOYER, hexToBytes(plan.tokenSaltHex), hexToBytes(plan.tokenDeployTx.bytecode));
  assert.equal(String(predictedToken).toLowerCase(), plan.predictedTokenAddress);
  const predictedCollection = predictCreate2ContractAddress(DEPLOYER, hexToBytes(SALT), hexToBytes(plan.collectionDeployTx.bytecode));
  assert.equal(String(predictedCollection).toLowerCase(), plan.predictedCollectionAddress);
  assert.deepEqual(plan.tokenLink.peers, [plan.predictedCollectionAddress]);
  assert.deepEqual(plan.collectionLink.peers, [plan.predictedTokenAddress]);
  assert.equal(plan.tokenDeployTx.description_hash, descriptionHashHexFromLinkedNftToken(plan.tokenLink));
  assert.equal(plan.collectionDeployTx.description_hash, descriptionHashHexFromLinkedNftToken(plan.collectionLink));
});

test('plan: register flow claims both assets then links them, from the deployer, on the registry', () => {
  const plan = planProjectPack(base);
  assert.equal(plan.registerFlowTxs.length, 3);
  const [claimC, claimT, reg] = plan.registerFlowTxs;
  for (const tx of plan.registerFlowTxs) {
    assert.equal(tx.type, 'contract_call');
    assert.equal(String(tx.contract).toLowerCase(), REGISTRY);
  }
  assert.equal(claimC.calldata, encodeLinkedNftTokenClaimAssetCalldataHex(plan.predictedCollectionAddress));
  assert.equal(claimT.calldata, encodeLinkedNftTokenClaimAssetCalldataHex(plan.predictedTokenAddress));
  assert.equal(reg.calldata, encodeLinkedNftTokenRegisterLinkCalldataHex(plan.predictedCollectionAddress, plan.predictedTokenAddress));
  assert.equal(plan.senderHex32, DEPLOYER);
});

test('plan: custom supply changes the token (address and minted amount) but not the collection salt', () => {
  const a = planProjectPack(base);
  const b = planProjectPack({ ...base, tokenSupply: '2,500,000' });
  assert.equal(b.tokenSupply, 2_500_000n);
  assert.ok(eqBytes(decodeInit(b.tokenDeployTx.bytecode).amount, word(2_500_000n)));
  assert.notEqual(a.predictedTokenAddress, b.predictedTokenAddress);
  assert.equal(a.collectionSaltHex, b.collectionSaltHex);
  assert.equal(planProjectPack({ ...base, tokenSupply: '2500000' }).predictedTokenAddress, b.predictedTokenAddress, 'deterministic');
  assert.equal(planProjectPack({ ...base, tokenSupply: 2_500_000n }).predictedTokenAddress, b.predictedTokenAddress);
});

test('plan: rejects bad supply, missing names, and a sender other than the deployer', () => {
  assert.throws(() => planProjectPack({ ...base, tokenSupply: '0' }), /greater than 0/);
  assert.throws(() => planProjectPack({ ...base, tokenSupply: '10.5' }), /whole number/);
  assert.throws(() => planProjectPack({ ...base, tokenSupply: (1n << 128n).toString() }), /too large/);
  assert.throws(() => planProjectPack({ ...base, tokenSymbol: ' ' }), /Token name and symbol/);
  assert.throws(() => planProjectPack({ ...base, collectionName: '' }), /Collection name and symbol/);
  assert.throws(() => planProjectPack({ ...base, deployerHex: '0x1234' }), /Connect a Boing account/);
  assert.throws(() => planProjectPack({ ...base, senderHex32: `0x${'b2'.repeat(32)}` }), /same account/);
});

test('plan: works with the pair-compose fallback when the SDK pack helper is missing', () => {
  const a = planProjectPack(base);
  const b = planProjectPack({ ...base, sdk: { buildLinkedNftTokenProjectPack: undefined } });
  assert.equal(b.source, 'sdk_pair_compose');
  assert.equal(b.predictedTokenAddress, a.predictedTokenAddress);
  assert.deepEqual(b.registerFlowTxs, a.registerFlowTxs);
});
