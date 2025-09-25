import React, { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Music, Play } from 'lucide-react';
import { useNFTMetadata } from '@/hooks/useNFTMetadata-optimized';
import { useMusicPlayerContext } from '@/hooks/useMusicPlayerContext';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';

interface ActiveListingCardProps {
  listing: {
    id: string;
    tokenId: number;
    seller: string;
    price: string;
    priceInETH: string;
    isActive: boolean;
    createdAt: string;
    title?: string;
    artist?: string;
    genre?: string;
    category?: string;
    tags?: string[];
    duration?: number;
    // Additional metadata fields for completeness
    imageUrl?: string;
    audioUrl?: string;
    description?: string;
  };
  onClick: (listing: any) => void;
  onBuy?: (listing: any) => void;
}

const ActiveListingCard: React.FC<ActiveListingCardProps> = ({ listing, onClick, onBuy }) => {
  const { metadata, isLoading: isLoadingMetadata, error: metadataError } = useNFTMetadata(listing.tokenId);
  const { playSong } = useMusicPlayerContext();
  const [isClicking, setIsClicking] = useState(false);

  // Use metadata if available, otherwise fallback to listing data
  const displayTitle = metadata?.name || listing.title || `Music NFT #${listing.tokenId}`;
  const displayArtist = metadata?.artist || listing.artist || `Creator ${listing.seller.slice(0, 6)}...${listing.seller.slice(-4)}`;
  const displayGenre = metadata?.genre || listing.genre || listing.category || 'Unknown';
  const displayImage = metadata?.image || listing.imageUrl;
  const audioUrl = metadata?.audio_url || listing.audioUrl;
  const displayDescription = metadata?.description || listing.description;
  const displayDuration = metadata?.duration || listing.duration || 180;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioUrl) {
      const songData = {
        id: listing.id,
        title: displayTitle,
        artist: displayArtist,
        audioUrl,
        imageUrl: displayImage,
        duration: displayDuration,
        genre: [displayGenre], // Convert to array as expected by GeneratedMusic type
        taskId: `task-${listing.tokenId}`,
        createdAt: listing.createdAt
      };
      playSong(songData, [songData]);
    }
  };

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBuy) {
      // Create comprehensive listing data with metadata
      const listingWithMetadata = {
        ...listing,
        title: displayTitle,
        artist: displayArtist,
        genre: displayGenre,
        imageUrl: displayImage,
        audioUrl,
        description: displayDescription,
        duration: displayDuration,
        tokenId: listing.tokenId,
        priceInWei: listing.price, // Keep original price in wei
        priceInETH: listing.priceInETH,
        // Include metadata status for debugging
        hasMetadata: !!metadata,
        isLoadingMetadata
      };
      onBuy(listingWithMetadata);
    }
  };

  const handleCardClick = () => {
    if (isClicking) return; // Prevent multiple clicks
    
    setIsClicking(true);
    setTimeout(() => {
      onClick(listing);
      setIsClicking(false);
    }, 150);
  };

  return (
    <div className={`group cursor-pointer ${isClicking ? 'opacity-75' : ''}`} onClick={handleCardClick}>
      <div className="relative aspect-[16/9] mb-6">
        <div className="w-full h-full rounded-2xl relative overflow-hidden shadow-lg">
          {/* NFT Image with Multi-Gateway Fallback */}
          {displayImage ? (
            <ImageWithFallback
              src={displayImage.startsWith('ipfs://')
                ? displayImage.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
                : displayImage
              }
              alt={displayTitle}
              className="w-full h-full object-cover rounded-2xl"
              onError={() => {
                console.error('❌ Failed to load NFT image from all gateways:', displayTitle);
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center rounded-2xl">
              <Music className="w-24 h-24 text-white/80" />
            </div>
          )}


          {/* Play button overlay */}
          {audioUrl && (
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
              <Button
                size="sm"
                className="rounded-full w-20 h-20 bg-white/20 hover:bg-white/30 border-0"
                onClick={handlePlay}
              >
                <Play className="w-8 h-8 text-white" />
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-white font-medium text-sm leading-tight overflow-hidden"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}>
            {displayTitle}
          </h3>
          <p className="text-gray-400 text-xs">{displayArtist}</p>
          <p className="text-gray-500 text-xs">{displayGenre}</p>

          {/* Buy Button */}
          <div className="flex items-center justify-between gap-2 mt-2">
            <div className="flex flex-col">
              <span className="text-green-400 font-medium text-sm">{listing.priceInETH} STT</span>
              <span className="text-gray-500 text-xs">Listed</span>
            </div>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 h-6 rounded-full"
              onClick={handleBuy}
            >
              Buy STT
            </Button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
            <span>Token #{listing.tokenId}</span>
            <span>{new Date(listing.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export default memo(ActiveListingCard, (prevProps, nextProps) => {
  return (
    prevProps.listing.id === nextProps.listing.id &&
    prevProps.listing.price === nextProps.listing.price &&
    prevProps.listing.isActive === nextProps.listing.isActive &&
    prevProps.listing.title === nextProps.listing.title &&
    prevProps.listing.artist === nextProps.listing.artist &&
    prevProps.listing.imageUrl === nextProps.listing.imageUrl &&
    prevProps.listing.audioUrl === nextProps.listing.audioUrl
  );
});