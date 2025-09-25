import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Filter,
  TrendingUp,
  Clock,
  Eye,
  Heart,
  Gavel,
  Grid3X3,
  List,
  ArrowUpDown,
  Star,
  Timer,
  Activity,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useMarketplaceExplorer, { type ListingData, type AuctionData, type MarketplaceStats } from '@/hooks/useMarketplaceExplorer';
import { formatEther } from 'viem';

interface MarketplaceBrowserProps {
  className?: string;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'price_asc' | 'price_desc' | 'newest' | 'oldest';
type FilterTab = 'all' | 'listings' | 'auctions' | 'featured' | 'ending_soon';

export const MarketplaceBrowser: React.FC<MarketplaceBrowserProps> = ({ className }) => {
  // State management
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);

  // Hooks
  const {
    useMarketplaceOverview,
    useMarketplaceBrowse,
    useEndingSoonAuctions,
    useFeaturedListings,
    searchHelpers,
    refresh
  } = useMarketplaceExplorer();

  // Data fetching
  const overview = useMarketplaceOverview();
  const pageSize = 12;

  // Browse data based on active tab
  const browseData = useMarketplaceBrowse(
    activeTab === 'auctions' ? 'auctions' : 'listings',
    currentPage,
    pageSize,
    priceRange.min && priceRange.max ? {
      min: BigInt(parseFloat(priceRange.min) * 10**18),
      max: BigInt(parseFloat(priceRange.max) * 10**18)
    } : undefined
  );

  // Featured listings
  const featuredListings = useFeaturedListings({ offset: 0, limit: 8 });

