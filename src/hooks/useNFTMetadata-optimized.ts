import { useState, useEffect, useRef } from 'react';
import { useIPFS } from './useIPFS';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, HIBEATS_NFT_ABI } from '@/contracts';

// Cache untuk menghindari duplicate requests
const metadataCache = new Map<string, any>();

export const useNFTMetadata = (tokenIdOrHash: string | number | bigint | undefined) => {
  const { getFromIPFS, isLoading: ipfsLoading } = useIPFS();
  const [metadata, setMetadata] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  // Check if input is a tokenId (number/bigint) or IPFS hash (string)
  const isTokenId = typeof tokenIdOrHash === 'number' || typeof tokenIdOrHash === 'bigint';

  // Get tokenURI from contract if tokenId is provided
  const { data: tokenURI } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_NFT,
    abi: HIBEATS_NFT_ABI,
    functionName: 'tokenURI',
    args: isTokenId ? [BigInt(tokenIdOrHash)] : undefined,
  });

  // Determine the IPFS hash to use
  const ipfsHash = isTokenId ? (tokenURI as string) : (tokenIdOrHash as string);

  useEffect(() => {
    if (!ipfsHash || isFetchingRef.current) {
      return;
    }

    // Check cache first
    if (metadataCache.has(ipfsHash)) {
      setMetadata(metadataCache.get(ipfsHash));
      return;
    }

    const fetchMetadata = async () => {
      isFetchingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const data = await getFromIPFS(ipfsHash);
        metadataCache.set(ipfsHash, data);
        setMetadata(data);
      } catch (err) {
        console.error('Error fetching NFT metadata:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch metadata');
        setMetadata(null);
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    };

    fetchMetadata();
  }, [ipfsHash]);

  return {
    metadata,
    isLoading: isLoading || ipfsLoading,
    error,
  };
};
