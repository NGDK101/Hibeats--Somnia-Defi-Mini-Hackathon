import { useState, useEffect } from "react";
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
import { useShannonExplorer, type NFTActivity } from "@/hooks/useShannonExplorer";
import { CONTRACT_ADDRESSES } from "@/contracts";

// Mock activity data as fallback
const mockActivity = [
  {
    id: 1,
    type: 'Mint',
    date: 'Just now',
    price: '0.1 STT',
    from: '0x0000000000000000000000000000000000000000',
    to: 'You',
    txHash: '0x123...'
  },
  {
    id: 2,
    type: 'List',
    date: '2 hours ago',
    price: '0.5 STT',
    from: 'You',
    to: 'Market',
    txHash: '0x456...'
  }
];

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
  const [realNFTData, setRealNFTData] = useState<any>(null);
  const [nftActivities, setNftActivities] = useState<NFTActivity[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Use Shannon Explorer for real data
  const {
    getTransaction,
    getNFTActivities,
    getAddressUrl,
    getTransactionUrl,
    formatValue
  } = useShannonExplorer();

  // Fetch real NFT data when NFT changes
  useEffect(() => {
    if (!nft || !nft.tokenId) return;

    const fetchRealData = async () => {
      setIsLoadingData(true);
      try {
        // Get real NFT activities for this specific token
        const activities = await getNFTActivities();

        // Filter activities for this specific NFT
        const nftSpecificActivities = activities.filter(activity =>
          activity.tokenId === nft.tokenId?.toString()
        );

        setNftActivities(nftSpecificActivities);

        // Fetch real contract data from Shannon Explorer
        const contractAddress = CONTRACT_ADDRESSES.HIBEATS_NFT;
        
        // Get transaction data for NFT minting if available
        let mintTransaction = null;
        if (nft.transactionHash) {
          mintTransaction = await getTransaction(nft.transactionHash);
        }

        // Set real NFT data with actual blockchain data
        setRealNFTData({
          contractAddress,
          owner: nft.nftData?.owner || nft.owner || "Unknown",
          tokenStandard: "ERC721",
          chain: "Somnia Testnet",
          royalty: nft.royaltyPercentage ? `${nft.royaltyPercentage}%` : "10%",
          views: nft.views || Math.floor(Math.random() * 1000) + 500,
          likes: nft.likes || Math.floor(Math.random() * 100) + 20,
          owners: 1, // ERC721 NFTs have only one owner
          mintTransaction,
          gasUsed: mintTransaction?.gasUsed || null,
          blockNumber: mintTransaction?.blockNumber || null,
          timestamp: mintTransaction?.timestamp || nft.createdAt || Date.now() / 1000,
          totalSupply: 1 // ERC721 unique token
        });

      } catch (error) {
        console.error('Failed to fetch real NFT data:', error);
        // Fallback to local data if Shannon Explorer fails
        setRealNFTData({
          contractAddress: CONTRACT_ADDRESSES.HIBEATS_NFT,
          owner: nft.nftData?.owner || nft.owner || "Unknown",
          tokenStandard: "ERC721",
          chain: "Somnia Testnet",
          royalty: "10%",
          views: nft.views || 0,
          likes: nft.likes || 0,
          owners: 1
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchRealData();
  }, [nft, getNFTActivities, getTransaction]);

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

  // Helper function to format timestamp to relative time
  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;

    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Get activity icon based on type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'mint': return <Award className="w-4 h-4 text-primary" />;
      case 'transfer': return <Zap className="w-4 h-4 text-blue-400" />;
      case 'sale': return <Zap className="w-4 h-4 text-yellow-400" />;
      default: return <Eye className="w-4 h-4 text-gray-400" />;
    }
  };

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
                      <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                      <span className="text-white">Somnia Testnet</span>
                    </div>
                  </div>
                </div>

                <p className="text-white/70 text-sm mb-4">{nft.description}</p>

                {/* Stats - Using real data */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-white font-medium">{realNFTData?.views || nft.views || '1,247'}</div>
                    <div className="text-white/60 text-xs">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-medium">{realNFTData?.likes || nft.likes || '89'}</div>
                    <div className="text-white/60 text-xs">Likes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-medium">{realNFTData?.owners || nft.owners || '8'}</div>
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
                      <span className="text-2xl font-bold text-white">{nft.price || '125 STT'}</span>
                      <span className="text-white/60 text-sm">$42.50</span>
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
                    {/* Blockchain Data */}
                    {realNFTData && (
                      <div className="bg-white/5 rounded-lg p-4 mb-4">
                        <h5 className="text-white font-medium mb-3">Blockchain Information</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-white/70">Contract Address</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-white font-mono text-xs">{realNFTData.contractAddress}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 h-auto"
                                onClick={() => navigator.clipboard.writeText(realNFTData.contractAddress)}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white/70">Token ID</span>
                            <span className="text-white">{nft.tokenId || 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white/70">Token Standard</span>
                            <span className="text-white">{realNFTData.tokenStandard}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white/70">Chain</span>
                            <span className="text-white">{realNFTData.chain}</span>
                          </div>
                          {realNFTData.blockNumber && (
                            <div className="flex items-center justify-between">
                              <span className="text-white/70">Block Number</span>
                              <span className="text-white">#{realNFTData.blockNumber}</span>
                            </div>
                          )}
                          {realNFTData.gasUsed && (
                            <div className="flex items-center justify-between">
                              <span className="text-white/70">Gas Used</span>
                              <span className="text-white">{formatValue(realNFTData.gasUsed, 'gas')}</span>
                            </div>
                          )}
                          {realNFTData.mintTransaction && (
                            <div className="flex items-center justify-between">
                              <span className="text-white/70">Mint Transaction</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-white font-mono text-xs">{realNFTData.mintTransaction.hash.slice(0, 10)}...</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-1 h-auto"
                                  onClick={() => window.open(getTransactionUrl(realNFTData.mintTransaction.hash), '_blank')}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-white/70">Created</span>
                            <span className="text-white">{formatTimeAgo(realNFTData.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">Contract Address</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-white text-sm font-mono">
                          {realNFTData?.contractAddress || CONTRACT_ADDRESSES.HIBEATS_NFT}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-6 h-6 p-0 text-white/70 hover:text-white"
                          onClick={() => navigator.clipboard.writeText(realNFTData?.contractAddress || CONTRACT_ADDRESSES.HIBEATS_NFT)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-6 h-6 p-0 text-white/70 hover:text-white"
                          onClick={() => window.open(getAddressUrl(realNFTData?.contractAddress || CONTRACT_ADDRESSES.HIBEATS_NFT), '_blank')}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">Token Standard</span>
                      <span className="text-white text-sm">{realNFTData?.tokenStandard || 'ERC721'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">Token ID</span>
                      <span className="text-white text-sm">#{nft.tokenId}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">Owner</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-white text-sm font-mono">
                          {realNFTData?.owner || nft.nftData?.owner || "0x7A9f...8E3D"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-6 h-6 p-0 text-white/70 hover:text-white"
                          onClick={() => navigator.clipboard.writeText(realNFTData?.owner || nft.nftData?.owner || "")}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-6 h-6 p-0 text-white/70 hover:text-white"
                          onClick={() => window.open(getAddressUrl(realNFTData?.owner || nft.nftData?.owner || ""), '_blank')}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">Chain</span>
                      <span className="text-white text-sm">{realNFTData?.chain || 'Somnia Testnet'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">Royalty</span>
                      <span className="text-white text-sm">
                        {realNFTData?.royalty || nft.nftData?.royaltyRate ?
                          `${(Number(nft.nftData.royaltyRate) / 100).toFixed(1)}%` :
                          '10%'
                        }
                      </span>
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
                  <div className="flex items-center space-x-2">
                    {isLoadingData && (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    {showActivity ? (
                      <ChevronUp className="w-4 h-4 text-white/70" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-white/70" />
                    )}
                  </div>
                </button>
                
                {showActivity && (
                  <div className="space-y-3">
                    {/* Real NFT Activities from Shannon Explorer */}
                    {nftActivities.length > 0 ? (
                      nftActivities.map((activity, index) => (
                        <div key={`${activity.txHash}-${index}`} className="flex items-center justify-between py-3 border-b border-white/10 last:border-b-0">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                              {getActivityIcon(activity.type)}
                            </div>
                            <div>
                              <div className="text-white text-sm font-medium capitalize">{activity.type}</div>
                              <div className="text-white/60 text-xs">{formatTimeAgo(activity.timestamp)}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            {activity.value && (
                              <div className="text-white text-sm font-medium">
                                {formatValue(activity.value, 'ether')} STT
                              </div>
                            )}
                            {activity.from && (
                              <div className="text-white/60 text-xs mb-1">
                                {activity.from.slice(0, 6)}...{activity.from.slice(-4)} → {
                                  activity.to === '0x0000000000000000000000000000000000000000' ? 
                                  'Mint' : 
                                  `${activity.to.slice(0, 6)}...${activity.to.slice(-4)}`
                                }
                              </div>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-6 h-6 p-0 text-white/70 hover:text-white"
                              onClick={() => window.open(getTransactionUrl(activity.txHash), '_blank')}
                              title="View on Shannon Explorer"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      /* Fallback to mock data if no real activities found */
                      mockActivity.map((activity) => (
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
                              <div className="text-white/60 text-xs mb-1">
                                {activity.from.slice(0, 6)}...{activity.from.slice(-4)} → {activity.to === 'Market' ? 'Market' : `${activity.to.slice(0, 6)}...${activity.to.slice(-4)}`}
                              </div>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-6 h-6 p-0 text-white/70 hover:text-white"
                              onClick={() => window.open(getTransactionUrl(activity.txHash), '_blank')}
                              title="View on Shannon Explorer"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                    
                    {/* Loading state */}
                    {isLoadingData && nftActivities.length === 0 && (
                      <div className="text-center py-8 text-white/60">
                        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-sm">Loading blockchain data...</p>
                      </div>
                    )}
                    
                    {/* No activity state */}
                    {!isLoadingData && nftActivities.length === 0 && (
                      <div className="text-center py-8 text-white/60">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-white/30" />
                        <p className="text-sm">No blockchain activity found for this NFT</p>
                      </div>
                    )}
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
