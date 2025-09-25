import React, { useState, useEffect } from 'react';
import { Search, Filter, TrendingUp, Star, Users, Music, Grid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserProfile, CreatorLevel } from '@/types/music';
import CreatorCard from '@/components/profile/CreatorCard';
import { cn } from '@/lib/utils';

// Mock creators data - in real app, this would come from the blockchain/backend
const mockCreators: UserProfile[] = [
  {
    address: '0x1234567890123456789012345678901234567890',
    username: 'beatmaker_pro',
    displayName: 'Beat Maker Pro',
    bio: 'Professional music producer creating AI-assisted beats. Love electronic and hip-hop genres with over 5 years of experience.',
    avatar: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop&crop=face',
    coverImage: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=300&fit=crop',
    website: 'https://beatmakerpro.com',
    socialLinks: ['https://twitter.com/beatmakerpro', 'https://soundcloud.com/beatmakerpro'],
    isVerified: true,
    isActive: true,
    createdAt: Date.now() - 86400000 * 30,
    followerCount: 1250,
    followingCount: 320,
    trackCount: 89,
    totalPlays: 45620,
    totalEarnings: 1.25
  },
  {
    address: '0x2345678901234567890123456789012345678901',
    username: 'synth_wave',
    displayName: 'Synth Wave',
    bio: 'Creating retro synthwave and electronic music with AI. Inspired by 80s aesthetics and modern technology.',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=300&fit=crop',
    website: '',
    socialLinks: ['https://instagram.com/synthwave'],
    isVerified: false,
    isActive: true,
    createdAt: Date.now() - 86400000 * 15,
    followerCount: 580,
    followingCount: 125,
    trackCount: 34,
    totalPlays: 12340,
    totalEarnings: 0.45
  },
  {
    address: '0x3456789012345678901234567890123456789012',
    username: 'jazz_fusion',
    displayName: 'Jazz Fusion Master',
    bio: 'Blending traditional jazz with modern AI composition. Creating unique fusion experiences.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    coverImage: '',
    website: 'https://jazzfusion.studio',
    socialLinks: ['https://spotify.com/jazzfusion', 'https://youtube.com/jazzfusion'],
    isVerified: true,
    isActive: true,
    createdAt: Date.now() - 86400000 * 60,
    followerCount: 890,
    followingCount: 210,
    trackCount: 156,
    totalPlays: 67890,
    totalEarnings: 2.8
  },
  {
    address: '0x4567890123456789012345678901234567890123',
    username: 'ambient_dreams',
    displayName: 'Ambient Dreams',
    bio: 'Crafting ethereal ambient soundscapes for meditation and relaxation.',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
    coverImage: '',
    website: '',
    socialLinks: [],
    isVerified: false,
    isActive: true,
    createdAt: Date.now() - 86400000 * 10,
    followerCount: 234,
    followingCount: 67,
    trackCount: 23,
    totalPlays: 8970,
    totalEarnings: 0.15
  },
  {
    address: '0x5678901234567890123456789012345678901234',
    username: 'hip_hop_legend',
    displayName: 'Hip Hop Legend',
    bio: 'Old school meets new school. AI-powered hip hop beats with classic soul.',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    coverImage: '',
    website: 'https://hiphoplegend.com',
    socialLinks: ['https://twitter.com/hiphoplegend', 'https://soundcloud.com/hiphoplegend'],
    isVerified: true,
    isActive: true,
    createdAt: Date.now() - 86400000 * 90,
    followerCount: 2340,
    followingCount: 445,
    trackCount: 234,
    totalPlays: 156780,
    totalEarnings: 8.9
  }
];

