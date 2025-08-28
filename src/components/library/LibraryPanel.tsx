import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, MoreHorizontal, Download, Share, Heart, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGeneratedMusic } from "@/hooks/useGeneratedMusic";

export const LibraryPanel = () => {
  const { generatedMusic, clearGeneratedMusic } = useGeneratedMusic();
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);

  const togglePlay = (songId: string) => {
    setCurrentPlaying(currentPlaying === songId ? null : songId);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const openIPFS = (hash?: string) => {
    if (hash) {
      window.open(`https://gateway.pinata.cloud/ipfs/${hash}`, '_blank');
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">My Library Song</h2>
        <div className="flex gap-2">
          {generatedMusic.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearGeneratedMusic}
            >
              Clear All
            </Button>
          )}
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {generatedMusic.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">No songs generated yet</p>
            <p className="text-sm">Use the Generate tab to create your first AI song</p>
          </div>
        ) : (
          generatedMusic.map((song) => (
            <div key={song.id} className="group">
              <GlassCard className="p-4 hover:bg-glass/90 transition-all cursor-pointer">
                <div className="flex items-center space-x-4">
                  {/* Album Cover */}
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gradient-secondary flex-shrink-0">
                    <img 
                      src={song.imageUrl} 
                      alt={song.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0 bg-black/50 hover:bg-black/70 text-white"
                        onClick={() => togglePlay(song.id)}
                      >
                        {currentPlaying === song.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Song Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium truncate">{song.title}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {song.metadata?.description || `Generated with ${song.metadata?.model_used || 'AI'}`}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2">
                        {song.genre.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {song.ipfsHash && (
                          <Badge variant="outline" className="text-xs text-green-400 border-green-400/50">
                            IPFS
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>{formatDuration(song.duration)}</span>
                        <Badge
                          variant="outline"
                          className="text-xs text-primary border-primary/50"
                        >
                          Free
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                      <Share className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-8 h-8 p-0"
                      onClick={() => window.open(song.audioUrl, '_blank')}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {song.ipfsHash && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-8 h-8 p-0"
                        onClick={() => openIPFS(song.ipfsHash)}
                        title="View on IPFS"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </GlassCard>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
};