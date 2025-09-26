import { useEffect, useState, useMemo } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { getPrimarySomName } from '@/services/somniaService';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Wallet, AlertTriangle } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useSocial } from '@/hooks/useSocial';
import { useRainbowKitConnectionFix } from '@/hooks/useRainbowKitConnectionFix';
import { useWalletPersistence } from '@/hooks/useWalletPersistence';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import defaultAvatar from '@/images/assets/defaultprofile.gif';

export const WalletConnect = () => {
  const { address, isConnected } = useAccount();
  const { isConnectionInProgress, isMetaMaskAvailable } = useRainbowKitConnectionFix();
  const { isReconnecting, isInitializing, disconnectWallet } = useWalletPersistence();
  const [somniaName, setSomniaName] = useState<string | null>(null);
  const [isLoadingName, setIsLoadingName] = useState(false);
  const [isProfileStable, setIsProfileStable] = useState(false);

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
      trackCount: Number(userProfileData[10]) || 0,
      totalEarnings: Number(userProfileData[11]) || 0,
    };
  })() : null;

  // Create normalized social profile
  const normalizedSocialProfile = socialProfile ? {
    ...socialProfile,
    joinedDate: socialProfile.createdAt ?
      new Date(Number(socialProfile.createdAt) * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      }) : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      }),
    verified: socialProfile.isVerified || false,
    creatorLevel: "RISING" as const
  } : null;

  // Get user avatar with smart fallback logic
  const userAvatar = useMemo(() => {
    // Try social profile first, but skip if it's a placeholder
    if (normalizedSocialProfile?.avatar &&
        normalizedSocialProfile.avatar.trim() !== '' &&
        !normalizedSocialProfile.avatar.includes('/api/placeholder')) {
      return normalizedSocialProfile.avatar;
    }

    // Try contract profile avatar
    if (profileFromContract?.avatar &&
        profileFromContract.avatar.trim() !== '' &&
        !profileFromContract.avatar.includes('/api/placeholder')) {
      return profileFromContract.avatar;
    }

    // Use defaultAvatar as fallback
    return defaultAvatar;
  }, [normalizedSocialProfile, profileFromContract]);

  // Get user display name
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

  // Add profile stabilization to prevent flicker
  useEffect(() => {
    if (isConnected && address && !isReconnecting && !isInitializing) {
      // Wait a bit for profile data to stabilize
      const timer = setTimeout(() => {
        setIsProfileStable(true);
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      setIsProfileStable(false);
    }
  }, [isConnected, address, isReconnecting, isInitializing]);

  // Fetch Somnia name with optimized caching
  useEffect(() => {
    const fetchSomniaName = async () => {
      if (address && isConnected && !isReconnecting && isProfileStable) {
        // Check cache first
        const cacheKey = `somnia_name_${address}`;
        const cached = sessionStorage.getItem(cacheKey);
        const cacheTime = sessionStorage.getItem(`${cacheKey}_time`);
        
        // Use cached data if less than 5 minutes old
        if (cached && cacheTime && Date.now() - parseInt(cacheTime) < 5 * 60 * 1000) {
          setSomniaName(cached === 'null' ? null : cached);
          return;
        }

        setIsLoadingName(true);
        try {
          const name = await getPrimarySomName(address);
          setSomniaName(name);
          
          // Cache the result
          sessionStorage.setItem(cacheKey, name || 'null');
          sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());
        } catch (error) {
          console.error('Failed to fetch Somnia name:', error);
          setSomniaName(null);
          // Cache the null result to avoid repeated failed requests
          sessionStorage.setItem(cacheKey, 'null');
          sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());
        } finally {
          setIsLoadingName(false);
        }
      } else {
        setSomniaName(null);
        setIsLoadingName(false);
      }
    };

    fetchSomniaName();
  }, [address, isConnected, isReconnecting, isProfileStable]);

  // Loading state during connection or reconnection
  const showMetaMaskWarning = !isMetaMaskAvailable();
  const isLoading = isConnectionInProgress || isReconnecting || isInitializing;
  const showConnectedUI = isConnected && isProfileStable;

  if (!isConnected && !isInitializing) {
    return (
      <div className="flex items-center space-x-2">
        {/* Use RainbowKit's ConnectButton with custom styling */}
        <ConnectButton.Custom>
          {({ account, chain, openConnectModal, mounted }) => {
            const ready = mounted;
            const connected = ready && account && chain;

            return (
              <div
                {...(!ready && {
                  'aria-hidden': true,
                  'style': {
                    opacity: 0,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  },
                })}
              >
                {(() => {
                  if (!connected) {
                    return (
                      <Button
                        onClick={openConnectModal}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/80 hover:to-purple-600/80 text-black font-semibold px-4 py-2 rounded-full transition-all duration-200 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {isReconnecting ? 'Reconnecting...' : 
                             isInitializing ? 'Initializing...' : 'Connecting...'}
                          </>
                        ) : (
                          <>
                            <Wallet className="w-4 h-4 mr-2" />
                            Connect Wallet
                          </>
                        )}
                      </Button>
                    );
                  }
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    );
  }

  // Show loading skeleton during initialization or when profile not stable
  if (isInitializing || (isConnected && !isProfileStable)) {
    return (
      <div className="flex items-center space-x-3">
        {/* Loading skeleton that matches the connected state layout */}
        <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20 animate-pulse">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-white/70" />
            <span className="text-white/70 text-sm">
              {isInitializing ? 'Reconnecting...' : 'Loading...'}
            </span>
          </div>
        </div>
        
        {/* Loading avatar skeleton */}
        <div className="w-10 h-10 bg-white/10 rounded-full animate-pulse border-2 border-white/30"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Wallet Info Display - Clean Circular Design */}
      {showConnectedUI && (
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
      )}

      {/* User Avatar with Photo */}
      {showConnectedUI && (
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
      )}
    </div>
  );
};
