import React, { useState, useEffect } from 'react';
import { IPFS_GATEWAYS, extractIPFSHash, ipfsToGatewayUrl } from '@/utils/ipfsGatewayHelper';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc,
  onLoad,
  onError
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [gatewayIndex, setGatewayIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setGatewayIndex(0);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    const ipfsHash = extractIPFSHash(currentSrc);

    if (ipfsHash && gatewayIndex < IPFS_GATEWAYS.length - 1) {
      const nextIndex = gatewayIndex + 1;
      const nextUrl = `${IPFS_GATEWAYS[nextIndex]}${ipfsHash}`;

      setGatewayIndex(nextIndex);
      setCurrentSrc(nextUrl);
    } else if (fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(true);
    } else {
      setHasError(true);
      onError?.();
    }
  };

  const handleLoad = () => {
    onLoad?.();
  };

  if (hasError && !fallbackSrc) {
    return null;
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
      crossOrigin="anonymous"
    />
  );
};