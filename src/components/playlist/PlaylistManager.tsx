import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Plus,
  Music,
  Play,
  Pause,
  Heart,
  Share2,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  Globe,
  Lock,
  Clock,
  Download,
  ExternalLink
} from 'lucide-react';
import { usePlaylistManager, PlaylistItem } from '@/hooks/usePlaylistManager';
import { useGeneratedMusicContext } from '@/hooks/useGeneratedMusicContext';
import { useMusicPlayerContext } from '@/hooks/useMusicPlayerContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface PlaylistManagerProps {
  className?: string;
  onPlaylistSelect?: (playlist: PlaylistItem) => void;
}

export const PlaylistManager = ({ className, onPlaylistSelect }: PlaylistManagerProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isCollaborative, setIsCollaborative] = useState(false);
  
  const { userPlaylists, publicPlaylists, createPlaylist, isLoading } = usePlaylistManager();
  const { generatedMusic } = useGeneratedMusicContext();
  const { playSong, currentSong, isPlaying } = useMusicPlayerContext();
  const { toast } = useToast();

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a playlist name",
        variant: "destructive",
      });
      return;
    }

    try {
      await createPlaylist(
        newPlaylistName,
        newPlaylistDescription,
        isPublic ? 'PUBLIC' : 'PERSONAL',
        isPublic,
        isCollaborative
      );
      
      // Reset form
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setIsPublic(false);
      setIsCollaborative(false);
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Error creating playlist:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
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

  const getPlaylistTypeColor = (type: string) => {
    switch (type) {
      case 'PUBLIC':
        return 'text-green-400';
      case 'SHARED':
        return 'text-blue-400';
      default:
        return 'text-white/60';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Playlist Manager</h2>
          <p className="text-white/70">Create and manage your music collections</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/80 text-black font-medium">
              <Plus className="w-4 h-4 mr-2" />
              New Playlist
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-black/90 border-white/20 text-white">
            <DialogHeader>
              <DialogTitle>Create New Playlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white mb-2 block">Name</label>
                <Input
                  placeholder="My Awesome Playlist"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white mb-2 block">Description</label>
                <Textarea
                  placeholder="Describe your playlist..."
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                  rows={3}
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-white">Public Playlist</label>
                  <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-white">Collaborative</label>
                  <Switch checked={isCollaborative} onCheckedChange={setIsCollaborative} />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreatePlaylist}
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary/80 text-black"
                >
                  {isLoading ? 'Creating...' : 'Create Playlist'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* User Playlists */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">My Playlists</h3>
        {userPlaylists.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Music className="w-12 h-12 mx-auto mb-4 text-white/30" />
            <p className="text-white/70 mb-4">No playlists yet</p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              variant="outline"
              className="text-white border-white/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Playlist
            </Button>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userPlaylists.map((playlist) => (
              <GlassCard 
                key={playlist.id} 
                className="p-4 group hover:scale-105 transition-transform cursor-pointer"
                onClick={() => onPlaylistSelect?.(playlist)}
              >
                <div className="relative mb-4">
                  <div className="w-full h-32 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                    {playlist.coverImageHash ? (
                      <img 
                        src={`https://ipfs.io/ipfs/${playlist.coverImageHash}`}
                        alt={playlist.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Music className="w-8 h-8 text-white/60" />
                    )}
                  </div>
                  <div className="absolute top-2 left-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPlaylistTypeColor(playlist.type)}`}
                    >
                      {getPlaylistTypeIcon(playlist.type)}
                      <span className="ml-1">{playlist.type}</span>
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-white truncate">{playlist.name}</h4>
                  <p className="text-sm text-white/70 line-clamp-2">
                    {playlist.description || 'No description'}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>{playlist.trackIds.length} tracks</span>
                    <span>{formatDuration(playlist.totalDuration)}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-1">
                      <Button size="sm" variant="ghost" className="p-1 text-white/70 hover:text-white">
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="p-1 text-white/70 hover:text-white">
                        <Heart className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="p-1 text-white/70 hover:text-white">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Button size="sm" variant="ghost" className="p-1 text-white/70 hover:text-white">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="p-1 text-white/70 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Public Playlists */}
      {publicPlaylists.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Discover Playlists</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicPlaylists.map((playlist) => (
              <GlassCard 
                key={playlist.id} 
                className="p-4 group hover:scale-105 transition-transform cursor-pointer"
                onClick={() => onPlaylistSelect?.(playlist)}
              >
                <div className="relative mb-4">
                  <div className="w-full h-32 bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-lg flex items-center justify-center">
                    {playlist.coverImageHash ? (
                      <img 
                        src={`https://ipfs.io/ipfs/${playlist.coverImageHash}`}
                        alt={playlist.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Music className="w-8 h-8 text-white/60" />
                    )}
                  </div>
                  <div className="absolute top-2 left-2">
                    <Badge variant="outline" className="text-xs text-green-400">
                      <Globe className="w-3 h-3 mr-1" />
                      PUBLIC
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-white truncate">{playlist.name}</h4>
                  <p className="text-sm text-white/70 line-clamp-2">
                    {playlist.description || 'No description'}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>{playlist.trackIds.length} tracks</span>
                    <span>{playlist.followerCount} followers</span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-1">
                      <Button size="sm" variant="ghost" className="p-1 text-white/70 hover:text-white">
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="p-1 text-white/70 hover:text-white">
                        <Heart className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="p-1 text-white/70 hover:text-white">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <Button size="sm" variant="outline" className="text-xs">
                      Follow
                    </Button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};