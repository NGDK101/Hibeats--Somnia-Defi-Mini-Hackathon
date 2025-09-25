import { useState, useMemo } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Eye, 
  Heart, 
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { usePortfolio, type PortfolioStats } from '@/hooks/usePortfolio';

interface PortfolioAnalyticsProps {
  className?: string;
}

export const PortfolioAnalytics = ({ className }: PortfolioAnalyticsProps) => {
  const [activeTimeframe, setActiveTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const { portfolioStats, getPerformanceData, portfolioItems } = usePortfolio();
  
  const performanceData = getPerformanceData();

  // Calculate portfolio insights
  const insights = useMemo(() => {
    const totalValue = parseFloat(portfolioStats.totalValue.replace(' STT', ''));
    const floorPrice = parseFloat(portfolioStats.floorPrice.replace(' STT', ''));
    const avgPrice = parseFloat(portfolioStats.averagePrice?.replace(' STT', '') || '0');
    
    return {
      valueGrowth: '+12.5%',
      volumeGrowth: '+8.3%',
      bestPerformer: portfolioItems.find(item => item.rarity === 'Legendary') || portfolioItems[0],
      mostViewed: portfolioItems.sort((a, b) => b.views - a.views)[0],
      recentSales: 3,
      totalVolume: (totalValue * 1.2).toFixed(2) + ' STT'
    };
  }, [portfolioStats, portfolioItems]);

  // Generate chart data
  const chartData = useMemo(() => {
    return performanceData.daily.map((day, index) => ({
      date: day.date,
      value: day.value,
      volume: day.volume,
      sales: day.sales
    }));
  }, [performanceData]);

  // Rarity distribution
  const rarityDistribution = useMemo(() => {
    const distribution = portfolioItems.reduce((acc, item) => {
      acc[item.rarity] = (acc[item.rarity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([rarity, count]) => ({
      rarity,
      count,
      percentage: ((count / portfolioItems.length) * 100).toFixed(1)
    }));
  }, [portfolioItems]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common': return 'bg-gray-400';
      case 'Rare': return 'bg-blue-400';
      case 'Epic': return 'bg-purple-400';
      case 'Legendary': return 'bg-yellow-400';
      default: return 'bg-gray-400';
    }
  };

  if (portfolioItems.length === 0) {
    return (
      <div className="text-center py-12 text-white/70">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-white/30" />
        <p className="text-lg mb-2">No analytics available</p>
        <p className="text-sm">Analytics will appear once you have NFTs in your portfolio</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-sm text-white/70">Portfolio Value</span>
            </div>
            <Badge variant="outline" className="text-green-400 border-green-400">
              <ArrowUp className="w-3 h-3 mr-1" />
              {insights.valueGrowth}
            </Badge>
          </div>
          <div className="text-2xl font-bold text-white">{portfolioStats.totalValue}</div>
          <div className="text-xs text-white/50">Total estimated value</div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-white/70">Volume</span>
            </div>
            <Badge variant="outline" className="text-blue-400 border-blue-400">
              <ArrowUp className="w-3 h-3 mr-1" />
              {insights.volumeGrowth}
            </Badge>
          </div>
          <div className="text-2xl font-bold text-white">{insights.totalVolume}</div>
          <div className="text-xs text-white/50">30-day volume</div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Eye className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-white/70">Total Views</span>
          </div>
          <div className="text-2xl font-bold text-white">{portfolioStats.totalViews.toLocaleString()}</div>
          <div className="text-xs text-white/50">Across all items</div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Heart className="w-4 h-4 text-red-400" />
            <span className="text-sm text-white/70">Total Likes</span>
          </div>
          <div className="text-2xl font-bold text-white">{portfolioStats.totalLikes}</div>
          <div className="text-xs text-white/50">Community engagement</div>
        </GlassCard>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-transparent border-b border-glass-border/20 rounded-none h-auto p-0 space-x-8">
          <TabsTrigger 
            value="overview" 
            className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none pb-2 text-white/70 data-[state=active]:text-white"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="performance" 
            className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none pb-2 text-white/70 data-[state=active]:text-white"
          >
            Performance
          </TabsTrigger>
          <TabsTrigger 
            value="distribution" 
            className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none pb-2 text-white/70 data-[state=active]:text-white"
          >
            Distribution
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                Top Performers
              </h3>
              <div className="space-y-4">
                {portfolioItems
                  .sort((a, b) => b.views - a.views)
                  .slice(0, 3)
                  .map((item, index) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{item.title}</div>
                        <div className="text-xs text-white/60">{item.views} views • {item.likes} likes</div>
                      </div>
                      <div className="text-sm font-semibold text-white">{item.price}</div>
                    </div>
                  ))}
              </div>
            </GlassCard>

            {/* Recent Activity */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-400" />
                Recent Activity
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm text-white">NFT Listed</span>
                  </div>
                  <span className="text-xs text-white/60">2 hours ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-sm text-white">Price Updated</span>
                  </div>
                  <span className="text-xs text-white/60">1 day ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-sm text-white">NFT Minted</span>
                  </div>
                  <span className="text-xs text-white/60">3 days ago</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-primary" />
                Portfolio Performance
              </h3>
              <div className="flex space-x-2">
                {(['7d', '30d', '90d', '1y'] as const).map((timeframe) => (
                  <Button
                    key={timeframe}
                    variant={activeTimeframe === timeframe ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTimeframe(timeframe)}
                    className={activeTimeframe === timeframe ? 'bg-primary text-black' : 'text-white/70 hover:text-white'}
                  >
                    {timeframe}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Simple performance metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-green-400 mb-1">{performanceData.totalGrowth}</div>
                <div className="text-sm text-white/60">Total Growth</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-blue-400 mb-1">{performanceData.monthlyVolume}</div>
                <div className="text-sm text-white/60">Monthly Volume</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-purple-400 mb-1">{performanceData.averageSalePrice}</div>
                <div className="text-sm text-white/60">Avg Sale Price</div>
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="distribution" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rarity Distribution */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-primary" />
                Rarity Distribution
              </h3>
              <div className="space-y-3">
                {rarityDistribution.map(({ rarity, count, percentage }) => (
                  <div key={rarity} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getRarityColor(rarity)}`}></div>
                      <span className="text-sm text-white">{rarity}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-white/60">{count} items</span>
                      <span className="text-sm font-medium text-white">{percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Value Distribution */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-400" />
                Value Insights
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70">Floor Price</span>
                  <span className="text-sm font-medium text-white">{portfolioStats.floorPrice}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70">Highest Value</span>
                  <span className="text-sm font-medium text-white">{portfolioStats.topBid}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70">Average Price</span>
                  <span className="text-sm font-medium text-white">{portfolioStats.averagePrice}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70">Listed Items</span>
                  <span className="text-sm font-medium text-white">{portfolioStats.listed} / {portfolioStats.totalItems}</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};