export default function DiscoverPage() {
  const [creators, setCreators] = useState<UserProfile[]>(mockCreators);
  const [filteredCreators, setFilteredCreators] = useState<UserProfile[]>(mockCreators);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('followers');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeFilter, setActiveFilter] = useState('all');

  // Filter and sort creators
  useEffect(() => {
    let filtered = [...creators];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(creator =>
        creator.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        creator.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        creator.bio.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Level filter
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(creator => {
        const level = getCreatorLevel(creator.trackCount);
        return level.toLowerCase() === selectedLevel.toLowerCase();
      });
    }

    // Active filter
    if (activeFilter === 'verified') {
      filtered = filtered.filter(creator => creator.isVerified);
    } else if (activeFilter === 'trending') {
      // Mock trending logic - creators with recent activity
      filtered = filtered.filter(creator => 
        creator.createdAt > Date.now() - 86400000 * 30
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'followers':
          return b.followerCount - a.followerCount;
        case 'tracks':
          return b.trackCount - a.trackCount;
        case 'plays':
          return b.totalPlays - a.totalPlays;
        case 'newest':
          return b.createdAt - a.createdAt;
        case 'earnings':
          return b.totalEarnings - a.totalEarnings;
        default:
          return 0;
      }
    });

    setFilteredCreators(filtered);
  }, [searchQuery, selectedLevel, sortBy, activeFilter, creators]);

  const getCreatorLevel = (trackCount: number): CreatorLevel => {
    if (trackCount >= 100) return CreatorLevel.LEGEND;
    if (trackCount >= 51) return CreatorLevel.ESTABLISHED;
    if (trackCount >= 11) return CreatorLevel.RISING;
    return CreatorLevel.NEWCOMER;
  };

  const getCreatorsByLevel = (level: CreatorLevel) => {
    return filteredCreators.filter(creator => getCreatorLevel(creator.trackCount) === level);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Discover Creators
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Explore talented music creators on HiBeats. Find your next favorite artist and support independent musicians.
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="bg-card/50 border-glass-border">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search creators by name, username, or bio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-input/50 border-glass-border"
                />
              </div>

              {/* Filter Row */}
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>

                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger className="w-40 bg-input/50 border-glass-border">
                    <SelectValue placeholder="Creator Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="newcomer">Newcomer</SelectItem>
                    <SelectItem value="rising">Rising Star</SelectItem>
                    <SelectItem value="established">Established</SelectItem>
                    <SelectItem value="legend">Legend</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40 bg-input/50 border-glass-border">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="followers">Most Followers</SelectItem>
                    <SelectItem value="tracks">Most Tracks</SelectItem>
                    <SelectItem value="plays">Most Plays</SelectItem>
                    <SelectItem value="earnings">Top Earners</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-1 ml-auto">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={activeFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveFilter('all')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  All Creators
                </Button>
                <Button
                  variant={activeFilter === 'verified' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveFilter('verified')}
                >
                  <Star className="w-4 h-4 mr-2" />
                  Verified
                </Button>
                <Button
                  variant={activeFilter === 'trending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveFilter('trending')}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Trending
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 border-glass-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                {filteredCreators.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Creators</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 border-glass-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {filteredCreators.filter(c => c.isVerified).length}
              </div>
              <div className="text-sm text-muted-foreground">Verified</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 border-glass-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {filteredCreators.reduce((sum, c) => sum + c.trackCount, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Tracks</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 border-glass-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-1">
                {(filteredCreators.reduce((sum, c) => sum + c.totalPlays, 0) / 1000).toFixed(0)}k
              </div>
              <div className="text-sm text-muted-foreground">Total Plays</div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {filteredCreators.length > 0 ? (
            <div className={cn(
              "grid gap-6",
              viewMode === 'grid' 
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                : "grid-cols-1"
            )}>
              {filteredCreators.map((creator) => (
                <CreatorCard
                  key={creator.address}
                  creator={creator}
                  compact={viewMode === 'list'}
                  showStats={viewMode === 'grid'}
                />
              ))}
            </div>
          ) : (
            <Card className="bg-card/50 border-glass-border">
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No creators found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms or filters to find more creators.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
