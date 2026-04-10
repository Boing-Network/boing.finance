/**
 * KV-style history store backed by a local file (Node CLI only). Do not import from
 * Cloudflare Pages Functions — keeps `node:fs` out of the Worker bundle graph.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';

/**
 * @param {string} path
 * @returns {import('boing-sdk').NativeDexIndexerHistoryStore}
 */
export function createFsHistoryStore(path) {
  return {
    async get() {
      if (!existsSync(path)) return null;
      return readFileSync(path, 'utf8');
    },
    async put(body) {
      writeFileSync(path, body, 'utf8');
    },
  };
}
