import React, { useEffect, useState } from 'react';
import { isBoingL1BlobUri } from '../utils/nftCollectionMetadata';
import { resolveBoingBlobDisplayUrl } from '../utils/boingBlobMediaUrl';

/**
 * `<img>` that resolves `boing://blob/…` via RPC getBlob; passes through https/ipfs/data URLs.
 */
export default function BoingBlobImage({ src, alt = '', className, style, ...rest }) {
  const [resolved, setResolved] = useState(() => (isBoingL1BlobUri(src) ? '' : src || ''));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    if (!src) {
      setResolved('');
      return undefined;
    }
    if (!isBoingL1BlobUri(src)) {
      setResolved(src);
      return undefined;
    }
    setResolved('');
    (async () => {
      try {
        const url = await resolveBoingBlobDisplayUrl(src);
        if (!cancelled) {
          if (url) setResolved(url);
          else setFailed(true);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [src]);

  if (failed || !resolved) {
    return (
      <div
        className={className}
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          opacity: 0.7,
          ...(style || {}),
        }}
        title={src || ''}
      >
        {failed ? 'Blob unavailable' : '…'}
      </div>
    );
  }

  return <img src={resolved} alt={alt} className={className} style={style} {...rest} />;
}
