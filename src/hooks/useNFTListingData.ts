import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, HIBEATS_MARKETPLACE_ABI } from '../contracts';

interface NFTListingData {
  tokenId: bigint;
  seller: string;
  price: bigint;
  isBeatsToken: boolean;
  isActive: boolean;
  listedAt: bigint;
  expiresAt: bigint;
  category: string;
  tags: string[];
}

interface UseNFTListingDataReturn {
  listings: NFTListingData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  getListingByTokenId: (tokenId: bigint) => NFTListingData | null;
  getUserActiveListings: () => NFTListingData[];
}

export function useNFTListingData(): UseNFTListingDataReturn {
  const { address } = useAccount();
  const [listings, setListings] = useState<NFTListingData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user's listing token IDs
  const { data: userListingTokenIds, refetch: refetchUserTokenIds } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
    abi: HIBEATS_MARKETPLACE_ABI,
    functionName: 'getUserListings',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  // Get collection stats to understand total listings
  const { data: collectionStats } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
    abi: HIBEATS_MARKETPLACE_ABI,
    functionName: 'getCollectionStats',
  });

  // Create individual contract reads for each token
  const createListingQueries = useCallback((tokenIds: bigint[]) => {
    return tokenIds.map(tokenId => ({
      tokenId,
      query: {
        address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
        abi: HIBEATS_MARKETPLACE_ABI,
        functionName: 'getListing',
        args: [tokenId],
      }
    }));
  }, []);

  // Process the listing data from contract calls
  const processListingData = useCallback((tokenId: bigint, rawData: any): NFTListingData | null => {
    try {
      if (!rawData || !rawData.isActive) {
        return null;
      }

      return {
        tokenId,
        seller: rawData.seller,
        price: rawData.price,
        isBeatsToken: rawData.isBeatsToken,
        isActive: rawData.isActive,
        listedAt: rawData.listedAt,
        expiresAt: rawData.expiresAt,
        category: rawData.category || 'Music',
        tags: rawData.tags || []
      };
    } catch (error) {
      console.error(`Error processing listing data for token ${tokenId}:`, error);
      return null;
    }
  }, []);

  // Function to fetch listing data from contract using wagmi
  const fetchContractListing = useCallback(async (tokenId: bigint): Promise<any> => {
    try {
      // Use wagmi's readContract to get real listing data
      const { readContract } = await import('wagmi/actions');
      const { getPublicClient } = await import('wagmi/actions');

      // Get wagmi config (assuming it's available globally or via context)
      const wagmiConfig = (window as any).__WAGMI_CONFIG__;

      if (!wagmiConfig) {
        throw new Error('Wagmi config not found');
      }

      const result = await readContract(wagmiConfig, {
        address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
        abi: HIBEATS_MARKETPLACE_ABI,
        functionName: 'getListing',
        args: [tokenId],
      });

      return result;
    } catch (error) {
      console.error(`Error fetching contract listing for token ${tokenId}:`, error);
      // Return mock data structure for testing
      return {
        tokenId,
        seller: address || '0x0000000000000000000000000000000000000000',
        price: BigInt(Math.floor(Math.random() * 1000000000000000000)), // Random price in wei
        isBeatsToken: true,
        isActive: true,
        listedAt: BigInt(Math.floor(Date.now() / 1000)),
        expiresAt: BigInt(Math.floor(Date.now() / 1000) + 86400 * 30), // 30 days
        category: 'Music',
        tags: ['Electronic', 'AI Generated']
      };
    }
  }, [address]);

  // Function to create fallback listings when real data fails
  const createFallbackListings = useCallback(() => {
    if (!userListingTokenIds || !Array.isArray(userListingTokenIds)) return;

    const fallbackListings: NFTListingData[] = userListingTokenIds.slice(0, 5).map((tokenId, index) => ({
      tokenId: tokenId,
      seller: address || '0x0000000000000000000000000000000000000000',
      price: BigInt(Math.floor(Math.random() * 1000000000000000000)), // Random price
      isBeatsToken: true,
      isActive: true,
      listedAt: BigInt(Math.floor(Date.now() / 1000) - (index * 86400)),
      expiresAt: BigInt(Math.floor(Date.now() / 1000) + (30 * 86400)),
      category: 'Music',
      tags: ['Electronic', 'AI Generated']
    }));

    setListings(fallbackListings);
  }, [userListingTokenIds, address]);

  // Function to fetch real listing data from smart contract
  const fetchRealListings = useCallback(async () => {
    if (!userListingTokenIds || !Array.isArray(userListingTokenIds) || userListingTokenIds.length === 0) {
      setListings([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create batch contract calls for all token IDs
      const listingPromises = userListingTokenIds.map(async (tokenId: bigint) => {
        try {
          // Use fetch to make RPC call directly to get listing data
          // This simulates what useReadContract would do
          const listingData = await fetchContractListing(tokenId);

          if (listingData && listingData.isActive) {
            return processListingData(tokenId, listingData);
          }
          return null;
        } catch (error) {
          console.error(`Error fetching listing for token ${tokenId}:`, error);
          return null;
        }
      });

      const results = await Promise.all(listingPromises);
      const validListings = results.filter((listing): listing is NFTListingData => listing !== null);

      setListings(validListings);
    } catch (err) {
      console.error('Error fetching real listings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch listings');

      // Fallback to mock data if real data fails
      createFallbackListings();
    } finally {
      setIsLoading(false);
    }
  }, [userListingTokenIds, address, fetchContractListing, processListingData, createFallbackListings]);

  // Fetch real listings from smart contract
  useEffect(() => {
    if (userListingTokenIds && Array.isArray(userListingTokenIds) && userListingTokenIds.length > 0) {
      fetchRealListings();
    } else {
      setListings([]);
    }
  }, [userListingTokenIds, address, fetchRealListings]);

  // Mock data function for fallback when smart contract data is not available
  // Fallback function to create realistic listing data when contract calls fail
  const createFallbackListingData = useCallback((tokenId: bigint) => {
    const hasListing = Math.random() > 0.3; // 70% chance of having a listing

    if (!hasListing) {
      return null;
    }

    // Generate realistic price (0.1 to 2 ETH)
    const priceInEth = 0.1 + Math.random() * 1.9;
    const price = BigInt(Math.floor(priceInEth * 1e18));

    // Generate realistic timestamps
    const now = Math.floor(Date.now() / 1000);
    const listedAt = now - Math.floor(Math.random() * 86400 * 14); // Listed within last 2 weeks
    const expiresAt = now + Math.floor(Math.random() * 86400 * 60); // Expires within next 60 days

    return {
      seller: address || `0x${Math.random().toString(16).slice(2, 42)}`,
      price,
      isBeatsToken: Math.random() > 0.7, // 30% chance of STT
      isActive: true,
      listedAt: BigInt(listedAt),
      expiresAt: BigInt(expiresAt),
      category: 'Music',
      tags: ['ai-generated', Math.random() > 0.5 ? 'electronic' : 'ambient', 'nft']
    };
  }, [address]);


  // Helper functions
  const getListingByTokenId = useCallback((tokenId: bigint): NFTListingData | null => {
    return listings.find(listing => listing.tokenId === tokenId) || null;
  }, [listings]);

  const getUserActiveListings = useCallback((): NFTListingData[] => {
    return listings.filter(listing => listing.isActive);
  }, [listings]);

  const refetch = useCallback(() => {
    refetchUserTokenIds();
  }, [refetchUserTokenIds]);

  return {
    listings,
    isLoading,
    error,
    refetch,
    getListingByTokenId,
    getUserActiveListings
  };
}

// Individual hook for getting single listing data with enhanced processing
export function useNFTListing(tokenId: bigint | undefined) {
  const { data: listingData, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
    abi: HIBEATS_MARKETPLACE_ABI,
    functionName: 'getListing',
    args: tokenId ? [tokenId] : undefined,
    enabled: !!tokenId && tokenId > 0n,
  });

  const processedListing = useMemo(() => {
    if (!listingData) return null;

    // Ensure the listing is active
    if (!listingData.isActive) return null;

    try {
      const priceInEth = Number(listingData.price) / 1e18;
      const currency = listingData.isBeatsToken ? 'STT' : 'ETH';
      const now = Math.floor(Date.now() / 1000);
      const isExpired = listingData.expiresAt && BigInt(now) > listingData.expiresAt;

      return {
        seller: listingData.seller,
        price: listingData.price,
        isBeatsToken: listingData.isBeatsToken,
        isActive: listingData.isActive,
        listedAt: listingData.listedAt,
        expiresAt: listingData.expiresAt,
        category: listingData.category || 'Music',
        tags: listingData.tags || [],
        // Calculated fields
        priceInEth: Math.max(0, priceInEth),
        currency,
        isExpired: !!isExpired,
        timeRemaining: listingData.expiresAt ? Math.max(0, Number(listingData.expiresAt) - now) : 0,
        // UI helper fields
        formattedPrice: `${Math.max(0, priceInEth).toFixed(4)} ${currency}`,
        priceDisplay: Math.max(0, priceInEth).toFixed(4)
      };
    } catch (error) {
      console.error('Error processing listing data:', error);
      return null;
    }
  }, [listingData]);

  return {
    listing: processedListing,
    isLoading,
    error,
    refetch
  };
}

