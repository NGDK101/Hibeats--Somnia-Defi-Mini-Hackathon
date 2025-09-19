import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  X, 
  Play, 
  Pause,
  Heart, 
  Share2, 
  MoreHorizontal,
  ExternalLink,
  Copy,
  Eye,
  Clock,
  Zap,
  Shield,
  Award,
  ChevronDown,
  ChevronUp,
  Volume2,
  Download
} from "lucide-react";

interface NFTDetailPanelProps {
  nft: any;
  isVisible: boolean;
  onClose: () => void;
  isPlaying?: boolean;
  onPlayPause?: () => void;
}

export const NFTDetailPanel = ({ 
  nft, 
  isVisible, 
  onClose, 
  isPlaying = false, 
  onPlayPause 
}: NFTDetailPanelProps) => {
  const [showDetails, setShowDetails] = useState(true);
  const [showActivity, setShowActivity] = useState(false);

  if (!isVisible || !nft) return null;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common': return 'text-gray-400 border-gray-400 bg-gray-400/10';
      case 'Rare': return 'text-blue-400 border-blue-400 bg-blue-400/10';
      case 'Epic': return 'text-purple-400 border-purple-400 bg-purple-400/10';
      case 'Legendary': return 'text-yellow-400 border-yellow-400 bg-yellow-400/10';
      default: return 'text-gray-400 border-gray-400 bg-gray-400/10';
    }
  };

  const mockActivity = [
    {
      id: 1,
      type: "Sale",
      price: "0.5 ETH",
      from: "0xf3...2266",
      to: "0xa7...4521",
      date: "2 hours ago",
      txHash: "0x1234...abcd"
    },
    {
      id: 2,
      type: "List",
      price: "0.5 ETH",
      from: "0xf3...2266",
      to: "",
      date: "1 day ago",
      txHash: "0x5678...efgh"
    },
    {
      id: 3,
      type: "Mint",
      price: "Free",
      from: "",
      to: "0xf3...2266",
      date: "1 week ago",
      txHash: "0x9abc...ijkl"
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl h-[90vh] overflow-hidden">
        <GlassCard className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-glass-border/20">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-semibold text-white">{nft.title}</h2>
              <Badge className={`text-xs border ${getRarityColor(nft.rarity)}`}>
                {nft.rarity}
              </Badge>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Left Panel - NFT Display */}
            <div className="w-1/2 p-6 flex flex-col">
              {/* NFT Image */}
              <div className="relative aspect-square rounded-lg overflow-hidden mb-4 group">
                <div className={`w-full h-full bg-gradient-to-br ${nft.backgroundColor} flex items-center justify-center relative`}>
                  <div className="w-full h-full bg-black/20 flex items-center justify-center">
                    <Volume2 className="w-24 h-24 text-white/60" />
                  </div>
                  
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={onPlayPause}
                      className="w-20 h-20 p-0 rounded-full bg-primary/80 hover:bg-primary text-black"
                    >
                      {isPlaying ? (
                        <Pause className="w-10 h-10" />
                      ) : (
                        <Play className="w-10 h-10 ml-1" />
                      )}
                    </Button>
                  </div>

                  {/* Collection Badge */}
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium bg-black/50 text-white border border-white/20">
                    Rarible Singles
                  </div>

                  {/* ID */}
                  <div className="absolute bottom-4 left-4 text-white/80 text-sm font-mono">
                    #{nft.id}
                  </div>
                </div>
              </div>

              {/* Audio Controls */}
              <div className="bg-white/5 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70 text-sm">Audio Preview</span>
                  <span className="text-white/70 text-sm">3:00</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 mb-3">
                  <div className="bg-primary h-2 rounded-full w-1/3"></div>
                </div>
                <div className="flex items-center justify-center space-x-4">
                  <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={onPlayPause}
                    className="w-12 h-12 p-0 rounded-full bg-primary/20 hover:bg-primary/30 text-primary"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6 ml-0.5" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                    <Volume2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <Button className="flex-1 bg-primary hover:bg-primary/80 text-black font-medium">
                  Buy Now
                </Button>
                <Button variant="ghost" className="text-white/70 hover:text-white border border-white/20">
                  <Heart className="w-4 h-4" />
                </Button>
                <Button variant="ghost" className="text-white/70 hover:text-white border border-white/20">
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" className="text-white/70 hover:text-white border border-white/20">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Right Panel - NFT Info */}
            <div className="w-1/2 border-l border-glass-border/20 overflow-y-auto">
              {/* Owner Info */}
              <div className="p-6 border-b border-glass-border/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{nft.title}</h3>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-white/60 text-sm">Owned by</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-primary font-medium">You</span>
                    <span className="text-white/60">on</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      <span className="text-white">Ethereum</span>
                    </div>
                  </div>
                </div>

                <p className="text-white/70 text-sm mb-4">{nft.description}</p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-white font-medium">{nft.views}</div>
                    <div className="text-white/60 text-xs">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-medium">{nft.likes}</div>
                    <div className="text-white/60 text-xs">Likes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-medium">12</div>
                    <div className="text-white/60 text-xs">Owners</div>
                  </div>
                </div>
              </div>

              {/* Listing Info */}
              {nft.isListed && (
                <div className="p-6 border-b border-glass-border/10">
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/70 text-sm">Listed for</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-yellow-400 hover:text-yellow-300 text-sm"
                      >
                        Unlist
                      </Button>
                    </div>
                    <div className="flex items-baseline space-x-2 mb-1">
                      <span className="text-2xl font-bold text-white">{nft.price}</span>
                      <span className="text-white/60 text-sm">$2,145</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Details Section */}
              <div className="p-6 border-b border-glass-border/10">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center justify-between w-full text-left mb-4"
                >
                  <h4 className="text-white font-medium">Details</h4>
                  {showDetails ? (
                    <ChevronUp className="w-4 h-4 text-white/70" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/70" />
                  )}
                </button>
                
                {showDetails && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">Contract Address</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-white text-sm font-mono">0xf8...350c</span>
                        <Button variant="ghost" size="sm" className="w-6 h-6 p-0 text-white/70 hover:text-white">
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">Token Standard</span>
                      <span className="text-white text-sm">ERC721</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">Owner</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-white text-sm font-mono">0xf3...2266</span>
                        <Button variant="ghost" size="sm" className="w-6 h-6 p-0 text-white/70 hover:text-white">
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">Chain</span>
                      <span className="text-white text-sm">Ethereum</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">Royalty</span>
                      <span className="text-white text-sm">10%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Activity Section */}
              <div className="p-6">
                <button
                  onClick={() => setShowActivity(!showActivity)}
                  className="flex items-center justify-between w-full text-left mb-4"
                >
                  <h4 className="text-white font-medium">Activity</h4>
                  {showActivity ? (
                    <ChevronUp className="w-4 h-4 text-white/70" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/70" />
                  )}
                </button>
                
                {showActivity && (
                  <div className="space-y-3">
                    {mockActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                            {activity.type === 'Sale' && <Zap className="w-4 h-4 text-primary" />}
                            {activity.type === 'List' && <Eye className="w-4 h-4 text-primary" />}
                            {activity.type === 'Mint' && <Award className="w-4 h-4 text-primary" />}
                          </div>
                          <div>
                            <div className="text-white text-sm font-medium">{activity.type}</div>
                            <div className="text-white/60 text-xs">{activity.date}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white text-sm font-medium">{activity.price}</div>
                          {activity.from && (
                            <div className="text-white/60 text-xs">
                              {activity.from} → {activity.to || 'Market'}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
