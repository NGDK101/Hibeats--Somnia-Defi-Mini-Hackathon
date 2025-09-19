import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, HIBEATS_NFT_ABI, HIBEATS_MARKETPLACE_ABI } from '../contracts';
import { useMemo } from 'react';

export type SongStatus =
  | 'not-minted'           // Song belum di-mint - SEMUA USER BISA MINT
  | 'minted-not-listed'    // Sudah mint, belum list - SEMUA USER BISA LIST
  | 'minted-listed'        // Sudah mint, sudah list - SEMUA USER BISA UNLIST/UPDATE
  | 'minted-not-owner'     // Sudah mint, tapi bukan owner - MASIH BISA AKSI
  | 'error';               // Error

export interface SongStatusResult {
  status: SongStatus;
  isMinted: boolean;
  isListed: boolean;
  isOwner: boolean;
  tokenId: bigint | null;
  listingData: any;
  loading: boolean;
  error: any;
  
  // Action flags untuk UI
  canMint: boolean;
  canList: boolean;
  canUnlist: boolean;
  canUpdate: boolean;
}

export function useSongStatus(aiTrackId: string) {
  const { address } = useAccount();

  // Check if song is already minted
  const { 
    data: isMinted, 
    isLoading: mintCheckLoading,
    error: mintCheckError,
    refetch: refetchMintStatus
  } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_NFT,
    abi: HIBEATS_NFT_ABI,
    functionName: 'trackExists',
    args: [aiTrackId],
    enabled: !!aiTrackId,
  });

  // Get token ID if minted
  const { 
    data: tokenId,
    isLoading: tokenIdLoading,
    refetch: refetchTokenId
  } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_NFT,
    abi: HIBEATS_NFT_ABI,
    functionName: 'getTokenIdByAITrackId',
    args: [aiTrackId],
    enabled: !!aiTrackId && !!isMinted,
  });

  // Check ownership if token exists
  const { 
    data: owner,
    isLoading: ownerLoading,
    refetch: refetchOwner
  } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_NFT,
    abi: HIBEATS_NFT_ABI,
    functionName: 'ownerOf',
    args: tokenId ? [tokenId as bigint] : undefined,
    enabled: !!tokenId && tokenId !== 0n,
  });

  // Check listing status if token exists
  const { 
    data: listingData,
    isLoading: listingLoading,
    refetch: refetchListing
  } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
    abi: HIBEATS_MARKETPLACE_ABI,
    functionName: 'getListing',
    args: tokenId ? [tokenId as bigint] : undefined,
    enabled: !!tokenId && tokenId !== 0n,
  });

  // Calculate derived state
  const result: SongStatusResult = useMemo(() => {
    const loading = mintCheckLoading || tokenIdLoading || ownerLoading || listingLoading;
    const error = mintCheckError;

    // If not minted yet
    if (!isMinted) {
      return {
        status: 'not-minted',
        isMinted: false,
        isListed: false,
        isOwner: false,
        tokenId: null,
        listingData: null,
        loading,
        error,
        canMint: true,
        canList: false,
        canUnlist: false,
        canUpdate: false,
      };
    }

    // If minted but no valid token ID
    if (!tokenId || tokenId === 0n) {
      return {
        status: 'error',
        isMinted: true,
        isListed: false,
        isOwner: false,
        tokenId: null,
        listingData: null,
        loading,
        error: new Error('Token ID not found for minted track'),
        canMint: false,
        canList: false,
        canUnlist: false,
        canUpdate: false,
      };
    }

    const tokenIdBig = tokenId as bigint;
    const isOwner = owner === address;
    const listing = listingData as any;
    const isListed = listing && listing.isActive;

    // Determine status - TIDAK TERBATAS OWNERSHIP
    let status: SongStatus;
    if (isListed) {
      status = 'minted-listed';
    } else {
      status = 'minted-not-listed';
    }

    return {
      status,
      isMinted: true,
      isListed: !!isListed,
      isOwner: !!isOwner,
      tokenId: tokenIdBig,
      listingData: listing,
      loading,
      error,
      // ✅ SEMUA USER BISA MELAKUKAN SEMUA AKSI
      canMint: false, // Sudah di-mint
      canList: !isListed, // Bisa list jika belum listed
      canUnlist: isListed, // Bisa unlist jika sudah listed
      canUpdate: isListed, // Bisa update price jika sudah listed
    };
  }, [
    isMinted, 
    tokenId, 
    owner, 
    listingData, 
    address,
    mintCheckLoading,
    tokenIdLoading,
    ownerLoading,
    listingLoading,
    mintCheckError
  ]);

  // Refetch all data
  const refetchAll = async () => {
    await Promise.all([
      refetchMintStatus(),
      refetchTokenId(),
      refetchOwner(),
      refetchListing(),
    ]);
  };

  return {
    ...result,
    refetch: refetchAll,
  };
}

// Hook untuk mengecek status multiple songs sekaligus
export function useMultipleSongStatus(aiTrackIds: string[]) {
  const results = aiTrackIds.map(id => useSongStatus(id));
  
  return {
    results,
    loading: results.some(r => r.loading),
    errors: results.filter(r => r.error).map(r => r.error),
    refetchAll: async () => {
      await Promise.all(results.map(r => r.refetch()));
    }
  };
}