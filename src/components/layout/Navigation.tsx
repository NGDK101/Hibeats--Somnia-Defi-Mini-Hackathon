import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, User, Sun, Flame, Gift, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RewardHistoryPanel } from "@/components/notifications/RewardHistoryPanel";
import { cn } from "@/lib/utils";
import logoImage from "@/images/logo hibeats.png";
import beatsImage from "@/images/beats.png";
import { WalletConnect } from "@/components/ui/WalletConnect";
import { NotificationIcon } from "@/components/notifications/NotificationIcon";
import { useToken } from "@/hooks/useToken";
import { useProfile } from "@/hooks/useProfile";
import { useSocial } from "@/hooks/useSocial";
import { useDailyLogin } from "@/hooks/useDailyLogin";
import { useRewardHistoryV2 } from "@/hooks/useRewardHistoryV2";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { useClickDebounce } from "@/hooks/useClickDebounce";
import { toast } from "sonner";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
  onNavigationStart?: () => void;
}

export const Navigation = ({ activeTab, onTabChange, className, onNavigationStart }: NavigationProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isRewardPanelOpen, setIsRewardPanelOpen] = useState(false);
  const { balance, tokenSymbol, forceRefreshBalance } = useToken();
  const { address } = useAccount();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Reward History Hook
  const { rewardSummary, hasNewRewards } = useRewardHistoryV2();
  
  // Daily Login Hook
  const { 
    isLoading: dailyLoginLoading, 
    canClaim, 
    stats, 
    streakBonus, 
    claimDailyReward, 
    getUserStats, 
    getStreakText 
  } = useDailyLogin();

  // Load user stats on wallet connect
  useEffect(() => {
    if (address) {
      getUserStats();
    }
  }, [address, getUserStats]);

  // Handle daily reward claim
  const handleClaimDaily = useCallback(async () => {
    if (!canClaim) {
      toast.info('Already claimed today! Come back tomorrow 🌙');
      return;
    }

    await claimDailyReward();
    // Force refresh balance after claim
    setTimeout(() => {
      forceRefreshBalance();
    }, 2000); // Wait 2 seconds for blockchain confirmation
  }, [canClaim, claimDailyReward, forceRefreshBalance]);
  
  // Get profile data
  const { userProfile: userProfileData } = useProfile();
  const { getProfileFromState } = useSocial();

  // Get social profile
  const socialProfile = address ? getProfileFromState(address) : null;

  // Debounced navigation function to prevent multiple rapid clicks
  const handleNavigationInternal = useCallback((itemId: string, path: string) => {
    // Prevent navigation if clicking the same tab
    if (getCurrentActiveTab() === itemId) {
      return;
    }

    // Trigger loading state if callback provided
    if (onNavigationStart) {
      onNavigationStart();
    }

    // Execute navigation
    onTabChange(itemId);
    navigate(path);
  }, [onNavigationStart, onTabChange, navigate]);

  // Use debounce hook with 500ms delay and 1000ms max wait
  const [handleNavigation, cancelNavigation] = useClickDebounce(
    handleNavigationInternal,
    { delay: 500, maxWait: 1000 }
  );

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      cancelNavigation();
    };
  }, [cancelNavigation]);

  // Convert userProfileData array to object if it exists (same logic as in Portfolio)
  const profileFromContract = userProfileData ? (() => {
    return {
      username: userProfileData[0] || '',
      displayName: userProfileData[1] || '',
      bio: userProfileData[2] || '',
      avatar: userProfileData[3] || '',
      coverImage: userProfileData[4] || '',
      website: userProfileData[5] || '',
      socialLinks: userProfileData[6] || [],
      isVerified: userProfileData[7] || false,
      isActive: userProfileData[8] || false,
      createdAt: Number(userProfileData[9]) || 0,
      followerCount: Number(userProfileData[10]) || 0,
      followingCount: Number(userProfileData[11]) || 0,
      trackCount: Number(userProfileData[12]) || 0,
      totalPlays: Number(userProfileData[13]) || 0,
      totalEarnings: Number(userProfileData[14]) || 0,
    };
  })() : null;

  // Create normalized social profile (prioritize social profile over contract profile)
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

  // Get user avatar (same priority as Portfolio)
  const userAvatar = useMemo(() => {
    const profile = normalizedSocialProfile || profileFromContract;

    if (profile?.avatar && profile.avatar !== '') {
      return profile.avatar;
    }

    // Default placeholder
    return "/api/placeholder/40/40";
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

  const navItems = [
    { id: "explore", label: "explore", path: "/explore" },
    { id: "create", label: "create", path: "/create" },
    { id: "portfolio", label: "portfolio", path: "/portfolio" },
  ];

  // Determine active tab based on current location
  const getCurrentActiveTab = () => {
    const path = location.pathname;
    if (path === '/explore') return 'explore';
    if (path === '/create') return 'create';
    if (path === '/portfolio') return 'portfolio';
    return activeTab;
  };

  const currentActiveTab = getCurrentActiveTab();

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full bg-transparent  shadow-none transition-all duration-300",
      className
    )}>
      <div className="container flex h-16 items-center px-6">
        {/* Logo */}
        <div className="flex items-center mr-8">
          <button
            onClick={() => handleNavigation("create", "/create")}
            className="cursor-pointer"
          >
            <img
              src={logoImage}
              alt="HiBeats Logo"
              className="w-32 h-8 object-contain hover:opacity-80 transition-opacity"
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex items-center space-x-2 mr-8">
          {navItems.map((item) => {
            const isActive = currentActiveTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id, item.path)}
                className={cn(
                  "text-white hover:text-white hover:bg-white/20 hover:scale-105 hover:translate-x-1 transition-all duration-300 ease-out px-6 py-3 text-base font-medium rounded-full transform inline-block cursor-pointer relative",
                  isActive && "text-white bg-white/15 scale-105 translate-x-1"
                )}
              >
                {item.label}
                {/* Loading indicator for active navigation */}
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mr-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="search by creator or title song"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-input/50 border-glass-border focus:border-primary/50 rounded-full"
            />
          </div>
        </div>

        {/* User Info & Wallet */}
        <div className="flex items-center space-x-4">
          {/* Daily Login & GM Button (only show when wallet connected) */}
          {address && (
            <div className="flex items-center space-x-3">
              {/* GM Button */}
              <div className="relative">
                {/* Streak bonus indicator */}
                {streakBonus > 0 && stats && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-xs text-orange-300 font-medium">
                    🔥+{streakBonus}%
                  </div>
                )}
                <Button
                  onClick={handleClaimDaily}
                  disabled={!canClaim || dailyLoginLoading || !stats}
                  size="sm"
                  className={cn(
                    "flex items-center space-x-2 rounded-full px-3 py-2 bg-transparent border-none hover:bg-orange-500/20 transition-colors",
                    canClaim && stats
                      ? "text-orange-200 hover:text-orange-100 hover:scale-105" 
                      : "text-gray-400 cursor-not-allowed opacity-60"
                  )}
                >
                  <Flame className={cn(
                    "w-4 h-4",
                    canClaim && stats ? "text-orange-400" : "text-gray-500"
                  )} />
                  <span className="text-orange-200 text-sm font-medium">
                    {!stats 
                      ? 'Loading...'
                      : dailyLoginLoading 
                        ? 'sayGM..' 
                        : canClaim 
                          ? 'GM' 
                          : stats?.consecutiveLoginDays 
                            ? `Day ${stats.consecutiveLoginDays} ✓`
                            : 'GM ✓'
                    }
                  </span>
                </Button>
              </div>
            </div>
          )}

          {/* Beats Balance Button - opens Reward History Panel (only show when wallet connected) */}
          {address && (
            <Popover open={isRewardPanelOpen} onOpenChange={setIsRewardPanelOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 bg-white/10 rounded-full px-3 py-2 hover:bg-white/20 transition-colors relative"
                >
                  <img
                    src={beatsImage}
                    alt="Beats"
                    className="w-5 h-5 object-contain"
                  />
                  <span className="text-white text-sm font-medium">
                    {balance ? Number(formatEther(balance)).toFixed(2) : '0'} {tokenSymbol || 'BEATS'}
                  </span>
                  {hasNewRewards && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-background" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 bg-card/95 backdrop-blur-sm border-border/50" align="end">
                <RewardHistoryPanel />
              </PopoverContent>
            </Popover>
          )}

          {/* Beats Balance for non-connected wallet */}
          {!address && (
            <div className="flex items-center space-x-2 bg-white/10 rounded-full px-3 py-2">
              <img
                src={beatsImage}
                alt="Beats"
                className="w-5 h-5 object-contain"
              />
              <span className="text-white text-sm font-medium">
                {balance ? Number(formatEther(balance)).toFixed(2) : '0'} {tokenSymbol || 'BEATS'}
              </span>
            </div>
          )}

          {/* Notification Icon (only show when wallet is connected) */}
          {address && (
            <NotificationIcon
              variant="ghost"
              size="default"
              className="text-white hover:text-white hover:bg-white/20"
            />
          )}

          <WalletConnect />
        </div>
      </div>
    </header>
  );
};