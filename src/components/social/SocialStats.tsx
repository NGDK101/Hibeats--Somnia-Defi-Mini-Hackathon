import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Music, 
  Heart, 
  Play, 
  TrendingUp, 
  Award, 
  Star, 
  Eye,
  MessageCircle,
  Share2,
  Download,
  Disc3
} from 'lucide-react';

interface SocialStatsProps {
  stats: {
    followerCount: number;
    followingCount: number;
    trackCount: number;
    totalPlays: number;
    totalLikes: number;
    totalShares: number;
    totalComments: number;
    totalDownloads: number;
    nftsSold: number;
    totalEarnings: number;
    monthlyListeners: number;
    creatorRank: number;
  };
  timeframe?: 'all' | '30d' | '7d' | '24h';
  onTimeframeChange?: (timeframe: string) => void;
}

export const SocialStats: React.FC<SocialStatsProps> = ({
  stats,
  timeframe = 'all',
  onTimeframeChange
}) => {
  const formatNumber = (num: number, compact: boolean = true) => {
    if (!compact) return num.toLocaleString();
    
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatEarnings = (amount: number) => {
    return `${formatNumber(amount)} STT`;
  };

  const getGrowthPercentage = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100);
  };

  // Mock growth data - in production, this would come from analytics
  const growthData = {
    followers: getGrowthPercentage(stats.followerCount, stats.followerCount * 0.9),
    plays: getGrowthPercentage(stats.totalPlays, stats.totalPlays * 0.85),
    likes: getGrowthPercentage(stats.totalLikes, stats.totalLikes * 0.92),
    earnings: getGrowthPercentage(stats.totalEarnings, stats.totalEarnings * 0.88)
  };

  const statItems = [
    {
      label: 'Followers',
      value: formatNumber(stats.followerCount),
      fullValue: stats.followerCount.toLocaleString(),
      icon: <Users className="w-5 h-5" />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      growth: growthData.followers
    },
    {
      label: 'Following',
      value: formatNumber(stats.followingCount),
      fullValue: stats.followingCount.toLocaleString(),
      icon: <Users className="w-5 h-5" />,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    {
      label: 'Total Plays',
      value: formatNumber(stats.totalPlays),
      fullValue: stats.totalPlays.toLocaleString(),
      icon: <Play className="w-5 h-5" />,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      growth: growthData.plays
    },
    {
      label: 'Tracks',
      value: formatNumber(stats.trackCount),
      fullValue: stats.trackCount.toLocaleString(),
      icon: <Music className="w-5 h-5" />,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20'
    },
    {
      label: 'Total Likes',
      value: formatNumber(stats.totalLikes),
      fullValue: stats.totalLikes.toLocaleString(),
      icon: <Heart className="w-5 h-5" />,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      growth: growthData.likes
    },
    {
      label: 'Monthly Listeners',
      value: formatNumber(stats.monthlyListeners),
      fullValue: stats.monthlyListeners.toLocaleString(),
      icon: <Eye className="w-5 h-5" />,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/20'
    },
    {
      label: 'Total Earnings',
      value: formatEarnings(stats.totalEarnings),
      fullValue: `${stats.totalEarnings.toLocaleString()} STT`,
      icon: <Award className="w-5 h-5" />,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      growth: growthData.earnings
    },
    {
      label: 'NFTs Sold',
      value: formatNumber(stats.nftsSold),
      fullValue: stats.nftsSold.toLocaleString(),
      icon: <Disc3 className="w-5 h-5" />,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/20'
    }
  ];

  const engagementStats = [
    {
      label: 'Shares',
      value: formatNumber(stats.totalShares),
      icon: <Share2 className="w-4 h-4" />,
      color: 'text-blue-400'
    },
    {
      label: 'Comments',
      value: formatNumber(stats.totalComments),
      icon: <MessageCircle className="w-4 h-4" />,
      color: 'text-green-400'
    },
    {
      label: 'Downloads',
      value: formatNumber(stats.totalDownloads),
      icon: <Download className="w-4 h-4" />,
      color: 'text-purple-400'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Timeframe Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Social Statistics</h2>
        {onTimeframeChange && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-white/60">Timeframe:</span>
            <select
              value={timeframe}
              onChange={(e) => onTimeframeChange(e.target.value)}
              className="bg-glass-background border-glass-border text-white rounded px-3 py-1 text-sm"
            >
              <option value="all">All Time</option>
              <option value="30d">Last 30 Days</option>
              <option value="7d">Last 7 Days</option>
              <option value="24h">Last 24 Hours</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map((stat, index) => (
          <GlassCard key={index} className="p-4 hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <div className={stat.color}>
                  {stat.icon}
                </div>
              </div>
              {stat.growth !== undefined && (
                <Badge 
                  variant={stat.growth >= 0 ? "default" : "destructive"}
                  className={`text-xs ${stat.growth >= 0 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}
                >
                  <TrendingUp className={`w-3 h-3 mr-1 ${stat.growth < 0 ? 'rotate-180' : ''}`} />
                  {Math.abs(stat.growth).toFixed(1)}%
                </Badge>
              )}
            </div>
            
            <div>
              <p className="text-2xl font-bold text-white mb-1" title={stat.fullValue}>
                {stat.value}
              </p>
              <p className="text-sm text-white/60">{stat.label}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Engagement Stats */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <MessageCircle className="w-5 h-5 mr-2" />
          Engagement Metrics
        </h3>
        
        <div className="grid grid-cols-3 gap-6">
          {engagementStats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className={`${stat.color} mb-2 flex justify-center`}>
                {stat.icon}
              </div>
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-white/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Creator Rank */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-400" />
              Creator Ranking
            </h3>
            <p className="text-white/60">Your position among all creators</p>
          </div>
          
          <div className="text-right">
            <p className="text-3xl font-bold text-yellow-400">
              #{formatNumber(stats.creatorRank, false)}
            </p>
            <p className="text-sm text-white/60">Global Rank</p>
          </div>
        </div>
        
        {/* Rank Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.max(10, 100 - (stats.creatorRank / 1000) * 100)}%` 
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/60 mt-2">
            <span>Top Creator</span>
            <span>Rising Star</span>
          </div>
        </div>
      </GlassCard>

      {/* Quick Stats Summary */}
      <GlassCard className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-sm text-white/60">Avg. Plays per Track</p>
            <p className="text-lg font-semibold text-white">
              {stats.trackCount > 0 ? formatNumber(Math.floor(stats.totalPlays / stats.trackCount)) : '0'}
            </p>
          </div>
          <div>
            <p className="text-sm text-white/60">Engagement Rate</p>
            <p className="text-lg font-semibold text-white">
              {stats.totalPlays > 0 ? ((stats.totalLikes / stats.totalPlays) * 100).toFixed(1) : '0'}%
            </p>
          </div>
          <div>
            <p className="text-sm text-white/60">Avg. Earnings per NFT</p>
            <p className="text-lg font-semibold text-white">
              {stats.nftsSold > 0 ? formatEarnings(Math.floor(stats.totalEarnings / stats.nftsSold)) : '0 STT'}
            </p>
          </div>
          <div>
            <p className="text-sm text-white/60">Fan Loyalty</p>
            <p className="text-lg font-semibold text-white">
              {stats.followerCount > 0 ? ((stats.monthlyListeners / stats.followerCount) * 100).toFixed(0) : '0'}%
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};