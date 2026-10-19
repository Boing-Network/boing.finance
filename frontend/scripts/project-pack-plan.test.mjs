import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REFERENCE_FUNGIBLE_BALANCE_XOR,
  boingTokenBytecodeHex,
  bytesToHex,
  descriptionHashHexFromLinkedNftToken,
  buildLinkedNftTokenClaimSelfInitSnippetHex,
  encodeLinkedNftTokenRegisterLinkCalldataHex,
  hexToBytes,
  predictCreate2ContractAddress,
  resolveReferenceNftCollectionTemplateBytecodeHex,
} from 'boing-sdk';
import { BOING_NFT_COLLECTION_ADMIN_SLOT_HEX, buildBoingNftCollectionAtDeployBytecodeHex } from '../src/services/boingDeployInit.js';
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

/** Decode the 0xFD init into its three SSTOREs, the optional registry claim and the RETURNed runtime. */
function decodeInit(hex, { registry = null } = {}) {
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
  const claimed = expectClaim(b, i, registry);
  i += claimed;
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
  return { adminSlot, amount, mask, once, onceSlot, claimed: claimed > 0, runtime: memory.subarray(retOff, retOff + len) };
}

/** Registry claim snippet at `i` (when `registry` is set): returns its length, asserting the exact bytes. */
function expectClaim(b, i, registry) {
  if (!registry) return 0;
  const snip = hexToBytes(buildLinkedNftTokenClaimSelfInitSnippetHex(registry));
  assert.equal(bytesToHex(b.subarray(i, i + snip.length)), bytesToHex(snip), 'claim_self snippet');
  return snip.length;
}

/** Decode the collection init: admin SSTORE (CALLER → 0x..e0), registry claim, RETURNed runtime. */
function decodeCollectionInit(hex, registry) {
  const b = hexToBytes(hex);
  let i = 0;
  const op = (code) => assert.equal(b[i++], code, `opcode 0x${code.toString(16)} at ${i - 1}`);
  const push32 = () => {
    op(0x7f);
    i += 32;
    return b.subarray(i - 32, i);
  };
  op(0xfd);
  op(0x33);
  const adminSlot = push32();
  op(0x55);
  i += expectClaim(b, i, registry);
  const memory = [];
  while (b[i] === 0x7f && b[i + 33] === 0x7f && b[i + 66] === 0x52) {
    const chunk = push32();
    const off = Number(BigInt(bytesToHex(push32())));
    op(0x52);
    memory.push([off, chunk]);
  }
  const len = Number(BigInt(bytesToHex(push32())));
  const retOff = Number(BigInt(bytesToHex(push32())));
  op(0xf3);
  op(0x00);
  assert.equal(i, b.length, 'no trailing bytes');
  const mem = new Uint8Array(memory.length * 32);
  for (const [off, chunk] of memory) mem.set(chunk, off);
  return { adminSlot, runtime: mem.subarray(retOff, retOff + len) };
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
  assert.deepEqual([...plan.submitOrder], ['collectionDeploy', 'tokenDeploy', 'registerLink']);
  assert.equal(plan.tokenDeployTx.type, 'contract_deploy_meta');
  assert.equal(plan.tokenDeployTx.purpose_category, 'token');
  assert.equal(plan.tokenDeployTx.asset_symbol, 'NGT');
  assert.equal(
    plan.tokenDeployTx.bytecode,
    buildBoingTokenV2MintAtDeployBytecodeHex({ supply: PROJECT_PACK_DEFAULT_TOKEN_SUPPLY, claimRegistryHex: REGISTRY })
  );
  const d = decodeInit(plan.tokenDeployTx.bytecode, { registry: REGISTRY });
  assert.ok(eqBytes(d.amount, word(1_000_000_000n)));
  assert.ok(d.claimed, 'token claims itself in the registry at deploy');
  assert.equal(bytesToHex(d.runtime), boingTokenBytecodeHex(2));
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

test('plan: collection deploy = reference collection runtime + init (admin = creator, claim_self)', () => {
  const plan = planProjectPack(base);
  const d = decodeCollectionInit(plan.collectionDeployTx.bytecode, REGISTRY);
  assert.equal(bytesToHex(d.adminSlot), BOING_NFT_COLLECTION_ADMIN_SLOT_HEX);
  assert.equal(
    bytesToHex(d.runtime),
    resolveReferenceNftCollectionTemplateBytecodeHex({ extraEnvKeys: ['REACT_APP_BOING_REFERENCE_NFT_BYTECODE_HEX'] }).toLowerCase(),
    'runtime is the unchanged reference collection template'
  );
  assert.equal(
    plan.collectionDeployTx.bytecode,
    buildBoingNftCollectionAtDeployBytecodeHex({
      runtimeHex: resolveReferenceNftCollectionTemplateBytecodeHex({}),
      claimRegistryHex: REGISTRY,
    })
  );
});

test('plan: register flow is a single register_link (both deploys claimed themselves), from the deployer', () => {
  const plan = planProjectPack(base);
  assert.equal(plan.registerFlowTxs.length, 1);
  const [reg] = plan.registerFlowTxs;
  assert.equal(reg.type, 'contract_call');
  assert.equal(String(reg.contract).toLowerCase(), REGISTRY);
  assert.equal(reg.calldata, encodeLinkedNftTokenRegisterLinkCalldataHex(plan.predictedCollectionAddress, plan.predictedTokenAddress));
  assert.equal(plan.senderHex32, DEPLOYER);
});

test('plan: custom supply changes the token (address and minted amount) but not the collection salt', () => {
  const a = planProjectPack(base);
  const b = planProjectPack({ ...base, tokenSupply: '2,500,000' });
  assert.equal(b.tokenSupply, 2_500_000n);
  assert.ok(eqBytes(decodeInit(b.tokenDeployTx.bytecode, { registry: REGISTRY }).amount, word(2_500_000n)));
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
  assert.equal(b.predictedCollectionAddress, a.predictedCollectionAddress);
  assert.deepEqual(b.registerFlowTxs, a.registerFlowTxs);
});

test('init code: different registries give different deploys; no registry means no claim; init deploys are refused as runtime', () => {
  const other = `0x${'c3'.repeat(32)}`;
  const a = buildBoingTokenV2MintAtDeployBytecodeHex({ supply: 5n, claimRegistryHex: REGISTRY });
  const b = buildBoingTokenV2MintAtDeployBytecodeHex({ supply: 5n, claimRegistryHex: other });
  assert.notEqual(a, b);
  assert.equal(decodeInit(buildBoingTokenV2MintAtDeployBytecodeHex({ supply: 5n })).claimed, false);
  assert.throws(() => buildBoingTokenV2MintAtDeployBytecodeHex({ supply: 5n, runtimeHex: a }), /not deploy init code/);
  assert.throws(() => buildBoingNftCollectionAtDeployBytecodeHex({ runtimeHex: '0xfd00' }), /not deploy init code/);
  assert.throws(() => buildBoingNftCollectionAtDeployBytecodeHex({ runtimeHex: '0x' }), /empty/);
  assert.throws(() => buildBoingTokenV2MintAtDeployBytecodeHex({ supply: 5n, claimRegistryHex: '0x1234' }));
});
