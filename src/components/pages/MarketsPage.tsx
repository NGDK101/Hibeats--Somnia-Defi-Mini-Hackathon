import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, TrendingUp, ShoppingCart, Coins, Play, Pause, Heart, Eye } from "lucide-react";
import { useGeneratedMusicContext } from "@/hooks/useGeneratedMusicContext";
import { useMusicPlayerContext } from "@/hooks/useMusicPlayerContext";
import { GeneratedMusic } from "@/types/music";

interface MarketsPageProps {
  onSongSelect?: (song: any) => void;
}

export const MarketsPage = ({ onSongSelect }: MarketsPageProps) => {
  const [activeTab, setActiveTab] = useState("marketplace");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("trending");
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  
  const { generatedMusic, userCompletedTaskIds, userTaskIds } = useGeneratedMusicContext();
  const { playSong, currentSong, togglePlayPause, isPlaying } = useMusicPlayerContext();

  // Filter to only show songs saved in smart contract (using userTaskIds only) and sort by newest first
  const contractSongs = generatedMusic.filter(song => 
    userTaskIds && userTaskIds.includes(song.taskId)
  ).sort((a, b) => {
    // Sort by creation date (newest first)
    const aDate = new Date(a.createdAt).getTime();
    const bDate = new Date(b.createdAt).getTime();

    // Handle invalid dates
    if (isNaN(aDate) && isNaN(bDate)) return 0;
    if (isNaN(aDate)) return 1;
    if (isNaN(bDate)) return -1;

    // Newest first: higher timestamp comes first
    return bDate - aDate;
  });

  // Mock marketplace data with pricing
  const [marketplaceItems, setMarketplaceItems] = useState(() => 
    contractSongs.slice(0, 20).map((song, index) => ({
      ...song,
      price: Math.floor(Math.random() * 10) + 1, // 1-10 ETH
      currency: "ETH",
      seller: `Creator ${index + 1}`,
      likes: Math.floor(Math.random() * 500),
      views: Math.floor(Math.random() * 2000),
      isForSale: Math.random() > 0.3, // 70% chance to be for sale
      royaltyPercentage: Math.floor(Math.random() * 10) + 5, // 5-15%
    }))
  );

  // Mock user's NFT collection
  const [userNFTs] = useState(() =>
    generatedMusic.slice(0, 5).map((song, index) => ({
      ...song,
      tokenId: index + 1,
      mintedAt: new Date().toISOString(),
      isListed: Math.random() > 0.5,
      currentPrice: Math.floor(Math.random() * 5) + 1,
    }))
  );

  useEffect(() => {
    setCurrentPlaying(currentSong?.id || null);
  }, [currentSong]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlay = (song: GeneratedMusic) => {
    if (currentPlaying === song.id) {
      togglePlayPause();
    } else {
      playSong(song, contractSongs);
      setCurrentPlaying(song.id);
    }
  };

  const handleBuyNFT = (item: any) => {
    // TODO: Implement buy functionality
  };

  const handleListForSale = (nft: any) => {
    // TODO: Implement listing functionality
  };

  const filteredMarketplace = marketplaceItems.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.seller.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.genre.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesPrice = priceFilter === "all" || 
                        (priceFilter === "low" && item.price < 3) ||
                        (priceFilter === "medium" && item.price >= 3 && item.price <= 7) ||
                        (priceFilter === "high" && item.price > 7);
    
    return matchesSearch && matchesPrice && item.isForSale;
  });

  const sortedMarketplace = [...filteredMarketplace].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "recent":
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      case "popular":
        return b.views - a.views;
      default: // trending
        return b.likes - a.likes;
    }
  });

  const renderMarketplaceItem = (item: any) => (
    <GlassCard 
      key={item.id} 
      className="p-4 cursor-pointer hover:bg-white/5 transition-colors group"
      onClick={() => onSongSelect?.(item)}
    >
      <div className="space-y-3">
        {/* Album Cover & Play Button */}
        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gradient-secondary">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handlePlay(item);
              }}
              className="w-12 h-12 p-0 rounded-full bg-primary/80 hover:bg-primary text-white"
            >
              {currentPlaying === item.id && isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-0.5" />
              )}
            </Button>
          </div>
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {formatDuration(item.duration || 30)}
          </div>
          <div className="absolute bottom-2 left-2 bg-primary/80 text-white text-xs px-2 py-1 rounded">
            NFT
          </div>
        </div>

        {/* Song Info */}
        <div>
          <h3 className="font-semibold text-white truncate">{item.title}</h3>
          <p className="text-sm text-white/70 truncate">by {item.seller}</p>
          <div className="flex items-center space-x-2 mt-1">
            {item.genre.slice(0, 2).map((genre: string) => (
              <Badge key={genre} variant="secondary" className="text-xs">
                {genre}
              </Badge>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-white/50 text-sm">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Heart className="w-4 h-4" />
              <span>{item.likes}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>{item.views}</span>
            </div>
          </div>
          <div className="text-xs text-white/70">
            {item.royaltyPercentage}% royalty
          </div>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between">
          <div className="text-white">
            <div className="text-lg font-bold flex items-center">
              <Coins className="w-4 h-4 mr-1 text-yellow-400" />
              {item.price} {item.currency}
            </div>
          </div>
          <Button 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              handleBuyNFT(item);
            }}
            className="bg-primary/20 hover:bg-primary/30 text-white border border-primary/30"
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            Buy
          </Button>
        </div>
      </div>
    </GlassCard>
  );

  const renderUserNFT = (nft: any) => (
    <GlassCard 
      key={nft.id} 
      className="p-4 cursor-pointer hover:bg-white/5 transition-colors group"
      onClick={() => onSongSelect?.(nft)}
    >
      <div className="space-y-3">
        {/* Album Cover */}
        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gradient-secondary">
          <img
            src={nft.imageUrl}
            alt={nft.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 bg-green-500/80 text-white text-xs px-2 py-1 rounded">
            Owned
          </div>
          {nft.isListed && (
            <div className="absolute top-2 left-2 bg-blue-500/80 text-white text-xs px-2 py-1 rounded">
              Listed
            </div>
          )}
        </div>

        {/* NFT Info */}
        <div>
          <h3 className="font-semibold text-white truncate">{nft.title}</h3>
          <p className="text-sm text-white/70">Token ID: #{nft.tokenId}</p>
          <div className="flex items-center space-x-2 mt-1">
            {nft.genre.slice(0, 2).map((genre: string) => (
              <Badge key={genre} variant="secondary" className="text-xs">
                {genre}
              </Badge>
            ))}
          </div>
        </div>

        {/* Action */}
        <Button 
          size="sm" 
          variant={nft.isListed ? "outline" : "default"}
          onClick={(e) => {
            e.stopPropagation();
            handleListForSale(nft);
          }}
          className="w-full"
        >
          {nft.isListed ? "Update Listing" : "List for Sale"}
        </Button>
      </div>
    </GlassCard>
  );

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-glass-border/10">
        <h1 className="text-3xl font-bold text-white mb-6">NFT Marketplace</h1>
        
        {/* Search and Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
            <Input
              placeholder="Search NFTs, creators, or collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-input/20 border-glass-border/30 text-white placeholder:text-white/50"
            />
          </div>
          
          <Select value={priceFilter} onValueChange={setPriceFilter}>
            <SelectTrigger className="w-40 bg-input/20 border-glass-border/30 text-white">
              <SelectValue placeholder="Price Range" />
            </SelectTrigger>
            <SelectContent className="bg-card/95 backdrop-blur-sm border-glass-border">
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="low">Under 3 ETH</SelectItem>
              <SelectItem value="medium">3-7 ETH</SelectItem>
              <SelectItem value="high">Above 7 ETH</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40 bg-input/20 border-glass-border/30 text-white">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent className="bg-card/95 backdrop-blur-sm border-glass-border">
              <SelectItem value="trending">Trending</SelectItem>
              <SelectItem value="recent">Recently Listed</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <div className="px-6 pt-4">
            <TabsList className="bg-glass-card/30 backdrop-blur-sm border border-glass-border/20">
              <TabsTrigger 
                value="marketplace" 
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-white text-white/70"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Marketplace
              </TabsTrigger>
              <TabsTrigger 
                value="my-nfts" 
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-white text-white/70"
              >
                My NFTs
              </TabsTrigger>
              <TabsTrigger 
                value="create-nft" 
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-white text-white/70"
              >
                Create NFT
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="marketplace" className="flex-1 overflow-y-auto m-0 mt-4">
            <div className="px-6 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">
                  🎵 Music NFTs ({sortedMarketplace.length})
                </h2>
                <div className="text-sm text-white/70">
                  Total Volume: 1,234 ETH
                </div>
              </div>
              
              {sortedMarketplace.length === 0 ? (
                <div className="text-center py-12 text-white/70">
                  <p className="text-lg mb-2">No NFTs found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {sortedMarketplace.map(renderMarketplaceItem)}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="my-nfts" className="flex-1 overflow-y-auto m-0 mt-4">
            <div className="px-6 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">
                  🎨 My Collection ({userNFTs.length})
                </h2>
                <Button className="bg-primary/20 hover:bg-primary/30 text-white border border-primary/30">
                  Create New NFT
                </Button>
              </div>
              
              {userNFTs.length === 0 ? (
                <div className="text-center py-12 text-white/70">
                  <p className="text-lg mb-2">No NFTs in your collection</p>
                  <p className="text-sm">Create your first music NFT to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {userNFTs.map(renderUserNFT)}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="create-nft" className="flex-1 overflow-y-auto m-0 mt-4">
            <div className="px-6 pb-6">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-xl font-semibold text-white mb-6">🎨 Create Music NFT</h2>
                <GlassCard className="p-6">
                  <div className="text-center py-12 text-white/70">
                    <p className="text-lg mb-2">NFT Creation Coming Soon</p>
                    <p className="text-sm">Turn your generated music into tradeable NFTs</p>
                  </div>
                </GlassCard>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
