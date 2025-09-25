import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_ADDRESSES, HIBEATS_MARKETPLACE_ABI, HIBEATS_NFT_ABI, type MarketplaceListParams } from '../contracts';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

export function useMarketplace() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  
  // Write contract operations
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  // Wait for transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Read marketplace fee
  const { data: marketplaceFee } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
    abi: HIBEATS_MARKETPLACE_ABI,
    functionName: 'marketplaceFee',
  });

  // Read collection stats (as a replacement for active listings)
  const { data: collectionStats, refetch: refetchListings } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
    abi: HIBEATS_MARKETPLACE_ABI,
    functionName: 'getCollectionStats',
  });

  // Read user's listings
  const { data: userListings, refetch: refetchUserListings } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
    abi: HIBEATS_MARKETPLACE_ABI,
    functionName: 'getUserListings',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  // Check if song is already minted by AI Track ID
  const checkSongMintStatus = (aiTrackId: string) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_NFT,
      abi: HIBEATS_NFT_ABI,
      functionName: 'trackExists',
      args: [aiTrackId],
      enabled: !!aiTrackId,
    });
  };

  // Get token ID by AI Track ID
  const getTokenIdByAITrackId = (aiTrackId: string) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_NFT,
      abi: HIBEATS_NFT_ABI,
      functionName: 'getTokenIdByAITrackId',
      args: [aiTrackId],
      enabled: !!aiTrackId,
    });
  };

  // Check if NFT is listed in marketplace
  const checkNFTListingStatus = (tokenId: bigint) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
      abi: HIBEATS_MARKETPLACE_ABI,
      functionName: 'getListing',
      args: [tokenId],
      enabled: !!tokenId && tokenId > 0n,
    });
  };

  // Check if user owns the NFT
  const checkNFTOwnership = (tokenId: bigint) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_NFT,
      abi: HIBEATS_NFT_ABI,
      functionName: 'ownerOf',
      args: [tokenId],
      enabled: !!tokenId && tokenId > 0n,
    });
  };

  // List NFT for sale
  const listNFT = async (params: MarketplaceListParams) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);

      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
        abi: HIBEATS_MARKETPLACE_ABI,
        functionName: 'listToken',
        args: [
          params.tokenId,
          params.price,
          params.isBeatsToken || false, // STT token flag
          params.duration,
          params.category || 'Music',
          params.tags || []
        ],
      });

      toast.success('NFT listing initiated!');
    } catch (err) {
      console.error('Error listing NFT:', err);
      toast.error('Failed to list NFT');
      setIsLoading(false);
    }
  };

  // Buy NFT with ETH/STT
  const buyNFT = async (tokenId: bigint, price: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);

      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
        abi: HIBEATS_MARKETPLACE_ABI,
        functionName: 'buyToken',
        args: [tokenId],
        value: price,
      });

      toast.success('NFT purchase initiated!');
    } catch (err) {
      console.error('Error buying NFT:', err);
      toast.error('Failed to buy NFT');
      setIsLoading(false);
    }
  };

  // Buy NFT with BEATS tokens
  const buyNFTWithTokens = async (tokenId: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
        abi: HIBEATS_MARKETPLACE_ABI,
        functionName: 'buyItemWithTokens',
        args: [tokenId],
      });

      toast.success('NFT purchase with tokens initiated!');
    } catch (err) {
      console.error('Error buying NFT with tokens:', err);
      toast.error('Failed to buy NFT with tokens');
      setIsLoading(false);
    }
  };

  // Cancel listing (unlist NFT)
  const unlistNFT = async (tokenId: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);

      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
        abi: HIBEATS_MARKETPLACE_ABI,
        functionName: 'unlistToken',
        args: [tokenId],
      });

      toast.success('NFT unlisting initiated!');
    } catch (err) {
      console.error('Error unlisting NFT:', err);
      toast.error('Failed to unlist NFT');
      setIsLoading(false);
    }
  };

  // Place bid on auction
  const placeBid = async (tokenId: bigint, bidAmount: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
        abi: HIBEATS_MARKETPLACE_ABI,
        functionName: 'placeBid',
        args: [tokenId],
        value: bidAmount,
      });

      toast.success('Bid placed successfully!');
    } catch (err) {
      console.error('Error placing bid:', err);
      toast.error('Failed to place bid');
      setIsLoading(false);
    }
  };

  // Place bid with tokens
  const placeBidWithTokens = async (tokenId: bigint, bidAmount: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
        abi: HIBEATS_MARKETPLACE_ABI,
        functionName: 'placeBidWithTokens',
        args: [tokenId, bidAmount],
      });

      toast.success('Token bid placed successfully!');
    } catch (err) {
      console.error('Error placing token bid:', err);
      toast.error('Failed to place token bid');
      setIsLoading(false);
    }
  };

  // End auction
  const endAuction = async (tokenId: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
        abi: HIBEATS_MARKETPLACE_ABI,
        functionName: 'endAuction',
        args: [tokenId],
      });

      toast.success('Auction ending initiated!');
    } catch (err) {
      console.error('Error ending auction:', err);
      toast.error('Failed to end auction');
      setIsLoading(false);
    }
  };

  // Get comprehensive song status (mint + listing status)
  const getSongStatus = async (aiTrackId: string) => {
    try {
      // Check if song is minted
      const isMinted = await checkSongMintStatus(aiTrackId);
      
      if (!isMinted.data) {
        return {
          isMinted: false,
          isListed: false,
          tokenId: null,
          listingData: null,
          isOwner: false,
          status: 'not-minted' as const
        };
      }

      // Get token ID
      const tokenIdData = await getTokenIdByAITrackId(aiTrackId);
      const tokenId = tokenIdData.data as bigint;

      if (!tokenId || tokenId === 0n) {
        return {
          isMinted: false,
          isListed: false,
          tokenId: null,
          listingData: null,
          isOwner: false,
          status: 'not-minted' as const
        };
      }

      // Check ownership
      const ownerData = await checkNFTOwnership(tokenId);
      const isOwner = ownerData.data === address;

      // Check if listed
      const listingData = await checkNFTListingStatus(tokenId);
      const listing = listingData.data as any;
      const isListed = listing && listing.isActive;

      let status: 'minted-not-listed' | 'minted-listed' | 'minted-not-owner' = 'minted-not-owner';
      
      if (isOwner) {
        status = isListed ? 'minted-listed' : 'minted-not-listed';
      }

      return {
        isMinted: true,
        isListed,
        tokenId,
        listingData: listing,
        isOwner,
        status
      };
    } catch (error) {
      console.error('Error getting song status:', error);
      return {
        isMinted: false,
        isListed: false,
        tokenId: null,
        listingData: null,
        isOwner: false,
        status: 'error' as const
      };
    }
  };

  // Update listing price
  const updateListingPrice = async (tokenId: bigint, newPrice: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
        abi: HIBEATS_MARKETPLACE_ABI,
        functionName: 'updatePrice',
        args: [tokenId, newPrice],
      });

      toast.success('Price update initiated!');
    } catch (err) {
      console.error('Error updating price:', err);
      toast.error('Failed to update price');
      setIsLoading(false);
    }
  };

  // Get listing details
  const getListing = (tokenId: bigint) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
      abi: HIBEATS_MARKETPLACE_ABI,
      functionName: 'getListing',
      args: [tokenId],
    });
  };

  // Effects
  useEffect(() => {
    if (isSuccess) {
      setIsLoading(false);
      refetchListings();
      refetchUserListings();
      toast.success('Marketplace transaction completed!');
    }
  }, [isSuccess, refetchListings, refetchUserListings]);

  useEffect(() => {
    if (error) {
      setIsLoading(false);
      toast.error('Marketplace transaction failed: ' + error.message);
    }
  }, [error]);

  // Create auction
  const createAuction = async (params: {
    tokenId: bigint;
    startPrice: bigint;
    reservePrice: bigint;
    duration: bigint;
    isBeatsToken?: boolean;
    category?: string;
  }) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);

      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
        abi: HIBEATS_MARKETPLACE_ABI,
        functionName: 'createAuction',
        args: [
          params.tokenId,
          params.startPrice,
          params.reservePrice,
          params.duration,
          params.isBeatsToken || false,
          params.category || 'Music'
        ],
      });

      toast.success('Auction creation initiated!');
    } catch (err) {
      console.error('Error creating auction:', err);
      toast.error('Failed to create auction');
      setIsLoading(false);
    }
  };

  // Make offer on NFT
  const makeOffer = async (tokenId: bigint, offerAmount: bigint, isBeatsToken: boolean = false, expirationTime: bigint = 604800n) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
        abi: HIBEATS_MARKETPLACE_ABI,
        functionName: 'makeOffer',
        args: [tokenId, offerAmount, isBeatsToken, expirationTime],
        value: isBeatsToken ? 0n : offerAmount,
      });

      toast.success('Offer submitted successfully!');
    } catch (err) {
      console.error('Error making offer:', err);
      toast.error('Failed to make offer');
      setIsLoading(false);
    }
  };

  // Accept offer
  const acceptOffer = async (tokenId: bigint, offerIndex: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
        abi: HIBEATS_MARKETPLACE_ABI,
        functionName: 'acceptOffer',
        args: [tokenId, offerIndex],
      });

      toast.success('Offer accepted successfully!');
    } catch (err) {
      console.error('Error accepting offer:', err);
      toast.error('Failed to accept offer');
      setIsLoading(false);
    }
  };

  // Cancel offer
  const cancelOffer = async (tokenId: bigint, offerIndex: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
        abi: HIBEATS_MARKETPLACE_ABI,
        functionName: 'cancelOffer',
        args: [tokenId, offerIndex],
      });

      toast.success('Offer cancelled successfully!');
    } catch (err) {
      console.error('Error cancelling offer:', err);
      toast.error('Failed to cancel offer');
      setIsLoading(false);
    }
  };

  return {
    // Core marketplace actions
    listNFT,
    createAuction,
    buyNFT,
    buyNFTWithTokens,
    unlistNFT,
    placeBid,
    placeBidWithTokens,
    endAuction,
    updateListingPrice,
    makeOffer,
    acceptOffer,
    cancelOffer,
    
    // Song status checking functions
    checkSongMintStatus,
    getTokenIdByAITrackId,
    checkNFTListingStatus,
    checkNFTOwnership,
    getSongStatus,
    
    // Queries
    getListing,
    
    // Data
    marketplaceFee: marketplaceFee || 0n,
    collectionStats: collectionStats || null,
    userListings: userListings || [],
    
    // State
    isLoading: isLoading || isPending || isConfirming,
    hash,
    error,

    // Legacy support (deprecated)
    cancelListing: unlistNFT,
    updatePrice: updateListingPrice,
  };
}
