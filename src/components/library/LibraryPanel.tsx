import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, MoreHorizontal, Download, Share, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface Song {
  id: string;
  title: string;
  artist: string;
  description: string;
  duration: string;
  coverUrl: string;
  isPlaying: boolean;
  tags: string[];
  price?: string;
}

export const LibraryPanel = () => {
  const [songs] = useState<Song[]>([
    {
      id: "1",
      title: "Jazz Night",
      artist: "AI Generated",
      description: "This piece is an instrumental rock track with a driving tempo. The primary instruments are",
      duration: "0:30",
      coverUrl: "/placeholder.svg",
      isPlaying: false,
      tags: ["jazz", "instrumental", "smooth"],
      price: "Free"
    },
    {
      id: "2", 
      title: "Jazz Night",
      artist: "AI Generated",
      description: "This piece is an instrumental rock track with a driving tempo. The primary instruments are",
      duration: "0:30",
      coverUrl: "/placeholder.svg",
      isPlaying: false,
      tags: ["jazz", "instrumental", "smooth"],
      price: "Free"
    },
    {
      id: "3",
      title: "Jazz Night", 
      artist: "AI Generated",
      description: "This piece is an instrumental rock track with a driving tempo. The primary instruments are",
      duration: "0:30",
      coverUrl: "/placeholder.svg",
      isPlaying: false,
      tags: ["jazz", "instrumental", "smooth"],
      price: "Free"
    },
    {
      id: "4",
      title: "Jazz Night",
      artist: "AI Generated", 
      description: "This piece is an instrumental rock track with a driving tempo. The primary instruments are",
      duration: "0:30",
      coverUrl: "/placeholder.svg",
      isPlaying: false,
      tags: ["jazz", "instrumental", "smooth"],
      price: "Free"
    },
    {
      id: "5",
      title: "Jazz Night",
      artist: "AI Generated",
      description: "This piece is an instrumental rock track with a driving tempo. The primary instruments are", 
      duration: "0:30",
      coverUrl: "/placeholder.svg",
      isPlaying: false,
      tags: ["jazz", "instrumental", "smooth"],
      price: "Free"
    },
    {
      id: "6",
      title: "Jazz Night",
      artist: "AI Generated",
      description: "This piece is an instrumental rock track with a driving tempo. The primary instruments are",
      duration: "0:30", 
      coverUrl: "/placeholder.svg",
      isPlaying: false,
      tags: ["jazz", "instrumental", "smooth"],
      price: "Free"
    }
  ]);

  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);

  const togglePlay = (songId: string) => {
    setCurrentPlaying(currentPlaying === songId ? null : songId);
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">My Library Song</h2>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {songs.map((song) => (
          <div key={song.id} className="group">
            <GlassCard className="p-4 hover:bg-glass/90 transition-all cursor-pointer">
              <div className="flex items-center space-x-4">
                {/* Album Cover */}
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gradient-secondary flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
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
                    {song.description}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      {song.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>{song.duration}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          song.price === "Free" 
                            ? "text-primary border-primary/50" 
                            : "text-accent border-accent/50"
                        )}
                      >
                        {song.price}
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
                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};