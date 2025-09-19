import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle, Clock, ShoppingCart } from 'lucide-react';
import { useSongStatus } from '@/hooks/useSongStatus';
import { useNFTManager, getStatusText, getStatusColor } from '@/hooks/useNFTManager';
import { NFTMintRoadmapModal } from '@/components/nft/NFTMintRoadmapModal';
import { formatEther } from 'viem';

interface NFTActionButtonsProps {
  aiTrackId: string;
  songData?: {
    title?: string;
    artist?: string;
    imageUrl?: string;
    audioUrl?: string;
    genre?: string | string[];
    duration?: number;
    createdAt?: string;
  };
  size?: 'sm' | 'md'; // Add size prop for different button sizes
}

export function NFTActionButtons({ aiTrackId, songData, size = 'md' }: NFTActionButtonsProps) {
  const songStatus = useSongStatus(aiTrackId);
  const nftManager = useNFTManager();
  
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showMintModal, setShowMintModal] = useState(false);
  const [price, setPrice] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [useBeatsToken, setUseBeatsToken] = useState(false);

  // Define button styles based on size
  const buttonStyles = {
    sm: "h-6 px-1.5 text-xs font-semibold",
    md: "h-7 px-2 text-xs font-semibold"
  };

  const iconStyles = {
    sm: "h-3 w-3",
    md: "h-3 w-3"
  };

  const baseButtonClass = `${buttonStyles[size]} bg-gradient-to-r border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-full`;

  // Loading state - show clean Mint button while checking in background
  if (songStatus.loading) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={`${baseButtonClass} from-blue-500 to-purple-600 text-white`}
        onClick={() => {}} // No-op function to prevent action while loading
      >
        Mint NFT
      </Button>
    );
  }

  // Error state - show error button without text
  if (songStatus.error) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className={`${buttonStyles[size]} bg-red-400 text-white border-0 rounded-full cursor-not-allowed opacity-70`}
      >
        <AlertCircle className={`${iconStyles[size]} mr-1`} />
        Error
      </Button>
    );
  }

  // Status badge
  const StatusBadge = () => {
    const icons = {
      'not-minted': <Clock className="h-3 w-3" />,
      'minted-not-listed': <CheckCircle className="h-3 w-3" />,
      'minted-listed': <ShoppingCart className="h-3 w-3" />,
      'minted-not-owner': <AlertCircle className="h-3 w-3" />,
      'error': <AlertCircle className="h-3 w-3" />
    };

    const colors = {
      'not-minted': 'bg-blue-100 text-blue-800',
      'minted-not-listed': 'bg-green-100 text-green-800',
      'minted-listed': 'bg-orange-100 text-orange-800',
      'minted-not-owner': 'bg-green-100 text-green-800', // ✅ SAMA SEPERTI READY TO LIST
      'error': 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={`flex items-center gap-1 ${colors[songStatus.status]}`}>
        {icons[songStatus.status]}
        {getStatusText(songStatus.status)}
      </Badge>
    );
  };

  // Listing info display
  const ListingInfo = () => {
    if (!songStatus.isListed || !songStatus.listingData) return null;
    
    return (
      <div className="text-xs text-gray-600 mt-1">
        Price: {formatEther(songStatus.listingData.price)} {songStatus.listingData.isBeatsToken ? 'BEATS' : 'STT'}
      </div>
    );
  };

  // Handle mint action - open modal instead of direct mint
  const handleMint = () => {
    setShowMintModal(true);
  };

  // Handle mint success from modal
  const handleMintSuccess = async (tokenId: any) => {
    setShowMintModal(false);
    await songStatus.refetch(); // Refresh status after mint
  };

  // Handle list action
  const handleList = async () => {
    if (!price || !songStatus.tokenId) return;
    
    try {
      await nftManager.handleAction('list', {
        aiTrackId,
        tokenId: songStatus.tokenId,
        price,
        isBeatsToken: useBeatsToken,
      });
      await songStatus.refetch();
      setShowPriceDialog(false);
      setPrice('');
    } catch (error) {
      console.error('List failed:', error);
    }
  };

  // Handle update price
  const handleUpdatePrice = async () => {
    if (!newPrice || !songStatus.tokenId) return;
    
    try {
      await nftManager.handleAction('update', {
        aiTrackId,
        tokenId: songStatus.tokenId,
        newPrice,
      });
      await songStatus.refetch();
      setShowUpdateDialog(false);
      setNewPrice('');
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  // Handle unlist action
  const handleUnlist = async () => {
    if (!songStatus.tokenId) return;
    
    try {
      await nftManager.handleAction('unlist', {
        aiTrackId,
        tokenId: songStatus.tokenId,
      });
      await songStatus.refetch();
    } catch (error) {
      console.error('Unlist failed:', error);
    }
  };

  // Render action buttons based on status
  const renderActionButtons = () => {
    const buttonConfig = nftManager.getActionButtonConfig(
      songStatus.status,
      songStatus.isOwner,
      songStatus.isListed
    );

    if (Array.isArray(buttonConfig)) {
      // Multiple buttons for listed NFT (update + unlist)
      return (
        <div className="flex gap-1">
          <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={nftManager.isLoading}
                className={`${baseButtonClass} from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white`}
              >
                {nftManager.isLoading ? <Loader2 className={`${iconStyles[size]} animate-spin mr-1`} /> : null}
                Update
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Listing Price</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="newPrice">New Price</Label>
                  <Input
                    id="newPrice"
                    type="number"
                    step="0.001"
                    placeholder="Enter new price"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleUpdatePrice} 
                  disabled={!newPrice || nftManager.isLoading}
                  className="w-full"
                >
                  {nftManager.isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Update Price
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleUnlist}
            disabled={nftManager.isLoading}
            className={`${baseButtonClass} from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white`}
          >
            {nftManager.isLoading ? <Loader2 className={`${iconStyles[size]} animate-spin mr-1`} /> : null}
            Unlist
          </Button>
        </div>
      );
    }

    // Single button cases
    switch (buttonConfig.action) {
      case 'mint':
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMint}
            disabled={nftManager.isLoading}
            className={`${baseButtonClass} from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white`}
          >
            {nftManager.isLoading ? <Loader2 className={`${iconStyles[size]} animate-spin mr-1`} /> : null}
            Mint NFT
          </Button>
        );

      case 'list':
        return (
          <Dialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={nftManager.isLoading}
                className={`${baseButtonClass} from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white`}
              >
                {nftManager.isLoading ? <Loader2 className={`${iconStyles[size]} animate-spin mr-1`} /> : null}
                List NFT
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>List NFT for Sale</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.001"
                    placeholder="Enter price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useBeatsToken"
                    checked={useBeatsToken}
                    onChange={(e) => setUseBeatsToken(e.target.checked)}
                  />
                  <Label htmlFor="useBeatsToken">Accept BEATS tokens</Label>
                </div>
                <Button 
                  onClick={handleList} 
                  disabled={!price || nftManager.isLoading}
                  className="w-full"
                >
                  {nftManager.isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  List NFT
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        );

      case 'view':
        return (
          <Button
            variant="ghost"
            size="sm"
            disabled
            className={`${buttonStyles[size]} bg-gray-400 text-gray-600 border-0 rounded-full cursor-not-allowed`}
          >
            Owned by Others
          </Button>
        );

      default:
        return (
          <Button
            variant="ghost"
            size="sm"
            disabled
            className={`${buttonStyles[size]} bg-red-400 text-white border-0 rounded-full cursor-not-allowed`}
          >
            Error
          </Button>
        );
    }
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        {/* Compact action button for library view */}
        {renderActionButtons()}
      </div>

      {/* NFT Mint Roadmap Modal */}
      <NFTMintRoadmapModal
        isOpen={showMintModal}
        onClose={() => setShowMintModal(false)}
        selectedSong={songData ? {
          id: aiTrackId,
          title: songData.title || `Song ${aiTrackId}`,
          artist: songData.artist || 'AI Generated',
          displayName: songData.artist || 'AI Generated',
          imageUrl: songData.imageUrl || '',
          audioUrl: songData.audioUrl || '',
          genre: Array.isArray(songData.genre) ? songData.genre : [songData.genre || 'Electronic'],
          tags: Array.isArray(songData.genre) ? songData.genre : [songData.genre || 'Electronic'],
          duration: songData.duration || 30,
          createdAt: songData.createdAt || new Date().toISOString(),
          taskId: aiTrackId,
          metadata: {
            description: `AI-generated music: ${songData.title || 'Untitled'}`
          }
        } : null}
        onMintSuccess={handleMintSuccess}
      />
    </>
  );
}

export default NFTActionButtons;