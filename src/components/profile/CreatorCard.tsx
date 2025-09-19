import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Music, Play, Badge as BadgeIcon, Star, Verified } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserProfile, CreatorLevel } from '@/types/music';
import { useProfile } from '@/hooks/useProfile';
import FollowButton from './FollowButton';
import { cn } from '@/lib/utils';

interface CreatorCardProps {
  creator: UserProfile;
  className?: string;
  showStats?: boolean;
  compact?: boolean;
}

export default function CreatorCard({ 
  creator, 
  className, 
  showStats = true, 
  compact = false 
}: CreatorCardProps) {
  const navigate = useNavigate();
  const { getCreatorLevel } = useProfile();
  
  const creatorLevel = getCreatorLevel(creator.trackCount);

  const getCreatorLevelConfig = (level: CreatorLevel) => {
    const configs = {
      [CreatorLevel.NEWCOMER]: { 
        color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', 
        label: 'Newcomer',
        icon: User 
      },
      [CreatorLevel.RISING]: { 
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', 
        label: 'Rising Star',
        icon: Star 
      },
      [CreatorLevel.ESTABLISHED]: { 
        color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', 
        label: 'Established',
        icon: BadgeIcon 
      },
      [CreatorLevel.LEGEND]: { 
        color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', 
        label: 'Legend',
        icon: BadgeIcon 
      }
    };
    return configs[level];
  };

  const levelConfig = getCreatorLevelConfig(creatorLevel);
  const LevelIcon = levelConfig.icon;

  const handleProfileClick = () => {
    navigate(`/profile/${creator.username}`);
  };

  if (compact) {
    return (
      <Card className={cn(
        "bg-card/50 border-glass-border hover:bg-card/70 transition-all duration-200 cursor-pointer group",
        className
      )}>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="relative" onClick={handleProfileClick}>
              <Avatar className="w-10 h-10">
                <AvatarImage src={creator.avatar} alt={creator.displayName} />
                <AvatarFallback className="text-sm">
                  {creator.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {creator.isVerified && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <Verified className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0" onClick={handleProfileClick}>
              <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                {creator.displayName}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                @{creator.username}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={cn("text-xs", levelConfig.color)}>
                <LevelIcon className="w-3 h-3 mr-1" />
                {levelConfig.label}
              </Badge>
              <FollowButton 
                targetAddress={creator.address}
                targetUsername={creator.username}
                size="sm"
                variant="outline"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "bg-card/50 border-glass-border hover:bg-card/70 transition-all duration-300 cursor-pointer group",
      className
    )}>
      <CardContent className="p-6">
        {/* Header with Avatar and Basic Info */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative" onClick={handleProfileClick}>
            <Avatar className="w-16 h-16 border-2 border-glass-border">
              <AvatarImage src={creator.avatar} alt={creator.displayName} />
              <AvatarFallback className="text-xl">
                {creator.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {creator.isVerified && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-background">
                <Verified className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div onClick={handleProfileClick}>
              <h3 className="font-semibold text-lg mb-1 truncate group-hover:text-primary transition-colors">
                {creator.displayName}
              </h3>
              <p className="text-muted-foreground text-sm mb-2">@{creator.username}</p>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className={cn("text-xs", levelConfig.color)}>
                <LevelIcon className="w-3 h-3 mr-1" />
                {levelConfig.label}
              </Badge>
            </div>
          </div>
        </div>

        {/* Bio */}
        {creator.bio && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2" onClick={handleProfileClick}>
            {creator.bio}
          </p>
        )}

        {/* Stats */}
        {showStats && (
          <div className="grid grid-cols-3 gap-4 mb-4 text-center" onClick={handleProfileClick}>
            <div>
              <div className="flex items-center justify-center gap-1 text-sm font-medium">
                <Music className="w-4 h-4 text-primary" />
                {creator.trackCount}
              </div>
              <p className="text-xs text-muted-foreground">Tracks</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-sm font-medium">
                <Play className="w-4 h-4 text-primary" />
                {creator.totalPlays > 1000 
                  ? `${(creator.totalPlays / 1000).toFixed(1)}k` 
                  : creator.totalPlays}
              </div>
              <p className="text-xs text-muted-foreground">Plays</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-sm font-medium">
                <User className="w-4 h-4 text-primary" />
                {creator.followerCount > 1000 
                  ? `${(creator.followerCount / 1000).toFixed(1)}k` 
                  : creator.followerCount}
              </div>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={handleProfileClick}
          >
            View Profile
          </Button>
          <FollowButton 
            targetAddress={creator.address}
            targetUsername={creator.username}
            size="sm"
            className="flex-1"
          />
        </div>
      </CardContent>
    </Card>
  );
}
