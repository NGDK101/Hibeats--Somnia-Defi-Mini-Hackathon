import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Users,
  ShoppingCart,
  Gavel,
  BarChart3,
  PieChart,
  Calendar,
  Timer,
  Star,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useMarketplaceExplorer, {
  type MarketplaceStats,
  type TradeActivity,
  type UserTradingActivity
} from '@/hooks/useMarketplaceExplorer';
import { formatEther } from 'viem';
import { useAccount } from 'wagmi';

interface MarketplaceStatsProps {
  className?: string;
}

type StatsTab = 'overview' | 'trading' | 'users' | 'trends';

export const MarketplaceStats: React.FC<MarketplaceStatsProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState<StatsTab>('overview');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('24h');
  const { address } = useAccount();

  const {
    useMarketplaceStats,
    useTradeHistory,
    useUserTradingActivity,
    refresh
  } = useMarketplaceExplorer();

  // Fetch marketplace statistics
  const marketplaceStats = useMarketplaceStats();
  const tradeHistory = useTradeHistory({ offset: 0, limit: 100 });
  const userActivity = useUserTradingActivity(address || '0x');

  // Auto-refresh every minute
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 60000);

    return () => clearInterval(interval);
  }, [refresh]);

  const stats = marketplaceStats.data as MarketplaceStats | undefined;
  const trades = tradeHistory.data?.trades || [];
  const userStats = userActivity.data as UserTradingActivity | undefined;

  // Calculate derived statistics
  const calculateDerivedStats = () => {
    if (!stats) return null;

    const totalItems = Number(stats.totalActiveListings) + Number(stats.totalActiveAuctions);
    const listingPercentage = totalItems > 0 ? (Number(stats.totalActiveListings) / totalItems) * 100 : 0;
    const auctionPercentage = 100 - listingPercentage;

    return {
      totalItems,
      listingPercentage,
      auctionPercentage,
      averagePriceFormatted: stats.averagePrice > 0
        ? parseFloat(formatEther(stats.averagePrice)).toFixed(4)
        : '0',
      floorPriceFormatted: stats.floorPrice === BigInt(2**256 - 1)
        ? 'N/A'
        : parseFloat(formatEther(stats.floorPrice)).toFixed(4),
      totalVolumeFormatted: parseFloat(formatEther(stats.totalVolume)).toFixed(2)
    };
  };

  const derivedStats = calculateDerivedStats();

  // Calculate recent trading activity metrics
  const calculateTradingMetrics = () => {
    if (!trades.length) return null;

    const now = Math.floor(Date.now() / 1000);
    const oneDayAgo = now - 86400;
    const oneWeekAgo = now - 604800;

    const recentTrades24h = trades.filter(trade => Number(trade.timestamp) > oneDayAgo);
    const recentTrades7d = trades.filter(trade => Number(trade.timestamp) > oneWeekAgo);

    const volume24h = recentTrades24h.reduce((sum, trade) => sum + Number(formatEther(trade.price)), 0);
    const volume7d = recentTrades7d.reduce((sum, trade) => sum + Number(formatEther(trade.price)), 0);

    // Calculate average trade size
    const avgTradeSize24h = recentTrades24h.length > 0 ? volume24h / recentTrades24h.length : 0;
    const avgTradeSize7d = recentTrades7d.length > 0 ? volume7d / recentTrades7d.length : 0;

    // Get unique traders
    const uniqueTraders24h = new Set([
      ...recentTrades24h.map(t => t.seller),
      ...recentTrades24h.map(t => t.buyer)
    ]).size;

    const uniqueTraders7d = new Set([
      ...recentTrades7d.map(t => t.seller),
      ...recentTrades7d.map(t => t.buyer)
    ]).size;

    return {
      trades24h: recentTrades24h.length,
      trades7d: recentTrades7d.length,
      volume24h,
      volume7d,
      avgTradeSize24h,
      avgTradeSize7d,
      uniqueTraders24h,
      uniqueTraders7d
    };
  };

  const tradingMetrics = calculateTradingMetrics();

  const isLoading = marketplaceStats.isLoading || tradeHistory.isLoading;

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Header */}
      <div className="bg-card/50 rounded-xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-secondary rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Marketplace Analytics</h2>
              <p className="text-sm text-gray-400">Comprehensive marketplace insights and statistics</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <div className="flex bg-white/10 rounded-lg p-1">
              {(['24h', '7d', '30d', 'all'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                  className="h-8 px-3 text-xs"
                >
                  {range.toUpperCase()}
                </Button>
              ))}
            </div>

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

        {/* Key Metrics Overview */}
        {!isLoading && stats && derivedStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Total Volume"
              value={`${derivedStats.totalVolumeFormatted} STT`}
              icon={DollarSign}
              color="text-green-400"
              trend={tradingMetrics ? `${tradingMetrics.volume24h.toFixed(2)} STT (24h)` : undefined}
            />

            <MetricCard
              title="Floor Price"
              value={`${derivedStats.floorPriceFormatted} STT`}
              icon={TrendingDown}
              color="text-blue-400"
              trend="Current lowest price"
            />

            <MetricCard
              title="Total Sales"
              value={Number(stats.totalSales).toLocaleString()}
              icon={ShoppingCart}
              color="text-purple-400"
              trend={tradingMetrics ? `${tradingMetrics.trades24h} (24h)` : undefined}
            />

            <MetricCard
              title="Active Items"
              value={derivedStats.totalItems.toLocaleString()}
              icon={Activity}
              color="text-orange-400"
              trend={`${Number(stats.totalActiveListings)} listings, ${Number(stats.totalActiveAuctions)} auctions`}
            />
          </div>
        )}
      </div>

      {/* Stats Tabs */}
      <Tabs value={activeTab} onValueChange={(value: StatsTab) => setActiveTab(value)}>
        <TabsList className="bg-white/10 border border-white/20">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-black">
            <Eye className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="trading" className="data-[state=active]:bg-white data-[state=active]:text-black">
            <TrendingUp className="w-4 h-4 mr-2" />
            Trading Activity
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-white data-[state=active]:text-black">
            <Users className="w-4 h-4 mr-2" />
            User Stats
          </TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-white data-[state=active]:text-black">
            <BarChart3 className="w-4 h-4 mr-2" />
            Market Trends
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Market Distribution */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Market Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats && derivedStats && (
                  <div className="space-y-4">
                    {/* Listings vs Auctions */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-400">Fixed Price Listings</span>
                        <span className="text-sm text-white">{derivedStats.listingPercentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className="bg-blue-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${derivedStats.listingPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-400">Auctions</span>
                        <span className="text-sm text-white">{derivedStats.auctionPercentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${derivedStats.auctionPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <p className="text-lg font-bold text-white">{Number(stats.totalActiveListings)}</p>
                        <p className="text-xs text-gray-400">Active Listings</p>
                      </div>
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <p className="text-lg font-bold text-white">{Number(stats.totalActiveAuctions)}</p>
                        <p className="text-xs text-gray-400">Active Auctions</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Price Statistics */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Price Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats && derivedStats && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Floor Price</span>
                      <span className="text-white font-bold">{derivedStats.floorPriceFormatted} STT</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Average Price</span>
                      <span className="text-white font-bold">{derivedStats.averagePriceFormatted} STT</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Volume</span>
                      <span className="text-white font-bold">{derivedStats.totalVolumeFormatted} STT</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Sales</span>
                      <span className="text-white font-bold">{Number(stats.totalSales).toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Featured Items</span>
                      <span className="text-white font-bold">{Number(stats.featuredCount)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trading Activity Tab */}
        <TabsContent value="trading" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 24h Activity */}
            {tradingMetrics && (
              <>
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Timer className="w-5 h-5" />
                      24h Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-2xl font-bold text-white">{tradingMetrics.trades24h}</p>
                      <p className="text-sm text-gray-400">Trades</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{tradingMetrics.volume24h.toFixed(2)}</p>
                      <p className="text-sm text-gray-400">Volume (STT)</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{tradingMetrics.uniqueTraders24h}</p>
                      <p className="text-sm text-gray-400">Unique Traders</p>
                    </div>
                  </CardContent>
                </Card>

                {/* 7d Activity */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      7d Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-2xl font-bold text-white">{tradingMetrics.trades7d}</p>
                      <p className="text-sm text-gray-400">Trades</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{tradingMetrics.volume7d.toFixed(2)}</p>
                      <p className="text-sm text-gray-400">Volume (STT)</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{tradingMetrics.uniqueTraders7d}</p>
                      <p className="text-sm text-gray-400">Unique Traders</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Average Trade Size */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Avg Trade Size
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-2xl font-bold text-white">{tradingMetrics.avgTradeSize24h.toFixed(4)}</p>
                      <p className="text-sm text-gray-400">24h Average (STT)</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{tradingMetrics.avgTradeSize7d.toFixed(4)}</p>
                      <p className="text-sm text-gray-400">7d Average (STT)</p>
                    </div>
                    <div className="pt-2">
                      <Badge variant={tradingMetrics.avgTradeSize24h > tradingMetrics.avgTradeSize7d ? "default" : "secondary"}>
                        {tradingMetrics.avgTradeSize24h > tradingMetrics.avgTradeSize7d ? "↗ Growing" : "↘ Declining"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Recent Trades */}
          <Card className="bg-white/5 border-white/10 mt-6">
            <CardHeader>
              <CardTitle className="text-white">Recent Trading Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentTradesList trades={trades.slice(0, 10)} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Stats Tab */}
        <TabsContent value="users" className="mt-6">
          {address && userStats ? (
            <UserStatsPanel userStats={userStats} address={address} />
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-white/50" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Connect Wallet</h3>
              <p className="text-gray-400">Connect your wallet to view your trading statistics</p>
            </div>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="mt-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-white/50" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Market Trends</h3>
            <p className="text-gray-400">Advanced trend analysis coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  trend?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, color, trend }) => (
  <Card className="bg-white/5 border-white/10">
    <CardContent className="p-4">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center")}>
          <Icon className={cn("w-5 h-5", color)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-xl font-bold text-white truncate">{value}</p>
          {trend && <p className="text-xs text-gray-500 truncate">{trend}</p>}
        </div>
      </div>
    </CardContent>
  </Card>
);

// Recent Trades List Component
interface RecentTradesListProps {
  trades: TradeActivity[];
}

const RecentTradesList: React.FC<RecentTradesListProps> = ({ trades }) => {
  if (!trades.length) {
    return (
      <div className="text-center py-8 text-gray-400">
        No recent trades found
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {trades.map((trade, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <div className="flex items-center gap-3">
            <Badge variant={trade.tradeType === 'auction' ? 'default' : 'secondary'}>
              {trade.tradeType}
            </Badge>
            <span className="text-white font-medium">NFT #{trade.tokenId.toString()}</span>
          </div>
          <div className="text-right">
            <p className="text-white font-bold">
              {parseFloat(formatEther(trade.price)).toFixed(4)} {trade.isBeatsToken ? 'BEATS' : 'STT'}
            </p>
            <p className="text-xs text-gray-400">
              {new Date(Number(trade.timestamp) * 1000).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// User Stats Panel Component
interface UserStatsPanelProps {
  userStats: UserTradingActivity;
  address: string;
}

const UserStatsPanel: React.FC<UserStatsPanelProps> = ({ userStats, address }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <Card className="bg-white/5 border-white/10">
      <CardContent className="p-6 text-center">
        <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-3" />
        <p className="text-2xl font-bold text-white">
          {parseFloat(formatEther(userStats.tradingVolume)).toFixed(2)}
        </p>
        <p className="text-sm text-gray-400">Trading Volume (STT)</p>
      </CardContent>
    </Card>

    <Card className="bg-white/5 border-white/10">
      <CardContent className="p-6 text-center">
        <ShoppingCart className="w-8 h-8 text-blue-400 mx-auto mb-3" />
        <p className="text-2xl font-bold text-white">{Number(userStats.salesCount)}</p>
        <p className="text-sm text-gray-400">Sales Made</p>
      </CardContent>
    </Card>

    <Card className="bg-white/5 border-white/10">
      <CardContent className="p-6 text-center">
        <Activity className="w-8 h-8 text-purple-400 mx-auto mb-3" />
        <p className="text-2xl font-bold text-white">{userStats.userListingsList.length}</p>
        <p className="text-sm text-gray-400">Active Listings</p>
      </CardContent>
    </Card>

    <Card className="bg-white/5 border-white/10">
      <CardContent className="p-6 text-center">
        <Gavel className="w-8 h-8 text-orange-400 mx-auto mb-3" />
        <p className="text-2xl font-bold text-white">{userStats.userBidsList.length}</p>
        <p className="text-sm text-gray-400">Active Bids</p>
      </CardContent>
    </Card>
  </div>
);

export default MarketplaceStats;