  // Ending soon auctions
  const endingSoonAuctions = useEndingSoonAuctions({
    timeThreshold: BigInt(24 * 60 * 60), // 24 hours
    limit: 8
  });

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 30000);

    return () => clearInterval(interval);
  }, [refresh]);

  // Handle page changes
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Handle filter changes
  const handlePriceFilter = () => {
    if (priceRange.min && priceRange.max) {
      setCurrentPage(0); // Reset to first page
      // Price filter is applied automatically through the hook
    }
  };

  // Clear filters
  const clearFilters = () => {
    setPriceRange({ min: '', max: '' });
    setSearchQuery('');
    setCurrentPage(0);
  };

  // Get current data based on active tab
  const getCurrentData = () => {
    switch (activeTab) {
      case 'featured':
        return featuredListings.data as ListingData;
      case 'ending_soon':
        return endingSoonAuctions.data;
      case 'auctions':
      case 'listings':
      case 'all':
      default:
        return browseData.data;
    }
  };

  const currentData = getCurrentData();
  const isLoading = browseData.isLoading || featuredListings.isLoading || endingSoonAuctions.isLoading;

  // Stats from overview
  const stats = overview.stats;

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Header with Stats */}
      <div className="bg-card/50 rounded-xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">NFT Marketplace</h2>
            <p className="text-gray-400">Discover, collect, and trade unique music NFTs</p>
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

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <List className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">Active Listings</p>
                    <p className="text-xl font-bold text-white">{Number(stats.totalActiveListings)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Gavel className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-sm text-gray-400">Active Auctions</p>
                    <p className="text-xl font-bold text-white">{Number(stats.totalActiveAuctions)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm text-gray-400">Floor Price</p>
                    <p className="text-xl font-bold text-white">
                      {stats.floorPrice === BigInt(2**256 - 1)
                        ? '--'
                        : `${parseFloat(formatEther(stats.floorPrice)).toFixed(3)} STT`
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-400">Total Volume</p>
                    <p className="text-xl font-bold text-white">
                      {parseFloat(formatEther(stats.totalVolume)).toFixed(2)} STT
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-card/50 rounded-xl border border-white/10 p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search NFTs by name, artist, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/20 text-white"
            />
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>

          {/* View Mode */}
          <div className="flex bg-white/10 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 p-0"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 w-8 p-0"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Expanded Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-white/10"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Price Range */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Price Range (STT)</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                      className="bg-white/5 border-white/20 text-white"
                    />
                    <Input
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Sort By</label>
                  <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="price_asc">Price: Low to High</SelectItem>
                      <SelectItem value="price_desc">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filter Actions */}
                <div className="flex items-end gap-2">
                  <Button
                    onClick={handlePriceFilter}
                    className="bg-gradient-button hover:opacity-90"
                  >
                    Apply Filters
                  </Button>
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeTab} onValueChange={(value: FilterTab) => setActiveTab(value)}>
        <TabsList className="bg-white/10 border border-white/20">
          <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-black">
            All Items
          </TabsTrigger>
          <TabsTrigger value="listings" className="data-[state=active]:bg-white data-[state=active]:text-black">
            Fixed Price
          </TabsTrigger>
          <TabsTrigger value="auctions" className="data-[state=active]:bg-white data-[state=active]:text-black">
            Auctions
          </TabsTrigger>
          <TabsTrigger value="featured" className="data-[state=active]:bg-white data-[state=active]:text-black">
            <Star className="w-4 h-4 mr-1" />
            Featured
          </TabsTrigger>
          <TabsTrigger value="ending_soon" className="data-[state=active]:bg-white data-[state=active]:text-black">
            <Timer className="w-4 h-4 mr-1" />
            Ending Soon
          </TabsTrigger>
        </TabsList>

        {/* Content for each tab */}
        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="bg-white/5 border-white/10 animate-pulse">
                  <div className="aspect-square bg-white/10 rounded-t-lg" />
                  <CardContent className="p-4">
                    <div className="h-4 bg-white/10 rounded mb-2" />
                    <div className="h-3 bg-white/10 rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : currentData && 'tokenIds' in currentData && currentData.tokenIds?.length > 0 ? (
            <NFTGrid
              data={currentData}
              viewMode={viewMode}
              sortBy={sortBy}
              searchHelpers={searchHelpers}
            />
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                <Eye className="w-8 h-8 text-white/50" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No items found</h3>
              <p className="text-gray-400">Try adjusting your filters or search terms</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {currentData && 'total' in currentData && Number(currentData.total) > pageSize && (
        <div className="flex justify-center items-center gap-4">
          <Button
            variant="outline"
            onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Previous
          </Button>

          <span className="text-sm text-gray-400">
            Page {currentPage + 1} of {Math.ceil(Number(currentData.total) / pageSize)}
          </span>

          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={(currentPage + 1) * pageSize >= Number(currentData.total)}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

// NFT Grid Component
interface NFTGridProps {
  data: ListingData | AuctionData | any;
  viewMode: ViewMode;
  sortBy: SortOption;
  searchHelpers: any;
}

const NFTGrid: React.FC<NFTGridProps> = ({ data, viewMode, searchHelpers }) => {
  if (!data?.tokenIds || data.tokenIds.length === 0) {
    return null;
  }

  const containerClass = viewMode === 'grid'
    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    : "flex flex-col gap-4";

  return (
    <div className={containerClass}>
      {data.tokenIds.map((tokenId: bigint, index: number) => {
        const itemData = data.listingData?.[index] || data.auctionData?.[index];
        if (!itemData) return null;

        return (
          <NFTCard
            key={tokenId.toString()}
            tokenId={tokenId}
            data={itemData}
            viewMode={viewMode}
            searchHelpers={searchHelpers}
          />
        );
      })}
    </div>
  );
};

// Individual NFT Card Component
interface NFTCardProps {
  tokenId: bigint;
  data: any;
  viewMode: ViewMode;
  searchHelpers: any;
}

const NFTCard: React.FC<NFTCardProps> = ({ tokenId, data, viewMode, searchHelpers }) => {
  const isAuction = 'currentBid' in data;
  const isListing = 'price' in data;

  const price = isAuction ? data.currentBid || data.startPrice : data.price;
  const priceDisplay = searchHelpers.formatPrice(price, data.isBeatsToken);

  const timeRemaining = isAuction ? searchHelpers.getTimeRemaining(data.endTime) : null;

  if (viewMode === 'list') {
    return (
      <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-secondary rounded-lg flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-white truncate">NFT #{tokenId.toString()}</h3>
              <p className="text-sm text-gray-400 truncate">{data.category}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-white">{priceDisplay}</p>
              {isAuction && timeRemaining && (
                <p className="text-xs text-yellow-400">{timeRemaining}</p>
              )}
            </div>
            <div className="flex gap-2">
              {isAuction && (
                <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                  <Gavel className="w-3 h-3 mr-1" />
                  Auction
                </Badge>
              )}
              <Button size="sm" className="bg-gradient-button hover:opacity-90">
                {isAuction ? 'Bid' : 'Buy'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group"
    >
      <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all overflow-hidden">
        <div className="relative aspect-square">
          <div className="w-full h-full bg-gradient-secondary" />
          {isAuction && (
            <Badge className="absolute top-2 left-2 bg-yellow-500/20 text-yellow-400">
              <Gavel className="w-3 h-3 mr-1" />
              Auction
            </Badge>
          )}
          {timeRemaining && (
            <Badge className="absolute top-2 right-2 bg-red-500/20 text-red-400">
              <Clock className="w-3 h-3 mr-1" />
              {timeRemaining}
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-medium text-white mb-1">NFT #{tokenId.toString()}</h3>
          <p className="text-sm text-gray-400 mb-3">{data.category}</p>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">
                {isAuction ? 'Current Bid' : 'Price'}
              </p>
              <p className="font-bold text-white">{priceDisplay}</p>
            </div>

            <Button size="sm" className="bg-gradient-button hover:opacity-90">
              {isAuction ? 'Bid' : 'Buy'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MarketplaceBrowser;