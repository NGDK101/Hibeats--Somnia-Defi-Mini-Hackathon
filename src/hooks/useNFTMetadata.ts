import { useReadContract } from 'wagmi';
import { useState, useEffect, useRef } from 'react';
import { CONTRACT_ADDRESSES, HIBEATS_NFT_ABI } from '../contracts';

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  genre?: string;
  duration?: number;
  artist?: string;
  audio_url?: string;
}

// Simple cache to reduce API calls
const metadataCache = new Map<string, NFTMetadata>();
const loadingCache = new Set<string>();

export function useNFTMetadata(tokenId: number | null) {
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get tokenURI from contract
  const { data: tokenURI } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_NFT,
    abi: HIBEATS_NFT_ABI,
    functionName: 'tokenURI',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: !!tokenId && !!CONTRACT_ADDRESSES.HIBEATS_NFT,
      staleTime: 600000, // Cache for 10 minutes
      refetchOnWindowFocus: false,
      refetchInterval: false,
    },
  });

  // Fetch metadata from IPFS/HTTP when tokenURI changes
  useEffect(() => {
    if (!tokenURI || !tokenId) return;

    const cacheKey = `${tokenId}-${tokenURI}`;
    
    // Check cache first
    if (metadataCache.has(cacheKey)) {
      setMetadata(metadataCache.get(cacheKey)!);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Check if already loading
    if (loadingCache.has(cacheKey)) {
      return;
    }

    const fetchMetadata = async () => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setIsLoading(true);
      setError(null);
      loadingCache.add(cacheKey);

      try {
        let metadataUrl = tokenURI;

        // Convert IPFS URLs to gateway URLs
        if (metadataUrl.startsWith('ipfs://')) {
          metadataUrl = metadataUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
        }

        const response = await fetch(metadataUrl, {
          signal,
          timeout: 10000 // 10 second timeout
        } as RequestInit);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Cache the result
        metadataCache.set(cacheKey, data);
        setMetadata(data);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch NFT metadata:', err);
          setError(err.message || 'Failed to fetch metadata');
        }
      } finally {
        setIsLoading(false);
        loadingCache.delete(cacheKey);
      }
    };

    fetchMetadata();
  }, [tokenURI]);

  return {
    metadata,
    isLoading,
    error,
    tokenURI
  };
}