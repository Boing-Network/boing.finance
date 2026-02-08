// Create NFT - Top-notch minting UX
// Industry standards: ERC-721 metadata, local image upload, bulk minting, IPFS/R2 storage
// Solana: SPL NFT (0 decimals, supply 1) with IPFS metadata

import React, { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useWallet } from '../contexts/WalletContext';
import { useChainType, useSolanaWallet } from '../contexts/SolanaWalletContext';
import EmptyState from '../components/EmptyState';
import { uploadToIPFS, uploadMetadataToIPFS, validateFile } from '../utils/ipfsUpload';
import { createSPLNFT } from '../services/solanaNftService';
import { SOLANA_NETWORKS } from '../config/solanaConfig';
import toast from 'react-hot-toast';

const SOLANA_NFT_STEPS = [
  { id: 'upload', label: 'Image & Details', icon: '🖼️' },
  { id: 'review', label: 'Review & Mint', icon: '✅' },
];

const STEPS = [
  { id: 'collection', label: 'Collection', icon: '📦' },
  { id: 'upload', label: 'Images', icon: '🖼️' },
  { id: 'metadata', label: 'Metadata', icon: '📝' },
  { id: 'review', label: 'Review & Mint', icon: '✅' }
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

const DYNAMIC_STEPS = [
  { id: 'collection', label: 'Collection & size', icon: '📦' },
  { id: 'layers', label: 'Trait layers', icon: '🎲' },
  { id: 'review', label: 'Review & export', icon: '✅' }
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

// Parse CSV: header row, then data. Columns "name", "description" (or "Name", "Description") + any other = trait_type/value
function parseMetadataCSV(text, maxRows = 10000) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const nameCol = headers.findIndex((h) => /^name$/i.test(h));
  const descCol = headers.findIndex((h) => /^description$/i.test(h));
  const traitCols = headers
    .map((h, i) => (i !== nameCol && i !== descCol && i !== -1 && /^image$/i.test(h) ? -1 : i))
    .map((i, idx) => (i >= 0 && nameCol !== idx && descCol !== idx && !/^image$/i.test(headers[idx]) ? idx : -1));
  const list = [];
  for (let r = 1; r < lines.length && list.length < maxRows; r++) {
    const row = lines[r];
    const cells = row.match(/("([^"]|"")*"|[^,]*)/g)?.map((c) => c.replace(/^"|"$/g, '').replace(/""/g, '"').trim()) || row.split(',').map((c) => c.trim());
    const name = (nameCol >= 0 && cells[nameCol]) ? cells[nameCol] : `Token #${r}`;
    const description = (descCol >= 0 && cells[descCol]) ? cells[descCol] : '';
    const attributes = [];
    headers.forEach((h, i) => {
      if (i === nameCol || i === descCol || /^image$/i.test(h)) return;
      const value = cells[i];
      if (value != null && value !== '') attributes.push({ trait_type: h, value });
    });
    list.push(createNFTMetadata({ name, description, imageUri: '', attributes }));
  }
  return list;
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
    if (!connected || !address || !connection || !signTransaction) {
      toast.error('Please connect your Solana wallet.');
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
      const result = await createSPLNFT(connection, address, signTransaction, {
        name: name.trim(),
        symbol: symbol.trim().toUpperCase().slice(0, 10),
        description: description.trim(),
        imageFile,
      });
      setMintAddress(result.mintAddress);
      setSignature(result.signature);
      toast.success('NFT minted successfully!');
      // Record to backend (non-blocking)
      const url = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8787';
      fetch(`${url}/api/solana/deployments`, {
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
        <meta name="description" content="Mint SPL NFTs on Solana. Image upload, IPFS metadata." />
      </Helmet>
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-white mb-2">Create SPL NFT</h1>
            <p className="text-gray-400">Mint an NFT on Solana {solanaNetwork.name}. Image + metadata stored on IPFS.</p>
          </div>

          {!connected ? (
            <div className="rounded-xl border p-8 text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <p className="mb-4 text-gray-400">Connect your Solana wallet to mint NFTs.</p>
              <button
                onClick={connectWallet}
                className="px-6 py-3 rounded-lg font-medium bg-cyan-600 text-white hover:bg-cyan-500"
              >
                Connect Solana Wallet
              </button>
            </div>
          ) : (
            <>
              <div className="flex justify-center gap-2 mb-6">
                {SOLANA_NFT_STEPS.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStep(s.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                      step === s.id ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50' : 'bg-gray-700/50 text-gray-500'
                    }`}
                  >
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                {step === 'upload' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Image *</label>
                      <input type="file" accept="image/*" onChange={handleImageSelect} className="block w-full text-gray-400" />
                      {imagePreview && <img src={imagePreview} alt="Preview" className="mt-2 max-h-48 rounded-lg object-contain" />}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="My NFT"
                        className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Symbol *</label>
                      <input
                        type="text"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value.toUpperCase().slice(0, 10))}
                        placeholder="NFT"
                        className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your NFT"
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white"
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
                        <p className="font-semibold text-white">{name || 'Untitled'}</p>
                        <p className="text-sm text-gray-400">{symbol || '—'}</p>
                        {description && <p className="text-sm text-gray-300 mt-1">{description}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setStep('upload')} className="px-4 py-2 rounded-lg bg-gray-600 text-white text-sm">
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
                        <p className="text-sm font-medium text-white">Minted!</p>
                        <p className="text-xs text-gray-400 break-all">Mint: {mintAddress}</p>
                        <a href={`${solanaNetwork.explorer}/tx/${signature}`} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-400 hover:underline">
                          View on Explorer
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function CreateNFT() {
  const { isSolana } = useChainType();
  const { account, isConnected, getCurrentNetwork, connectWallet } = useWallet();
  const [step, setStep] = useState('collection');
  const [collectionName, setCollectionName] = useState('');
  const [collectionSymbol, setCollectionSymbol] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploadedUris, setUploadedUris] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const [tokenMetadata, setTokenMetadata] = useState([]);
  const [useSameMetadata, setUseSameMetadata] = useState(false);
  const [bulkName, setBulkName] = useState('');
  const [bulkDescription, setBulkDescription] = useState('');

  const [isMinting, setIsMinting] = useState(false);

  const [mode, setMode] = useState('standard');
  const [dynamicSize, setDynamicSize] = useState(1000);
  const [traitLayers, setTraitLayers] = useState([{ trait_type: '', values: [''] }]);
  const [generatedDynamicMetadata, setGeneratedDynamicMetadata] = useState([]);
  const [previewTokenIndex, setPreviewTokenIndex] = useState(null);

  const network = getCurrentNetwork?.();

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

  const uploadImages = useCallback(async () => {
    if (files.length === 0) {
      toast.error('Add at least one image');
      return;
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
        const uri = result?.url || result?.gatewayUrls?.[0] || result?.hash;
        if (uri) uris.push(uri.startsWith('ipfs://') ? uri : `ipfs://${uri}`);
      }
      setUploadedUris((prev) => prev.length === 0 ? uris : [...prev, ...uris].slice(0, files.length));
      if (uris.length > 0) toast.success(`${uris.length} image(s) uploaded`);
      if (uris.length < files.length) toast.error('Some uploads failed');
    } catch (err) {
      toast.error(err?.message || 'Upload failed');
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
      if (uploadedUris.length < files.length) await uploadImages();
      else setStep('metadata');
    } else if (step === 'metadata') setStep('review');
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

  const dynamicFee = DYNAMIC_SIZES.find((s) => s.value === dynamicSize)?.feeEth || '0.01';

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
        const list = parseMetadataCSV(text, 10000);
        if (list.length === 0) {
          toast.error('CSV has no data rows or invalid format');
          return;
        }
        setGeneratedDynamicMetadata(list);
        toast.success(`Imported ${list.length} tokens from CSV`);
      } catch (err) {
        toast.error(err?.message || 'Failed to parse CSV');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

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
          imageUri: '',
          attributes: attrs
        })
      );
    }
    setGeneratedDynamicMetadata(list);
    toast.success(`Generated ${list.length} metadata entries`);
  };

  if (isSolana) return <CreateNFTSolanaContent />;

  if (!isConnected) {
    return (
      <>
        <Helmet>
          <title>Create NFT - Mint Your Collectibles | Boing Finance</title>
          <meta name="description" content="Create and mint NFTs. Upload images from your device, add metadata, and bulk mint." />
        </Helmet>
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl border p-6 sm:p-8" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <EmptyState
                variant="nfts"
                title="Connect your wallet"
                description="Connect your wallet to create and mint NFTs."
                action={connectWallet}
                actionLabel="Connect Wallet"
                secondaryLabel="Deploy Token instead"
                secondaryHref="/deploy-token"
              />
            </div>
          </div>
        </div>
      </>
    );
  }

  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <>
      <Helmet>
        <title>Create NFT - Mint Your Collectibles | Boing Finance</title>
        <meta name="description" content="Create and mint NFTs with local image upload and bulk minting. ERC-721 metadata, IPFS storage." />
      </Helmet>
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-white mb-2">Create NFT</h1>
            <p className="text-gray-400">Upload images from your computer, add metadata, and mint. Supports single, bulk, and dynamic collections up to 10,000.</p>
          </div>

          {/* Mode: Standard vs Dynamic collection */}
          <div className="flex justify-center gap-2 mb-6">
            <button
              type="button"
              onClick={() => { setMode('standard'); setStep('collection'); }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${mode === 'standard' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
            >
              Standard mint
            </button>
            <button
              type="button"
              onClick={() => { setMode('dynamic'); setStep('collection'); }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${mode === 'dynamic' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
            >
              Dynamic collection (up to 10k)
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex justify-center gap-2 mb-8">
            {(mode === 'dynamic' ? DYNAMIC_STEPS : STEPS).map((s, i) => {
              const steps = mode === 'dynamic' ? DYNAMIC_STEPS : STEPS;
              const currentStepIndex = steps.findIndex((x) => x.id === step);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => currentStepIndex > i && setStep(s.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    step === s.id ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50' : i < currentStepIndex ? 'bg-gray-600/50 text-gray-300 hover:bg-gray-600' : 'bg-gray-700/50 text-gray-500'
                  }`}
                >
                  <span>{s.icon}</span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border p-6 sm:p-8" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
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
                      <label className="block text-sm font-medium text-gray-300 mb-2">Collection Name *</label>
                      <input
                        type="text"
                        value={collectionName}
                        onChange={(e) => setCollectionName(e.target.value)}
                        placeholder="My Dynamic Collection"
                        className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Symbol *</label>
                      <input
                        type="text"
                        value={collectionSymbol}
                        onChange={(e) => setCollectionSymbol(e.target.value.toUpperCase().slice(0, 10))}
                        placeholder="DYN"
                        maxLength={10}
                        className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Collection size (up to 10,000)</label>
                      <select
                        value={dynamicSize}
                        onChange={(e) => setDynamicSize(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-cyan-500"
                      >
                        {DYNAMIC_SIZES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label} — Service fee: {s.feeEth} ETH</option>
                        ))}
                      </select>
                    </div>
                    <div className="p-4 rounded-lg bg-cyan-900/20 border border-cyan-500/30">
                      <p className="text-cyan-200 font-medium">Platform service fee: {dynamicFee} ETH</p>
                      <p className="text-cyan-200/80 text-sm mt-1">Charged when you deploy or mint the collection. Fee supports infrastructure and ongoing development.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Description (optional)</label>
                      <textarea
                        value={collectionDescription}
                        onChange={(e) => setCollectionDescription(e.target.value)}
                        placeholder="Description of your dynamic collection"
                        rows={2}
                        className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 resize-none"
                      />
                    </div>
                  </div>
                )}
                {step === 'layers' && (
                  <div className="space-y-6">
                    <p className="text-gray-400 text-sm">Define trait layers. Each layer has a name (e.g. Background) and possible values. Metadata will be generated with random combinations.</p>
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
                    <button type="button" onClick={addTraitLayer} className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-medium">
                      + Add trait layer
                    </button>
                  </div>
                )}
                {step === 'review' && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-lg bg-gray-700/50 border border-gray-600">
                      <p className="text-gray-300 font-medium">{collectionName || 'Collection'}</p>
                      <p className="text-gray-500 text-sm">{collectionSymbol} · {dynamicSize} NFTs · Service fee: {dynamicFee} ETH</p>
                    </div>
                    {generatedDynamicMetadata.length === 0 ? (
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-3">
                          <button type="button" onClick={generateDynamicMetadata} className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium">
                            Generate from trait layers
                          </button>
                          <label className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-medium cursor-pointer">
                            Upload CSV
                            <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
                          </label>
                        </div>
                        <p className="text-gray-400 text-sm">Generate from your trait layers above, or upload a CSV with columns: <code className="bg-gray-700 px-1 rounded">name</code>, <code className="bg-gray-700 px-1 rounded">description</code>, and any trait columns (e.g. Background, Rarity). Max 10,000 rows.</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-green-400">Ready: {generatedDynamicMetadata.length} metadata entries.</p>
                        <div className="flex flex-wrap gap-3">
                          <button type="button" onClick={exportMetadataJSON} className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-medium">
                            Export metadata JSON
                          </button>
                          <button type="button" onClick={() => setGeneratedDynamicMetadata([])} className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-medium">
                            Clear & re-import
                          </button>
                          <label className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-medium cursor-pointer">
                            Replace with CSV
                            <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
                          </label>
                        </div>
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
                              <div className="aspect-square bg-gray-700 flex items-center justify-center text-2xl text-gray-500">#{i + 1}</div>
                              <p className="p-2 text-white text-xs font-medium truncate">{meta.name}</p>
                              {meta.attributes?.length > 0 && (
                                <p className="px-2 pb-2 text-gray-500 text-xs truncate">{meta.attributes.map((a) => `${a.trait_type}: ${a.value}`).join(' · ')}</p>
                              )}
                            </button>
                          ))}
                        </div>
                        <p className="text-amber-200/90 text-sm">
                          Service fee ({dynamicFee} ETH) will be charged when you deploy this collection. Export the JSON for use with minting platforms or our contract when available.
                        </p>
                      </>
                    )}
                  </div>
                )}
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={() => setStep(step === 'layers' ? 'collection' : 'layers')}
                    disabled={step === 'collection'}
                    className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-medium disabled:opacity-50"
                  >
                    Back
                  </button>
                  {step !== 'review' && (
                    <button
                      type="button"
                      onClick={() => setStep(step === 'collection' ? 'layers' : 'review')}
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">Collection Name *</label>
                  <input
                    type="text"
                    value={collectionName}
                    onChange={(e) => setCollectionName(e.target.value)}
                    placeholder="My NFT Collection"
                    className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Symbol *</label>
                  <input
                    type="text"
                    value={collectionSymbol}
                    onChange={(e) => setCollectionSymbol(e.target.value.toUpperCase().slice(0, 10))}
                    placeholder="MNFT"
                    maxLength={10}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description (optional)</label>
                  <textarea
                    value={collectionDescription}
                    onChange={(e) => setCollectionDescription(e.target.value)}
                    placeholder="A short description of your collection"
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            )}

            {/* Step: Upload images */}
            {step === 'upload' && (
              <div className="space-y-6">
                <p className="text-gray-400 text-sm">Select images from your computer. You can add multiple for bulk minting (max {MAX_FILES_BULK}).</p>
                <label
                  className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer bg-gray-700/50 hover:bg-gray-700 hover:border-cyan-500/50 transition-colors"
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-cyan-500/50'); }}
                  onDragLeave={(e) => { e.currentTarget.classList.remove('border-cyan-500/50'); }}
                  onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-cyan-500/50'); addFiles(e.dataTransfer.files); }}
                >
                  <input
                    type="file"
                    accept={ACCEPTED_IMAGE_TYPES}
                    multiple
                    className="hidden"
                    onChange={(e) => addFiles(e.target.files)}
                  />
                  <span className="text-4xl mb-2">🖼️</span>
                  <span className="text-gray-300">Drag & drop images or click to browse</span>
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
                      <label className="block text-sm font-medium text-gray-300 mb-2">Name base *</label>
                      <input
                        type="text"
                        value={bulkName}
                        onChange={(e) => setBulkName(e.target.value)}
                        placeholder="My NFT"
                        className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Description (optional)</label>
                      <textarea
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
                        <input
                          type="text"
                          value={meta?.name ?? ''}
                          onChange={(e) => updateTokenMeta(i, 'name', e.target.value)}
                          placeholder="Token name *"
                          className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white text-sm mb-2"
                        />
                        <textarea
                          value={meta?.description ?? ''}
                          onChange={(e) => updateTokenMeta(i, 'description', e.target.value)}
                          placeholder="Description"
                          rows={2}
                          className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white text-sm resize-none mb-3"
                        />
                        <div className="mb-2 text-xs font-medium text-gray-400">Attributes (traits for OpenSea etc.)</div>
                        {(meta?.attributes || []).map((attr, ai) => (
                          <div key={ai} className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={attr.trait_type ?? ''}
                              onChange={(e) => updateTokenAttribute(i, ai, 'trait_type', e.target.value)}
                              placeholder="Trait (e.g. Background)"
                              className="flex-1 px-3 py-1.5 rounded bg-gray-700 border border-gray-600 text-white text-sm"
                            />
                            <input
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
                  <button type="button" onClick={exportMetadataJSON} className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-medium">
                    Export metadata JSON
                  </button>
                  <button type="button" disabled className="px-4 py-2 rounded-lg bg-cyan-600/50 text-gray-400 font-medium cursor-not-allowed" title="Minting available when Boing NFT contracts launch">
                    Mint on-chain (Coming soon)
                  </button>
                </div>
                <p className="text-amber-200/90 text-sm">
                  Metadata follows ERC-721 / OpenSea standards. Export the JSON to use with other minting tools; on-chain minting will be enabled when Boing NFT contracts launch.
                </p>
              </div>
            )}

            {/* Navigation (standard flow only) */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-700">
              <button
                type="button"
                onClick={handleBack}
                disabled={step === 'collection'}
                className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
              {step !== 'review' ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={step === 'upload' ? (files.length === 0 || isUploading) : !canProceed()}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {step === 'upload' && files.length > 0 && uploadedUris.length < files.length ? (isUploading ? 'Uploading…' : 'Upload images & Next') : 'Next'}
                </button>
              ) : null}
            </div>
              </>
            )}
          </div>
        </div>

        {/* Token preview modal */}
        {previewTokenIndex != null && (() => {
          const isDynamic = typeof previewTokenIndex === 'string' && previewTokenIndex.startsWith('d-');
          const idx = isDynamic ? parseInt(previewTokenIndex.slice(2), 10) : previewTokenIndex;
          const list = isDynamic ? generatedDynamicMetadata : getFinalMetadataList();
          const meta = list[idx];
          const imageUrl = !isDynamic && previews[idx] ? previews[idx] : null;
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
                className="rounded-2xl border bg-gray-800 border-gray-600 shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Token preview</h3>
                  <button type="button" onClick={() => setPreviewTokenIndex(null)} className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white">
                    <span className="sr-only">Close</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 p-4 space-y-4">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-700">
                    {imageUrl ? <img src={imageUrl} alt={meta.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-500 text-4xl">#{idx + 1}</div>}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Name</p>
                    <p className="text-white font-medium">{meta.name}</p>
                  </div>
                  {meta.description && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Description</p>
                      <p className="text-gray-300 text-sm whitespace-pre-wrap">{meta.description}</p>
                    </div>
                  )}
                  {meta.attributes?.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Attributes</p>
                      <div className="flex flex-wrap gap-2">
                        {meta.attributes.map((a, i) => (
                          <span key={i} className="px-2 py-1 rounded bg-gray-700 text-gray-300 text-sm">
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
      </div>
    </>
  );
}
