import React, { useState, useRef, useCallback, useEffect } from 'react';
import { uploadToIPFS } from '../utils/ipfsUpload';
import { toast } from 'react-hot-toast';

const LogoUpload = ({ onLogoUpload, onLogoChange, currentLogo, disabled = false }) => {
  const [previewUrl, setPreviewUrl] = useState(currentLogo || null);
  const [uploadedUrl, setUploadedUrl] = useState(currentLogo || null);
  const [fileInfo, setFileInfo] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [previewError, setPreviewError] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Update preview when currentLogo changes
  useEffect(() => {
    if (currentLogo) {
      setUploadedUrl(currentLogo);
      setPreviewUrl(currentLogo);
      setPreviewError(false);
    }
  }, [currentLogo]);

  const handleFile = useCallback(async (file) => {
    try {
      // Reset states
      setPreviewError(false);
      setUploadStatus(null);
      
      // Validate file
      if (!file || !file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      // Set file info
      setFileInfo({
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // Create preview immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Upload to IPFS
      setIsUploading(true);
      setUploadStatus('Processing image...');
      
      const uploadResult = await uploadToIPFS(file);
      
      console.log('Upload result:', uploadResult);
      
      // Update uploaded URL
      setUploadedUrl(uploadResult.url);
      
      // Set upload status based on result
      if (uploadResult.isSimulated) {
        setUploadStatus('Development Mode: Local processing');
        toast.success('Logo processed successfully! (Development Mode)');
      } else {
        setUploadStatus('Successfully uploaded to R2');
        toast.success('Logo uploaded to R2 successfully!');
      }
      
      // Call parent handlers
      if (onLogoUpload) {
        onLogoUpload(uploadResult);
      }
      if (onLogoChange) {
        onLogoChange(uploadResult.url);
      }
      
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error(error.message || 'Failed to process logo');
      setPreviewUrl(null);
      setUploadedUrl(null);
      setFileInfo(null);
      setPreviewError(true);
      setUploadStatus('Processing failed');
    } finally {
      setIsUploading(false);
    }
  }, [onLogoUpload, onLogoChange]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const removeLogo = () => {
    setPreviewUrl(null);
    setUploadedUrl(null);
    setFileInfo(null);
    setPreviewError(false);
    setUploadStatus(null);
    if (onLogoChange) {
      onLogoChange('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePreviewError = () => {
    console.log('Image preview failed to load, but upload was successful');
    // Don't set previewError to true if we have a successful upload
    // This prevents the UI from showing as failed when the upload actually worked
    if (!uploadedUrl) {
      setPreviewError(true);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
          ${dragActive 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
            : previewError
            ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <label htmlFor="logo-upload-file" className="sr-only">Upload logo image</label>
        <input
          ref={fileInputRef}
          id="logo-upload-file"
          name="logoFile"
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />
        
        {isUploading ? (
          <div className="space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {uploadStatus || 'Processing image...'}
            </p>
            {fileInfo && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {fileInfo.name} ({formatFileSize(fileInfo.size)})
              </div>
            )}
          </div>
        ) : previewUrl && !previewError ? (
          <div className="space-y-3">
            {/* Image Preview */}
            <div className="relative inline-block">
              <img
                src={previewUrl}
                alt="Logo preview"
                className="w-20 h-20 mx-auto rounded-lg object-cover border border-gray-300 dark:border-gray-600 shadow-sm"
                onError={handlePreviewError}
              />
              {uploadedUrl && uploadedUrl !== previewUrl && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  ✓ Ready
                </div>
              )}
            </div>
            
            {/* File Info */}
            {fileInfo && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <p className="font-medium">{fileInfo.name}</p>
                <p>{formatFileSize(fileInfo.size)} • {fileInfo.type}</p>
              </div>
            )}
            
            {/* Status Message */}
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              {uploadStatus || (uploadedUrl ? 'Logo processed successfully!' : 'Preview ready')}
            </p>
            
            {/* IPFS URL Display */}
            {uploadedUrl && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-2">
                <p className="text-xs text-green-700 dark:text-green-300 break-all">
                  <strong>Logo URL:</strong> {uploadedUrl}
                </p>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex justify-center space-x-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeLogo();
                }}
                className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-2 py-1 rounded border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Remove
              </button>
              {uploadedUrl && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(uploadedUrl, '_blank');
                  }}
                  className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 rounded border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  View
                </button>
              )}
            </div>
          </div>
        ) : previewError ? (
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 text-red-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                Processing failed
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                Please try again with a different image
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeLogo();
              }}
              className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Clear and try again
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Upload your token logo
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Drag and drop an image here, or click to select
              </p>
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              PNG, JPG, GIF, WebP up to 5MB
            </div>
          </div>
        )}
      </div>

      {/* Info Section */}
      {uploadedUrl && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Logo Processing Information
          </h4>
          <div className="space-y-2 text-xs text-blue-700 dark:text-blue-300">
            <p>
              <strong>Status:</strong> {uploadStatus?.includes('Development') ? 'Development Mode (Local Processing)' : 'Processed and ready for deployment'}
            </p>
            <p>
              <strong>Compatibility:</strong> Works with all token deployment features
            </p>
            <p>
              <strong>Storage:</strong> {uploadStatus?.includes('Development') ? 'Local processing for development' : 'Stored on IPFS (decentralized)'}
            </p>
            {uploadStatus?.includes('Development') && (
              <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                <p className="text-yellow-700 dark:text-yellow-300 text-xs">
                  <strong>Development Mode:</strong> For production IPFS uploads, add an API key to your .env file. 
                  See <a href="/docs" className="underline">documentation</a> for setup instructions.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual URL Input */}
      <div className="space-y-2">
        <label htmlFor="logo-upload-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Or enter logo URL manually
        </label>
        <input
          id="logo-upload-url"
          name="logoUrl"
          type="url"
          placeholder="https://example.com/logo.png or ipfs://QmXxxx..."
          value={currentLogo || ''}
          onChange={(e) => onLogoChange && onLogoChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          disabled={disabled}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          You can also provide a direct URL to your logo image
        </p>
      </div>
    </div>
  );
};

export default LogoUpload; 