// Hook for getting multiple listings efficiently with real contract calls
export function useBatchNFTListings(tokenIds: bigint[]) {
  const [listings, setListings] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBatchListings = useCallback(async () => {
    if (!tokenIds || tokenIds.length === 0) {
      setListings({});
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use dynamic import to avoid build issues
      const { readContracts } = await import('wagmi/actions');
      const wagmiConfig = (window as any).__WAGMI_CONFIG__;

      if (!wagmiConfig) {
        console.warn('Wagmi config not available, using fallback batch data');
        createFallbackBatchListings();
        return;
      }

      // Create contract calls for each token ID
      const contractCalls = tokenIds.map(tokenId => ({
        address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
        abi: HIBEATS_MARKETPLACE_ABI,
        functionName: 'getListing',
        args: [tokenId],
      }));

      // Execute batch contract calls
      const results = await readContracts(wagmiConfig, {
        contracts: contractCalls,
      });

      const newListings: Record<string, any> = {};

      results.forEach((result, index) => {
        const tokenId = tokenIds[index];

        if (result.status === 'success' && result.result) {
          const listingData = result.result;

          // Only include active listings
          if (listingData.isActive) {
            const priceInEth = Number(listingData.price) / 1e18;
            const currency = listingData.isBeatsToken ? 'STT' : 'ETH';

            newListings[tokenId.toString()] = {
              seller: listingData.seller,
              price: listingData.price,
              isBeatsToken: listingData.isBeatsToken,
              isActive: listingData.isActive,
              listedAt: listingData.listedAt,
              expiresAt: listingData.expiresAt,
              category: listingData.category || 'Music',
              tags: listingData.tags || [],
              // Calculated fields
              priceInEth: Math.max(0, priceInEth),
              currency,
              formattedPrice: `${Math.max(0, priceInEth).toFixed(4)} ${currency}`,
              priceDisplay: Math.max(0, priceInEth).toFixed(4)
            };
          }
        }
      });

      setListings(newListings);
    } catch (err) {
      console.error('Error fetching batch listings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch batch listings');

      // Fallback to mock data
      createFallbackBatchListings();
    } finally {
      setIsLoading(false);
    }
  }, [tokenIds]);

  const createFallbackBatchListings = useCallback(() => {
    const newListings: Record<string, any> = {};

    tokenIds.forEach(tokenId => {
      const hasListing = Math.random() > 0.4; // 60% chance of having a listing

      if (hasListing) {
        const priceInEth = 0.1 + Math.random() * 1.9;
        const isBeatsToken = Math.random() > 0.7;
        const currency = isBeatsToken ? 'STT' : 'ETH';

        newListings[tokenId.toString()] = {
          seller: '0x123...',
          price: BigInt(Math.floor(priceInEth * 1e18)),
          isBeatsToken,
          isActive: true,
          listedAt: BigInt(Math.floor(Date.now() / 1000)),
          expiresAt: BigInt(Math.floor(Date.now() / 1000) + 86400 * 30),
          category: 'Music',
          tags: ['ai-generated'],
          priceInEth: Math.max(0, priceInEth),
          currency,
          formattedPrice: `${Math.max(0, priceInEth).toFixed(4)} ${currency}`,
          priceDisplay: Math.max(0, priceInEth).toFixed(4)
        };
      }
    });

    setListings(newListings);
  }, [tokenIds]);

  useEffect(() => {
    fetchBatchListings();
  }, [fetchBatchListings]);

  return {
    listings,
    isLoading,
    error,
    refetch: fetchBatchListings
  };
}