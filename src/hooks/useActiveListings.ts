import { useCallback, useEffect, useState } from 'react';
import { useReadContract, useAccount } from 'wagmi';
import { formatEther } from 'viem';

// Correct ABI for the deployed marketplace contract
const MARKETPLACE_ABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "_offset", "type": "uint256"},
      {"internalType": "uint256", "name": "_limit", "type": "uint256"}
    ],
    "name": "readAllActiveListings",
    "outputs": [
      {"internalType": "uint256[]", "name": "tokenIds", "type": "uint256[]"},
      {
        "components": [
          {"internalType": "address", "name": "seller", "type": "address"},
          {"internalType": "uint256", "name": "price", "type": "uint256"},
          {"internalType": "bool", "name": "isBeatsToken", "type": "bool"},
          {"internalType": "bool", "name": "isActive", "type": "bool"},
          {"internalType": "uint256", "name": "listedAt", "type": "uint256"},
          {"internalType": "uint256", "name": "expiresAt", "type": "uint256"},
          {"internalType": "string", "name": "category", "type": "string"},
          {"internalType": "string[]", "name": "tags", "type": "string[]"}
        ],
        "internalType": "struct HiBeatsMarketplace.Listing[]",
        "name": "listingData",
        "type": "tuple[]"
      },
      {"internalType": "uint256", "name": "total", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_offset", "type": "uint256"},
      {"internalType": "uint256", "name": "_limit", "type": "uint256"}
    ],
    "name": "readAllActiveListingsEnhanced",
    "outputs": [
      {"internalType": "uint256[]", "name": "tokenIds", "type": "uint256[]"},
      {
        "components": [
          {"internalType": "address", "name": "seller", "type": "address"},
          {"internalType": "uint256", "name": "price", "type": "uint256"},
          {"internalType": "bool", "name": "isBeatsToken", "type": "bool"},
          {"internalType": "bool", "name": "isActive", "type": "bool"},
          {"internalType": "uint256", "name": "listedAt", "type": "uint256"},
          {"internalType": "uint256", "name": "expiresAt", "type": "uint256"},
          {"internalType": "string", "name": "category", "type": "string"},
          {"internalType": "string[]", "name": "tags", "type": "string[]"},
          {"internalType": "string", "name": "tokenURI", "type": "string"},
          {"internalType": "string", "name": "title", "type": "string"},
          {"internalType": "string", "name": "artist", "type": "string"},
          {"internalType": "string", "name": "genre", "type": "string"},
          {"internalType": "uint256", "name": "duration", "type": "uint256"},
          {"internalType": "string", "name": "prompt", "type": "string"},
          {"internalType": "string", "name": "modelUsed", "type": "string"},
          {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
          {"internalType": "bool", "name": "isRemixable", "type": "bool"},
          {"internalType": "uint256", "name": "royaltyRate", "type": "uint256"}
        ],
        "internalType": "struct HiBeatsMarketplace.EnhancedListing[]",
        "name": "enhancedListingData",
        "type": "tuple[]"
      },
      {"internalType": "uint256", "name": "total", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "readAllActiveAuctions",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
          {"internalType": "address", "name": "seller", "type": "address"},
          {"internalType": "uint256", "name": "startingBid", "type": "uint256"},
          {"internalType": "uint256", "name": "currentBid", "type": "uint256"},
          {"internalType": "address", "name": "highestBidder", "type": "address"},
          {"internalType": "uint256", "name": "endTime", "type": "uint256"},
          {"internalType": "bool", "name": "isActive", "type": "bool"}
        ],
        "internalType": "struct HiBeatsMarketplace.Auction[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "readFeaturedListings",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
          {"internalType": "address", "name": "seller", "type": "address"},
          {"internalType": "uint256", "name": "price", "type": "uint256"},
          {"internalType": "bool", "name": "isActive", "type": "bool"},
          {"internalType": "uint256", "name": "listedAt", "type": "uint256"}
        ],
        "internalType": "struct HiBeatsMarketplace.Listing[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "readRecentListings",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
          {"internalType": "address", "name": "seller", "type": "address"},
          {"internalType": "uint256", "name": "price", "type": "uint256"},
          {"internalType": "bool", "name": "isActive", "type": "bool"},
          {"internalType": "uint256", "name": "listedAt", "type": "uint256"}
        ],
        "internalType": "struct HiBeatsMarketplace.Listing[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Types based on actual contract response
interface ContractListing {
  seller: `0x${string}`;
  price: bigint;
  isBeatsToken: boolean;
  isActive: boolean;
  listedAt: bigint;
  expiresAt: bigint;
  category: string;
  tags: readonly string[];
}

interface EnhancedContractListing extends ContractListing {
  tokenURI: string;
  title: string;
  artist: string;
  genre: string;
  duration: bigint;
  prompt: string;
  modelUsed: string;
  createdAt: bigint;
  isRemixable: boolean;
  royaltyRate: bigint;
}

interface RawListing {
  tokenId: bigint;
  seller: string;
  price: bigint;
  isActive: boolean;
  listedAt: bigint;
}

interface FormattedListing {
  id: string;
  tokenId: number;
  seller: string;
  price: string;
  priceInETH: string;
  isBeatsToken: boolean;
  isActive: boolean;
  listedAt: Date;
  expiresAt: Date;
  category: string;
  tags: string[];
  createdAt: string;
  type: 'listing';
  title: string;
  artist: string;
  imageUrl?: string;
  audioUrl?: string;
  genre: string;
  duration: number;
  prompt?: string;
  modelUsed?: string;
  tokenURI?: string;
  isRemixable?: boolean;
  royaltyRate?: number;
  description?: string;
}

export interface ActiveListingsData {
  allActiveListings: FormattedListing[];
  isLoading: boolean;
  error: string | null;
  totalListings: number;
  refetch: () => void;
}

export const useActiveListings = (): ActiveListingsData => {
  const { address } = useAccount();
  const [error, setError] = useState<string | null>(null);

  // Get marketplace contract address from environment
  const marketplaceAddress = import.meta.env.VITE_HIBEATS_MARKETPLACE_ADDRESS as `0x${string}`;

  // Read all active listings with enhanced metadata
  const {
    data: listingsResponse,
    isLoading: isLoadingListings,
    error: listingsError,
    refetch: refetchListings
  } = useReadContract({
    address: marketplaceAddress,
    abi: MARKETPLACE_ABI,
    functionName: 'readAllActiveListingsEnhanced',
    args: [0n, 100n], // offset: 0, limit: 100
    query: {
      enabled: !!marketplaceAddress,
      refetchInterval: 600000, // Refetch every 10 minutes
      staleTime: 300000, // Consider data stale after 5 minutes
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnMount: true, // Only refetch on mount
      gcTime: 900000, // Keep in cache for 15 minutes
    }
  });


  // Format listing data
  const formatListing = useCallback((listing: RawListing): FormattedListing => {
    const tokenId = Number(listing.tokenId);
    const listedAt = new Date(Number(listing.listedAt) * 1000);
    
    return {
      id: `listing-${tokenId}`,
      tokenId,
      seller: listing.seller,
      price: listing.price.toString(),
      priceInETH: formatEther(listing.price),
      isActive: listing.isActive,
      isBeatsToken: true, // Default to true for now
      listedAt,
      expiresAt: undefined, // No expiration for listings
      createdAt: listedAt.toISOString(),
      type: 'listing',
      category: 'music', // Default category
      tags: [], // Empty tags array
      // Placeholder data - will be enhanced with NFT metadata
      title: `Track #${tokenId}`,
      artist: 'AI Artist',
      genre: 'Electronic',
      duration: 180
    };
  }, []);

  // Process enhanced listings data correctly from contract response
  const allActiveListings = listingsResponse 
    ? listingsResponse[0].map((tokenId, index) => {
        const listing = listingsResponse[1][index] as EnhancedContractListing;
        const id = Number(tokenId);
        const listedAt = new Date(Number(listing.listedAt) * 1000);
        const expiresAt = new Date(Number(listing.expiresAt) * 1000);
        
        return {
          id: `listing-${id}`,
          tokenId: id,
          seller: listing.seller,
          price: listing.price.toString(),
          priceInETH: formatEther(listing.price),
          isBeatsToken: listing.isBeatsToken,
          isActive: listing.isActive,
          listedAt,
          expiresAt,
          category: listing.category,
          tags: [...listing.tags],
          createdAt: listedAt.toISOString(),
          type: 'listing' as const,
          // Enhanced metadata from smart contract
          title: listing.title || `Music NFT #${id}`,
          artist: listing.artist || `Creator ${listing.seller.slice(0, 6)}...${listing.seller.slice(-4)}`,
          genre: listing.genre || listing.category || 'Music',
          duration: Number(listing.duration) || 180,
          prompt: listing.prompt || undefined,
          modelUsed: listing.modelUsed || undefined,
          tokenURI: listing.tokenURI || undefined,
          isRemixable: listing.isRemixable || false,
          royaltyRate: Number(listing.royaltyRate) || 0,
          // Generate description from available data
          description: `${listing.title || `Music NFT #${id}`} - Created by ${listing.artist || `Creator ${listing.seller.slice(0, 6)}...${listing.seller.slice(-4)}`}${listing.genre ? ` in ${listing.genre}` : ''}${listing.modelUsed ? ` using ${listing.modelUsed}` : ''}`,
          // These will be enhanced by IPFS metadata if available
          imageUrl: undefined,
          audioUrl: undefined,
        };
      })
    : [];
  // Combine loading states (focus on listings only for now)
  const isLoading = isLoadingListings;

  // Handle errors (focus on listings only for now)
  useEffect(() => {
    if (listingsError) {
      setError(`Failed to fetch marketplace data: ${listingsError.message}`);
    } else {
      setError(null);
    }
  }, [listingsError]);

  // Combined refetch function (focus on listings only for now)
  const refetch = useCallback(() => {
    refetchListings();
  }, [refetchListings]);


  return {
    allActiveListings,
    isLoading,
    error,
    totalListings: listingsResponse ? Number(listingsResponse[2]) : 0,
    refetch
  };
};