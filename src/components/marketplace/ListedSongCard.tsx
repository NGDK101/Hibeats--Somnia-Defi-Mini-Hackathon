import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Volume2, Music, Eye } from 'lucide-react';
import { useSongStatus } from '@/hooks/useSongStatus';
import { useMusicPlayerContext } from '@/hooks/useMusicPlayerContext';
import { type GeneratedMusic } from '@/types/music';
import { SongInteractions } from '@/components/social/SongInteractions';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';

interface ListedSongCardProps {
  song: GeneratedMusic;
  onClick: (song: GeneratedMusic) => void;
}

export const ListedSongCard: React.FC<ListedSongCardProps> = ({ song, onClick }) => {
  const { playSong, currentSong } = useMusicPlayerContext();
  const { status, isListed, isLoading } = useSongStatus(song.id);

  // Only render if the song is actually listed
  if (isLoading) {
    return (
      <div className="group cursor-pointer animate-pulse">
        <div className="relative aspect-square mb-3">
          <div className="w-full h-full rounded-2xl bg-gray-700 relative overflow-hidden shadow-lg">
            <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
              <Music className="w-16 h-16 text-gray-400" />
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Don't render if not listed
  if (!isListed) {
    return null;
  }

  return (
    <div className="group cursor-pointer" onClick={() => onClick(song)}>
      <div className="relative aspect-square mb-3">
        <div className="w-full h-full rounded-2xl relative overflow-hidden shadow-lg">
          {/* Song image with Multi-Gateway Fallback */}
          {song.imageUrl ? (
            <ImageWithFallback
              src={song.imageUrl}
              alt={song.title}
              className="w-full h-full object-cover rounded-2xl"
              onLoad={() => {
              }}
              onError={() => {
                console.error('❌ Failed to load song image from all gateways:', song.title);
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center rounded-2xl">
              <Music className="w-16 h-16 text-white/80" />
            </div>
          )}

          {/* Listed badge */}
          <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium bg-green-600/80 text-white border border-green-400/30">
            Listed
          </div>

          {/* Play button overlay */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
            <Button
              size="sm"
              className="rounded-full w-12 h-12 bg-white/20 hover:bg-white/30 border-0"
              onClick={(e) => {
                e.stopPropagation();
                playSong(song, [song]);
              }}
            >
              {currentSong?.id === song.id ? (
                <Volume2 className="w-4 h-4 text-white" />
              ) : (
                <Play className="w-4 h-4 text-white" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-white font-medium text-sm leading-tight overflow-hidden"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}>
            {song.title}
          </h3>
          <p className="text-gray-400 text-xs">{song.artist}</p>

          {/* Price and Buy Button */}
          <div className="flex items-center justify-between gap-2 mt-2">
            <div className="flex flex-col">
              <span className="text-green-400 font-medium text-sm">1 STT</span>
              <span className="text-gray-500 text-xs">~$2.50</span>
            </div>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 h-6 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                // Handle buy logic here
              }}
            >
              Buy Now
            </Button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between mt-1">
            <SongInteractions songId={song.id} compact />
            <div className="flex items-center gap-1 text-gray-500 text-xs">
              <Eye className="w-3 h-3" />
              <span>{Math.floor(Math.random() * 1000) + 100}</span>
            </div>
            <span>{new Date(song.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};