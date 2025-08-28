import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, List, Maximize2 } from "lucide-react";

export const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState([149]);
  const [volume, setVolume] = useState([80]);
  
  const currentSong = {
    title: "Jazz Night",
    artist: "by edisonasom",
    coverUrl: "/placeholder.svg",
    duration: "3:37"
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <GlassCard className="mx-4 mb-4 p-4 bg-glass/95 backdrop-blur-xl border-glass-border/50">
        <div className="flex items-center justify-between">
          {/* Song Info */}
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-secondary flex-shrink-0">
              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30" />
            </div>
            <div className="min-w-0">
              <h4 className="font-medium truncate">{currentSong.title}</h4>
              <p className="text-sm text-muted-foreground truncate">{currentSong.artist}</p>
            </div>
          </div>

          {/* Player Controls */}
          <div className="flex flex-col items-center space-y-2 flex-2 max-w-md">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                <Shuffle className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button
                variant="default"
                size="sm"
                className="w-10 h-10 rounded-full bg-gradient-primary hover:bg-gradient-primary/90"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </Button>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                <SkipForward className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                <Repeat className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Progress Bar */}
            <div className="flex items-center space-x-2 w-full">
              <span className="text-xs text-muted-foreground">2:49</span>
              <Slider
                value={currentTime}
                onValueChange={setCurrentTime}
                max={217}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground">{currentSong.duration}</span>
            </div>
          </div>

          {/* Volume & Actions */}
          <div className="flex items-center space-x-2 min-w-0 flex-1 justify-end">
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
              <List className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
              <Maximize2 className="w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={volume}
                onValueChange={setVolume}
                max={100}
                step={1}
                className="w-20"
              />
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};