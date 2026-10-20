// Create NFT - Top-notch minting UX
// Industry standards: ERC-721 metadata, local image upload, bulk minting, IPFS/R2 storage
// Solana: SPL NFT (0 decimals, supply 1) with R2-hosted metadata

import React, { useState, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useChainType, useSolanaWallet } from '../contexts/SolanaWalletContext';
import EmptyState from '../components/EmptyState';
import {
  TradeDeployShell,
  TradeDeployHero,
  StepRail,
  SegmentedControl,
  PageCard,
} from '../components/PageLayout';
import { uploadToIPFS, validateFile } from '../utils/ipfsUpload';
import {
  applyCoverImageToTokens,
  buildNftCollectionMetadataDocument,
  isPublicAssetUri,
  publicAssetUri,
  publishNftCollectionMetadata,
} from '../utils/nftCollectionMetadata';
import {
  downloadNftCsvTemplate,
  parseNftMetadataCsv,
  indexMediaFilesByBasename,
  applyMediaUrisToTokens,
  mediaMatchReport,
} from '../utils/nftCsv';
import { uploadFilesToR2Chunked, formatBytes } from '../utils/r2ChunkedUpload';
import {
  NFT_MEDIA_BUDGET_BYTES,
  NFT_MEDIA_BUDGET_GB,
  NFT_LARGE_FILE_MAX_BYTES,
  NFT_LARGE_SET_MAX_ROWS,
} from '../config/nftUploadLimits';
import { SOLANA_NETWORKS } from '../config/solanaConfig';
import toast from 'react-hot-toast';
import { BOING_NATIVE_L1_CHAIN_ID } from '../config/networks';
import { apiPath } from '../config';
import { showDeployCelebration } from '../utils/deployCelebration';
import { getBoingNativeFeeUsd, formatUsdReferenceLabel, isBoingNativeFeeChain } from '../config/boingEconomics';
import NativeBoingNftDeploySection from '../components/NativeBoingNftDeploySection';
import LinkedNftTokenPanel from '../components/LinkedNftTokenPanel';
import useEscapeKey from '../hooks/useEscapeKey';

const SOLANA_NFT_STEPS = [
  { id: 'upload', label: 'Image & Details' },
  { id: 'review', label: 'Review & Mint' },
];

const STEPS = [
  { id: 'collection', label: 'Collection' },
  { id: 'upload', label: 'Images' },
  { id: 'metadata', label: 'Metadata' },
  { id: 'review', label: 'Review & Mint' },
];

const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/gif,image/webp';
const MAX_FILE_SIZE_MB = 10;
const MAX_FILES_BULK = 50;

const DYNAMIC_SIZES = [
  { value: 100, label: '100 NFTs', feeEth: '0.001' },
  { value: 500, label: '500 NFTs', feeEth: '0.003' },
  { value: 1000, label: '1,000 NFTs', feeEth: '0.01' },
  { value: 5000, label: '5,000 NFTs', feeEth: '0.03' },
  { value: 10000, label: '10,000 NFTs', feeEth: '0.05' }
];

/** BOING display amounts for Boing L1 testnet (human BOING, not base units). */
const NFT_DYNAMIC_FEES_BOING = {
  100: '1',
  500: '2',
  1000: '5',
  5000: '15',
  10000: '50',
};

function getNftDynamicFeeAmount(chainId, collectionSize) {
  if (chainId === BOING_NATIVE_L1_CHAIN_ID) {
    return NFT_DYNAMIC_FEES_BOING[collectionSize] ?? '1';
  }
  return DYNAMIC_SIZES.find((s) => s.value === collectionSize)?.feeEth ?? '0.01';
}

function formatNftServiceFeeLine(chainId, collectionSize, nativeSymbol) {
  const amt = getNftDynamicFeeAmount(chainId, collectionSize);
  const usd = isBoingNativeFeeChain(chainId) ? getBoingNativeFeeUsd(amt) : null;
  return `${amt} ${nativeSymbol}${usd != null ? ` ${formatUsdReferenceLabel(usd)}` : ''}`;
}

const DYNAMIC_STEPS = [
  { id: 'collection', label: 'Collection & size' },
  { id: 'assets', label: 'CSV & media' },
  { id: 'review', label: 'Review & export' },
];

// ERC-721 / OpenSea standard metadata shape
function createNFTMetadata({ name, description, imageUri, attributes = [] }) {
  return {
    name,
    description: description || '',
    image: imageUri,
    external_url: '',
    attributes: attributes.filter((a) => a.trait_type && a.value != null).map(({ trait_type, value }) => ({ trait_type, value }))
  };
}

function CollectionCoverFields({
  imageUrl,
  onImageUrlChange,
  coverPreview,
  onCoverFile,
  requiredHint,
}) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-300">
        Collection image {requiredHint ? <span className="text-gray-500 font-normal">{requiredHint}</span> : null}
      </label>
      <input
        type="url"
        value={imageUrl}
        onChange={(e) => onImageUrlChange(e.target.value)}
        placeholder="https://… or ipfs://…"
        className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500"
      />
      <label className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-medium cursor-pointer inline-block">
        Upload image file
        <input
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) onCoverFile(file);
          }}
        />
      </label>
      {coverPreview ? (
        <img src={coverPreview} alt="Collection cover preview" className="w-24 h-24 rounded-lg object-cover border border-gray-600" />
      ) : null}
      <p className="text-xs text-gray-500">
        File uploads go to network storage (R2/IPFS). A public URL is written into collection metadata and hashed on native deploy.
      </p>
    </div>
  );
}

/** Normalize parsed CSV tokens into ERC-721 metadata objects (keeps `_filename` for media match). */
function normalizeCsvTokens(parsedTokens) {
  return (parsedTokens || []).map((t) => ({
    ...createNFTMetadata({
      name: t.name,
      description: t.description,
      imageUri: t.image || '',
      attributes: t.attributes || [],
    }),
    external_url: t.external_url || '',
    _filename: t._filename || '',
  }));
}

