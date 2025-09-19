import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  Calendar, 
  MapPin, 
  Link as LinkIcon, 
  Music, 
  Play, 
  Users, 
  UserPlus, 
  UserMinus,
  Settings,
  Badge as BadgeIcon,
  Edit3,
  Share2,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useProfile } from '@/hooks/useProfile';
import { UserProfile, CreatorLevel } from '@/types/music';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface ProfilePageProps {
  userAddress?: string;
  username?: string;
}

export default function ProfilePage({ userAddress, username }: ProfilePageProps) {
  const { username: urlUsername } = useParams();
  const navigate = useNavigate();
  const [targetProfile, setTargetProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tracks');

  const { 
    userProfile: currentUserProfile, 
    getProfileByAddress, 
    followUser, 
    unfollowUser, 
    isFollowing, 
    followers, 
    following 
  } = useProfile();

  const targetUsername = username || urlUsername;
  const targetAddress = userAddress;
  const isOwnProfile = currentUserProfile?.address === targetProfile?.address;
  
  // Simplified for now - use mock data or direct values
  const userFollowStats = {
    isFollowing: false,
    followerCount: followers?.length || 0,
    followingCount: following?.length || 0
  };

  // Load target profile
  useEffect(() => {
    const loadTargetProfile = async () => {
      setIsLoading(true);
      try {
        let profile = null;
        
        if (targetAddress) {
          profile = await getProfileByAddress(targetAddress);
        } else if (targetUsername) {
          profile = await getProfileByUsername(targetUsername);
        }
        
        if (profile) {
          setTargetProfile(profile);
          // Load follow stats
          await getFollowStats(profile.address);
        } else {
          toast({
            title: "Profile not found",
            description: "The requested profile does not exist.",
            variant: "destructive",
          });
          navigate('/');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (targetUsername || targetAddress) {
      loadTargetProfile();
    }
  }, [targetUsername, targetAddress, getProfileByAddress, getProfileByUsername, getFollowStats, navigate]);

  const handleFollow = async () => {
    if (!targetProfile) return;
    
    try {
      if (userFollowStats?.isFollowing) {
        await unfollowUser(targetProfile.address);
      } else {
        await followUser(targetProfile.address);
      }
    } catch (error) {
      console.error('Follow action failed:', error);
    }
  };

  // Helper function to get creator level
  const getCreatorLevel = (trackCount: number): CreatorLevel => {
    if (trackCount >= 100) return 'legend';
    if (trackCount >= 50) return 'expert';
    if (trackCount >= 20) return 'intermediate';
    if (trackCount >= 5) return 'beginner';
    return 'newbie';
  };

  const getCreatorLevelBadge = (level: CreatorLevel) => {
    const levelConfig = {
      [CreatorLevel.NEWCOMER]: { color: 'bg-gray-500', label: 'Newcomer' },
      [CreatorLevel.RISING]: { color: 'bg-blue-500', label: 'Rising Star' },
      [CreatorLevel.ESTABLISHED]: { color: 'bg-purple-500', label: 'Established' },
      [CreatorLevel.LEGEND]: { color: 'bg-yellow-500', label: 'Legend' }
    };
    
    const config = levelConfig[level];
    return (
      <Badge variant="secondary" className={cn("text-white", config.color)}>
        <BadgeIcon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!targetProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Profile not found</h2>
          <p className="text-muted-foreground">The requested profile does not exist.</p>
        </div>
      </div>
    );
  }

  const creatorLevel = getCreatorLevel(targetProfile.trackCount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        {targetProfile.coverImage ? (
          <img 
            src={targetProfile.coverImage} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary-glow/20 flex items-center justify-center">
            <Music className="w-16 h-16 text-primary/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Profile Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button variant="secondary" size="sm" className="backdrop-blur-sm bg-black/20 border-white/20">
            <Share2 className="w-4 h-4" />
          </Button>
          <Button variant="secondary" size="sm" className="backdrop-blur-sm bg-black/20 border-white/20">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="relative px-6 pb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-16 md:-mt-20">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background shadow-lg">
              <AvatarImage src={targetProfile.avatar} alt={targetProfile.displayName} />
              <AvatarFallback className="text-3xl md:text-4xl">
                {targetProfile.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {targetProfile.isVerified && (
              <Badge className="absolute -bottom-2 -right-2 bg-blue-500 text-white">
                <BadgeIcon className="w-3 h-3" />
              </Badge>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold">{targetProfile.displayName}</h1>
                {getCreatorLevelBadge(creatorLevel)}
              </div>
              <p className="text-lg text-muted-foreground">@{targetProfile.username}</p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{targetProfile.trackCount}</span>
                <span className="text-muted-foreground">Tracks</span>
              </div>
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{targetProfile.totalPlays.toLocaleString()}</span>
                <span className="text-muted-foreground">Plays</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{userFollowStats?.followerCount || 0}</span>
                <span className="text-muted-foreground">Followers</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{userFollowStats?.followingCount || 0}</span>
                <span className="text-muted-foreground">Following</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {isOwnProfile ? (
                <Button>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <Button 
                  onClick={handleFollow}
                  variant={userFollowStats?.isFollowing ? "outline" : "default"}
                  disabled={isLoading}
                >
                  {userFollowStats?.isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4 mr-2" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              )}
              {!isOwnProfile && (
                <Button variant="outline">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Collaborate
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Bio and Links */}
        <div className="mt-6 space-y-4">
          {targetProfile.bio && (
            <p className="text-foreground/80 max-w-2xl">{targetProfile.bio}</p>
          )}
          
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Joined {new Date(targetProfile.createdAt).toLocaleDateString()}</span>
            </div>
            {targetProfile.website && (
              <a 
                href={targetProfile.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <LinkIcon className="w-4 h-4" />
                <span>Website</span>
              </a>
            )}
          </div>

          {targetProfile.socialLinks.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {targetProfile.socialLinks.map((link, index) => (
                <Button key={index} variant="outline" size="sm" asChild>
                  <a href={link} target="_blank" rel="noopener noreferrer">
                    <LinkIcon className="w-3 h-3 mr-1" />
                    Social {index + 1}
                  </a>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content Tabs */}
      <div className="px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tracks">Tracks</TabsTrigger>
            <TabsTrigger value="playlists">Playlists</TabsTrigger>
            <TabsTrigger value="liked">Liked</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="tracks" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Mock tracks - replace with actual data */}
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="bg-card/50 border-glass-border hover:bg-card/70 transition-colors">
                    <CardContent className="p-4">
                      <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                        <Music className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium mb-1">Track {i}</h3>
                      <p className="text-sm text-muted-foreground">Electronic • 3:45</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="playlists" className="space-y-4">
              <div className="text-center py-12">
                <Music className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No public playlists</h3>
                <p className="text-muted-foreground">This creator hasn't shared any playlists yet.</p>
              </div>
            </TabsContent>

            <TabsContent value="liked" className="space-y-4">
              <div className="text-center py-12">
                <Music className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No liked tracks</h3>
                <p className="text-muted-foreground">Liked tracks are private to the user.</p>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <div className="space-y-4">
                {/* Mock activity - replace with actual data */}
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-card/50 border-glass-border">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={targetProfile.avatar} />
                          <AvatarFallback>{targetProfile.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium">{targetProfile.displayName}</span> created a new track
                          </p>
                          <p className="text-xs text-muted-foreground">{i} days ago</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
