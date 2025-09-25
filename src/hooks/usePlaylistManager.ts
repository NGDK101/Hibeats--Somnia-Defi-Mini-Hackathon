import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { contracts } from '@/config/contracts';

export interface PlaylistItem {
  id: string;
  name: string;
  description: string;
  creator: string;
  type: 'PERSONAL' | 'SHARED' | 'PUBLIC' | 'LIKED' | 'HISTORY' | 'QUEUE';
  trackIds: string[];
  isPublic: boolean;
  isCollaborative: boolean;
  createdAt: number;
  updatedAt: number;
  totalDuration: number;
  playCount: number;
  coverImageHash: string;
  followerCount: number;
}

export interface PlayerState {
  currentTrackId: string;
  currentPlaylistId: string;
  currentPosition: number;
  isPlaying: boolean;
  isShuffled: boolean;
  repeatMode: 'OFF' | 'SINGLE' | 'PLAYLIST';
  volume: number;
  queue: string[];
  originalQueue: string[];
  queueIndex: number;
}

export const usePlaylistManager = () => {
  const { address } = useAccount();
  const { toast } = useToast();
  const [userPlaylists, setUserPlaylists] = useState<PlaylistItem[]>([]);
  const [publicPlaylists, setPublicPlaylists] = useState<PlaylistItem[]>([]);
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get user playlists
  const { data: userPlaylistIds, refetch: refetchUserPlaylists } = useReadContract({
    address: contracts.HiBeatsPlaylist.address as `0x${string}`,
    abi: contracts.HiBeatsPlaylist.abi,
    functionName: 'getUserPlaylists',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Get player state
  const { data: currentPlayerState, refetch: refetchPlayerState } = useReadContract({
    address: contracts.HiBeatsPlaylist.address as `0x${string}`,
    abi: contracts.HiBeatsPlaylist.abi,
    functionName: 'playerStates',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Contract write functions
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Fetch playlist details
  const fetchPlaylistDetails = useCallback(async (playlistId: string): Promise<PlaylistItem | null> => {
    try {
      // This would typically make a contract call to get playlist details
      // For now, returning mock data
      return {
        id: playlistId,
        name: "My Playlist",
        description: "A collection of my favorite tracks",
        creator: address || "",
        type: "PERSONAL",
        trackIds: [],
        isPublic: false,
        isCollaborative: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        totalDuration: 0,
        playCount: 0,
        coverImageHash: "",
        followerCount: 0,
      };
    } catch (error) {
      console.error('Error fetching playlist details:', error);
      return null;
    }
  }, [address]);

  // Create new playlist
  const createPlaylist = useCallback(async (
    name: string,
    description: string,
    type: 'PERSONAL' | 'SHARED' | 'PUBLIC' = 'PERSONAL',
    isPublic: boolean = false,
    isCollaborative: boolean = false,
    coverImageHash: string = ""
  ) => {
    if (!address) {
      toast({
        title: "Error",
        description: "Please connect your wallet",
        variant: "destructive",
      });
      return;
    }

    try {
      const playlistTypeMap = {
        'PERSONAL': 0,
        'SHARED': 1,
        'PUBLIC': 2,
      };

      writeContract({
        address: contracts.HiBeatsPlaylist.address as `0x${string}`,
        abi: contracts.HiBeatsPlaylist.abi,
        functionName: 'createPlaylist',
        args: [name, description, playlistTypeMap[type], isPublic, isCollaborative, coverImageHash],
      });
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast({
        title: "Error",
        description: "Failed to create playlist",
        variant: "destructive",
      });
    }
  }, [address, writeContract, toast]);

  // Add track to playlist
  const addTrackToPlaylist = useCallback(async (playlistId: string, trackId: string) => {
    if (!address) {
      toast({
        title: "Error",
        description: "Please connect your wallet",
        variant: "destructive",
      });
      return;
    }

    try {
      writeContract({
        address: contracts.HiBeatsPlaylist.address as `0x${string}`,
        abi: contracts.HiBeatsPlaylist.abi,
        functionName: 'addTrackToPlaylist',
        args: [BigInt(playlistId), BigInt(trackId)],
      });
    } catch (error) {
      console.error('Error adding track to playlist:', error);
      toast({
        title: "Error",
        description: "Failed to add track to playlist",
        variant: "destructive",
      });
    }
  }, [address, writeContract, toast]);

  // Remove track from playlist
  const removeTrackFromPlaylist = useCallback(async (playlistId: string, trackId: string) => {
    if (!address) {
      toast({
        title: "Error",
        description: "Please connect your wallet",
        variant: "destructive",
      });
      return;
    }

    try {
      writeContract({
        address: contracts.HiBeatsPlaylist.address as `0x${string}`,
        abi: contracts.HiBeatsPlaylist.abi,
        functionName: 'removeTrackFromPlaylist',
        args: [BigInt(playlistId), BigInt(trackId)],
      });
    } catch (error) {
      console.error('Error removing track from playlist:', error);
      toast({
        title: "Error",
        description: "Failed to remove track from playlist",
        variant: "destructive",
      });
    }
  }, [address, writeContract, toast]);

  // Update player state
  const updatePlayerState = useCallback(async (
    trackId: string,
    playlistId: string,
    queueIds: string[] = [],
    position: number = 0,
    isPlaying: boolean = false,
    isShuffled: boolean = false,
    repeatMode: 'OFF' | 'SINGLE' | 'PLAYLIST' = 'OFF',
    volume: number = 50,
    playbackSpeed: number = 100
  ) => {
    if (!address) return;

    try {
      const repeatModeMap = { 'OFF': 0, 'SINGLE': 1, 'PLAYLIST': 2 };
      writeContract({
        address: contracts.HiBeatsPlaylist.address as `0x${string}`,
        abi: contracts.HiBeatsPlaylist.abi,
        functionName: 'updatePlayerState',
        args: [
          BigInt(trackId),
          BigInt(playlistId),
          queueIds.map(id => BigInt(id)),
          BigInt(position),
          isPlaying,
          isShuffled,
          repeatModeMap[repeatMode],
          volume,
          BigInt(playbackSpeed)
        ],
      });
    } catch (error) {
      console.error('Error updating player state:', error);
    }
  }, [address, writeContract]);

  // Follow/unfollow playlist
  const followPlaylist = useCallback(async (playlistId: string) => {
    if (!address) {
      toast({
        title: "Error",
        description: "Please connect your wallet",
        variant: "destructive",
      });
      return;
    }

    try {
      writeContract({
        address: contracts.HiBeatsPlaylist.address as `0x${string}`,
        abi: contracts.HiBeatsPlaylist.abi,
        functionName: 'toggleFollowPlaylist',
        args: [BigInt(playlistId)],
      });
    } catch (error) {
      console.error('Error following playlist:', error);
      toast({
        title: "Error",
        description: "Failed to follow playlist",
        variant: "destructive",
      });
    }
  }, [address, writeContract, toast]);

  // Load playlists data
  useEffect(() => {
    const loadPlaylists = async () => {
      if (!userPlaylistIds) return;

      setIsLoading(true);
      try {
        // Load user playlists
        if (userPlaylistIds && Array.isArray(userPlaylistIds)) {
          const userPlaylistDetails = await Promise.all(
            userPlaylistIds.map((id: bigint) => fetchPlaylistDetails(id.toString()))
          );
          setUserPlaylists(userPlaylistDetails.filter(Boolean) as PlaylistItem[]);
        }
      } catch (error) {
        console.error('Error loading playlists:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlaylists();
  }, [userPlaylistIds, fetchPlaylistDetails]);

  // Update player state from contract
  useEffect(() => {
    if (currentPlayerState) {
      setPlayerState(currentPlayerState as PlayerState);
    }
  }, [currentPlayerState]);

  // Handle transaction completion
  useEffect(() => {
    if (isSuccess) {
      toast({
        title: "Success",
        description: "Transaction completed successfully!",
      });
      refetchUserPlaylists();
    }
  }, [isSuccess, refetchUserPlaylists, toast]);

  // Handle transaction errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Transaction failed",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return {
    // Data
    userPlaylists,
    publicPlaylists,
    playerState,
    isLoading: isLoading || isPending || isConfirming,

    // Functions
    createPlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    updatePlayerState,
    followPlaylist,
    fetchPlaylistDetails,

    // Refetch functions
    refetchUserPlaylists,
    refetchPlayerState,
  };
};