// Solana SPL NFT wizard (shown when chain type is Solana)
function CreateNFTSolanaContent() {
  const { connection, address, connected, connectWallet, signTransaction, network } = useSolanaWallet();
  const [step, setStep] = useState('upload');
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isMinting, setIsMinting] = useState(false);
  const [mintAddress, setMintAddress] = useState('');
  const [signature, setSignature] = useState('');

  const solanaNetwork = SOLANA_NETWORKS[network] || SOLANA_NETWORKS.devnet;

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Max 10MB');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleMint = async (e) => {
    e.preventDefault();
    if (!connected || !address || !signTransaction) {
      toast.error('Please connect your Solana wallet.');
      return;
    }
    if (!connection) {
      toast.error('Solana RPC is unavailable. Refresh and try again, or switch to Devnet.');
      return;
    }
    if (!name.trim() || !symbol.trim() || !imageFile) {
      toast.error('Name, symbol, and image are required.');
      return;
    }
    setIsMinting(true);
    setMintAddress('');
    setSignature('');
    try {
      const { createSPLNFT } = await import('../services/solanaNftService');
      const result = await createSPLNFT(connection, address, signTransaction, {
        name: name.trim(),
        symbol: symbol.trim().toUpperCase().slice(0, 10),
        description: description.trim(),
        imageFile,
        network,
      });
      setMintAddress(result.mintAddress);
      setSignature(result.signature);
      const solCluster = network === 'devnet' ? '?cluster=devnet' : '';
      showDeployCelebration({
        title: 'Congratulations!',
        deploymentKind: 'Solana SPL NFT (mint)',
        details: [
          { label: 'Name', value: name.trim() },
          { label: 'Symbol', value: symbol.trim().toUpperCase().slice(0, 10) },
          { label: 'Mint address', value: result.mintAddress },
          ...(result.metadataUri ? [{ label: 'Metadata URI', value: result.metadataUri }] : []),
        ],
        txHash: result.signature,
        externalTxUrl: `https://explorer.solana.com/tx/${result.signature}${solCluster}`,
        externalAddressUrl: `https://explorer.solana.com/address/${result.mintAddress}${solCluster}`,
      });
      toast.success('NFT minted successfully!');
      // Record to backend (non-blocking)
      fetch(apiPath('solana/deployments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mintAddress: result.mintAddress,
          creatorAddress: address,
          network,
          type: 'nft',
          name: name.trim(),
          symbol: symbol.trim().toUpperCase().slice(0, 10),
          metadataUri: result.metadataUri,
          signature: result.signature,
        }),
      }).catch((e) => console.warn('Record deployment failed:', e));
    } catch (err) {
      console.error('SPL NFT mint error:', err);
      toast.error(err?.message || 'Failed to mint NFT');
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Create SPL NFT - Solana | Boing Finance</title>
        <meta name="description" content="Mint SPL NFTs on Solana. Image + metadata stored on Cloudflare R2." />
      </Helmet>
      <TradeDeployShell width="narrow">
          <TradeDeployHero
            eyebrow="Launch"
            title="Create NFT"
            subtitle={`Mint on Solana (${solanaNetwork.name}). Name your collection, add art, then publish.`}
          />

          {!connected ? (
            <PageCard className="td-mint-form text-center">
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>Connect your Solana wallet to mint NFTs.</p>
              <button
                type="button"
                onClick={connectWallet}
                className="td-btn td-btn--primary"
              >
                Connect Solana Wallet
              </button>
            </PageCard>
          ) : (
            <>
              <StepRail
                steps={SOLANA_NFT_STEPS}
                currentId={step}
                onStepClick={(id) => setStep(id)}
              />

              <PageCard className="td-mint-form">
                {step === 'upload' && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="nft-single-image" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Image *</label>
                      <input id="nft-single-image" name="image" type="file" accept="image/*" onChange={handleImageSelect} className="block w-full text-theme-tertiary" />
                      {imagePreview && <img src={imagePreview} alt="Preview" className="mt-2 max-h-48 rounded-lg object-contain" />}
                    </div>
                    <div>
                      <label htmlFor="nft-single-name" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Name *</label>
                      <input
                        id="nft-single-name"
                        name="name"
                        type="text"
                        autoComplete="off"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="My NFT"
                        className="w-full px-4 py-2 rounded-lg input-field"
                      />
                    </div>
                    <div>
                      <label htmlFor="nft-single-symbol" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Symbol *</label>
                      <input
                        id="nft-single-symbol"
                        name="symbol"
                        type="text"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value.toUpperCase().slice(0, 10))}
                        placeholder="NFT"
                        className="w-full px-4 py-2 rounded-lg input-field"
                      />
                    </div>
                    <div>
                      <label htmlFor="nft-single-description" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Description</label>
                      <textarea
                        id="nft-single-description"
                        name="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your NFT"
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg input-field"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep('review')}
                      disabled={!name.trim() || !symbol.trim() || !imageFile}
                      className="w-full py-3 rounded-lg font-medium bg-cyan-600 text-white disabled:opacity-50"
                    >
                      Next: Review & Mint
                    </button>
                  </div>
                )}

                {step === 'review' && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      {imagePreview && <img src={imagePreview} alt="Preview" className="w-24 h-24 rounded-lg object-cover" />}
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{name || 'Untitled'}</p>
                        <p className="text-sm text-theme-tertiary">{symbol || '—'}</p>
                        {description && <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{description}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setStep('upload')} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleMint}
                        disabled={isMinting || !name.trim() || !symbol.trim() || !imageFile}
                        className="flex-1 py-3 rounded-lg font-medium bg-cyan-600 text-white disabled:opacity-50"
                      >
                        {isMinting ? 'Minting…' : 'Mint NFT'}
                      </button>
                    </div>
                    {mintAddress && signature && (
                      <div className="mt-4 pt-4 border-t border-gray-600 space-y-2">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Minted!</p>
                        <p className="text-xs text-gray-400 break-all">Mint: {mintAddress}</p>
                        <a href={`${solanaNetwork.explorer}/tx/${signature}`} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-400 hover:underline">
                          View on Explorer
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </PageCard>
            </>
          )}
      </TradeDeployShell>
    </>
  );
}

