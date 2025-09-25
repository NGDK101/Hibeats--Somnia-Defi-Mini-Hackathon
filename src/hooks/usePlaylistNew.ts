import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, HIBEATS_PLAYLIST_ABI } from '@/contracts';
import { toast } from 'sonner';

export interface PlaylistTrack {
  tokenId: bigint;
  title: string;
  artist: string;
  duration: number;
}

export interface Playlist {
  id: bigint;
  name: string;
  description: string;
  owner: string;
  isPublic: boolean;
  trackCount: number;
  tracks: PlaylistTrack[];
}

export function usePlaylist() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);

  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Read user playlists
  const { data: userPlaylists, refetch: refetchPlaylists } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_PLAYLIST,
    abi: HIBEATS_PLAYLIST_ABI,
    functionName: 'getUserPlaylists',
    args: address ? [address] : undefined,
  });

  const createPlaylist = useCallback(async (name: string, description: string, isPublic: boolean) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_PLAYLIST,
        abi: HIBEATS_PLAYLIST_ABI,
        functionName: 'createPlaylist',
        args: [name, description, isPublic],
      });

      toast.success('Playlist creation initiated!');
    } catch (err) {
      console.error('Error creating playlist:', err);
      toast.error('Failed to create playlist');
      setIsLoading(false);
    }
  }, [address, writeContract]);

  const addToPlaylist = useCallback(async (playlistId: bigint, tokenId: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_PLAYLIST,
        abi: HIBEATS_PLAYLIST_ABI,
        functionName: 'addTrackToPlaylist',
        args: [playlistId, tokenId],
      });

      toast.success('Track added to playlist!');
    } catch (err) {
      console.error('Error adding to playlist:', err);
      toast.error('Failed to add track to playlist');
      setIsLoading(false);
    }
  }, [address, writeContract]);

  const removeFromPlaylist = useCallback(async (playlistId: bigint, tokenId: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_PLAYLIST,
        abi: HIBEATS_PLAYLIST_ABI,
        functionName: 'removeTrackFromPlaylist',
        args: [playlistId, tokenId],
      });

      toast.success('Track removed from playlist!');
    } catch (err) {
      console.error('Error removing from playlist:', err);
      toast.error('Failed to remove track from playlist');
      setIsLoading(false);
    }
  }, [address, writeContract]);

  return {
    userPlaylists: userPlaylists as Playlist[] | undefined,
    createPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    refetchPlaylists,
    isLoading: isLoading || isPending || isConfirming,
    hash,
    error,
  };
}
