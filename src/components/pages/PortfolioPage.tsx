import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GlassCard } from "@/components/ui/glass-card";
import { NFTDetailPanel } from "@/components/details/NFTDetailPanel";
import { 
  User, 
  Calendar, 
  MapPin, 
  Link as LinkIcon, 
  Music, 
  Play, 
  Pause,
  Users, 
  UserPlus,
  Settings,
  Edit3,
  Share2,
  MoreHorizontal,
  Heart,
  MessageCircle,
  Download,
  TrendingUp,
  Award,
  Mic,
  Disc3,
  Headphones,
  Star,
  Globe,
  Instagram,
  Twitter,
  Youtube,
  Eye,
  Volume2,
  Clock,
  Copy,
  ExternalLink,
  Filter,
  Grid3X3,
  List
} from "lucide-react";
import { useGeneratedMusicContext } from "@/hooks/useGeneratedMusicContext";
import { useMusicPlayerContext } from "@/hooks/useMusicPlayerContext";
import { useProfile } from "@/hooks/useProfile";
import { useAccount } from "wagmi";

interface PortfolioPageProps {
  onSongSelect?: (song: any) => void;
}

export const PortfolioPage = ({ onSongSelect }: PortfolioPageProps) => {
  const [activeTab, setActiveTab] = useState("items");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("All");
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [isDetailsPanelVisible, setIsDetailsPanelVisible] = useState(false);
  
  const { generatedMusic } = useGeneratedMusicContext();
  const { playSong, currentSong } = useMusicPlayerContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const { profile } = useProfile();
  const { address } = useAccount();

  // Mock NFT collection data inspired by the image
  const [nftCollection] = useState([
    {
      id: "5602",
      title: "Ancient Beats #5602",
      description: "Egyptian-inspired music NFT with ancient vibes",
      image: "/api/placeholder/300/300",
      type: "Music NFT",
      rarity: "Rare",
      price: "2.5 ETH",
      isListed: false,
      views: 1234,
      likes: 89,
      backgroundColor: "from-yellow-600 to-orange-600"
    },
    {
      id: "fff1",
      title: "Tropical Vibes",
      description: "Summer beats with pineapple fresh sounds",
      image: "/api/placeholder/300/300",
      type: "Music NFT",
      rarity: "Common",
      price: "0.94 ETH",
      isListed: true,
      views: 876,
      likes: 45,
      backgroundColor: "from-green-500 to-yellow-500"
    },
    {
      id: "soul1",
      title: "Light in your soul",
      description: "Deep house track that touches the soul",
      image: "/api/placeholder/300/300",
      type: "Music NFT",
      rarity: "Epic",
      price: "0.5 ETH",
      isListed: false,
      views: 2341,
      likes: 156,
      backgroundColor: "from-amber-600 to-yellow-700"
    },
    {
      id: "llama1",
      title: "Comfy Llama Beats",
      description: "Chill lo-fi beats featuring our mascot llama",
      image: "/api/placeholder/300/300",
      type: "Music NFT",
      rarity: "Legendary",
      price: "5.2 ETH",
      isListed: false,
      views: 3456,
      likes: 234,
      backgroundColor: "from-purple-600 to-pink-600"
    },
    {
      id: "grave1",
      title: "SimpleGraveStone",
      description: "Dark ambient track with mysterious undertones",
      image: "/api/placeholder/300/300",
      type: "Music NFT",
      rarity: "Rare",
      price: "1.8 ETH",
      isListed: false,
      views: 987,
      likes: 67,
      backgroundColor: "from-gray-700 to-gray-900"
    },
    {
      id: "nft1",
      title: "Nft by itself #1",
      description: "Meta NFT about NFTs - inception level music",
      image: "/api/placeholder/300/300",
      type: "Music NFT",
      rarity: "Common",
      price: "0.3 ETH",
      isListed: false,
      views: 543,
      likes: 32,
      backgroundColor: "from-white to-gray-200"
    },
    {
      id: "nft2",
      title: "Nft by itself #2",
      description: "The sequel to the meta NFT series",
      image: "/api/placeholder/300/300",
      type: "Music NFT",
      rarity: "Common",
      price: "0.35 ETH",
      isListed: false,
      views: 467,
      likes: 28,
      backgroundColor: "from-white to-gray-200"
    },
    {
      id: "red1",
      title: "Red Abstract Beats",
      description: "Experimental electronic with red-hot energy",
      image: "/api/placeholder/300/300",
      type: "Music NFT",
      rarity: "Epic",
      price: "3.1 ETH",
      isListed: true,
      views: 1876,
      likes: 134,
      backgroundColor: "from-red-600 to-red-800"
    },
    {
      id: "blue1",
      title: "Cyber Monkey Mix",
      description: "Futuristic trap beats with cyberpunk vibes",
      image: "/api/placeholder/300/300",
      type: "Music NFT",
      rarity: "Rare",
      price: "2.7 ETH",
      isListed: false,
      views: 2134,
      likes: 178,
      backgroundColor: "from-cyan-500 to-blue-600"
    }
  ]);

  // Portfolio stats
  const [portfolioStats] = useState({
    totalItems: nftCollection.length,
    totalValue: "24.8 ETH",
    floorPrice: "0.3 ETH",
    topBid: "5.2 ETH",
    listed: nftCollection.filter(item => item.isListed).length,
    totalViews: nftCollection.reduce((sum, item) => sum + item.views, 0),
    totalLikes: nftCollection.reduce((sum, item) => sum + item.likes, 0)
  });

  // User profile data
  const [userProfile] = useState({
    displayName: "Music Collector",
    username: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "0xf3...2266",
    bio: "Passionate collector of AI-generated music NFTs. Supporting the future of digital music ownership.",
    avatar: "/api/placeholder/150/150",
    coverImage: "/api/placeholder/1200/300",
    verified: true,
    joinedDate: "January 2024",
    followers: 2847,
    following: 156,
    socialLinks: {
      twitter: "@musiccollector",
      instagram: "@music_collector",
      website: "musiccollector.eth"
    }
  });

  useEffect(() => {
    setCurrentPlaying(currentSong?.id || null);
  }, [currentSong]);

  const handlePlay = (item: any) => {
    // Simple play/pause toggle for NFT preview
    if (currentPlaying === item.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentPlaying(item.id);
      setIsPlaying(true);
    }
    
    // Call onSongSelect if provided
    if (onSongSelect) {
      onSongSelect(item);
    }
  };

  const handleNFTClick = (item: any) => {
    setSelectedNFT(item);
    setIsDetailsPanelVisible(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsPanelVisible(false);
    setSelectedNFT(null);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common': return 'text-gray-400 border-gray-400';
      case 'Rare': return 'text-blue-400 border-blue-400';
      case 'Epic': return 'text-purple-400 border-purple-400';
      case 'Legendary': return 'text-yellow-400 border-yellow-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const filteredItems = nftCollection.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "All" || 
                         (filterType === "Listed" && item.isListed) ||
                         (filterType === "Not Listed" && !item.isListed) ||
                         item.rarity === filterType;
    return matchesSearch && matchesFilter;
  });

  const renderNFTGrid = () => (
    <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
      {filteredItems.map((item) => (
        <GlassCard 
          key={item.id} 
          className="group overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer"
          onClick={() => handleNFTClick(item)}
        >
          {/* NFT Image */}
          <div className="relative aspect-square">
            <div className={`w-full h-full bg-gradient-to-br ${item.backgroundColor} flex items-center justify-center relative overflow-hidden`}>
              {/* Placeholder for actual NFT image */}
              <div className="w-full h-full bg-black/20 flex items-center justify-center">
                <Music className="w-16 h-16 text-white/60" />
              </div>
              
              {/* Play overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlay(item);
                  }}
                  className="w-16 h-16 p-0 rounded-full bg-primary/80 hover:bg-primary text-white"
                >
                  {currentPlaying === item.id && isPlaying ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8 ml-1" />
                  )}
                </Button>
              </div>

              {/* Rarity badge */}
              <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium border ${getRarityColor(item.rarity)} bg-black/50 backdrop-blur-sm`}>
                {item.rarity}
              </div>

              {/* Listed badge */}
              {item.isListed && (
                <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium bg-green-500/80 text-white">
                  Listed
                </div>
              )}

              {/* ID number */}
              <div className="absolute bottom-2 left-2 text-white/80 text-xs font-mono">
                #{item.id}
              </div>
            </div>
          </div>

          {/* NFT Info */}
          <div className="p-4">
            <h3 className="font-semibold text-white mb-1 truncate">{item.title}</h3>
            <p className="text-sm text-white/70 mb-3 line-clamp-2">{item.description}</p>
            
            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-white/60 mb-3">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <Eye className="w-3 h-3" />
                  <span>{item.views}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="w-3 h-3" />
                  <span>{item.likes}</span>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {item.type}
              </Badge>
            </div>

            {/* Price and actions */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/60">Price</p>
                <p className="font-semibold text-white">{item.price}</p>
              </div>
              <div className="flex items-center space-x-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-8 h-8 p-0 text-white/70 hover:text-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Heart className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-8 h-8 p-0 text-white/70 hover:text-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-8 h-8 p-0 text-white/70 hover:text-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Cover Image */}
      <div className="relative h-48 overflow-hidden">
        <div className="w-full h-full bg-gradient-to-r from-purple-900 via-blue-900 to-green-900" />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Profile Section */}
      <div className="relative -mt-16 px-6">
        <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6 mb-8">
          {/* Avatar */}
          <Avatar className="w-32 h-32 border-4 border-glass-border bg-gradient-to-br from-primary to-purple-600">
            <AvatarFallback className="text-4xl font-bold text-white bg-gradient-to-br from-primary to-purple-600">
              {userProfile.displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{userProfile.displayName}</h1>
              {userProfile.verified && (
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-black text-sm">✓</span>
                </div>
              )}
            </div>
            <p className="text-white/60 mb-1">@{userProfile.username}</p>
            <p className="text-white/80 mb-4 max-w-2xl">{userProfile.bio}</p>
            
            {/* Social Stats */}
            <div className="flex items-center space-x-6 text-sm">
              <div>
                <span className="font-semibold text-white">{userProfile.followers.toLocaleString()}</span>
                <span className="text-white/60 ml-1">followers</span>
              </div>
              <div>
                <span className="font-semibold text-white">{userProfile.following}</span>
                <span className="text-white/60 ml-1">following</span>
              </div>
              <div className="flex items-center space-x-1 text-white/60">
                <Calendar className="w-4 h-4" />
                <span>Joined {userProfile.joinedDate}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button className="bg-primary hover:bg-primary/80 text-black font-medium">
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <GlassCard className="p-4 text-center">
            <div className="text-xl font-bold text-white">{portfolioStats.totalItems}</div>
            <div className="text-xs text-white/70">Items</div>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <div className="text-xl font-bold text-white">{portfolioStats.listed}</div>
            <div className="text-xs text-white/70">Listed</div>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <div className="text-xl font-bold text-white">{portfolioStats.floorPrice}</div>
            <div className="text-xs text-white/70">Floor</div>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <div className="text-xl font-bold text-white">{portfolioStats.topBid}</div>
            <div className="text-xs text-white/70">Top Bid</div>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <div className="text-xl font-bold text-white">{portfolioStats.totalValue}</div>
            <div className="text-xs text-white/70">Total Value</div>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <div className="text-xl font-bold text-white">{portfolioStats.totalViews.toLocaleString()}</div>
            <div className="text-xs text-white/70">Views</div>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <div className="text-xl font-bold text-white">{portfolioStats.totalLikes}</div>
            <div className="text-xs text-white/70">Likes</div>
          </GlassCard>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
          <TabsList className="bg-transparent border-b border-glass-border/20 rounded-none h-auto p-0 space-x-8">
            <TabsTrigger 
              value="items" 
              className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none pb-2 text-white/70 data-[state=active]:text-white"
            >
              Items {portfolioStats.totalItems}
            </TabsTrigger>
            <TabsTrigger 
              value="listings" 
              className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none pb-2 text-white/70 data-[state=active]:text-white"
            >
              Listings {portfolioStats.listed}
            </TabsTrigger>
            <TabsTrigger 
              value="offers" 
              className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none pb-2 text-white/70 data-[state=active]:text-white"
            >
              Offers
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none pb-2 text-white/70 data-[state=active]:text-white"
            >
              Activity
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-4 bg-input/20 border-glass-border/30 text-white placeholder:text-white/50 w-64"
              />
            </div>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-input/20 border border-glass-border/30 rounded-md text-white text-sm"
            >
              <option value="All">All Items</option>
              <option value="Listed">Listed</option>
              <option value="Not Listed">Not Listed</option>
              <option value="Common">Common</option>
              <option value="Rare">Rare</option>
              <option value="Epic">Epic</option>
              <option value="Legendary">Legendary</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-primary text-black' : 'text-white/70 hover:text-white'}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-primary text-black' : 'text-white/70 hover:text-white'}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="items" className="m-0">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-white/70">
                <Music className="w-16 h-16 mx-auto mb-4 text-white/30" />
                <p className="text-lg mb-2">No items found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              renderNFTGrid()
            )}
          </TabsContent>

          <TabsContent value="listings" className="m-0">
            <div className="text-center py-12 text-white/70">
              <div className="text-lg mb-2">{portfolioStats.listed} items listed</div>
              <p className="text-sm">Your active marketplace listings</p>
            </div>
          </TabsContent>

          <TabsContent value="offers" className="m-0">
            <div className="text-center py-12 text-white/70">
              <p className="text-lg mb-2">No offers yet</p>
              <p className="text-sm">Offers on your items will appear here</p>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="m-0">
            <div className="text-center py-12 text-white/70">
              <p className="text-lg mb-2">No recent activity</p>
              <p className="text-sm">Your portfolio activity will be shown here</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* NFT Detail Panel */}
      <NFTDetailPanel
        nft={selectedNFT}
        isVisible={isDetailsPanelVisible}
        onClose={handleCloseDetails}
        isPlaying={currentPlaying === selectedNFT?.id && isPlaying}
        onPlayPause={() => selectedNFT && handlePlay(selectedNFT)}
      />
    </div>
  );
};
