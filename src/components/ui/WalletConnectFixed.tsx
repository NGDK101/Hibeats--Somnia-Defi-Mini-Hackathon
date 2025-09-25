import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { getPrimarySomName } from '@/services/somniaService';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Wallet } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useSocial } from '@/hooks/useSocial';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import defaultAvatar from '@/images/assets/defaultprofile.gif';
import { toast } from 'sonner';

export const WalletConnect = () => {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  
  const [somniaName, setSomniaName] = useState<string | null>(null);
  const [isLoadingName, setIsLoadingName] = useState(false);
  const [connectionAttempted, setConnectionAttempted] = useState(false);
  const connectingRef = useRef(false);
  
  // Get profile data (same logic as Navigation and Portfolio)
  const { userProfile: userProfileData } = useProfile();
  const { getProfileFromState } = useSocial();

  // Get social profile
  const socialProfile = address ? getProfileFromState(address) : null;

  // Convert userProfileData array to object if it exists
  const profileFromContract = userProfileData ? (() => {
    // Smart contract Profile struct (HiBeatsProfile):
    // 0: creator (address), 1: username, 2: displayName, 3: bio, 4: profileImageUrl, 5: bannerImageUrl
    // 6: website, 7: twitter, 8: instagram, 9: spotify
    // 10: totalTracks, 11: totalEarnings, 12: followerCount, 13: followingCount, 14: joinedAt
    // 15: isVerified, 16: isActive

    return {
      username: userProfileData[1] || '',
      displayName: userProfileData[2] || '',
      bio: userProfileData[3] || '',
      avatar: userProfileData[4] || '', // profileImageUrl
      coverImage: userProfileData[5] || '', // bannerImageUrl
      website: userProfileData[6] || '',
      twitter: userProfileData[7] || '',
      instagram: userProfileData[8] || '',
      spotify: userProfileData[9] || '',
      isVerified: userProfileData[15] || false,
      isActive: userProfileData[16] || false,
      createdAt: Number(userProfileData[14]) || 0,
      followerCount: Number(userProfileData[12]) || 0,
      followingCount: Number(userProfileData[13]) || 0,
    };
  })() : null;

  // Normalize social profile
  const normalizedSocialProfile = socialProfile ? {
    ...socialProfile,
    avatar: socialProfile.profileImageURI || socialProfile.profilePicture || socialProfile.avatar || '',
  } : null;

  // Memoized user avatar and display name
  const userAvatar = useMemo(() => {
    const profile = normalizedSocialProfile || profileFromContract;
    return profile?.avatar || defaultAvatar;
  }, [normalizedSocialProfile, profileFromContract]);

  const userDisplayName = useMemo(() => {
    const profile = normalizedSocialProfile || profileFromContract;

    if (profile?.displayName && profile.displayName !== '') {
      return profile.displayName;
    }

    if (profile?.username && profile.username !== '') {
      return profile.username;
    }

    return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "User";
  }, [normalizedSocialProfile, profileFromContract, address]);

  // Debounced connection handler
  const handleConnect = useCallback(async () => {
    if (connectingRef.current || isConnecting || isReconnecting) {
      return;
    }

    try {
      connectingRef.current = true;
      setConnectionAttempted(true);

      const metamaskConnector = connectors.find(
        (connector) => connector.name === 'MetaMask'
      );

      if (metamaskConnector) {
        await connect({ connector: metamaskConnector });
      } else {
        // Fallback to first available connector
        const availableConnector = connectors[0];
        if (availableConnector) {
          await connect({ connector: availableConnector });
        } else {
          toast.error('No wallet connectors available');
        }
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Failed to connect wallet');
    } finally {
      connectingRef.current = false;
    }
  }, [connect, connectors, isConnecting, isReconnecting]);

  // Handle connection errors
  useEffect(() => {
    if (error && connectionAttempted) {
      console.error('Wallet connection error:', error);
      toast.error(`Connection failed: ${error.message}`);
      setConnectionAttempted(false);
      connectingRef.current = false;
    }
  }, [error, connectionAttempted]);

  // Reset connection state when disconnected
  useEffect(() => {
    if (!isConnected && !isConnecting && !isReconnecting) {
      setConnectionAttempted(false);
      connectingRef.current = false;
    }
  }, [isConnected, isConnecting, isReconnecting]);

  // Fetch Somnia name with proper cleanup
  useEffect(() => {
    const fetchSomniaName = async () => {
      if (address && isConnected) {
        setIsLoadingName(true);
        try {
          const name = await getPrimarySomName(address);
          setSomniaName(name);
        } catch (error) {
          console.error('Failed to fetch Somnia name:', error);
          setSomniaName(null);
        } finally {
          setIsLoadingName(false);
        }
      } else {
        setSomniaName(null);
        setIsLoadingName(false);
      }
    };

    fetchSomniaName();
  }, [address, isConnected]);

  // Loading state during connection
  const isLoading = isConnecting || isReconnecting || isPending;

  if (!isConnected) {
    return (
      <div className="flex items-center space-x-2">
        <Button
          onClick={handleConnect}
          disabled={isLoading}
          className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/80 hover:to-purple-600/80 text-black font-semibold px-4 py-2 rounded-full transition-all duration-200 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </>
          )}
        </Button>
        
        {/* Fallback to RainbowKit if custom button fails */}
        <div className="hidden">
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Wallet Info Display - Clean Circular Design */}
      <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20 hover:bg-white/15 transition-all duration-200 cursor-pointer">
        <div className="flex flex-col items-start min-w-0">
          {somniaName ? (
            <div className="flex items-center space-x-2">
              <span className="text-white text-sm font-medium truncate max-w-[120px]">{somniaName}</span>
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-primary/20 text-primary border-primary/30 rounded-full">
                .som
              </Badge>
            </div>
          ) : isLoadingName ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-3 h-3 animate-spin text-white/70" />
              <span className="text-white/70 text-xs">Loading...</span>
            </div>
          ) : (
            <span className="text-white text-sm font-medium">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          )}
        </div>
      </div>

      {/* User Avatar with Photo */}
      <ConnectButton.Custom>
        {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
          if (!mounted || !account || !chain) return null;

          return (
            <div
              onClick={openAccountModal}
              className="cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Avatar className="w-10 h-10 border-2 border-white/30 hover:border-white/50 transition-all duration-200">
                {userAvatar && userAvatar.trim() !== '' && userAvatar !== defaultAvatar ? (
                  <ImageWithFallback
                    src={userAvatar}
                    alt={userDisplayName}
                    className="w-full h-full object-cover rounded-full"
                    fallbackSrc={defaultAvatar}
                  />
                ) : (
                  <AvatarImage src={defaultAvatar} alt={userDisplayName} />
                )}
                <AvatarFallback
                  className="text-white font-bold text-lg"
                  style={{
                    background: 'linear-gradient(135deg, #FF007A 0%, #7C5DFA 100%)'
                  }}
                >
                  <User className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
            </div>
          );
        }}
      </ConnectButton.Custom>
    </div>
  );
};