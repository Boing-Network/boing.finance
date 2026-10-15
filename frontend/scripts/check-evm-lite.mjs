// Pins src/utils/evmLite.js (+ formatUnitsLite) to ethers v6 outputs. Run: node scripts/check-evm-lite.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as E from 'ethers';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'evmlite-'));
const sha3 = pathToFileURL(require.resolve('@noble/hashes/sha3')).href;
const read = (p) => fs.readFileSync(path.join(here, '..', 'src', 'utils', p), 'utf8');
fs.writeFileSync(path.join(dir, 'formatUnitsLite.mjs'), read('formatUnitsLite.js'));
fs.writeFileSync(
  path.join(dir, 'evmLite.mjs'),
  read('evmLite.js')
    .replace("'@noble/hashes/sha3'", `'${sha3}'`)
    .replace("'./formatUnitsLite'", "'./formatUnitsLite.mjs'")
    .replace("import('ethers')", "Promise.resolve({})")
);
const L = await import(pathToFileURL(path.join(dir, 'evmLite.mjs')).href);
const eq = (a, b, what) => { const sa = typeof a === 'bigint' ? a.toString() : JSON.stringify(a), sb = typeof b === 'bigint' ? b.toString() : JSON.stringify(b); if (sa !== sb) { console.log('MISMATCH', what, sa, sb); process.exitCode = 1; } };
const tryv = (f) => { try { return f(); } catch { return 'THROW'; } };
for (const [v, d] of [[0n, 18], [1n, 18], [10n ** 18n, 18], [123456789n, 6], ['5000', 2], [7, 0], [-15n, 1], [10n ** 30n, 18], [20000000000n, 'gwei']]) eq(L.formatUnits(v, d), E.formatUnits(v, d), `fmt ${v} ${d}`);
for (const [s, d] of [['1', 18], ['0.001', 18], ['1.5', 6], ['20', 'gwei'], ['.5', 18], ['5.', 2], ['1.230', 2], ['1.234', 2], ['-2.5', 3], ['abc', 2], ['', 2], ['1000000000', 18]]) eq(tryv(() => L.parseUnits(s, d)), tryv(() => E.parseUnits(s, d)), `parse ${s} ${d}`);
for (const a of ['0x52908400098527886e0f7030069857d2e4169ee7', '0x52908400098527886E0F7030069857D2E4169EE7', '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', '0x5aaeb6053F3E94C9b9A09f33669435E7Ef1BeAed', '0x123', 'zz', E.ZeroAddress]) { eq(tryv(() => L.getAddress(a)), tryv(() => E.getAddress(a)), `addr ${a}`); eq(L.isAddress(a), E.isAddress(a), `isAddr ${a}`); }
eq(L.id('PairCreated(address,address,address,uint256)'), E.id('PairCreated(address,address,address,uint256)'), 'id');
eq(L.keccak256(L.toUtf8Bytes('Transfer(address,address,uint256)')), E.keccak256(E.toUtf8Bytes('Transfer(address,address,uint256)')), 'keccak');
eq(L.zeroPadValue('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', 32), E.zeroPadValue('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', 32), 'pad');
eq(L.dataSlice('0x' + '00'.repeat(12) + '5aaeb6053f3e94c9b9a09f33669435e7ef1beaed', 12), E.dataSlice('0x' + '00'.repeat(12) + '5aaeb6053f3e94c9b9a09f33669435e7ef1beaed', 12), 'slice');
eq(L.MaxUint256, E.MaxUint256, 'max'); eq(L.ZeroAddress, E.ZeroAddress, 'zero'); eq(L.formatEther(12345n), E.formatEther(12345n), 'fe');
eq(L.toBigInt('0x10'), E.toBigInt('0x10'), 'tb'); eq(L.toBigInt(5), E.toBigInt(5), 'tb5');
console.log(process.exitCode ? 'FAIL' : 'evmLite matches ethers v6');
