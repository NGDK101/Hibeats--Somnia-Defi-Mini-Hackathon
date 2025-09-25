import React, { useState, useEffect } from 'react';
import { UserPlus, UserMinus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSocial } from '@/hooks/useSocial';
import { useNotifications } from '@/hooks/useNotifications';
import { useAccount } from 'wagmi';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  targetAddress: string;
  targetUsername?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg";
  showFollowerCount?: boolean;
  className?: string;
}

export default function FollowButton({ 
  targetAddress, 
  targetUsername, 
  variant = "default",
  size = "default",
  showFollowerCount = false,
  className 
}: FollowButtonProps) {
  const { address } = useAccount();
  const { followUser, unfollowUser, getSocialStats, socialStats } = useSocial();
  const { notifyFollow } = useNotifications();
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  // Load follow status and stats
  useEffect(() => {
    const loadFollowStatus = async () => {
      try {
        const stats = await getSocialStats(targetAddress);
        
        setIsFollowingUser(stats?.isFollowing || false);
        setFollowerCount(stats?.followerCount || 0);
      } catch (error) {
        console.error('Error loading follow status:', error);
      }
    };

    if (targetAddress) {
      loadFollowStatus();
    }
  }, [targetAddress, getSocialStats]);

  // Update local state when socialStats changes
  useEffect(() => {
    const stats = socialStats[targetAddress];
    if (stats) {
      setIsFollowingUser(stats.isFollowing || false);
      setFollowerCount(stats.followerCount);
    }
  }, [socialStats, targetAddress]);

  const handleFollow = async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      if (isFollowingUser) {
        await unfollowUser(targetAddress);
        setIsFollowingUser(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
      } else {
        await followUser(targetAddress);
        setIsFollowingUser(true);
        setFollowerCount(prev => prev + 1);

        // TODO: Follow notifications will be implemented when follow system is integrated with IPFS
      }
    } catch (error) {
      console.error('Follow action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleFollow}
      variant={isFollowingUser ? "outline" : variant}
      size={size}
      disabled={isLoading}
      className={cn(
        "transition-all duration-200",
        isFollowingUser && "hover:bg-destructive hover:text-destructive-foreground hover:border-destructive",
        className
      )}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
      ) : isFollowingUser ? (
        <UserMinus className="w-4 h-4 mr-2" />
      ) : (
        <UserPlus className="w-4 h-4 mr-2" />
      )}
      
      <span className="hidden group-hover:inline">
        {isFollowingUser ? 'Unfollow' : 'Follow'}
      </span>
      <span className="group-hover:hidden">
        {isFollowingUser ? 'Following' : 'Follow'}
      </span>
      
      {showFollowerCount && (
        <>
          <span className="mx-2">•</span>
          <Users className="w-4 h-4 mr-1" />
          <span>{followerCount.toLocaleString()}</span>
        </>
      )}
    </Button>
  );
}
