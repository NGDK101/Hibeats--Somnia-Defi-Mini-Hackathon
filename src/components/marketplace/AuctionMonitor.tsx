import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Timer,
  Gavel,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Activity,
  AlertTriangle,
  Star,
  History,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useMarketplaceExplorer, {
  type EndingSoonAuctionData,
  type AuctionData,
  type Auction
} from '@/hooks/useMarketplaceExplorer';
import { formatEther } from 'viem';

interface AuctionMonitorProps {
  className?: string;
  watchlist?: bigint[]; // User's watchlisted auction token IDs
  onWatchlistUpdate?: (tokenId: bigint, action: 'add' | 'remove') => void;
}

type AuctionTab = 'ending_soon' | 'active' | 'watchlist' | 'my_bids';

export const AuctionMonitor: React.FC<AuctionMonitorProps> = ({
  className,
  watchlist = [],
  onWatchlistUpdate
}) => {
  const [activeTab, setActiveTab] = useState<AuctionTab>('ending_soon');
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds default
  const [soundEnabled, setSoundEnabled] = useState(false);

  const {
    useAllActiveAuctions,
    useEndingSoonAuctions,
    useRealTimeAuctionMonitoring,
    searchHelpers,
    refresh
  } = useMarketplaceExplorer();

  // Fetch different types of auction data
  const endingSoonAuctions = useEndingSoonAuctions({
    timeThreshold: BigInt(24 * 60 * 60), // 24 hours
    limit: 20
  });

  const activeAuctions = useAllActiveAuctions({
    offset: 0,
    limit: 50
  });

  // Real-time monitoring for watchlist
  const watchlistMonitoring = useRealTimeAuctionMonitoring(watchlist);

  // Auto-refresh with configurable interval
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refresh, refreshInterval]);

  // Sound notification for ending auctions (if enabled)
  useEffect(() => {
    if (soundEnabled && endingSoonAuctions.data?.tokenIds) {
      const criticalAuctions = endingSoonAuctions.data.tokenIds.filter((_, index) => {
        const timeLeft = endingSoonAuctions.data?.timeLeft?.[index];
        return timeLeft && Number(timeLeft) < 300; // Less than 5 minutes
      });

      if (criticalAuctions.length > 0) {
        // Play notification sound (implement based on your audio system)
      }
    }
  }, [endingSoonAuctions.data, soundEnabled]);

  // Get current data based on active tab
  const getCurrentData = () => {
    switch (activeTab) {
      case 'ending_soon':
        return endingSoonAuctions.data;
      case 'active':
        return activeAuctions.data;
      case 'watchlist':
        return {
          tokenIds: watchlist,
          auctionData: watchlistMonitoring.auctions,
          timeLeft: watchlist.map(() => BigInt(0)) // Calculate separately
        };
      case 'my_bids':
        // Filter auctions where user has bid (implement based on your data structure)
        return activeAuctions.data;
      default:
        return endingSoonAuctions.data;
    }
  };

  const currentData = getCurrentData();
  const isLoading = endingSoonAuctions.isLoading || activeAuctions.isLoading || watchlistMonitoring.isLoading;

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Header */}
      <div className="bg-card/50 rounded-xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-secondary rounded-lg flex items-center justify-center">
              <Gavel className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Auction Monitor</h2>
              <p className="text-sm text-gray-400">Real-time auction tracking and alerts</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh Interval Selector */}
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-sm text-white"
            >
              <option value={5000}>5s refresh</option>
              <option value={10000}>10s refresh</option>
              <option value={30000}>30s refresh</option>
              <option value={60000}>1m refresh</option>
            </select>

            {/* Sound Toggle */}
            <Button
              variant={soundEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="border-white/20"
            >
              🔔 {soundEnabled ? 'On' : 'Off'}
            </Button>

            {/* Manual Refresh */}
            <Button
              onClick={refresh}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Activity className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-red-400" />
                <div>
                  <p className="text-xs text-gray-400">Ending Soon</p>
                  <p className="text-lg font-bold text-white">
                    {endingSoonAuctions.data?.tokenIds?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Gavel className="w-4 h-4 text-blue-400" />
                <div>
                  <p className="text-xs text-gray-400">Active Auctions</p>
                  <p className="text-lg font-bold text-white">
                    {activeAuctions.data?.total ? Number(activeAuctions.data.total) : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <div>
                  <p className="text-xs text-gray-400">Watchlist</p>
                  <p className="text-lg font-bold text-white">{watchlist.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-green-400" />
                <div>
                  <p className="text-xs text-gray-400">Critical (< 5m)</p>
                  <p className="text-lg font-bold text-white">
                    {endingSoonAuctions.data?.timeLeft?.filter(time => Number(time) < 300).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Auction Tabs */}
      <Tabs value={activeTab} onValueChange={(value: AuctionTab) => setActiveTab(value)}>
        <TabsList className="bg-white/10 border border-white/20">
          <TabsTrigger value="ending_soon" className="data-[state=active]:bg-white data-[state=active]:text-black">
            <Timer className="w-4 h-4 mr-2" />
            Ending Soon
          </TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-white data-[state=active]:text-black">
            <Gavel className="w-4 h-4 mr-2" />
            All Active
          </TabsTrigger>
          <TabsTrigger value="watchlist" className="data-[state=active]:bg-white data-[state=active]:text-black">
            <Star className="w-4 h-4 mr-2" />
            Watchlist ({watchlist.length})
          </TabsTrigger>
          <TabsTrigger value="my_bids" className="data-[state=active]:bg-white data-[state=active]:text-black">
            <Target className="w-4 h-4 mr-2" />
            My Bids
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="bg-white/5 border-white/10 animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/10 rounded-lg" />
                      <div className="flex-1">
                        <div className="h-4 bg-white/10 rounded mb-2" />
                        <div className="h-3 bg-white/10 rounded w-2/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : currentData && 'tokenIds' in currentData && currentData.tokenIds?.length > 0 ? (
            <AuctionList
              data={currentData}
              activeTab={activeTab}
              searchHelpers={searchHelpers}
              watchlist={watchlist}
              onWatchlistUpdate={onWatchlistUpdate}
            />
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                <Gavel className="w-8 h-8 text-white/50" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                {activeTab === 'watchlist' ? 'No watchlisted auctions' : 'No auctions found'}
              </h3>
              <p className="text-gray-400">
                {activeTab === 'watchlist'
                  ? 'Add auctions to your watchlist to monitor them here'
                  : 'Check back later for new auctions'
                }
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Auction List Component
interface AuctionListProps {
  data: EndingSoonAuctionData | AuctionData | any;
  activeTab: AuctionTab;
  searchHelpers: any;
  watchlist: bigint[];
  onWatchlistUpdate?: (tokenId: bigint, action: 'add' | 'remove') => void;
}

const AuctionList: React.FC<AuctionListProps> = ({
  data,
  activeTab,
  searchHelpers,
  watchlist,
  onWatchlistUpdate
}) => {
  if (!data?.tokenIds || data.tokenIds.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {data.tokenIds.map((tokenId: bigint, index: number) => {
        const auctionData = data.auctionData?.[index];
        const timeLeft = data.timeLeft?.[index];

        if (!auctionData) return null;

        return (
          <AuctionCard
            key={tokenId.toString()}
            tokenId={tokenId}
            auction={auctionData}
            timeLeft={timeLeft}
            activeTab={activeTab}
            searchHelpers={searchHelpers}
            isWatchlisted={watchlist.includes(tokenId)}
            onWatchlistUpdate={onWatchlistUpdate}
          />
        );
      })}
    </div>
  );
};

// Individual Auction Card Component
interface AuctionCardProps {
  tokenId: bigint;
  auction: Auction;
  timeLeft?: bigint;
  activeTab: AuctionTab;
  searchHelpers: any;
  isWatchlisted: boolean;
  onWatchlistUpdate?: (tokenId: bigint, action: 'add' | 'remove') => void;
}

const AuctionCard: React.FC<AuctionCardProps> = ({
  tokenId,
  auction,
  timeLeft,
  activeTab,
  searchHelpers,
  isWatchlisted,
  onWatchlistUpdate
}) => {
  const currentPrice = auction.currentBid > 0 ? auction.currentBid : auction.startPrice;
  const priceDisplay = searchHelpers.formatPrice(currentPrice, auction.isBeatsToken);

  // Calculate time remaining
  const timeRemaining = timeLeft
    ? searchHelpers.getTimeRemaining(auction.endTime)
    : searchHelpers.getTimeRemaining(auction.endTime);

  // Determine urgency level
  const getUrgencyLevel = () => {
    if (!timeLeft) return 'normal';
    const timeInSeconds = Number(timeLeft);
    if (timeInSeconds < 300) return 'critical'; // < 5 minutes
    if (timeInSeconds < 3600) return 'urgent'; // < 1 hour
    if (timeInSeconds < 86400) return 'warning'; // < 24 hours
    return 'normal';
  };

  const urgencyLevel = getUrgencyLevel();

  const urgencyColors = {
    critical: 'border-red-500 bg-red-500/10',
    urgent: 'border-orange-500 bg-orange-500/10',
    warning: 'border-yellow-500 bg-yellow-500/10',
    normal: 'border-white/10 bg-white/5'
  };

  const timeColors = {
    critical: 'text-red-400',
    urgent: 'text-orange-400',
    warning: 'text-yellow-400',
    normal: 'text-gray-400'
  };

  // Calculate bid progress
  const bidProgress = auction.reservePrice > 0
    ? Math.min((Number(currentPrice) / Number(auction.reservePrice)) * 100, 100)
    : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "relative",
        urgencyLevel === 'critical' && "animate-pulse"
      )}
    >
      <Card className={cn(
        "border-2 transition-all hover:bg-white/10",
        urgencyColors[urgencyLevel]
      )}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* NFT Preview */}
            <div className="w-20 h-20 bg-gradient-secondary rounded-xl flex-shrink-0 relative">
              {urgencyLevel === 'critical' && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>

            {/* Auction Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-white text-lg">NFT #{tokenId.toString()}</h3>
                  <p className="text-sm text-gray-400">{auction.category}</p>
                </div>

                {/* Watchlist Button */}
                {onWatchlistUpdate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onWatchlistUpdate(tokenId, isWatchlisted ? 'remove' : 'add')}
                    className="p-2 hover:bg-white/10"
                  >
                    <Star className={cn(
                      "w-4 h-4",
                      isWatchlisted ? "fill-yellow-400 text-yellow-400" : "text-gray-400"
                    )} />
                  </Button>
                )}
              </div>

              {/* Pricing and Bid Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-400">Current Bid</p>
                  <p className="font-bold text-white">{priceDisplay}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">Reserve Price</p>
                  <p className="font-medium text-gray-300">
                    {auction.reservePrice > 0
                      ? searchHelpers.formatPrice(auction.reservePrice, auction.isBeatsToken)
                      : 'None'
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">Bidders</p>
                  <p className="font-medium text-white flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {auction.bidders?.length || 0}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">Time Left</p>
                  <p className={cn("font-bold", timeColors[urgencyLevel])}>
                    {timeRemaining}
                  </p>
                </div>
              </div>

              {/* Reserve Progress */}
              {auction.reservePrice > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400">Reserve Progress</span>
                    <span className="text-xs text-gray-400">{bidProgress.toFixed(1)}%</span>
                  </div>
                  <Progress value={bidProgress} className="h-2" />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  className={cn(
                    "flex-1",
                    urgencyLevel === 'critical'
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-gradient-button hover:opacity-90"
                  )}
                >
                  <Gavel className="w-4 h-4 mr-2" />
                  Place Bid
                </Button>

                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <History className="w-4 h-4 mr-2" />
                  History
                </Button>
              </div>

              {/* Urgency Indicators */}
              {urgencyLevel === 'critical' && (
                <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Critical: Auction ending very soon!</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AuctionMonitor;