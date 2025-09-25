import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, HIBEATS_NFT_ABI, HIBEATS_MARKETPLACE_ABI } from '../contracts';
import { useMemo, useState, useEffect } from 'react';

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

export function useSongStatus(aiTrackId: string | undefined | null) {
  const { address } = useAccount();

  // Always call hooks, but disable them conditionally
  const isValidTrackId = !!aiTrackId;

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
    args: aiTrackId ? [aiTrackId] : [],
    query: {
      enabled: isValidTrackId,
    }
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
    args: aiTrackId ? [aiTrackId] : [],
    query: {
      enabled: isValidTrackId && !!isMinted,
    }
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
    query: {
      enabled: !!tokenId && tokenId !== 0n,
    }
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
    query: {
      enabled: !!tokenId && tokenId !== 0n,
    }
  });

  // Calculate derived state
  const result: SongStatusResult = useMemo(() => {
    // Handle invalid track ID
    if (!isValidTrackId) {
      return {
        status: 'not-minted' as const,
        isMinted: false,
        isListed: false,
        isOwner: false,
        tokenId: undefined,
        owner: undefined,
        listingData: undefined,
        loading: false,
        error: null,
        canMint: false,
        canList: false,
        canUnlist: false,
        canUpdate: false,
      };
    }

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
    isValidTrackId,
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
  ] as const);

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
export function useMultipleSongStatus(aiTrackIds: string[] | undefined | null) {
  const { address } = useAccount();
  const [results, setResults] = useState<SongStatusResult[]>([]);
  const [loading, setLoading] = useState(false);

  const safeTrackIds = useMemo(() => aiTrackIds || [], [aiTrackIds]);

  // Get all tracks from NFT contract to check which are minted
  const { data: allTracks, refetch: refetchTracks } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_NFT,
    abi: HIBEATS_NFT_ABI,
    functionName: 'getAllTracks',
    args: [],
    query: {
      enabled: safeTrackIds.length > 0,
    }
  });

  // Manually fetch data for each track instead of using dynamic hooks
  const fetchAllStatuses = async () => {
    if (safeTrackIds.length === 0) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const statusPromises = safeTrackIds.map(async (trackId): Promise<SongStatusResult> => {
        if (!trackId) {
          return {
            status: 'not-minted',
            isMinted: false,
            isListed: false,
            isOwner: false,
            tokenId: null,
            listingData: null,
            loading: false,
            error: null,
            canMint: false,
            canList: false,
            canUnlist: false,
            canUpdate: false,
          };
        }

        // Check if this track is minted by looking in allTracks
        const tracksArray = allTracks as any[];
        const trackIndex = tracksArray?.findIndex((track: any) => {
          const trackTaskId = String(track.taskId || '').trim();
          const expectedTaskId = String(trackId || '').trim();
          return trackTaskId === expectedTaskId && trackTaskId.length > 0;
        });

        const isMinted = trackIndex !== -1;
        
        if (isMinted) {
          const tokenId = tracksArray?.[trackIndex]?.tokenId || null;
          
          return {
            status: 'minted-not-listed',
            isMinted: true,
            isListed: false, // TODO: Check marketplace status
            isOwner: true, // TODO: Check actual ownership
            tokenId: tokenId ? BigInt(tokenId) : null,
            listingData: null,
            loading: false,
            error: null,
            canMint: false,
            canList: true,
            canUnlist: false,
            canUpdate: true,
          };
        }

        return {
          status: 'not-minted',
          isMinted: false,
          isListed: false,
          isOwner: false,
          tokenId: null,
          listingData: null,
          loading: false,
          error: null,
          canMint: true,
          canList: false,
          canUnlist: false,
          canUpdate: false,
        };
      });

      const statuses = await Promise.all(statusPromises);
      setResults(statuses);
    } catch (error) {
      console.error('Error fetching multiple song statuses:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (allTracks) {
      fetchAllStatuses();
    }
  }, [safeTrackIds.join(','), address, allTracks]);

  return {
    results,
    loading,
    errors: [],
    refetchAll: () => {
      refetchTracks();
      fetchAllStatuses();
    },
  };
}