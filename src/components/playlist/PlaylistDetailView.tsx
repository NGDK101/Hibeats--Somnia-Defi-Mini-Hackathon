import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Play, 
  Pause, 
  Plus, 
  Music, 
  Heart, 
  Share2, 
  MoreHorizontal,
  Search,
  Filter,
  Clock,
  Volume2,
  Download,
  ExternalLink,
  Shuffle,
  Repeat,
  SkipForward,
  SkipBack,
  Edit,
  Users,
  Globe,
  Lock,
  Calendar,
  Eye,
  Trash2
} from 'lucide-react';
import { useMusicPlayerContext } from '@/hooks/useMusicPlayerContext';
import { useGeneratedMusicContext } from '@/hooks/useGeneratedMusicContext';
import { usePlaylistManager, PlaylistItem } from '@/hooks/usePlaylistManager';
import { GeneratedMusic } from '@/types/music';

interface PlaylistDetailViewProps {
  playlist: PlaylistItem;
  onBack?: () => void;
  onSongSelect?: (song: GeneratedMusic) => void;
  className?: string;
}

export const PlaylistDetailView = ({ 
  playlist, 
  onBack, 
  onSongSelect, 
  className 
}: PlaylistDetailViewProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  
  const { generatedMusic } = useGeneratedMusicContext();
  const { playSong, currentSong, isPlaying } = useMusicPlayerContext();
  const { addTrackToPlaylist, removeTrackFromPlaylist } = usePlaylistManager();

  // Get tracks that are in this playlist
  const playlistTracks = generatedMusic.filter(track => 
    playlist.trackIds.includes(track.id)
  );

  // Filter tracks based on search
  const filteredTracks = playlistTracks.filter(track =>
    track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlayPause = (track: GeneratedMusic) => {
    if (currentSong?.id === track.id && isPlaying) {
      // Pause current song
    } else {
      playSong(track);
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    try {
      await removeTrackFromPlaylist(playlist.id, trackId);
    } catch (error) {
      console.error('Error removing track:', error);
    }
  };

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getPlaylistTypeIcon = (type: string) => {
    switch (type) {
      case 'PUBLIC':
        return <Globe className="w-4 h-4" />;
      case 'SHARED':
        return <Users className="w-4 h-4" />;
      default:
        return <Lock className="w-4 h-4" />;
    }
  };

  const getTotalDuration = () => {
    return filteredTracks.reduce((total, track) => total + (track.duration || 180), 0);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Playlist Header */}
      <div className="relative">
        <GlassCard className="p-6">
          <div className="flex items-start space-x-6">
            {/* Playlist Cover */}
            <div className="relative">
              <div className="w-48 h-48 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                {playlist.coverImageHash ? (
                  <img 
                    src={`https://ipfs.io/ipfs/${playlist.coverImageHash}`}
                    alt={playlist.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Music className="w-16 h-16 text-white/60" />
                )}
              </div>
              
              {/* Play button overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <Button
                  size="lg"
                  className="rounded-full bg-primary/80 hover:bg-primary text-black"
                  onClick={() => filteredTracks.length > 0 && handlePlayPause(filteredTracks[0])}
                >
                  <Play className="w-8 h-8 ml-1" />
                </Button>
              </div>
            </div>

            {/* Playlist Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {getPlaylistTypeIcon(playlist.type)}
                  <span className="ml-1">{playlist.type}</span>
                </Badge>
              </div>
              
              <h1 className="text-4xl font-bold text-white mb-2">{playlist.name}</h1>
              
              <p className="text-white/70 mb-4 max-w-2xl">
                {playlist.description || 'No description provided'}
              </p>

              <div className="flex items-center space-x-6 text-sm text-white/60 mb-6">
                <div className="flex items-center space-x-1">
                  <Music className="w-4 h-4" />
                  <span>{filteredTracks.length} tracks</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{Math.floor(getTotalDuration() / 60)} minutes</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Created {formatDate(playlist.createdAt)}</span>
                </div>
                {playlist.type === 'PUBLIC' && (
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{playlist.followerCount} followers</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <Button 
                  className="bg-primary hover:bg-primary/80 text-black font-medium"
                  onClick={() => filteredTracks.length > 0 && handlePlayPause(filteredTracks[0])}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Play All
                </Button>
                <Button variant="outline" className="text-white border-white/20">
                  <Shuffle className="w-4 h-4 mr-2" />
                  Shuffle
                </Button>
                <Button variant="outline" className="text-white border-white/20">
                  <Heart className="w-4 h-4 mr-2" />
                  Like
                </Button>
                <Button variant="outline" className="text-white border-white/20">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button variant="ghost" className="p-2 text-white/70 hover:text-white">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Search and Controls */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
          <Input
            placeholder="Search in playlist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="text-white border-white/20">
            <Plus className="w-4 h-4 mr-2" />
            Add Tracks
          </Button>
          <Button variant="outline" size="sm" className="text-white border-white/20">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Track List */}
      <GlassCard className="p-0 overflow-hidden">
        {filteredTracks.length === 0 ? (
          <div className="text-center py-12 text-white/70">
            <Music className="w-16 h-16 mx-auto mb-4 text-white/30" />
            <p className="text-lg mb-2">
              {searchQuery ? 'No tracks found' : 'No tracks in this playlist'}
            </p>
            <p className="text-sm">
              {searchQuery ? 'Try adjusting your search' : 'Add some tracks to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredTracks.map((track, index) => (
              <div
                key={track.id}
                className={`flex items-center p-4 hover:bg-white/5 transition-colors border-b border-white/10 last:border-b-0 ${
                  currentSong?.id === track.id ? 'bg-white/10' : ''
                }`}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="text-white/50 text-sm w-8">
                    {index + 1}
                  </div>
                  
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={track.image || '/api/placeholder/48/48'} />
                      <AvatarFallback>
                        <Music className="w-6 h-6" />
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      className="absolute inset-0 w-full h-full rounded-full bg-black/60 hover:bg-black/80 opacity-0 hover:opacity-100 transition-opacity"
                      onClick={() => handlePlayPause(track)}
                    >
                      {currentSong?.id === track.id && isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{track.title}</p>
                    <p className="text-sm text-white/70 truncate">{track.genre}</p>
                  </div>

                  <div className="hidden md:flex items-center space-x-4 text-white/70 text-sm">
                    <span>{formatDuration(track.duration || 180)}</span>
                    <Badge variant="outline" className="text-xs">
                      {track.style || 'Default'}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="ghost" className="p-2 text-white/70 hover:text-white">
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="p-2 text-white/70 hover:text-white">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="p-2 text-white/70 hover:text-white"
                      onClick={() => onSongSelect?.(track)}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="p-2 text-white/70 hover:text-red-400"
                      onClick={() => handleRemoveTrack(track.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Back Button */}
      {onBack && (
        <div className="flex justify-start">
          <Button variant="outline" onClick={onBack} className="text-white border-white/20">
            ← Back to Playlists
          </Button>
        </div>
      )}
    </div>
  );
};