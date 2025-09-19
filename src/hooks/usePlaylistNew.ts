import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_ADDRESSES, HIBEATS_PLAYLIST_ABI, type PlaylistMetadata } from '../contracts';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

export function usePlaylist() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  
  // Write contract operations
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  // Wait for transaction
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

  // Read public playlists
  const { data: publicPlaylists, refetch: refetchPublicPlaylists } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_PLAYLIST,
    abi: HIBEATS_PLAYLIST_ABI,
    functionName: 'getPublicPlaylists',
    args: [0n, 50n], // Get first 50 public playlists
  });

  // Read featured playlists
  const { data: featuredPlaylists } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_PLAYLIST,
    abi: HIBEATS_PLAYLIST_ABI,
    functionName: 'getFeaturedPlaylists',
  });

  // Read trending playlists
  const { data: trendingPlaylists } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_PLAYLIST,
    abi: HIBEATS_PLAYLIST_ABI,
    functionName: 'getTrendingPlaylists',
    args: [10n], // Get top 10 trending
  });

  // Create playlist
  const createPlaylist = async (metadata: PlaylistMetadata) => {
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
        args: [
          metadata.name,
          metadata.description,
          metadata.coverImageURI,
          metadata.isPublic,
          metadata.tags || [],
          metadata.genre || ''
        ],
      });

      toast.success('Playlist creation initiated!');
    } catch (err) {
      console.error('Error creating playlist:', err);
      toast.error('Failed to create playlist');
      setIsLoading(false);
    }
  };

  // Update playlist
  const updatePlaylist = async (playlistId: bigint, metadata: Partial<PlaylistMetadata>) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_PLAYLIST,
        abi: HIBEATS_PLAYLIST_ABI,
        functionName: 'updatePlaylist',
        args: [
          playlistId,
          metadata.name || '',
          metadata.description || '',
          metadata.coverImageURI || '',
          metadata.isPublic !== undefined ? metadata.isPublic : true
        ],
      });

      toast.success('Playlist update initiated!');
    } catch (err) {
      console.error('Error updating playlist:', err);
      toast.error('Failed to update playlist');
      setIsLoading(false);
    }
  };

  // Delete playlist
  const deletePlaylist = async (playlistId: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_PLAYLIST,
        abi: HIBEATS_PLAYLIST_ABI,
        functionName: 'deletePlaylist',
        args: [playlistId],
      });

      toast.success('Playlist deletion initiated!');
    } catch (err) {
      console.error('Error deleting playlist:', err);
      toast.error('Failed to delete playlist');
      setIsLoading(false);
    }
  };

  // Add track to playlist
  const addTrackToPlaylist = async (playlistId: bigint, tokenId: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_PLAYLIST,
        abi: HIBEATS_PLAYLIST_ABI,
        functionName: 'addTrack',
        args: [playlistId, tokenId],
      });

      toast.success('Track addition initiated!');
    } catch (err) {
      console.error('Error adding track to playlist:', err);
      toast.error('Failed to add track to playlist');
      setIsLoading(false);
    }
  };

  // Remove track from playlist
  const removeTrackFromPlaylist = async (playlistId: bigint, tokenId: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_PLAYLIST,
        abi: HIBEATS_PLAYLIST_ABI,
        functionName: 'removeTrack',
        args: [playlistId, tokenId],
      });

      toast.success('Track removal initiated!');
    } catch (err) {
      console.error('Error removing track from playlist:', err);
      toast.error('Failed to remove track from playlist');
      setIsLoading(false);
    }
  };

  // Follow playlist
  const followPlaylist = async (playlistId: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_PLAYLIST,
        abi: HIBEATS_PLAYLIST_ABI,
        functionName: 'followPlaylist',
        args: [playlistId],
      });

      toast.success('Playlist follow initiated!');
    } catch (err) {
      console.error('Error following playlist:', err);
      toast.error('Failed to follow playlist');
      setIsLoading(false);
    }
  };

  // Get followed playlists
  const { data: followedPlaylists, refetch: refetchFollowed } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_PLAYLIST,
    abi: HIBEATS_PLAYLIST_ABI,
    functionName: 'getFollowedPlaylists',
    args: address ? [address] : undefined,
  });

  // Effects
  useEffect(() => {
    if (isSuccess) {
      setIsLoading(false);
      refetchPlaylists();
      refetchPublicPlaylists();
      refetchFollowed();
      toast.success('Playlist transaction completed!');
    }
  }, [isSuccess, refetchPlaylists, refetchPublicPlaylists, refetchFollowed]);

  useEffect(() => {
    if (error) {
      setIsLoading(false);
      toast.error('Playlist transaction failed: ' + error.message);
    }
  }, [error]);

  return {
    // Actions
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    followPlaylist,
    
    // Data
    userPlaylists: userPlaylists || [],
    publicPlaylists: publicPlaylists || [],
    featuredPlaylists: featuredPlaylists || [],
    trendingPlaylists: trendingPlaylists || [],
    followedPlaylists: followedPlaylists || [],
    
    // State
    isLoading: isLoading || isPending || isConfirming,
    hash,
    error,
  };
}
