import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Star,
  Timer,
  Gavel,
  ShoppingBag,
  Activity,
  DollarSign,
  BarChart3,
  Eye,
  ArrowRight,
  Zap,
  Crown,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useMarketplaceExplorer from '@/hooks/useMarketplaceExplorer';
import { formatEther } from 'viem';

interface MarketplaceOverviewProps {
  className?: string;
  onNavigate?: (section: 'browse' | 'auctions' | 'stats' | 'featured') => void;
}

export const MarketplaceOverview: React.FC<MarketplaceOverviewProps> = ({
  className,
  onNavigate
}) => {
  const { useMarketplaceOverview, searchHelpers } = useMarketplaceExplorer();
  const overview = useMarketplaceOverview();

  const {
    stats,
    recentListings,
    featuredListings,
    endingSoonAuctions,
    isLoading,
    isError
  } = overview;

  if (isError) {
    return (
      <div className={cn("w-full", className)}>
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-6 text-center">
            <div className="text-red-400 mb-2">⚠️ Error loading marketplace data</div>
            <Button
              onClick={() => overview.refetch()}
              variant="outline"
              className="border-red-500/20 text-red-400 hover:bg-red-500/10"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-8", className)}>
      {/* Hero Section with Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-teal-900/20 rounded-2xl border border-white/10 p-8"
      >
        <div className="relative z-10">
          <div className="text-center mb-8">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-5xl font-bold text-white mb-4"
            >
              NFT Marketplace
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-gray-300 max-w-2xl mx-auto"
            >
              Discover, collect, and trade unique music NFTs. Join the revolution of digital music ownership.
            </motion.p>
          </div>

          {/* Quick Stats */}
          {!isLoading && stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              <QuickStatCard
                icon={ShoppingBag}
                label="Active Listings"
                value={Number(stats.totalActiveListings).toLocaleString()}
                color="text-blue-400"
              />
              <QuickStatCard
                icon={Gavel}
                label="Live Auctions"
                value={Number(stats.totalActiveAuctions).toLocaleString()}
                color="text-yellow-400"
              />
              <QuickStatCard
                icon={DollarSign}
                label="Floor Price"
                value={stats.floorPrice === BigInt(2**256 - 1) ? 'N/A' : `${parseFloat(formatEther(stats.floorPrice)).toFixed(3)} STT`}
                color="text-green-400"
              />
              <QuickStatCard
                icon={TrendingUp}
                label="Total Volume"
                value={`${parseFloat(formatEther(stats.totalVolume)).toFixed(1)} STT`}
                color="text-purple-400"
              />
            </motion.div>
          )}

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Button
              onClick={() => onNavigate?.('browse')}
              className="bg-gradient-button hover:opacity-90 text-white px-6 py-3 rounded-xl"
            >
              <Eye className="w-5 h-5 mr-2" />
              Browse All NFTs
            </Button>
            <Button
              onClick={() => onNavigate?.('auctions')}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 px-6 py-3 rounded-xl"
            >
              <Gavel className="w-5 h-5 mr-2" />
              View Auctions
            </Button>
            <Button
              onClick={() => onNavigate?.('stats')}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 px-6 py-3 rounded-xl"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              Market Stats
            </Button>
          </motion.div>
        </div>

        {/* Background Decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500/20 rounded-full blur-xl" />
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-xl" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-teal-500/10 rounded-full blur-xl" />
        </div>
      </motion.div>

      {/* Featured NFTs */}
      {!isLoading && featuredListings?.tokenIds && featuredListings.tokenIds.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <SectionHeader
            icon={Crown}
            title="Featured NFTs"
            description="Handpicked premium NFTs from verified artists"
            actionText="View All Featured"
            onAction={() => onNavigate?.('featured')}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredListings.tokenIds.slice(0, 4).map((tokenId, index) => {
              const listing = featuredListings.listingData[index];
              return (
                <NFTCard
                  key={tokenId.toString()}
                  tokenId={tokenId}
                  data={listing}
                  type="featured"
                  searchHelpers={searchHelpers}
                />
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Ending Soon Auctions */}
      {!isLoading && endingSoonAuctions?.tokenIds && endingSoonAuctions.tokenIds.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <SectionHeader
            icon={Timer}
            title="Ending Soon"
            description="Don't miss out on these auctions ending within 24 hours"
            actionText="View All Auctions"
            onAction={() => onNavigate?.('auctions')}
            urgent
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {endingSoonAuctions.tokenIds.slice(0, 4).map((tokenId, index) => {
              const auction = endingSoonAuctions.auctionData[index];
              const timeLeft = endingSoonAuctions.timeLeft?.[index];
              return (
                <NFTCard
                  key={tokenId.toString()}
                  tokenId={tokenId}
                  data={auction}
                  type="auction"
                  timeLeft={timeLeft}
                  searchHelpers={searchHelpers}
                />
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Recent Listings */}
      {!isLoading && recentListings?.tokenIds && recentListings.tokenIds.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <SectionHeader
            icon={Zap}
            title="Recently Listed"
            description="Fresh NFTs just added to the marketplace"
            actionText="Browse All"
            onAction={() => onNavigate?.('browse')}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentListings.tokenIds.slice(0, 4).map((tokenId, index) => {
              const listing = recentListings.listingData[index];
              return (
                <NFTCard
                  key={tokenId.toString()}
                  tokenId={tokenId}
                  data={listing}
                  type="listing"
                  searchHelpers={searchHelpers}
                />
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, sectionIndex) => (
            <div key={sectionIndex} className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="h-8 bg-white/10 rounded w-48 animate-pulse" />
                <div className="h-10 bg-white/10 rounded w-32 animate-pulse" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, cardIndex) => (
                  <Card key={cardIndex} className="bg-white/5 border-white/10 animate-pulse">
                    <div className="aspect-square bg-white/10 rounded-t-lg" />
                    <CardContent className="p-4 space-y-2">
                      <div className="h-4 bg-white/10 rounded w-3/4" />
                      <div className="h-3 bg-white/10 rounded w-1/2" />
                      <div className="h-6 bg-white/10 rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Quick Stat Card Component
interface QuickStatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}

const QuickStatCard: React.FC<QuickStatCardProps> = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
    <Icon className={cn("w-6 h-6 mx-auto mb-2", color)} />
    <div className="text-2xl font-bold text-white mb-1">{value}</div>
    <div className="text-sm text-gray-300">{label}</div>
  </div>
);

// Section Header Component
interface SectionHeaderProps {
  icon: React.ElementType;
  title: string;
  description: string;
  actionText: string;
  onAction?: () => void;
  urgent?: boolean;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  urgent
}) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-4">
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center",
        urgent ? "bg-red-500/20" : "bg-white/10"
      )}>
        <Icon className={cn(
          "w-6 h-6",
          urgent ? "text-red-400" : "text-white"
        )} />
      </div>
      <div>
        <h3 className="text-2xl font-bold text-white">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </div>
    </div>

    <Button
      onClick={onAction}
      variant="outline"
      className="border-white/20 text-white hover:bg-white/10 group"
    >
      {actionText}
      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
    </Button>
  </div>
);

// NFT Card Component
interface NFTCardProps {
  tokenId: bigint;
  data: any;
  type: 'featured' | 'auction' | 'listing';
  timeLeft?: bigint;
  searchHelpers: any;
}

const NFTCard: React.FC<NFTCardProps> = ({
  tokenId,
  data,
  type,
  timeLeft,
  searchHelpers
}) => {
  const isAuction = type === 'auction';
  const price = isAuction
    ? (data.currentBid > 0 ? data.currentBid : data.startPrice)
    : data.price;

  const priceDisplay = searchHelpers.formatPrice(price, data.isBeatsToken);
  const timeRemaining = timeLeft ? searchHelpers.getTimeRemaining(data.endTime) : null;

  // Determine urgency for auctions
  const isUrgent = timeLeft && Number(timeLeft) < 3600; // Less than 1 hour

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group cursor-pointer"
    >
      <Card className={cn(
        "bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 overflow-hidden",
        isUrgent && "border-red-500/50 shadow-red-500/20 shadow-lg"
      )}>
        <div className="relative aspect-square">
          {/* NFT Image Placeholder */}
          <div className="w-full h-full bg-gradient-to-br from-purple-600/50 via-blue-600/50 to-teal-600/50" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {type === 'featured' && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Featured
              </Badge>
            )}

            {isAuction && (
              <Badge className={cn(
                "border-orange-500/30",
                isUrgent ? "bg-red-500/20 text-red-400" : "bg-orange-500/20 text-orange-400"
              )}>
                <Gavel className="w-3 h-3 mr-1" />
                {isUrgent ? 'Urgent!' : 'Auction'}
              </Badge>
            )}
          </div>

          {/* Time Remaining for Auctions */}
          {timeRemaining && (
            <div className="absolute top-3 right-3">
              <Badge className={cn(
                "font-mono text-xs",
                isUrgent
                  ? "bg-red-500/20 text-red-400 animate-pulse"
                  : "bg-black/40 text-white"
              )}>
                <Clock className="w-3 h-3 mr-1" />
                {timeRemaining}
              </Badge>
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Button className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30">
              {isAuction ? 'Place Bid' : 'Buy Now'}
            </Button>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
              NFT #{tokenId.toString()}
            </h4>

            <p className="text-sm text-gray-400">{data.category}</p>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">
                  {isAuction ? 'Current Bid' : 'Price'}
                </p>
                <p className="font-bold text-white">{priceDisplay}</p>
              </div>

              {isAuction && data.bidders?.length > 0 && (
                <div className="text-right">
                  <p className="text-xs text-gray-400">Bidders</p>
                  <p className="text-sm text-white">{data.bidders.length}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MarketplaceOverview;