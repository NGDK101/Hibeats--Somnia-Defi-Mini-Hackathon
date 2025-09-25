import { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useAccount } from 'wagmi';

interface NotificationHelperProps {
  /** Register songs when they are created/minted */
  songs?: Array<{ id: string; title: string; owner?: string }>;

  /** Enable automatic song registration from NFT events */
  autoRegisterFromNFTEvents?: boolean;
}

/**
 * Helper component to automatically register songs for notification tracking
 * Use this component in pages where songs are created or displayed
 */
export const NotificationHelper: React.FC<NotificationHelperProps> = ({
  songs = [],
  autoRegisterFromNFTEvents = false
}) => {
  const { address } = useAccount();
  const { registerUserSong } = useNotifications();

  // Register songs when they are provided
  useEffect(() => {
    if (!address || songs.length === 0) return;

    songs.forEach(song => {
      // Only register if current user is the owner or no owner specified
      if (!song.owner || song.owner.toLowerCase() === address.toLowerCase()) {
        registerUserSong(song.id, song.title);
      }
    });
  }, [songs, address, registerUserSong]);

  // TODO: Listen to NFT mint events and auto-register songs
  useEffect(() => {
    if (!autoRegisterFromNFTEvents || !address) return;

    // This would listen to blockchain events for NFT minting
    // and automatically register songs for the user

    // Implementation would involve:
    // 1. Listen to smart contract events
    // 2. Filter events for current user
    // 3. Extract song data from event
    // 4. Call registerUserSong automatically

    return () => {
    };
  }, [autoRegisterFromNFTEvents, address, registerUserSong]);

  // This component doesn't render anything
  return null;
};

/**
 * Hook to easily register a song for notifications
 * Use this in components where songs are created
 */
export const useRegisterSong = () => {
  const { address } = useAccount();
  const { registerUserSong } = useNotifications();

  const registerSong = (songId: string, songTitle: string, songOwner?: string) => {
    if (!address) return;

    // Only register if current user is the owner or no owner specified
    if (!songOwner || songOwner.toLowerCase() === address.toLowerCase()) {
      registerUserSong(songId, songTitle);
    }
  };

  return { registerSong };
};