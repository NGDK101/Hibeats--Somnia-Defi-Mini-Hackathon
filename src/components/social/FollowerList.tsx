import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/ui/glass-card';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Search, 
  Verified,
  Music,
  Star,
  TrendingUp,
  X,
  Filter,
  SortDesc
} from 'lucide-react';

interface FollowerUser {
  address: string;
  displayName: string;
  username: string;
  avatar: string;
  bio: string;
  verified: boolean;
  followerCount: number;
  trackCount: number;
  isFollowing: boolean;
  isFollowingBack: boolean;
  joinedDate: string;
  creatorLevel: 'NEWCOMER' | 'RISING' | 'ESTABLISHED' | 'LEGEND';
}

interface FollowerListProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'followers' | 'following';
  userAddress: string;
  title: string;
  count: number;
  onFollow?: (userAddress: string) => void;
  onUnfollow?: (userAddress: string) => void;
}

export const FollowerList: React.FC<FollowerListProps> = ({
  isOpen,
  onClose,
  type,
  userAddress,
  title,
  count,
  onFollow,
  onUnfollow
}) => {
  const [users, setUsers] = useState<FollowerUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<FollowerUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'followers' | 'tracks' | 'recent'>('recent');

  // Mock data for demonstration - in production, fetch from blockchain
  const generateMockUsers = (): FollowerUser[] => {
    const mockUsers: FollowerUser[] = [
      {
        address: '0x1234567890123456789012345678901234567890',
        displayName: 'Alex Chen',
        username: 'alexchen',
        avatar: '/api/placeholder/60/60',
        bio: 'Electronic music producer and NFT collector',
        verified: true,
        followerCount: 15420,
        trackCount: 89,
        isFollowing: true,
        isFollowingBack: false,
        joinedDate: 'March 2024',
        creatorLevel: 'ESTABLISHED'
      },
      {
        address: '0x2345678901234567890123456789012345678901',
        displayName: 'Sarah Williams',
        username: 'sarahbeats',
        avatar: '/api/placeholder/60/60',
        bio: 'Lo-fi hip hop artist, building the future of music',
        verified: false,
        followerCount: 8560,
        trackCount: 156,
        isFollowing: false,
        isFollowingBack: true,
        joinedDate: 'January 2024',
        creatorLevel: 'LEGEND'
      },
      {
        address: '0x3456789012345678901234567890123456789012',
        displayName: 'Marcus Johnson',
        username: 'beatmaker_marcus',
        avatar: '/api/placeholder/60/60',
        bio: 'Trap and hip-hop producer',
        verified: true,
        followerCount: 32100,
        trackCount: 234,
        isFollowing: true,
        isFollowingBack: true,
        joinedDate: 'December 2023',
        creatorLevel: 'LEGEND'
      },
      {
        address: '0x4567890123456789012345678901234567890123',
        displayName: 'Luna Rodriguez',
        username: 'lunamusic',
        avatar: '/api/placeholder/60/60',
        bio: 'Ambient and experimental sound designer',
        verified: false,
        followerCount: 2840,
        trackCount: 45,
        isFollowing: false,
        isFollowingBack: false,
        joinedDate: 'May 2024',
        creatorLevel: 'RISING'
      },
      {
        address: '0x5678901234567890123456789012345678901234',
        displayName: 'DJ Neon',
        username: 'djneon',
        avatar: '/api/placeholder/60/60',
        bio: 'Synthwave and retrowave specialist',
        verified: true,
        followerCount: 67200,
        trackCount: 312,
        isFollowing: true,
        isFollowingBack: false,
        joinedDate: 'August 2023',
        creatorLevel: 'LEGEND'
      }
    ];

    return mockUsers.slice(0, Math.min(count, 20)); // Limit to reasonable number
  };

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        const mockData = generateMockUsers();
        setUsers(mockData);
        setFilteredUsers(mockData);
        setIsLoading(false);
      }, 1000);
    }
  }, [isOpen, userAddress, type, count]);

  useEffect(() => {
    let filtered = users.filter(user => 
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.bio.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort users
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.displayName.localeCompare(b.displayName);
        case 'followers':
          return b.followerCount - a.followerCount;
        case 'tracks':
          return b.trackCount - a.trackCount;
        case 'recent':
        default:
          return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime();
      }
    });

    setFilteredUsers(filtered);
  }, [searchQuery, users, sortBy]);

  const handleFollow = (user: FollowerUser) => {
    setUsers(prev => prev.map(u => 
      u.address === user.address 
        ? { ...u, isFollowing: true, followerCount: u.followerCount + 1 }
        : u
    ));
    onFollow?.(user.address);
  };

  const handleUnfollow = (user: FollowerUser) => {
    setUsers(prev => prev.map(u => 
      u.address === user.address 
        ? { ...u, isFollowing: false, followerCount: u.followerCount - 1 }
        : u
    ));
    onUnfollow?.(user.address);
  };

  const getCreatorLevelInfo = (level: string) => {
    switch (level) {
      case 'NEWCOMER':
        return { color: 'bg-gray-500', label: 'Newcomer', icon: '🌱' };
      case 'RISING':
        return { color: 'bg-blue-500', label: 'Rising', icon: '⭐' };
      case 'ESTABLISHED':
        return { color: 'bg-purple-500', label: 'Established', icon: '👑' };
      case 'LEGEND':
        return { color: 'bg-yellow-500', label: 'Legend', icon: '🏆' };
      default:
        return { color: 'bg-gray-500', label: 'Newcomer', icon: '🌱' };
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-glass-background border-glass-border text-white max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>{title}</span>
              <Badge variant="secondary" className="bg-primary/20 text-primary border-0">
                {formatNumber(count)}
              </Badge>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="w-8 h-8 p-0 text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Search and Filter */}
        <div className="flex-shrink-0 space-y-3 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-glass-background/50 border-glass-border text-white pl-10"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-white/70">
              <Filter className="w-4 h-4" />
              <span>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-glass-background border-glass-border text-white rounded px-2 py-1 text-sm"
              >
                <option value="recent">Recent</option>
                <option value="name">Name</option>
                <option value="followers">Followers</option>
                <option value="tracks">Tracks</option>
              </select>
            </div>
            <div className="text-sm text-white/60">
              {filteredUsers.length} of {users.length} users
            </div>
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <GlassCard key={i} className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/10 rounded-full animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-white/10 rounded animate-pulse" />
                      <div className="h-3 bg-white/10 rounded w-2/3 animate-pulse" />
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => {
              const creatorInfo = getCreatorLevelInfo(user.creatorLevel);
              
              return (
                <GlassCard key={user.address} className="p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {/* Avatar */}
                      <Avatar className="w-12 h-12 ring-2 ring-white/20">
                        <AvatarImage src={user.avatar} alt={user.displayName} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white font-bold">
                          {user.displayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-white truncate">{user.displayName}</h3>
                          {user.verified && (
                            <Verified className="w-4 h-4 text-primary flex-shrink-0" />
                          )}
                          <Badge className={`${creatorInfo.color} text-white border-0 text-xs`}>
                            {creatorInfo.icon}
                          </Badge>
                          
                          {/* Mutual follow indicators */}
                          {user.isFollowingBack && (
                            <Badge variant="outline" className="border-primary/50 text-primary text-xs">
                              Follows you
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-white/60 mb-1">@{user.username}</p>
                        <p className="text-sm text-white/70 truncate mb-2">{user.bio}</p>
                        
                        {/* Stats */}
                        <div className="flex items-center space-x-4 text-xs text-white/60">
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{formatNumber(user.followerCount)} followers</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Music className="w-3 h-3" />
                            <span>{user.trackCount} tracks</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Follow Button */}
                    <Button
                      variant={user.isFollowing ? "outline" : "default"}
                      size="sm"
                      onClick={() => user.isFollowing ? handleUnfollow(user) : handleFollow(user)}
                      className={user.isFollowing ? 
                        "border-glass-border bg-glass-background/50 text-white hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 min-w-[80px]" :
                        "bg-primary hover:bg-primary/80 text-black min-w-[80px]"
                      }
                    >
                      {user.isFollowing ? (
                        <>
                          <UserMinus className="w-3 h-3 mr-1" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3 mr-1" />
                          Follow
                        </>
                      )}
                    </Button>
                  </div>
                </GlassCard>
              );
            })
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/60">
                {searchQuery ? 'No users found matching your search.' : `No ${type} yet.`}
              </p>
            </div>
          )}
        </div>

        {/* Footer with actions */}
        {!isLoading && filteredUsers.length > 0 && (
          <div className="flex-shrink-0 pt-4 border-t border-glass-border">
            <div className="flex items-center justify-between text-sm text-white/60">
              <span>Showing {filteredUsers.length} users</span>
              {type === 'following' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white"
                >
                  <SortDesc className="w-4 h-4 mr-2" />
                  Manage Following
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};