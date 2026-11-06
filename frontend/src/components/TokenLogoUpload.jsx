/**
 * Optional token logo for Create Token. Uploads to R2; parent receives the public URL.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  isPublicAssetUri,
  publicAssetUri,
  uploadFileToR2,
  validateTokenLogoFile,
} from '../utils/r2AssetUpload';

export default function TokenLogoUpload({
  value = '',
  onChange,
  disabled = false,
}) {
  const [previewUrl, setPreviewUrl] = useState(value || null);
  const [busy, setBusy] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (value && isPublicAssetUri(value)) {
      setPreviewUrl(value);
    } else if (!value) {
      setPreviewUrl(null);
    }
  }, [value]);

  const emit = useCallback(
    (url) => {
      if (typeof onChange === 'function') onChange(url);
    },
    [onChange]
  );

  const handleFile = useCallback(
    async (file) => {
      const check = validateTokenLogoFile(file);
      if (!check.ok) {
        toast.error(check.message);
        return;
      }
      setBusy(true);
      try {
        const reader = new FileReader();
        reader.onload = (e) => setPreviewUrl(String(e.target?.result || ''));
        reader.readAsDataURL(file);

        const uploadResult = await uploadFileToR2(file);
        const publicUrl = publicAssetUri(uploadResult);
        if (!publicUrl) throw new Error('Logo upload returned no public URL.');
        setPreviewUrl(publicUrl);
        emit(publicUrl);
        toast.success('Logo uploaded');
      } catch (e) {
        setPreviewUrl(value || null);
        toast.error(e?.message || 'Logo upload failed');
      } finally {
        setBusy(false);
      }
    },
    [emit, value]
  );

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled || busy) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const clear = () => {
    setPreviewUrl(null);
    emit('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-3" data-testid="create-token-logo">
      <div
        className={`rounded-lg border border-dashed p-4 text-center transition-colors ${
          dragActive ? 'border-[var(--accent-teal)]' : ''
        } ${disabled || busy ? 'opacity-60' : 'cursor-pointer'}`}
        style={{ borderColor: dragActive ? undefined : 'var(--border-color)' }}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onDrop={onDrop}
        onClick={() => {
          if (!disabled && !busy) inputRef.current?.click();
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled && !busy) inputRef.current?.click();
          }
        }}
        aria-label="Upload token logo"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={disabled || busy}
          data-testid="create-token-logo-file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        {busy ? (
          <p className="text-sm mb-0" style={{ color: 'var(--text-secondary)' }}>
            Uploading logo…
          </p>
        ) : previewUrl ? (
          <div className="flex flex-col items-center gap-2">
            <img
              src={previewUrl}
              alt="Token logo preview"
              className="h-16 w-16 rounded-lg object-cover"
              style={{ border: '1px solid var(--border-color)' }}
              data-testid="create-token-logo-preview"
            />
            <p className="text-xs mb-0" style={{ color: 'var(--text-tertiary)' }}>
              Click to replace · PNG, JPG, GIF, WebP, SVG · up to 5 MB
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
              Token logo <span style={{ color: 'var(--text-tertiary)' }}>(optional)</span>
            </p>
            <p className="text-xs mb-0" style={{ color: 'var(--text-tertiary)' }}>
              Drop an image or click to upload. Shown on boing.observer after create.
            </p>
          </div>
        )}
      </div>

      {value ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="td-btn td-btn--ghost text-xs"
            onClick={(e) => {
              e.stopPropagation();
              clear();
            }}
            disabled={disabled || busy}
            data-testid="create-token-logo-clear"
          >
            Remove logo
          </button>
        </div>
      ) : null}

      <label className="td-field block">
        <span className="td-field__label">Or logo URL</span>
        <input
          type="url"
          value={value}
          onChange={(e) => {
            const next = e.target.value.trim();
            emit(next);
            if (next && isPublicAssetUri(next)) setPreviewUrl(next);
            if (!next) setPreviewUrl(null);
          }}
          className="td-field__input text-sm"
          placeholder="https://… or ipfs://…"
          disabled={disabled || busy}
          data-testid="create-token-logo-url"
          autoComplete="off"
        />
      </label>
    </div>
  );
}
