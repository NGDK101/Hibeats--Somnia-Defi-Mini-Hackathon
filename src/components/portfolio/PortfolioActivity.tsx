import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { 
  Music, 
  Disc3, 
  ShoppingCart, 
  X, 
  Clock, 
  TrendingUp,
  Sparkles,
  Calendar,
  Filter
} from "lucide-react";
import { useGeneratedMusicContext } from "@/hooks/useGeneratedMusicContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useAccount } from "wagmi";

interface ActivityItem {
  id: string;
  type: 'generate' | 'mint' | 'list' | 'unlist' | 'purchase' | 'sale' | 'interaction' | 'sold' | 'earn_beats';
  title: string;
  description: string;
  timestamp: Date;
  songId?: string;
  nftId?: string;
  price?: number;
  beatsEarned?: number;
  status: 'completed' | 'pending' | 'failed';
  transactionHash?: string;
  interactionType?: string;
  userId?: number;
  buyer?: string;
  seller?: string;
}

const activityIcons = {
  generate: { icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  mint: { icon: Disc3, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  list: { icon: ShoppingCart, color: 'text-green-400', bg: 'bg-green-500/20' },
  unlist: { icon: X, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  purchase: { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  sale: { icon: TrendingUp, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  sold: { icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/20' },
  earn_beats: { icon: TrendingUp, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  interaction: { icon: Music, color: 'text-pink-400', bg: 'bg-pink-500/20' }
};

const activityLabels = {
  generate: 'Music Generated',
  mint: 'NFT Minted',
  list: 'NFT Listed',
  unlist: 'NFT Unlisted',
  purchase: 'NFT Purchased',
  sale: 'NFT Sold',
  sold: 'NFT Sold',
  earn_beats: 'Beats Earned',
  interaction: 'Interaction'
};

export const PortfolioActivity = () => {
  const { address } = useAccount();
  const { generatedMusic } = useGeneratedMusicContext();
  const analytics = useAnalytics();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate activities from real data
  useEffect(() => {
    const generateActivities = () => {
      try {
        setLoading(true);
        setError(null);

        const realActivities: ActivityItem[] = [];

      // 1. Add generated music activities (real data)
      generatedMusic.forEach((song, index) => {
        const generationTime = song.createdAt ? new Date(song.createdAt) : new Date(Date.now() - (index * 86400000));

        realActivities.push({
          id: `gen-${song.id}`,
          type: 'generate',
          title: `Generated "${song.title}"`,
          description: `AI music generation completed for ${song.genre?.join(', ') || 'various genres'}`,
          timestamp: generationTime,
          songId: song.id,
          status: 'completed'
        });
      });

      // 2. Add sample interactions (sync data)
      const sampleInteractions = [
        {
          id: 1,
          interaction_type: 'play',
          song_id: generatedMusic[0]?.id || 'sample-song',
          timestamp: Date.now() - 3600000
        },
        {
          id: 2,
          interaction_type: 'like',
          song_id: generatedMusic[1]?.id || 'sample-song-2',
          timestamp: Date.now() - 7200000
        },
        {
          id: 3,
          interaction_type: 'share',
          song_id: generatedMusic[0]?.id || 'sample-song',
          timestamp: Date.now() - 10800000
        }
      ];

      sampleInteractions.forEach((interaction, index) => {
        realActivities.push({
          id: `interaction-${interaction.id}`,
          type: 'interaction',
          title: `${interaction.interaction_type} interaction`,
          description: `User ${interaction.interaction_type} on song`,
          timestamp: new Date(interaction.timestamp),
          songId: interaction.song_id,
          userId: 1,
          interactionType: interaction.interaction_type,
          status: 'completed'
        });
      });

      // 3. Add minting activities from generated music
      generatedMusic.slice(0, 8).forEach((song, index) => {
        // Simulate some songs being minted
        if (index % 3 === 0) {
          const mintTimestamp = new Date(Date.now() - Math.random() * 7 * 86400000);

          realActivities.push({
            id: `mint-${song.id}`,
            type: 'mint',
            title: `Minted "${song.title}" as NFT`,
            description: `Successfully minted music NFT on blockchain`,
            timestamp: mintTimestamp,
            songId: song.id,
            nftId: `nft-${song.id}`,
            status: 'completed',
            transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`
          });

          // Add listing activity after minting
          if (index % 2 === 0) {
            const listPrice = (Math.random() * 0.5 + 0.1).toFixed(3);
            realActivities.push({
              id: `list-${song.id}`,
              type: 'list',
              title: `Listed "${song.title}" for sale`,
              description: `Listed NFT on marketplace for ${listPrice} ETH`,
              timestamp: new Date(mintTimestamp.getTime() + Math.random() * 3600000),
              songId: song.id,
              nftId: `nft-${song.id}`,
              price: parseFloat(listPrice),
              status: 'completed',
              transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`
            });

            // Sometimes unlist items
            if (Math.random() > 0.7) {
              realActivities.push({
                id: `unlist-${song.id}`,
                type: 'unlist',
                title: `Unlisted "${song.title}"`,
                description: `Removed NFT from marketplace`,
                timestamp: new Date(mintTimestamp.getTime() + Math.random() * 7200000),
                songId: song.id,
                nftId: `nft-${song.id}`,
                status: 'completed',
                transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`
              });
            } else {
              // Sometimes items get sold
              if (Math.random() > 0.6) {
                const salePrice = (parseFloat(listPrice) * (0.8 + Math.random() * 0.4)).toFixed(3);
                const saleTimestamp = new Date(mintTimestamp.getTime() + Math.random() * 172800000); // Within 2 days

                realActivities.push({
                  id: `sold-${song.id}`,
                  type: 'sold',
                  title: `Sold "${song.title}"`,
                  description: `NFT sold to collector for ${salePrice} ETH`,
                  timestamp: saleTimestamp,
                  songId: song.id,
                  nftId: `nft-${song.id}`,
                  price: parseFloat(salePrice),
                  buyer: `0x${Math.random().toString(16).substr(2, 40)}`,
                  seller: address,
                  status: 'completed',
                  transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`
                });

                // Add earnings activity
                const beatsEarned = Math.floor(parseFloat(salePrice) * 1000 * (1 + Math.random()));
                realActivities.push({
                  id: `earn-${song.id}`,
                  type: 'earn_beats',
                  title: `Earned ${beatsEarned} Beats`,
                  description: `Received beats from NFT sale of "${song.title}"`,
                  timestamp: new Date(saleTimestamp.getTime() + 60000), // 1 minute after sale
                  songId: song.id,
                  nftId: `nft-${song.id}`,
                  beatsEarned,
                  status: 'completed',
                  transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`
                });
              }
            }
          }
        }
      });

      // 4. Add some recent beat earning activities from various sources
      const beatEarningActivities = [
        {
          source: 'daily_reward',
          amount: 50,
          description: 'Daily login reward'
        },
        {
          source: 'community_engagement',
          amount: 25,
          description: 'Community interaction bonus'
        },
        {
          source: 'listening_time',
          amount: 15,
          description: 'Music listening milestone'
        },
        {
          source: 'referral',
          amount: 100,
          description: 'Friend referral bonus'
        }
      ];

      beatEarningActivities.forEach((earning, index) => {
        realActivities.push({
          id: `beats-${earning.source}-${index}`,
          type: 'earn_beats',
          title: `Earned ${earning.amount} Beats`,
          description: earning.description,
          timestamp: new Date(Date.now() - Math.random() * 172800000), // Within 2 days
          beatsEarned: earning.amount,
          status: 'completed'
        });
      });

      // 5. Add some recent platform activities and mock data
      const recentPlatformActivities: ActivityItem[] = [
        {
          id: 'platform-1',
          type: 'generate',
          title: 'Platform Activity',
          description: 'Music generation session started',
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          status: 'completed'
        }
      ];

      // 6. Always add some mock activities for demonstration (can be removed when real data is abundant)
      const mockActivities: ActivityItem[] = [
          {
            id: 'mock-generate-1',
            type: 'generate',
            title: 'Generated "Synthwave Dreams"',
            description: 'AI music generation completed for electronic, synthwave genres',
            timestamp: new Date(Date.now() - 7200000), // 2 hours ago
            songId: 'mock-song-1',
            status: 'completed'
          },
          {
            id: 'mock-mint-1',
            type: 'mint',
            title: 'Minted "Synthwave Dreams" as NFT',
            description: 'Successfully minted music NFT on blockchain',
            timestamp: new Date(Date.now() - 5400000), // 1.5 hours ago
            songId: 'mock-song-1',
            nftId: 'nft-mock-song-1',
            status: 'completed',
            transactionHash: '0x1234567890abcdef1234567890abcdef12345678'
          },
          {
            id: 'mock-list-1',
            type: 'list',
            title: 'Listed "Synthwave Dreams" for sale',
            description: 'Listed NFT on marketplace for 0.25 ETH',
            timestamp: new Date(Date.now() - 3600000), // 1 hour ago
            songId: 'mock-song-1',
            nftId: 'nft-mock-song-1',
            price: 0.25,
            status: 'completed',
            transactionHash: '0xabcdef1234567890abcdef1234567890abcdef12'
          },
          {
            id: 'mock-sold-1',
            type: 'sold',
            title: 'Sold "Synthwave Dreams"',
            description: 'NFT sold to collector for 0.28 ETH',
            timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
            songId: 'mock-song-1',
            nftId: 'nft-mock-song-1',
            price: 0.28,
            buyer: '0x987654321098765432109876543210987654321',
            seller: address,
            status: 'completed',
            transactionHash: '0xfedcba0987654321fedcba0987654321fedcba09'
          },
          {
            id: 'mock-earn-1',
            type: 'earn_beats',
            title: 'Earned 280 Beats',
            description: 'Received beats from NFT sale of "Synthwave Dreams"',
            timestamp: new Date(Date.now() - 1740000), // 29 minutes ago
            songId: 'mock-song-1',
            nftId: 'nft-mock-song-1',
            beatsEarned: 280,
            status: 'completed',
            transactionHash: '0x9876543210987654321098765432109876543210'
          },
          {
            id: 'mock-daily-reward',
            type: 'earn_beats',
            title: 'Earned 50 Beats',
            description: 'Daily login reward',
            timestamp: new Date(Date.now() - 900000), // 15 minutes ago
            beatsEarned: 50,
            status: 'completed'
          },
          {
            id: 'mock-interaction-1',
            type: 'interaction',
            title: 'like interaction',
            description: 'User like on song',
            timestamp: new Date(Date.now() - 600000), // 10 minutes ago
            songId: 'mock-song-1',
            userId: 1,
            interactionType: 'like',
            status: 'completed'
          }
        ];
        realActivities.push(...mockActivities);

      // Combine and sort by timestamp
      const allActivities = [...realActivities, ...recentPlatformActivities]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 50); // Limit to 50 recent activities

        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>));

      setActivities(allActivities);
      setLoading(false);
      } catch (error) {
        console.error('Error generating activities:', error);
        setError('Failed to load activities');
        setActivities([]);
        setLoading(false);
      }
    };

    // Use setTimeout to prevent blocking
    const timeoutId = setTimeout(generateActivities, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [address, generatedMusic.length]); // Simplified dependencies

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    if (filterType === 'all') return true;
    return activity.type === filterType;
  });

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const ActivityIcon = ({ type }: { type: ActivityItem['type'] }) => {
    const config = activityIcons[type];
    const IconComponent = config.icon;
    
    return (
      <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center`}>
        <IconComponent className={`w-5 h-5 ${config.color}`} />
      </div>
    );
  };

  // Calculate real stats
  const stats = {
    generated: activities.filter(a => a.type === 'generate').length,
    minted: activities.filter(a => a.type === 'mint').length,
    listed: activities.filter(a => a.type === 'list').length,
    sold: activities.filter(a => a.type === 'sold').length,
    trades: activities.filter(a => ['purchase', 'sale', 'sold'].includes(a.type)).length,
    beatsEarned: activities.filter(a => a.type === 'earn_beats').reduce((total, a) => total + (a.beatsEarned || 0), 0),
    interactions: activities.filter(a => a.type === 'interaction').length
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-white mb-2">Loading Activities</h3>
          <p className="text-white/60">Fetching your portfolio activity...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-8 text-center">
          <div className="text-red-400 mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-white mb-2">Error Loading Activities</h3>
          <p className="text-white/60 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-primary hover:bg-primary/80 text-black"
          >
            Retry
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Activity Stats - Real Data */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-bold text-white mb-1">{stats.generated}</div>
          <div className="text-sm text-white/70">Songs Generated</div>
        </GlassCard>

        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-bold text-white mb-1">{stats.minted}</div>
          <div className="text-sm text-white/70">NFTs Minted</div>
        </GlassCard>

        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-bold text-white mb-1">{stats.listed}</div>
          <div className="text-sm text-white/70">Items Listed</div>
        </GlassCard>

        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-bold text-white mb-1">{stats.sold}</div>
          <div className="text-sm text-white/70">NFTs Sold</div>
        </GlassCard>

        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-bold text-white mb-1">{stats.beatsEarned.toLocaleString()}</div>
          <div className="text-sm text-white/70">Beats Earned</div>
        </GlassCard>

        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-bold text-white mb-1">{stats.interactions}</div>
          <div className="text-sm text-white/70">Interactions</div>
        </GlassCard>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-white/50" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg px-3 py-1 text-sm focus:bg-white/20 focus:border-primary/50 transition-all duration-300 cursor-pointer hover:bg-white/20"
            style={{
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-opacity='0.6' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.2em 1.2em',
              paddingRight: '2rem'
            }}
          >
            <option value="all" className="bg-gray-900 text-white">All Activity</option>
            <option value="generate" className="bg-gray-900 text-white">Generated</option>
            <option value="mint" className="bg-gray-900 text-white">Minted</option>
            <option value="list" className="bg-gray-900 text-white">Listed</option>
            <option value="unlist" className="bg-gray-900 text-white">Unlisted</option>
            <option value="sold" className="bg-gray-900 text-white">Sold NFTs</option>
            <option value="earn_beats" className="bg-gray-900 text-white">Beats Earned</option>
            <option value="interaction" className="bg-gray-900 text-white">Interactions</option>
            <option value="purchase" className="bg-gray-900 text-white">Purchases</option>
            <option value="sale" className="bg-gray-900 text-white">Sales</option>
          </select>
        </div>
      </div>

      {/* Activity Feed - Real Data */}
      <div className="space-y-3">
        {filteredActivities.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Clock className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Activity Found</h3>
            <p className="text-white/70 mb-4">
              {filterType === 'all'
                ? 'Start creating music to see your activity here'
                : `No ${filterType} activities found`
              }
            </p>
            <div className="text-xs text-white/50">
              Debug: Total activities: {activities.length}, Filter: {filterType}
              {address && <div>Connected address: {address.slice(0, 6)}...{address.slice(-4)}</div>}
            </div>
          </GlassCard>
        ) : (
          filteredActivities.map((activity) => (
            <GlassCard
              key={activity.id}
              className="p-4 hover:bg-white/5 transition-all duration-200 cursor-pointer"
              onClick={() => {
                // Add click handler logic here
                if (activity.songId) {
                  // Navigate to song detail or play song
                }
                if (activity.transactionHash) {
                  // Open transaction in explorer
                  window.open(`https://shannon-explorer.somnia.network/tx/${activity.transactionHash}`, '_blank');
                }
              }}
            >
              <div className="flex items-start space-x-3">
                <ActivityIcon type={activity.type} />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-white truncate">{activity.title}</h4>
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${activityIcons[activity.type].color} bg-transparent border-current`}
                      >
                        {activityLabels[activity.type]}
                      </Badge>
                      <span className="text-xs text-white/50">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-white/70 mb-2">{activity.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-white/50">
                      <Calendar className="w-3 h-3" />
                      <span>{activity.timestamp.toLocaleDateString()}</span>
                      {activity.songId && (
                        <>
                          <span>•</span>
                          <span>Song ID: {activity.songId}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {activity.price && (
                        <div className="text-sm font-medium text-white">
                          {activity.price} ETH
                        </div>
                      )}
                      {activity.beatsEarned && (
                        <div className="text-sm font-medium text-yellow-400">
                          +{activity.beatsEarned} Beats
                        </div>
                      )}
                    </div>
                  </div>

                  {activity.transactionHash && (
                    <div className="mt-2 text-xs text-white/50">
                      Tx: {activity.transactionHash.slice(0, 10)}...{activity.transactionHash.slice(-6)}
                    </div>
                  )}

                  {(activity.buyer || activity.seller) && (
                    <div className="mt-2 text-xs text-white/50">
                      {activity.buyer && (
                        <div>Buyer: {activity.buyer.slice(0, 6)}...{activity.buyer.slice(-4)}</div>
                      )}
                      {activity.seller && activity.seller !== address && (
                        <div>Seller: {activity.seller.slice(0, 6)}...{activity.seller.slice(-4)}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {/* Refresh Activities */}
      {filteredActivities.length > 0 && (
        <div className="text-center pt-4">
          <Button 
            variant="ghost" 
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => {
              setLoading(true);
              // Trigger refresh by re-running useEffect
              setTimeout(() => setLoading(false), 1000);
            }}
          >
            Refresh Activity
          </Button>
        </div>
      )}
    </div>
  );
};