// Optimized Image Component
// Provides lazy loading, error handling, and WebP support

import React, { useState, useRef, useEffect } from 'react';

const OptimizedImage = ({
  src,
  alt,
  className = '',
  placeholder = null,
  fallback = null,
  loading = 'lazy',
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder || src);
  const [isLoaded, setIsLoaded] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!imgRef.current) return;

    // Use Intersection Observer for lazy loading
    if (loading === 'lazy' && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              observer.disconnect();
            }
          });
        },
        { rootMargin: '50px' }
      );

      observer.observe(imgRef.current);

      return () => {
        observer.disconnect();
      };
    } else {
      // Load immediately if lazy loading not supported
      setImageSrc(src);
    }
  }, [src, loading]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    if (fallback) {
      setImageSrc(fallback);
    }
  };

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      onLoad={handleLoad}
      onError={handleError}
      loading={loading}
      decoding="async"
      {...props}
    />
  );
};

export default OptimizedImage;