export default function CreateNFT() {
  const { isSolana } = useChainType();
  const { account: _account, isConnected, getCurrentNetwork, connectWallet, chainId, walletType } = useWallet();
  const [searchParams] = useSearchParams();
  const linkTokenFromQuery = searchParams.get('linkToken') || searchParams.get('token') || '';
  const [step, setStep] = useState('collection');
  const [collectionName, setCollectionName] = useState('');
  const [collectionSymbol, setCollectionSymbol] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploadedUris, setUploadedUris] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [collectionImageUrl, setCollectionImageUrl] = useState('');
  const [collectionCoverFile, setCollectionCoverFile] = useState(null);
  const [collectionCoverPreview, setCollectionCoverPreview] = useState('');
  const [uploadedCoverUri, setUploadedCoverUri] = useState('');
  const [publishedMetadataUri, setPublishedMetadataUri] = useState('');
  const [publishedDescriptionHash, setPublishedDescriptionHash] = useState('');
  const [publishedCoverUri, setPublishedCoverUri] = useState('');
  const [publishedFingerprint, setPublishedFingerprint] = useState('');
  const [isPublishingMetadata, setIsPublishingMetadata] = useState(false);

  const [tokenMetadata, setTokenMetadata] = useState([]);
  const [useSameMetadata, setUseSameMetadata] = useState(false);
  const [bulkName, setBulkName] = useState('');
  const [bulkDescription, setBulkDescription] = useState('');

  const [_isMinting, _setIsMinting] = useState(false);

  const [mode, setMode] = useState('standard');
  const [dynamicSize, setDynamicSize] = useState(1000);
  const [traitLayers, setTraitLayers] = useState([{ trait_type: '', values: [''] }]);
  const [generatedDynamicMetadata, setGeneratedDynamicMetadata] = useState([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [csvWarnings, setCsvWarnings] = useState([]);
  const [largeMediaFiles, setLargeMediaFiles] = useState([]);
  const [largeMediaUriByFile, setLargeMediaUriByFile] = useState({});
  const [largeUploadProgress, setLargeUploadProgress] = useState(null);
  const [isLargeMediaUploading, setIsLargeMediaUploading] = useState(false);
  const [previewTokenIndex, setPreviewTokenIndex] = useState(null);
  useEscapeKey(previewTokenIndex != null, () => setPreviewTokenIndex(null));

  const largeMediaFileMap = useMemo(
    () => indexMediaFilesByBasename(largeMediaFiles),
    [largeMediaFiles]
  );
  const largeMediaMatch = useMemo(
    () => mediaMatchReport(generatedDynamicMetadata, largeMediaFileMap),
    [generatedDynamicMetadata, largeMediaFileMap]
  );
  const largeMediaTotalBytes = useMemo(
    () => largeMediaFiles.reduce((s, f) => s + (f.size || 0), 0),
    [largeMediaFiles]
  );

  const network = getCurrentNetwork?.();
  const nativeSymbol = network?.nativeCurrency?.symbol ?? 'ETH';
  const dynamicFeeDisplayLine = formatNftServiceFeeLine(network?.chainId, dynamicSize, nativeSymbol);
  const isBoingNativeNftWizard =
    isConnected && chainId === BOING_NATIVE_L1_CHAIN_ID && walletType === 'boingExpress';

  const addFiles = useCallback((newFiles) => {
    const fileList = Array.from(newFiles || []);
    const valid = [];
    for (const file of fileList) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name}: not an image`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`${file.name}: max ${MAX_FILE_SIZE_MB}MB`);
        continue;
      }
      if (files.length + valid.length >= MAX_FILES_BULK) {
        toast.error(`Max ${MAX_FILES_BULK} images per batch`);
        break;
      }
      valid.push(file);
    }
    if (valid.length === 0) return;
    setFiles((prev) => [...prev, ...valid].slice(0, MAX_FILES_BULK));
    const readers = valid.map((f) => {
      const r = new FileReader();
      r.readAsDataURL(f);
      return new Promise((res) => { r.onload = () => res(r.result); });
    });
    Promise.all(readers).then((urls) => setPreviews((p) => [...p, ...urls]));
    setTokenMetadata((prev) => {
      const next = [...prev];
      for (let i = 0; i < valid.length; i++) {
        next.push({ name: '', description: '', attributes: [{ trait_type: '', value: '' }] });
      }
      return next;
    });
  }, [files.length]);

  const removeFile = useCallback((index) => {
    setFiles((p) => p.filter((_, i) => i !== index));
    setPreviews((p) => p.filter((_, i) => i !== index));
    setUploadedUris((p) => p.filter((_, i) => i !== index));
    setTokenMetadata((p) => p.filter((_, i) => i !== index));
  }, []);

  const updateTokenMeta = useCallback((index, field, value) => {
    setTokenMetadata((prev) => {
      const next = [...prev];
      if (!next[index]) next[index] = { name: '', description: '', attributes: [{ trait_type: '', value: '' }] };
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }, []);

  const updateTokenAttribute = useCallback((tokenIndex, attrIndex, field, value) => {
    setTokenMetadata((prev) => {
      const next = [...prev];
      if (!next[tokenIndex]) next[tokenIndex] = { name: '', description: '', attributes: [{ trait_type: '', value: '' }] };
      const attrs = [...(next[tokenIndex].attributes || [])];
      if (!attrs[attrIndex]) attrs[attrIndex] = { trait_type: '', value: '' };
      attrs[attrIndex] = { ...attrs[attrIndex], [field]: value };
      next[tokenIndex] = { ...next[tokenIndex], attributes: attrs };
      return next;
    });
  }, []);

  const addTokenAttribute = useCallback((tokenIndex) => {
    setTokenMetadata((prev) => {
      const next = [...prev];
      if (!next[tokenIndex]) next[tokenIndex] = { name: '', description: '', attributes: [{ trait_type: '', value: '' }] };
      next[tokenIndex] = {
        ...next[tokenIndex],
        attributes: [...(next[tokenIndex].attributes || []), { trait_type: '', value: '' }]
      };
      return next;
    });
  }, []);

  const removeTokenAttribute = useCallback((tokenIndex, attrIndex) => {
    setTokenMetadata((prev) => {
      const next = [...prev];
      if (!next[tokenIndex]?.attributes?.length) return prev;
      const attrs = next[tokenIndex].attributes.filter((_, i) => i !== attrIndex);
      next[tokenIndex] = { ...next[tokenIndex], attributes: attrs.length ? attrs : [{ trait_type: '', value: '' }] };
      return next;
    });
  }, []);

  const onCollectionCoverFile = useCallback((file) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`Max ${MAX_FILE_SIZE_MB}MB`);
      return;
    }
    setCollectionCoverFile(file);
    setUploadedCoverUri('');
    setPublishedFingerprint('');
    const reader = new FileReader();
    reader.onload = () => setCollectionCoverPreview(typeof reader.result === 'string' ? reader.result : '');
    reader.readAsDataURL(file);
  }, []);

  const resolvedCoverUri = useCallback((tokenImages = uploadedUris) => {
    if (isPublicAssetUri(uploadedCoverUri)) return uploadedCoverUri;
    if (isPublicAssetUri(collectionImageUrl)) return publicAssetUri(collectionImageUrl);
    const first = tokenImages.find((u) => isPublicAssetUri(u));
    return first || '';
  }, [collectionImageUrl, uploadedCoverUri, uploadedUris]);

  const uploadImages = useCallback(async () => {
    if (files.length === 0) {
      toast.error('Add at least one image');
      return [];
    }
    setIsUploading(true);
    const uris = [];
    try {
      for (let i = 0; i < files.length; i++) {
        try {
          validateFile(files[i]);
        } catch (e) {
          toast.error(`Image ${i + 1}: ${e.message}`);
          continue;
        }
        const result = await uploadToIPFS(files[i]);
        const uri = publicAssetUri(result);
        if (uri) uris.push(uri);
      }
      setUploadedUris(uris);
      setPublishedFingerprint('');
      if (uris.length > 0) toast.success(`${uris.length} image(s) uploaded`);
      if (uris.length < files.length) toast.error('Some uploads failed');
      return uris;
    } catch (err) {
      toast.error(err?.message || 'Upload failed');
      return uris;
    } finally {
      setIsUploading(false);
    }
  }, [files]);

  const canProceed = () => {
    if (step === 'collection') return collectionName.trim() && collectionSymbol.trim();
    if (step === 'upload') return files.length > 0 && uploadedUris.length === files.length;
    if (step === 'metadata') {
      if (useSameMetadata) return bulkName.trim();
      return tokenMetadata.every((m, i) => (m?.name ?? '').trim() || files[i]?.name);
    }
    return true;
  };

  const handleNext = async () => {
    if (step === 'collection') setStep('upload');
    else if (step === 'upload') {
      if (files.length === 0) {
        toast.error('Add at least one image');
        return;
      }
      if (uploadedUris.length < files.length) {
        const uris = await uploadImages();
        if (!uris || uris.length < files.length) return;
      }
      setStep('metadata');
    } else if (step === 'metadata') {
      setStep('review');
    }
  };

  const handleBack = () => {
    if (step === 'upload') setStep('collection');
    else if (step === 'metadata') setStep('upload');
    else if (step === 'review') setStep('metadata');
  };

  const getFinalMetadataList = () => {
    const list = [];
    const count = Math.max(files.length, uploadedUris.length, tokenMetadata.length);
    for (let i = 0; i < count; i++) {
      const baseName = useSameMetadata ? `${bulkName} #${i + 1}` : (tokenMetadata[i]?.name || files[i]?.name?.replace(/\.[^.]+$/, '') || `Token ${i + 1}`);
      const baseDesc = useSameMetadata ? bulkDescription : (tokenMetadata[i]?.description || '');
      const attrs = useSameMetadata ? [] : (tokenMetadata[i]?.attributes || []).filter((a) => a.trait_type && a.value);
      list.push(
        createNFTMetadata({
          name: baseName,
          description: baseDesc,
          imageUri: uploadedUris[i] || '',
          attributes: attrs
        })
      );
    }
    return list;
  };

  const tokenListForPublish = useCallback(() => {
    if (mode === 'dynamic' && generatedDynamicMetadata.length > 0) {
      return generatedDynamicMetadata;
    }
    return getFinalMetadataList();
  }, [mode, generatedDynamicMetadata, files, uploadedUris, tokenMetadata, useSameMetadata, bulkName, bulkDescription]);

  const ensurePublishedMetadata = useCallback(async () => {
    let cover = resolvedCoverUri();
    if (!cover && collectionCoverFile) {
      try {
        validateFile(collectionCoverFile);
        const uploaded = await uploadToIPFS(collectionCoverFile);
        cover = publicAssetUri(uploaded);
        if (cover) setUploadedCoverUri(cover);
      } catch (e) {
        throw new Error(e?.message || 'Collection image upload failed');
      }
    }
    if (!isPublicAssetUri(cover)) {
      throw new Error('Add a collection image file or a public image URL before publishing metadata.');
    }
    const tokens = applyCoverImageToTokens(tokenListForPublish(), cover);
    const fingerprint = JSON.stringify({
      name: collectionName,
      symbol: collectionSymbol,
      description: collectionDescription,
      cover,
      tokens,
    });
    if (
      fingerprint === publishedFingerprint &&
      isPublicAssetUri(publishedMetadataUri) &&
      publishedDescriptionHash
    ) {
      return {
        metadataUri: publishedMetadataUri,
        descriptionHash: publishedDescriptionHash,
        coverImageUri: publishedCoverUri || cover,
        image: publishedCoverUri || cover,
      };
    }
    setIsPublishingMetadata(true);
    try {
      const doc = buildNftCollectionMetadataDocument({
        name: collectionName,
        symbol: collectionSymbol,
        description: collectionDescription,
        image: cover,
        tokens,
      });
      const published = await publishNftCollectionMetadata(doc);
      setPublishedMetadataUri(published.metadataUri);
      setPublishedDescriptionHash(published.descriptionHash);
      setPublishedCoverUri(cover);
      setPublishedFingerprint(fingerprint);
      toast.success('Collection metadata uploaded');
      return {
        metadataUri: published.metadataUri,
        descriptionHash: published.descriptionHash,
        coverImageUri: cover,
        image: cover,
      };
    } finally {
      setIsPublishingMetadata(false);
    }
  }, [
    collectionCoverFile,
    collectionDescription,
    collectionName,
    collectionSymbol,
    publishedCoverUri,
    publishedDescriptionHash,
    publishedFingerprint,
    publishedMetadataUri,
    resolvedCoverUri,
    tokenListForPublish,
  ]);

  const exportMetadataJSON = () => {
    const list = mode === 'dynamic' && generatedDynamicMetadata.length > 0 ? generatedDynamicMetadata : getFinalMetadataList();
    const blob = new Blob([JSON.stringify(list.length === 1 ? list[0] : list, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${collectionSymbol || 'collection'}-metadata.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success('Metadata JSON downloaded');
  };

  const updateTraitLayer = (layerIndex, field, value) => {
    setTraitLayers((prev) => {
      const next = [...prev];
      if (!next[layerIndex]) next[layerIndex] = { trait_type: '', values: [''] };
      if (field === 'trait_type') next[layerIndex] = { ...next[layerIndex], trait_type: value };
      else if (field === 'values') next[layerIndex] = { ...next[layerIndex], values: Array.isArray(value) ? value : [value] };
      return next;
    });
  };

  const setTraitLayerValues = (layerIndex, values) => {
    setTraitLayers((prev) => {
      const next = [...prev];
      if (!next[layerIndex]) next[layerIndex] = { trait_type: '', values: [''] };
      next[layerIndex] = { ...next[layerIndex], values: values.length ? values : [''] };
      return next;
    });
  };

  const addTraitLayerValue = (layerIndex) => {
    setTraitLayers((prev) => {
      const next = [...prev];
      if (!next[layerIndex]) next[layerIndex] = { trait_type: '', values: [''] };
      next[layerIndex] = { ...next[layerIndex], values: [...(next[layerIndex].values || []), ''] };
      return next;
    });
  };

  const removeTraitLayerValue = (layerIndex, valueIndex) => {
    setTraitLayers((prev) => {
      const next = [...prev];
      const vals = (next[layerIndex]?.values || []).filter((_, i) => i !== valueIndex);
      next[layerIndex] = { ...next[layerIndex], values: vals.length ? vals : [''] };
      return next;
    });
  };

  const addTraitLayer = () => {
    setTraitLayers((prev) => [...prev, { trait_type: '', values: [''] }]);
  };

  const removeTraitLayer = (layerIndex) => {
    setTraitLayers((prev) => prev.filter((_, i) => i !== layerIndex));
  };

  const handleCSVUpload = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result;
        if (!text) return;
        const { tokens, warnings } = parseNftMetadataCsv(text, NFT_LARGE_SET_MAX_ROWS);
        if (tokens.length === 0) {
          toast.error('CSV has no data rows or invalid format');
          return;
        }
        setGeneratedDynamicMetadata(normalizeCsvTokens(tokens));
        setCsvFileName(file.name);
        setCsvWarnings(warnings || []);
        setPublishedFingerprint('');
        setDynamicSize(Math.min(tokens.length, NFT_LARGE_SET_MAX_ROWS));
        toast.success(`Imported ${tokens.length} tokens from CSV`);
        warnings?.forEach((w) => toast(w));
      } catch (err) {
        toast.error(err?.message || 'Failed to parse CSV');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const addLargeMediaFiles = useCallback((incoming) => {
    const list = Array.from(incoming || []);
    if (list.length === 0) return;
    const next = [...largeMediaFiles];
    let added = 0;
    let skipped = 0;
    const existing = new Set(next.map((f) => f.name.toLowerCase()));
    for (const file of list) {
      if (!file.type?.startsWith('image/')) {
        skipped += 1;
        continue;
      }
      if (file.size > NFT_LARGE_FILE_MAX_BYTES) {
        toast.error(`${file.name}: max ${formatBytes(NFT_LARGE_FILE_MAX_BYTES)}`);
        skipped += 1;
        continue;
      }
      const key = file.name.toLowerCase();
      if (existing.has(key)) continue;
      const projected = next.reduce((s, f) => s + f.size, 0) + file.size;
      if (projected > NFT_MEDIA_BUDGET_BYTES) {
        toast.error(`Media budget is ${NFT_MEDIA_BUDGET_GB} GB for this release`);
        break;
      }
      if (next.length >= NFT_LARGE_SET_MAX_ROWS) {
        toast.error(`Max ${NFT_LARGE_SET_MAX_ROWS.toLocaleString()} media files`);
        break;
      }
      next.push(file);
      existing.add(key);
      added += 1;
    }
    setLargeMediaFiles(next);
    if (added) toast.success(`Added ${added} media file(s)`);
    else if (skipped) toast.error('No new image files added');
  }, [largeMediaFiles]);

  const clearLargeMedia = useCallback(() => {
    setLargeMediaFiles([]);
    setLargeMediaUriByFile({});
    setLargeUploadProgress(null);
  }, []);

  const uploadLargeMedia = useCallback(async () => {
    if (largeMediaFiles.length === 0) {
      toast.error('Add media files that match CSV filenames');
      return false;
    }
    if (largeMediaTotalBytes > NFT_MEDIA_BUDGET_BYTES) {
      toast.error(`Total media exceeds ${NFT_MEDIA_BUDGET_GB} GB budget`);
      return false;
    }
    setIsLargeMediaUploading(true);
    setLargeUploadProgress({ loaded: 0, total: largeMediaTotalBytes, ratio: 0, completed: 0, failed: 0 });
    try {
      const { results, failures } = await uploadFilesToR2Chunked(largeMediaFiles, {
        onTotalProgress: setLargeUploadProgress,
      });
      const uriMap = { ...largeMediaUriByFile };
      for (const { file, uri } of results) {
        uriMap[file.name.toLowerCase()] = uri;
      }
      setLargeMediaUriByFile(uriMap);
      if (generatedDynamicMetadata.length > 0) {
        setGeneratedDynamicMetadata((prev) => applyMediaUrisToTokens(prev, uriMap));
        setPublishedFingerprint('');
      }
      if (results.length) toast.success(`Uploaded ${results.length} media file(s)`);
      if (failures.length) {
        toast.error(`${failures.length} upload(s) failed — retry or remove those files`);
      }
      return failures.length === 0 && results.length > 0;
    } catch (err) {
      toast.error(err?.message || 'Media upload failed');
      return false;
    } finally {
      setIsLargeMediaUploading(false);
    }
  }, [largeMediaFiles, largeMediaTotalBytes, largeMediaUriByFile, generatedDynamicMetadata.length]);

  const generateDynamicMetadata = () => {
    const layers = traitLayers.filter((l) => (l.trait_type || '').trim() && (l.values || []).some((v) => String(v).trim()));
    if (layers.length === 0) {
      toast.error('Add at least one trait layer with type and values');
      return;
    }
    const baseName = collectionName.trim() || 'Collection';
    const list = [];
    for (let i = 0; i < dynamicSize; i++) {
      const attrs = [];
      for (const layer of layers) {
        const vals = (layer.values || []).map(String).filter(Boolean);
        if (vals.length === 0) continue;
        const value = vals[Math.floor(Math.random() * vals.length)];
        attrs.push({ trait_type: layer.trait_type.trim(), value });
      }
      list.push(
        createNFTMetadata({
          name: `${baseName} #${i + 1}`,
          description: collectionDescription.trim() || `${baseName} collection`,
          imageUri: resolvedCoverUri([]),
          attributes: attrs
        })
      );
    }
    setGeneratedDynamicMetadata(list);
    setCsvFileName('');
    setCsvWarnings([]);
    toast.success(`Generated ${list.length} metadata entries`);
  };

  if (isSolana) return <CreateNFTSolanaContent />;

  // Dev-only: ?demo=1 skips the wallet gate for local UI review / screenshots.
  const demoWizard =
    typeof process !== 'undefined' &&
    process.env.NODE_ENV === 'development' &&
    searchParams.get('demo') === '1';

  if (!isConnected && !demoWizard) {
    return (
      <>
        <Helmet>
          <title>Create NFT | boing.finance</title>
          <meta name="description" content="Name your collection, add art, then publish on boing.finance." />
        </Helmet>
        <TradeDeployShell width="medium">
          <TradeDeployHero
            eyebrow="Launch"
            title="Create NFT"
            subtitle="Name your collection, add art, then publish. Connect a wallet to continue."
          />
          <PageCard className="td-mint-form">
            <EmptyState
              variant="nfts"
              title="Connect your wallet"
              description="Connect to create a collection. Need a token too? Use Project pack."
              action={connectWallet}
              actionLabel="Connect wallet"
              secondaryLabel="Project pack"
              secondaryHref="/project-pack"
            />
          </PageCard>
        </TradeDeployShell>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Create NFT | boing.finance</title>
        <meta name="description" content="Name your collection, add art, then publish on boing.finance." />
      </Helmet>
      <TradeDeployShell width="medium">
          <TradeDeployHero
            eyebrow="Launch"
            title="Create NFT"
            subtitle="Name your collection, add art, then publish."
          >
            <p className="mt-3 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Need a token too?{' '}
              <Link to="/project-pack" className="underline" style={{ color: 'var(--finance-primary)' }}>
                Project pack
              </Link>
            </p>
          </TradeDeployHero>

          <div className="flex justify-center mb-6">
            <SegmentedControl
              aria-label="Mint mode"
              value={mode}
              onChange={(next) => {
                setMode(next);
                setStep('collection');
              }}
              options={[
                { value: 'standard', label: 'Standard' },
                { value: 'dynamic', label: 'Large set (CSV)' },
              ]}
            />
          </div>

          <StepRail
            steps={mode === 'dynamic' ? DYNAMIC_STEPS : STEPS}
            currentId={step}
            onStepClick={(id) => setStep(id)}
          />

          <PageCard className="td-mint-form">
            {/* ========== Dynamic collection flow ========== */}
            {mode === 'dynamic' && (
              <>
                {step === 'collection' && (
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm text-gray-400">
                        Network: <span className="font-medium text-gray-300">{network?.name || 'Not connected'}</span>
                        {network && <span className="ml-2 text-xs text-gray-500">(change in navbar)</span>}
                      </p>
                    </div>
                    <div>
                      <label htmlFor="nft-dynamic-collection-name" className="block text-sm font-medium text-gray-300 mb-2">Collection Name *</label>
                      <input
                        id="nft-dynamic-collection-name"
                        name="collectionName"
                        type="text"
                        value={collectionName}
                        onChange={(e) => setCollectionName(e.target.value)}
                        placeholder="My Dynamic Collection"
                        className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="nft-dynamic-collection-symbol" className="block text-sm font-medium text-gray-300 mb-2">Symbol *</label>
                      <input
                        id="nft-dynamic-collection-symbol"
                        name="collectionSymbol"
                        type="text"
                        value={collectionSymbol}
                        onChange={(e) => setCollectionSymbol(e.target.value.toUpperCase().slice(0, 10))}
                        placeholder="DYN"
                        maxLength={10}
                        className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="nft-dynamic-size" className="block text-sm font-medium text-gray-300 mb-2">Collection size (up to 10,000)</label>
                      <select
                        id="nft-dynamic-size"
                        name="dynamicSize"
                        value={dynamicSize}
                        onChange={(e) => setDynamicSize(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-cyan-500"
                      >
                        {DYNAMIC_SIZES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label} — future mint reference: {formatNftServiceFeeLine(network?.chainId, s.value, nativeSymbol)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="p-4 rounded-lg bg-cyan-900/20 border border-cyan-500/30">
                      <p className="text-cyan-200 font-medium">Reference size: {dynamicSize.toLocaleString()} tokens</p>
                      <p className="text-cyan-200/80 text-sm mt-1">
                        This wizard exports metadata only. No platform fee is charged here. A future mint contract may
                        quote a fee separately (reference: {dynamicFeeDisplayLine}).
                      </p>
                    </div>
                    <div>
                      <label htmlFor="nft-dynamic-description" className="block text-sm font-medium text-gray-300 mb-2">Description (optional)</label>
                      <textarea
                        id="nft-dynamic-description"
                        name="collectionDescription"
                        value={collectionDescription}
                        onChange={(e) => setCollectionDescription(e.target.value)}
                        placeholder="Description of your dynamic collection"
                        rows={2}
                        className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 resize-none"
                      />
                    </div>
                    <CollectionCoverFields
                      imageUrl={collectionImageUrl}
                      onImageUrlChange={(v) => { setCollectionImageUrl(v); setPublishedFingerprint(''); }}
                      coverPreview={collectionCoverPreview}
                      onCoverFile={onCollectionCoverFile}
                      requiredHint="(file or URL — used in on-chain metadata)"
                    />
                  </div>
                )}
                {step === 'assets' && (
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <h3 className="text-white font-medium">1. Collection CSV</h3>
                      <p className="text-gray-400 text-sm">
                        OpenSea-style spreadsheet: <code className="bg-gray-700 px-1 rounded">filename</code>,{' '}
                        <code className="bg-gray-700 px-1 rounded">name</code>,{' '}
                        <code className="bg-gray-700 px-1 rounded">description</code>, optional{' '}
                        <code className="bg-gray-700 px-1 rounded">external_url</code> /{' '}
                        <code className="bg-gray-700 px-1 rounded">image</code>, plus trait columns. Max{' '}
                        {NFT_LARGE_SET_MAX_ROWS.toLocaleString()} rows.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            downloadNftCsvTemplate();
                            toast.success('CSV template downloaded');
                          }}
                          className="td-btn td-btn--ghost"
                        >
                          Download CSV template
                        </button>
                        <label className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium cursor-pointer">
                          Upload CSV
                          <input type="file" accept=".csv,text/csv" onChange={handleCSVUpload} className="hidden" />
                        </label>
                      </div>
                      {csvFileName ? (
                        <p className="text-sm text-green-400">
                          Loaded {csvFileName}: {generatedDynamicMetadata.length.toLocaleString()} token(s)
                        </p>
                      ) : null}
                      {csvWarnings.length > 0 ? (
                        <ul className="text-xs text-amber-300/90 list-disc pl-5 space-y-1">
                          {csvWarnings.map((w) => (
                            <li key={w}>{w}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-white font-medium">2. NFT media</h3>
                      <p className="text-gray-400 text-sm">
                        Upload a folder or many image files whose names match the CSV{' '}
                        <code className="bg-gray-700 px-1 rounded">filename</code> column. Chunked upload to network
                        storage (budget {NFT_MEDIA_BUDGET_GB} GB total; up to {formatBytes(NFT_LARGE_FILE_MAX_BYTES)} per
                        file). Prefer a folder of files over a multi‑GB zip in the browser.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <label className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-medium cursor-pointer">
                          Choose folder
                          <input
                            type="file"
                            className="hidden"
                            webkitdirectory=""
                            directory=""
                            multiple
                            accept={ACCEPTED_IMAGE_TYPES}
                            onChange={(e) => {
                              addLargeMediaFiles(e.target.files);
                              e.target.value = '';
                            }}
                          />
                        </label>
                        <label className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-medium cursor-pointer">
                          Choose files
                          <input
                            type="file"
                            className="hidden"
                            multiple
                            accept={ACCEPTED_IMAGE_TYPES}
                            onChange={(e) => {
                              addLargeMediaFiles(e.target.files);
                              e.target.value = '';
                            }}
                          />
                        </label>
                        {largeMediaFiles.length > 0 ? (
                          <button type="button" onClick={clearLargeMedia} className="td-btn td-btn--ghost">
                            Clear media
                          </button>
                        ) : null}
                      </div>
                      {largeMediaFiles.length > 0 ? (
                        <div className="space-y-2 text-sm text-gray-300">
                          <p>
                            {largeMediaFiles.length.toLocaleString()} file(s) · {formatBytes(largeMediaTotalBytes)} /{' '}
                            {NFT_MEDIA_BUDGET_GB} GB
                          </p>
                          {generatedDynamicMetadata.length > 0 ? (
                            <p className="text-gray-400">
                              CSV filenames needing art: {largeMediaMatch.needed.length}
                              {largeMediaMatch.missing.length > 0
                                ? ` · missing ${largeMediaMatch.missing.length} (${largeMediaMatch.missing.slice(0, 5).join(', ')}${largeMediaMatch.missing.length > 5 ? '…' : ''})`
                                : ' · all matched or have image URLs'}
                            </p>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => uploadLargeMedia()}
                            disabled={isLargeMediaUploading}
                            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium disabled:opacity-50"
                          >
                            {isLargeMediaUploading ? 'Uploading media…' : 'Upload media to network'}
                          </button>
                          {largeUploadProgress ? (
                            <div className="space-y-1">
                              <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
                                <div
                                  className="h-full bg-cyan-500 transition-[width] duration-200"
                                  style={{ width: `${Math.min(100, Math.round((largeUploadProgress.ratio || 0) * 100))}%` }}
                                />
                              </div>
                              <p className="text-xs text-gray-400">
                                {formatBytes(largeUploadProgress.loaded)} / {formatBytes(largeUploadProgress.total)}
                                {largeUploadProgress.completed != null
                                  ? ` · ${largeUploadProgress.completed} done`
                                  : ''}
                                {largeUploadProgress.failed
                                  ? ` · ${largeUploadProgress.failed} failed`
                                  : ''}
                              </p>
                            </div>
                          ) : null}
                          {Object.keys(largeMediaUriByFile).length > 0 ? (
                            <p className="text-green-400 text-xs">
                              {Object.keys(largeMediaUriByFile).length} file(s) have network URLs linked into metadata.
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <details className="rounded-lg border border-gray-600 bg-gray-700/30 p-4">
                      <summary className="cursor-pointer text-sm text-gray-300 font-medium">
                        Advanced: generate from trait layers (no per-token art)
                      </summary>
                      <div className="mt-4 space-y-4">
                        <p className="text-gray-400 text-sm">
                          Optional fallback if you do not have a CSV. Each layer has a name and values; metadata uses
                          random combinations and the collection cover as the image.
                        </p>
                        {traitLayers.map((layer, li) => (
                          <div key={li} className="p-4 rounded-lg bg-gray-700/50 border border-gray-600">
                            <div className="flex items-center gap-2 mb-2">
                              <input
                                type="text"
                                value={layer.trait_type || ''}
                                onChange={(e) => updateTraitLayer(li, 'trait_type', e.target.value)}
                                placeholder="Trait name (e.g. Background)"
                                className="flex-1 px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white"
                              />
                              <button type="button" onClick={() => removeTraitLayer(li)} className="px-2 py-1.5 rounded bg-red-600/80 hover:bg-red-500 text-white text-sm">Remove layer</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {(layer.values || ['']).map((v, vi) => (
                                <div key={vi} className="flex gap-1">
                                  <input
                                    type="text"
                                    value={v}
                                    onChange={(e) => {
                                      const vals = [...(layer.values || [])];
                                      vals[vi] = e.target.value;
                                      setTraitLayerValues(li, vals);
                                    }}
                                    placeholder="Value"
                                    className="w-28 px-2 py-1.5 rounded bg-gray-700 border border-gray-600 text-white text-sm"
                                  />
                                  <button type="button" onClick={() => removeTraitLayerValue(li, vi)} className="text-red-400 hover:text-red-300">×</button>
                                </div>
                              ))}
                              <button type="button" onClick={() => addTraitLayerValue(li)} className="text-cyan-400 hover:text-cyan-300 text-sm">+ Value</button>
                            </div>
                          </div>
                        ))}
                        <div className="flex flex-wrap gap-3">
                          <button type="button" onClick={addTraitLayer} className="td-btn td-btn--ghost">
                            + Add trait layer
                          </button>
                          <button type="button" onClick={generateDynamicMetadata} className="px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-medium">
                            Generate from trait layers
                          </button>
                        </div>
                      </div>
                    </details>
                  </div>
                )}
                {step === 'review' && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-lg bg-gray-700/50 border border-gray-600">
                      <p className="text-gray-300 font-medium">{collectionName || 'Collection'}</p>
                      <p className="text-gray-500 text-sm">
                        {collectionSymbol} · {generatedDynamicMetadata.length || dynamicSize} NFTs
                        {csvFileName ? ` · ${csvFileName}` : ''}
                        {' · '}reference fee: {dynamicFeeDisplayLine}
                      </p>
                    </div>
                    {generatedDynamicMetadata.length === 0 ? (
                      <div className="space-y-4">
                        <p className="text-amber-200/90 text-sm">
                          No metadata yet. Go back to <strong>CSV &amp; media</strong> to upload a spreadsheet (or use trait layers).
                        </p>
                        <button type="button" onClick={() => setStep('assets')} className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium">
                          Back to CSV &amp; media
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-green-400">Ready: {generatedDynamicMetadata.length} metadata entries.</p>
                        {largeMediaMatch.missing.length > 0 ? (
                          <p className="text-amber-300 text-sm">
                            {largeMediaMatch.missing.length} CSV filename(s) still lack media or image URLs. You can still
                            export JSON or deploy the collection contract; art can be filled later.
                          </p>
                        ) : null}
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => ensurePublishedMetadata().catch((e) => toast.error(e?.message || 'Metadata upload failed'))}
                            disabled={isPublishingMetadata}
                            className="px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-medium disabled:opacity-50"
                          >
                            {isPublishingMetadata ? 'Uploading metadata…' : 'Upload metadata to network'}
                          </button>
                          <button type="button" onClick={exportMetadataJSON} className="td-btn td-btn--ghost">
                            Export metadata JSON
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setGeneratedDynamicMetadata([]);
                              setCsvFileName('');
                              setCsvWarnings([]);
                              setStep('assets');
                            }}
                            className="td-btn td-btn--ghost"
                          >
                            Clear &amp; re-import
                          </button>
                          <label className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-medium cursor-pointer">
                            Replace with CSV
                            <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
                          </label>
                        </div>
                        {publishedMetadataUri ? (
                          <p className="text-sm text-gray-400">
                            Network metadata:{' '}
                            <a href={publishedMetadataUri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline break-all">
                              {publishedMetadataUri}
                            </a>
                          </p>
                        ) : null}
                        {isBoingNativeNftWizard && generatedDynamicMetadata.length > 0 && (
                          <>
                            <NativeBoingNftDeploySection
                              embedInWizard
                              collectionName={collectionName}
                              collectionSymbol={collectionSymbol}
                              metadataUri={publishedMetadataUri}
                              committedDescriptionHash={publishedDescriptionHash}
                              coverImageUri={publishedCoverUri || resolvedCoverUri(generatedDynamicMetadata.map((m) => m.image))}
                              onEnsureMetadataPublished={ensurePublishedMetadata}
                              linkTokenId={linkTokenFromQuery}
                            />
                            <details className="mt-2">
                              <summary className="cursor-pointer text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                Advanced tools
                              </summary>
                              <Link
                                to="/boing/native-vm"
                                className="mt-2 px-4 py-2 rounded-lg border border-cyan-500/50 text-cyan-300 text-sm font-medium inline-flex items-center hover:bg-cyan-950/40"
                              >
                                Native VM tools
                              </Link>
                            </details>
                          </>
                        )}
                        <h3 className="text-lg font-semibold text-white mt-4">Preview — what you’re minting</h3>
                        <p className="text-gray-400 text-sm">Showing first 24 of {generatedDynamicMetadata.length}. Click a card to see full metadata.</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-80 overflow-y-auto">
                          {generatedDynamicMetadata.slice(0, 24).map((meta, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setPreviewTokenIndex(mode === 'dynamic' ? `d-${i}` : i)}
                              className="rounded-lg border border-gray-600 overflow-hidden bg-gray-800 text-left hover:border-cyan-500/50 transition-colors"
                            >
                              {isPublicAssetUri(meta.image) || collectionCoverPreview ? (
                                <img
                                  src={isPublicAssetUri(meta.image) ? meta.image : collectionCoverPreview}
                                  alt={meta.name}
                                  className="w-full aspect-square object-cover"
                                />
                              ) : (
                                <div className="aspect-square bg-gray-700 flex items-center justify-center text-2xl text-gray-500">#{i + 1}</div>
                              )}
                              <p className="p-2 text-white text-xs font-medium truncate">{meta.name}</p>
                              {meta.attributes?.length > 0 && (
                                <p className="px-2 pb-2 text-gray-500 text-xs truncate">{meta.attributes.map((a) => `${a.trait_type}: ${a.value}`).join(' · ')}</p>
                              )}
                            </button>
                          ))}
                        </div>
                        <p className="text-gray-400 text-sm">
                          {isBoingNativeNftWizard
                            ? 'Deploy native collection publishes the contract only — it does not mint these tokens or upload art. Details: '
                            : 'Export the JSON for an external minter. This page does not deploy an EVM collection or charge a fee.'}
                          {isBoingNativeNftWizard && (
                            <Link to="/docs?section=boing-l1" className="text-cyan-400 underline">
                              Documentation → Boing L1 &amp; Express
                            </Link>
                          )}
                          {isBoingNativeNftWizard && '. Export JSON works with any toolchain.'}
                        </p>
                      </>
                    )}
                  </div>
                )}
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={() => setStep(step === 'assets' ? 'collection' : 'assets')}
                    disabled={step === 'collection'}
                    className="td-btn td-btn--ghost disabled:opacity-50"
                  >
                    Back
                  </button>
                  {step !== 'review' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (step === 'collection') {
                          setStep('assets');
                          return;
                        }
                        if (generatedDynamicMetadata.length === 0) {
                          toast.error('Upload a CSV (or generate from trait layers) before review');
                          return;
                        }
                        setStep('review');
                      }}
                      disabled={step === 'collection' && (!collectionName.trim() || !collectionSymbol.trim())}
                      className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium disabled:opacity-50"
                    >
                      Next
                    </button>
                  )}
                </div>
              </>
            )}

            {/* ========== Standard mint flow ========== */}
            {mode === 'standard' && (
              <>
            {/* Step: Collection */}
            {step === 'collection' && (
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-400">
                    Network: <span className="font-medium text-gray-300">{network?.name || 'Not connected'}</span>
                    {network && <span className="ml-2 text-xs text-gray-500">(change in navbar)</span>}
                  </p>
                </div>
                <div>
                  <label htmlFor="nft-collection-name" className="block text-sm font-medium text-gray-300 mb-2">Collection Name *</label>
                  <input
                    id="nft-collection-name"
                    name="collectionName"
                    type="text"
                    value={collectionName}
                    onChange={(e) => setCollectionName(e.target.value)}
                    placeholder="My NFT Collection"
                    className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="nft-collection-symbol" className="block text-sm font-medium text-gray-300 mb-2">Symbol *</label>
                  <input
                    id="nft-collection-symbol"
                    name="collectionSymbol"
                    type="text"
                    value={collectionSymbol}
                    onChange={(e) => setCollectionSymbol(e.target.value.toUpperCase().slice(0, 10))}
                    placeholder="MNFT"
                    maxLength={10}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="nft-collection-description" className="block text-sm font-medium text-gray-300 mb-2">Description (optional)</label>
                  <textarea
                    id="nft-collection-description"
                    name="collectionDescription"
                    value={collectionDescription}
                    onChange={(e) => setCollectionDescription(e.target.value)}
                    placeholder="A short description of your collection"
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                  />
                </div>
                <CollectionCoverFields
                  imageUrl={collectionImageUrl}
                  onImageUrlChange={(v) => { setCollectionImageUrl(v); setPublishedFingerprint(''); }}
                  coverPreview={collectionCoverPreview}
                  onCoverFile={onCollectionCoverFile}
                  requiredHint="(optional — first token image is used if empty)"
                />
              </div>
            )}

            {/* Step: Upload images */}
            {step === 'upload' && (
              <div className="space-y-6">
                <p className="text-gray-400 text-sm">Select images from your computer. You can add multiple for bulk minting (max {MAX_FILES_BULK}).</p>
                <label
                  htmlFor="nft-bulk-images"
                  className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer bg-gray-700/50 hover:bg-gray-700 hover:border-cyan-500/50 transition-colors"
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-cyan-500/50'); }}
                  onDragLeave={(e) => { e.currentTarget.classList.remove('border-cyan-500/50'); }}
                  onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-cyan-500/50'); addFiles(e.dataTransfer.files); }}
                >
                  <input
                    id="nft-bulk-images"
                    name="bulkImages"
                    type="file"
                    accept={ACCEPTED_IMAGE_TYPES}
                    multiple
                    className="hidden"
                    onChange={(e) => addFiles(e.target.files)}
                  />
                                    <span style={{ color: 'var(--text-secondary)' }}>Drag & drop images or click to browse</span>
                  <span className="text-gray-500 text-sm mt-1">JPEG, PNG, GIF, WebP · max {MAX_FILE_SIZE_MB}MB each</span>
                </label>
                {files.length > 0 && (
                  <>
                    <div className="flex flex-wrap gap-4">
                      {previews.map((url, i) => (
                        <div key={i} className="relative group">
                          <img src={url} alt={`Preview ${i + 1}`} className="w-24 h-24 object-cover rounded-lg border border-gray-600" />
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                          {uploadedUris[i] && <span className="absolute bottom-1 left-1 text-xs bg-green-600/80 rounded px-1">Uploaded</span>}
                        </div>
                      ))}
                    </div>
                    {uploadedUris.length < files.length && (
                      <button
                        type="button"
                        onClick={uploadImages}
                        disabled={isUploading}
                        className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium disabled:opacity-50"
                      >
                        {isUploading ? 'Uploading…' : `Upload ${files.length} image(s)`}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Step: Metadata */}
            {step === 'metadata' && (
              <div className="space-y-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={useSameMetadata} onChange={(e) => setUseSameMetadata(e.target.checked)} className="rounded" />
                  <span className="text-gray-300">Use same name/description for all (with #1, #2, …)</span>
                </label>
                {useSameMetadata ? (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="nft-bulk-name" className="block text-sm font-medium text-gray-300 mb-2">Name base *</label>
                      <input
                        id="nft-bulk-name"
                        name="bulkName"
                        type="text"
                        value={bulkName}
                        onChange={(e) => setBulkName(e.target.value)}
                        placeholder="My NFT"
                        className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="nft-bulk-description" className="block text-sm font-medium text-gray-300 mb-2">Description (optional)</label>
                      <textarea
                        id="nft-bulk-description"
                        name="bulkDescription"
                        value={bulkDescription}
                        onChange={(e) => setBulkDescription(e.target.value)}
                        placeholder="Description for all tokens"
                        rows={2}
                        className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 resize-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 max-h-[28rem] overflow-y-auto">
                    {tokenMetadata.map((meta, i) => (
                      <div key={i} className="p-4 rounded-lg bg-gray-700/50 border border-gray-600">
                        <div className="flex items-center gap-2 mb-3">
                          {previews[i] && <img src={previews[i]} alt="" className="w-12 h-12 object-cover rounded" />}
                          <span className="text-gray-400">Token #{i + 1}</span>
                        </div>
                        <label htmlFor={`nft-token-name-${i}`} className="sr-only">Token name</label>
                        <input
                          id={`nft-token-name-${i}`}
                          name={`tokenName-${i}`}
                          type="text"
                          value={meta?.name ?? ''}
                          onChange={(e) => updateTokenMeta(i, 'name', e.target.value)}
                          placeholder="Token name *"
                          className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white text-sm mb-2"
                        />
                        <label htmlFor={`nft-token-desc-${i}`} className="sr-only">Token description</label>
                        <textarea
                          id={`nft-token-desc-${i}`}
                          name={`tokenDescription-${i}`}
                          value={meta?.description ?? ''}
                          onChange={(e) => updateTokenMeta(i, 'description', e.target.value)}
                          placeholder="Description"
                          rows={2}
                          className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white text-sm resize-none mb-3"
                        />
                        <div className="mb-2 text-xs font-medium text-gray-400">Attributes (traits for OpenSea etc.)</div>
                        {(meta?.attributes || []).map((attr, ai) => (
                          <div key={ai} className="flex gap-2 mb-2">
                            <label htmlFor={`nft-trait-type-${i}-${ai}`} className="sr-only">Trait type</label>
                            <input
                              id={`nft-trait-type-${i}-${ai}`}
                              name={`traitType-${i}-${ai}`}
                              type="text"
                              value={attr.trait_type ?? ''}
                              onChange={(e) => updateTokenAttribute(i, ai, 'trait_type', e.target.value)}
                              placeholder="Trait (e.g. Background)"
                              className="flex-1 px-3 py-1.5 rounded bg-gray-700 border border-gray-600 text-white text-sm"
                            />
                            <label htmlFor={`nft-trait-value-${i}-${ai}`} className="sr-only">Trait value</label>
                            <input
                              id={`nft-trait-value-${i}-${ai}`}
                              name={`traitValue-${i}-${ai}`}
                              type="text"
                              value={attr.value ?? ''}
                              onChange={(e) => updateTokenAttribute(i, ai, 'value', e.target.value)}
                              placeholder="Value"
                              className="flex-1 px-3 py-1.5 rounded bg-gray-700 border border-gray-600 text-white text-sm"
                            />
                            <button type="button" onClick={() => removeTokenAttribute(i, ai)} className="px-2 py-1.5 rounded bg-red-600/80 hover:bg-red-500 text-white text-sm">−</button>
                          </div>
                        ))}
                        <button type="button" onClick={() => addTokenAttribute(i)} className="text-sm text-cyan-400 hover:text-cyan-300">
                          + Add trait
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step: Review & Mint */}
            {step === 'review' && (
              <div className="space-y-6">
                <div className="p-4 rounded-lg bg-gray-700/50 border border-gray-600">
                  <p className="text-gray-300 font-medium">{collectionName || 'Collection'}</p>
                  <p className="text-gray-500 text-sm">{collectionSymbol} · {getFinalMetadataList().length} token(s)</p>
                </div>
                <h3 className="text-lg font-semibold text-white">Preview — what you’re minting</h3>
                <p className="text-gray-400 text-sm">Click a card to see full details.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-80 overflow-y-auto">
                  {getFinalMetadataList().map((meta, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPreviewTokenIndex(i)}
                      className="rounded-lg border border-gray-600 overflow-hidden bg-gray-800 text-left hover:border-cyan-500/50 transition-colors"
                    >
                      {previews[i] ? <img src={previews[i]} alt={meta.name} className="w-full aspect-square object-cover" /> : <div className="w-full aspect-square bg-gray-700 flex items-center justify-center text-gray-500">#{i + 1}</div>}
                      <p className="p-2 text-white text-sm font-medium truncate">{meta.name}</p>
                      {meta.attributes?.length > 0 && (
                        <p className="px-2 pb-2 text-gray-500 text-xs truncate">{meta.attributes.map((a) => `${a.trait_type}: ${a.value}`).join(' · ')}</p>
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => ensurePublishedMetadata().catch((e) => toast.error(e?.message || 'Metadata upload failed'))}
                    disabled={isPublishingMetadata}
                    className="px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-medium disabled:opacity-50"
                  >
                    {isPublishingMetadata ? 'Uploading metadata…' : 'Upload metadata to network'}
                  </button>
                  <button type="button" onClick={exportMetadataJSON} className="td-btn td-btn--ghost">
                    Export metadata JSON
                  </button>
                </div>
                {publishedMetadataUri ? (
                  <p className="text-sm text-gray-400">
                    Network metadata:{' '}
                    <a href={publishedMetadataUri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline break-all">
                      {publishedMetadataUri}
                    </a>
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  {!isBoingNativeNftWizard && (
                    <button
                      type="button"
                      disabled
                      className="px-4 py-2 rounded-lg bg-cyan-600/50 text-gray-400 font-medium cursor-not-allowed"
                      title="No EVM NFT factory is deployed. Export metadata or use Boing native collection deploy."
                    >
                      Mint tokens (not available on EVM)
                    </button>
                  )}
                </div>
                {isBoingNativeNftWizard && (
                  <NativeBoingNftDeploySection
                    embedInWizard
                    collectionName={collectionName}
                    collectionSymbol={collectionSymbol}
                    metadataUri={publishedMetadataUri}
                    committedDescriptionHash={publishedDescriptionHash}
                    coverImageUri={publishedCoverUri || resolvedCoverUri()}
                    onEnsureMetadataPublished={ensurePublishedMetadata}
                    linkTokenId={linkTokenFromQuery}
                  />
                )}
                {isBoingNativeNftWizard && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Advanced tools
                    </summary>
                    <Link
                      to="/boing/native-vm"
                      className="mt-2 px-4 py-2 rounded-lg border border-cyan-500/50 text-cyan-300 text-sm font-medium inline-flex items-center hover:bg-cyan-950/40"
                    >
                      Native VM tools
                    </Link>
                  </details>
                )}
                {!isBoingNativeNftWizard ? (
                  <LinkedNftTokenPanel
                    compact
                    seedTokenId={linkTokenFromQuery}
                    collectionLabel={collectionName}
                    title="Link a project token (optional)"
                  />
                ) : null}
                <p className="text-gray-400 text-sm">
                  {isBoingNativeNftWizard ? (
                    <>
                      Metadata is uploaded with a public image URL and committed as{' '}
                      <code className="text-xs">description_hash</code> on native deploy.{' '}
                      <Link to="/docs?section=boing-l1" className="text-cyan-400 underline">
                        Documentation → Boing L1 &amp; Express
                      </Link>
                      .
                    </>
                  ) : (
                    'Metadata follows ERC-721 / OpenSea JSON. Export it for another minter. This app does not mint EVM tokens yet and does not charge the reference fee shown in Dynamic mode.'
                  )}
                </p>
              </div>
            )}

            {/* Navigation (standard flow only) */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-700">
              <button
                type="button"
                onClick={handleBack}
                disabled={step === 'collection'}
                className="td-btn td-btn--ghost disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
              {step !== 'review' ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={step === 'upload' ? (files.length === 0 || isUploading) : !canProceed()}
                  className="td-btn td-btn--primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {step === 'upload' && files.length > 0 && uploadedUris.length < files.length ? (isUploading ? 'Uploading…' : 'Upload images & Next') : 'Next'}
                </button>
              ) : null}
            </div>
              </>
            )}
          </PageCard>

        {/* Token preview modal */}
        {previewTokenIndex != null && (() => {
          const isDynamic = typeof previewTokenIndex === 'string' && previewTokenIndex.startsWith('d-');
          const idx = isDynamic ? parseInt(previewTokenIndex.slice(2), 10) : previewTokenIndex;
          const list = isDynamic ? generatedDynamicMetadata : getFinalMetadataList();
          const meta = list[idx];
          const imageUrl = (!isDynamic && previews[idx])
            || collectionCoverPreview
            || (isPublicAssetUri(meta?.image) ? meta.image : null);
          if (!meta) return null;
          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
              onClick={() => setPreviewTokenIndex(null)}
              role="dialog"
              aria-modal="true"
              aria-label="Token preview"
            >
              <div
                className="td-card max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="p-4 flex items-center justify-between"
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                >
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Token preview</h3>
                  <button
                    type="button"
                    onClick={() => setPreviewTokenIndex(null)}
                    className="p-2 rounded-lg"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    <span className="sr-only">Close</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 p-4 space-y-4">
                  <div
                    className="aspect-square rounded-lg overflow-hidden"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    {imageUrl ? <img src={imageUrl} alt={meta.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl" style={{ color: 'var(--text-tertiary)' }}>#{idx + 1}</div>}
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Name</p>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{meta.name}</p>
                  </div>
                  {meta.description && (
                    <div>
                      <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Description</p>
                      <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{meta.description}</p>
                    </div>
                  )}
                  {meta.attributes?.length > 0 && (
                    <div>
                      <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>Attributes</p>
                      <div className="flex flex-wrap gap-2">
                        {meta.attributes.map((a, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 rounded text-sm"
                            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                          >
                            {a.trait_type}: {String(a.value)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </TradeDeployShell>
    </>
  );
}
