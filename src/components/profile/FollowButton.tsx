import React, { useState, useEffect } from 'react';
import { UserPlus, UserMinus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSocial } from '@/hooks/useProfile';
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
  const { followUser, unfollowUser, getFollowStats, isFollowing, followStats } = useSocial();
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  // Load follow status and stats
  useEffect(() => {
    const loadFollowStatus = async () => {
      try {
        const [following, stats] = await Promise.all([
          isFollowing(targetAddress),
          getFollowStats(targetAddress)
        ]);
        
        setIsFollowingUser(following);
        setFollowerCount(stats.followerCount);
      } catch (error) {
        console.error('Error loading follow status:', error);
      }
    };

    if (targetAddress) {
      loadFollowStatus();
    }
  }, [targetAddress, isFollowing, getFollowStats]);

  // Update local state when followStats changes
  useEffect(() => {
    const stats = followStats[targetAddress];
    if (stats) {
      setIsFollowingUser(stats.isFollowing || false);
      setFollowerCount(stats.followerCount);
    }
  }, [followStats, targetAddress]);

  const handleFollow = async () => {
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
