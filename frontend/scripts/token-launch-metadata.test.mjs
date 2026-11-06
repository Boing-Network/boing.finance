import assert from 'node:assert/strict';
import test from 'node:test';
import {
  TOKEN_LAUNCH_METADATA_SCHEMA,
  buildTokenLaunchMetadataDocument,
  descriptionHashHexFromTokenLaunchMetadata,
} from '../src/utils/tokenLaunchMetadata.js';

test('buildTokenLaunchMetadataDocument includes image aliases and v2 security', () => {
  const doc = buildTokenLaunchMetadataDocument({
    name: 'Pugs On The Block',
    symbol: 'potb',
    image: 'https://cdn.example.com/pug.png',
    initialSupply: '1000000',
  });
  assert.equal(doc.schema, TOKEN_LAUNCH_METADATA_SCHEMA);
  assert.equal(doc.symbol, 'POTB');
  assert.equal(doc.image, 'https://cdn.example.com/pug.png');
  assert.equal(doc.logoURI, 'https://cdn.example.com/pug.png');
  assert.equal(doc.decimals, 0);
  assert.equal(doc.security.renounceMint, true);
  assert.equal(doc.security.renounceOwnership, true);
});

test('descriptionHashHexFromTokenLaunchMetadata is stable blake3 hex', () => {
  const doc = buildTokenLaunchMetadataDocument({
    name: 'Alpha',
    symbol: 'ALP',
    image: 'https://cdn.example.com/a.png',
    initialSupply: '42',
  });
  const h1 = descriptionHashHexFromTokenLaunchMetadata(doc);
  const h2 = descriptionHashHexFromTokenLaunchMetadata(doc);
  assert.match(h1, /^0x[0-9a-f]{64}$/);
  assert.equal(h1, h2);
  const other = buildTokenLaunchMetadataDocument({
    name: 'Alpha',
    symbol: 'ALP',
    image: 'https://cdn.example.com/b.png',
    initialSupply: '42',
  });
  assert.notEqual(h1, descriptionHashHexFromTokenLaunchMetadata(other));
});
