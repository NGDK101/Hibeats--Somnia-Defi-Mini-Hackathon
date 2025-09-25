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
import { useAccount } from "wagmi";
import { useGeneratedMusicContext } from "@/hooks/useGeneratedMusicContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useShannonExplorer } from "@/hooks/useShannonExplorer";
import { useMarketplace } from "@/hooks/useMarketplace";

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

export const PortfolioActivitySimple = () => {
  const { address } = useAccount();
  const { generatedMusic, userTaskIds, userCompletedTaskIds } = useGeneratedMusicContext();
  const analytics = useAnalytics();
  const { userTransactions, nftTransfers } = useShannonExplorer();
  const { userListings, marketplaceHistory } = useMarketplace();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Generate activities from real user data
  useEffect(() => {
    const generateRealActivities = async () => {
      try {
        setLoading(true);

        const realActivities: ActivityItem[] = [];

        // 1. Add ONLY real generated music activities
        if (generatedMusic && generatedMusic.length > 0) {
          generatedMusic.forEach((song) => {
            // Only add if song has valid creation data
            if (song.createdAt && song.title && song.id) {
              const generationTime = new Date(song.createdAt);

              realActivities.push({
                id: `gen-${song.id}`,
                type: 'generate',
                title: `Generated "${song.title}"`,
                description: `AI music generation completed for ${song.genre?.join(', ') || 'music track'}`,
                timestamp: generationTime,
                songId: song.id,
                status: 'completed'
              });

            }
          });
        }

        // 2. Add ONLY real minting activities from blockchain
        if (userTransactions && userTransactions.length > 0) {
          userTransactions.forEach((tx) => {
            // Only add if transaction is related to minting (check function name)
            if (tx.functionName && (tx.functionName.includes('mint') || tx.functionName.includes('Mint'))) {
              realActivities.push({
                id: `mint-${tx.hash}`,
                type: 'mint',
                title: `Minted NFT`,
                description: `Successfully minted NFT on blockchain`,
                timestamp: new Date(tx.timestamp * 1000),
                transactionHash: tx.hash,
                status: tx.status === 'success' ? 'completed' : 'failed'
              });

            }
          });
        }

        // 3. Add ONLY real NFT transfer activities
        if (nftTransfers && nftTransfers.length > 0) {
          nftTransfers.forEach((transfer) => {
            // Only add real transfers with valid data
            if (transfer.hash && transfer.tokenId && transfer.timestamp) {
              // Check if it's a mint (from zero address) or transfer
              const isMint = transfer.from === '0x0000000000000000000000000000000000000000';

              realActivities.push({
                id: `nft-${transfer.hash}`,
                type: isMint ? 'mint' : 'sale',
                title: isMint ?
                  `Minted NFT #${transfer.tokenId}` :
                  `Transferred NFT #${transfer.tokenId}`,
                description: isMint ?
                  'NFT minted on blockchain' :
                  `NFT transferred to ${transfer.to.slice(0, 6)}...${transfer.to.slice(-4)}`,
                timestamp: new Date(transfer.timestamp * 1000),
                nftId: transfer.tokenId,
                transactionHash: transfer.hash,
                buyer: isMint ? undefined : transfer.to,
                seller: isMint ? undefined : transfer.from,
                status: 'completed'
              });

            }
          });
        }

        // 4. Add ONLY real user interactions from analytics
        try {
          const analyticsPromise = analytics.getUserInteractions();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Analytics timeout')), 2000)
          );

          const userInteractions = await Promise.race([analyticsPromise, timeoutPromise]) as any[];

          if (userInteractions && userInteractions.length > 0) {
            userInteractions.forEach((interaction) => {
              // Only add if interaction has valid data and timestamp
              if (interaction.interaction_type && interaction.timestamp && interaction.id) {
                realActivities.push({
                  id: `analytics-${interaction.id}`,
                  type: 'interaction',
                  title: `${interaction.interaction_type} interaction`,
                  description: `User ${interaction.interaction_type} ${interaction.song_id ? `on song ${interaction.song_id}` : 'on platform'}`,
                  timestamp: new Date(interaction.timestamp),
                  songId: interaction.song_id?.toString(),
                  userId: interaction.user_id,
                  interactionType: interaction.interaction_type,
                  status: 'completed'
                });

              }
            });
          }
        } catch (error) {
        }

        // 5. Add ONLY real user analytics earnings (if they exist)
        if (analytics.userAnalytics) {
          const userStats = analytics.userAnalytics;

          // Only add if user actually has real earnings > 0
          if (userStats.totalEarnings && Number(userStats.totalEarnings) > 0) {
            realActivities.push({
              id: 'real-earnings',
              type: 'earn_beats',
              title: `Earned ${Number(userStats.totalEarnings)} Beats`,
              description: 'Real earnings from platform activities',
              timestamp: new Date(userStats.lastActiveTime * 1000 || Date.now() - 3600000),
              beatsEarned: Number(userStats.totalEarnings),
              status: 'completed'
            });

          }

          // Only add play milestone if user has actual plays
          if (userStats.totalPlays > 0) {
            realActivities.push({
              id: 'real-plays',
              type: 'interaction',
              title: `${userStats.totalPlays} total plays`,
              description: 'Real music listening activity',
              timestamp: new Date(userStats.lastActiveTime * 1000 || Date.now() - 7200000),
              interactionType: 'plays',
              status: 'completed'
            });

          }
        }

        // 6. Add ONLY real marketplace listings
        if (userListings && userListings.length > 0) {
          userListings.forEach((listing) => {
            // Only add if listing has valid data
            if (listing.tokenId && listing.price && listing.timestamp) {
              realActivities.push({
                id: `list-${listing.tokenId}-${listing.timestamp}`,
                type: 'list',
                title: `Listed NFT #${listing.tokenId}`,
                description: `Listed on marketplace for ${listing.price} ETH`,
                timestamp: new Date(listing.timestamp * 1000),
                nftId: listing.tokenId,
                price: parseFloat(listing.price),
                status: listing.active ? 'completed' : 'completed'
              });

            }
          });
        }

        // 7. Add ONLY real marketplace sales from history
        if (marketplaceHistory && marketplaceHistory.length > 0) {
          marketplaceHistory.forEach((sale) => {
            // Only add if sale has valid data and is a sale (not listing)
            if (sale.eventType === 'sale' && sale.tokenId && sale.price && sale.timestamp) {
              realActivities.push({
                id: `sale-${sale.tokenId}-${sale.timestamp}`,
                type: 'sold',
                title: `Sold NFT #${sale.tokenId}`,
                description: `NFT sold for ${sale.price} ETH`,
                timestamp: new Date(sale.timestamp * 1000),
                nftId: sale.tokenId,
                price: parseFloat(sale.price),
                buyer: sale.buyer,
                seller: sale.seller,
                transactionHash: sale.transactionHash,
                status: 'completed'
              });

            }
          });
        }

        // 8. No fake data - show empty state if no real activities
        if (realActivities.length === 0) {
        }

        // Sort by timestamp (newest first)
        const sortedActivities = realActivities.sort((a, b) =>
          b.timestamp.getTime() - a.timestamp.getTime()
        ).slice(0, 50); // Limit to 50 most recent

        setActivities(sortedActivities);
        setLoading(false);
      } catch (error) {
        console.error('Error generating real activities:', error);
        setActivities([]);
        setLoading(false);
      }
    };

    generateRealActivities();
  }, [address, generatedMusic, userTaskIds, userCompletedTaskIds, userTransactions, nftTransfers, userListings, marketplaceHistory]);

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
            <h3 className="text-lg font-medium text-white mb-2">No Real Activity Found</h3>
            <p className="text-white/70 mb-4">
              {filterType === 'all'
                ? 'Your real activities will appear here when you:'
                : `No real ${filterType} activities found`
              }
            </p>
            {filterType === 'all' && (
              <div className="text-sm text-white/60 space-y-2">
                <div>• Generate music with AI</div>
                <div>• Mint your songs as NFTs</div>
                <div>• List NFTs on marketplace</div>
                <div>• Interact with the platform</div>
              </div>
            )}
            {address && (
              <div className="mt-4 text-xs text-white/50">
                Connected: {address.slice(0, 6)}...{address.slice(-4)}
              </div>
            )}
          </GlassCard>
        ) : (
          filteredActivities.map((activity) => (
            <GlassCard
              key={activity.id}
              className="p-4 hover:bg-white/5 transition-all duration-200 cursor-pointer"
              onClick={() => {

                // Record interaction click analytics
                if (analytics.recordInteraction) {
                  analytics.recordInteraction('click_activity', parseInt(activity.songId || '0') || 0);
                }

                // Handle different click actions based on activity type
                if (activity.transactionHash) {
                  window.open(`https://shannon-explorer.somnia.network/tx/${activity.transactionHash}`, '_blank');
                } else if (activity.songId && activity.type === 'generate') {
                  // Could trigger song player or navigation
                } else if (activity.type === 'earn_beats') {
                  // Could show earnings breakdown
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
            onClick={() => window.location.reload()}
          >
            Refresh Activity
          </Button>
        </div>
      )}
    </div>
  );
};