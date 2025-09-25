import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Music, ShoppingCart, Eye } from 'lucide-react';
import { useSongStatus } from '@/hooks/useSongStatus';
import { useNFTManager, getStatusText, getStatusColor } from '@/hooks/useNFTManager';
import { formatEther } from 'viem';
import NFTActionButtons from './NFTActionButtons';

interface NFTGridItemProps {
  aiTrackId: string;
  songData: {
    title: string;
    artist?: string;
    imageUrl?: string;
    audioUrl?: string;
    genre?: string;
    duration?: number;
    createdAt?: string;
  };
}

export function NFTGridItem({ aiTrackId, songData }: NFTGridItemProps) {
  const songStatus = useSongStatus(aiTrackId);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        {/* Cover Image */}
        <div className="aspect-square bg-gradient-to-br from-purple-400 to-blue-500 relative overflow-hidden">
          {songData.imageUrl ? (
            <img 
              src={songData.imageUrl} 
              alt={songData.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="h-16 w-16 text-white/80" />
            </div>
          )}
          
          {/* Status overlay */}
          <div className="absolute top-2 right-2">
            {songStatus.loading ? (
              <Badge variant="secondary" className="bg-white/90">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Loading...
              </Badge>
            ) : (
              <Badge 
                className={`${getStatusColor(songStatus.status)} bg-white/90 backdrop-blur-sm`}
              >
                {getStatusText(songStatus.status)}
              </Badge>
            )}
          </div>

          {/* Play button overlay */}
          {songData.audioUrl && (
            <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button size="sm" variant="secondary" className="rounded-full">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        {/* Song Info */}
        <div className="space-y-2">
          <div>
            <h3 className="font-semibold text-lg truncate" title={songData.title}>
              {songData.title}
            </h3>
            {songData.artist && (
              <p className="text-sm text-gray-600 truncate">
                by {songData.artist}
              </p>
            )}
          </div>

          {/* Additional metadata */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{songData.genre || 'Music'}</span>
            {songData.duration && (
              <span>{Math.floor(songData.duration / 60)}:{(songData.duration % 60).toString().padStart(2, '0')}</span>
            )}
          </div>

          {/* Listing price if applicable */}
          {songStatus.isListed && songStatus.listingData && (
            <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
              <ShoppingCart className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">
                {formatEther(songStatus.listingData.price)} {songStatus.listingData.isBeatsToken ? 'BEATS' : 'STT'}
              </span>
            </div>
          )}

          {/* Token ID if minted */}
          {songStatus.tokenId && (
            <div className="text-xs text-gray-500">
              Token ID: #{songStatus.tokenId.toString()}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4">
          <NFTActionButtons 
            aiTrackId={aiTrackId} 
            songData={songData}
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface NFTGridProps {
  songs: Array<{
    aiTrackId: string;
    title: string;
    artist?: string;
    imageUrl?: string;
    audioUrl?: string;
    genre?: string;
    duration?: number;
    createdAt?: string;
  }>;
  loading?: boolean;
  emptyMessage?: string;
}

export function NFTGrid({ songs, loading, emptyMessage = "No songs found" }: NFTGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="aspect-square bg-gray-200 animate-pulse" />
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="text-center py-12">
        <Music className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Songs Found</h3>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {songs.map((song) => (
        <NFTGridItem
          key={song.aiTrackId}
          aiTrackId={song.aiTrackId}
          songData={song}
        />
      ))}
    </div>
  );
}

export default NFTGrid;