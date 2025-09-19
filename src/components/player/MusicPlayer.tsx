import { useState, useRef, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { VolumeSlider } from "@/components/ui/volume-slider";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Repeat, 
  Shuffle, 
  Volume2, 
  VolumeX, 
  Heart,
  Share2,
  MoreHorizontal,
  Maximize2,
  AlertCircle,
  ChevronUp
} from "lucide-react";
import { GeneratedMusic } from "@/types/music";
import { cn } from "@/lib/utils";
import { AudioVisualizer } from "@/components/ui/audio-visualizer-new";
import { AudioVisualizerBackground } from "@/components/ui/audio-visualizer-background";
import { AudioContextProvider } from "@/hooks/useAudioContext";

interface MusicPlayerProps {
  currentSong?: GeneratedMusic;
  playlist?: GeneratedMusic[];
  currentIndex?: number;
  onNext?: () => void;
  onPrevious?: () => void;
  onSongChange?: (song: GeneratedMusic, index: number) => void;
  onPlayingChange?: (isPlaying: boolean) => void;
  onStopAudio?: () => void;
  className?: string;
}

export const MusicPlayer = ({ 
  currentSong = null, 
  playlist = [], 
  currentIndex = 0,
  onNext,
  onPrevious,
  onSongChange,
  onPlayingChange,
  onStopAudio,
  className 
}: MusicPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isLiked, setIsLiked] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0); // 0: off, 1: all, 2: one
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [shuffledPlaylist, setShuffledPlaylist] = useState<number[]>([]);
  const [originalIndex, setOriginalIndex] = useState(0);
  
  // New state for Dynamic Island functionality
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [autoCollapseTimer, setAutoCollapseTimer] = useState<NodeJS.Timeout | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFirstCollapse, setIsFirstCollapse] = useState(true); // Track first collapse
  const [autoCollapseStage, setAutoCollapseStage] = useState<'idle' | 'warning' | 'collapsing'>('idle'); // Animation stages
  const [warningTimer, setWarningTimer] = useState<NodeJS.Timeout | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  // New state for drag functionality
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: -1, y: -1 }); // Use -1 as initial state indicator
  const dragRef = useRef<HTMLDivElement>(null);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Auto-collapse functionality
  useEffect(() => {
    // Clear existing timer
    if (autoCollapseTimer) {
      clearTimeout(autoCollapseTimer);
    }

    // Set timer to auto-collapse after 10 seconds of inactivity (when playing)
    if (isPlaying && !isCollapsed) {
      const timer = setTimeout(() => {
        setIsCollapsed(true);
      }, 10000);
      setAutoCollapseTimer(timer);
    }

    return () => {
      if (autoCollapseTimer) {
        clearTimeout(autoCollapseTimer);
      }
    };
  }, [isPlaying, isCollapsed]);

  // Reset auto-collapse timer on user interaction
  const resetAutoCollapseTimer = () => {
    if (autoCollapseTimer) {
      clearTimeout(autoCollapseTimer);
    }
    
    if (isPlaying) {
      const timer = setTimeout(() => {
        setIsCollapsed(true);
      }, 10000);
      setAutoCollapseTimer(timer);
    }
  };

  // Toggle collapsed state with smooth transition
  const toggleCollapsed = () => {
    setIsTransitioning(true);
    setIsCollapsed(!isCollapsed);
    resetAutoCollapseTimer();
    
    // Haptic feedback on mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    // Reset transition state after animation completes
    const duration = prefersReducedMotion ? 200 : 800;
    setTimeout(() => {
      setIsTransitioning(false);
    }, duration);
  };

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isCollapsed) return; // Only allow dragging in collapsed mode
    
    setIsDragging(true);
    const rect = dragRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !isCollapsed) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Constrain to viewport bounds, keeping it in bottom area only
    const maxX = window.innerWidth - (dragRef.current?.offsetWidth || 320);
    const maxY = window.innerHeight - (dragRef.current?.offsetHeight || 64);
    const minY = window.innerHeight - 200; // Adjusted to allow more movement while staying in bottom area
    
    setPosition({
      x: Math.max(0, Math.min(maxX, newX)),
      y: Math.max(minY, Math.min(maxY, newY)) // Constrain to bottom area only
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Touch events for mobile support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isCollapsed) return;
    
    setIsDragging(true);
    const touch = e.touches[0];
    const rect = dragRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      });
    }
    e.preventDefault();
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !isCollapsed) return;
    
    const touch = e.touches[0];
    const newX = touch.clientX - dragOffset.x;
    const newY = touch.clientY - dragOffset.y;
    
    const maxX = window.innerWidth - (dragRef.current?.offsetWidth || 320);
    const maxY = window.innerHeight - (dragRef.current?.offsetHeight || 64);
    const minY = window.innerHeight - 200; // Adjusted to match mouse handling
    
    setPosition({
      x: Math.max(0, Math.min(maxX, newX)),
      y: Math.max(minY, Math.min(maxY, newY)) // Constrain to bottom area only
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Touch event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragOffset]);

  // Reset position when expanding/collapsing
  useEffect(() => {
    setIsTransitioning(true);
    
    if (!isCollapsed) {
      // When expanding, reset position indicator immediately
      setPosition({ x: -1, y: -1 }); // Reset to initial state indicator
      setIsFirstCollapse(true); // Reset first collapse flag
    } else if (isCollapsed) {
      if (isFirstCollapse || (position.x === -1 && position.y === -1)) {
        // When collapsing for the first time, set position immediately without transition
        const defaultX = (window.innerWidth - 320) / 2; // Center horizontally
        const defaultY = window.innerHeight - 80; // Aligned with bottom-4 spacing (16px + height)
        
        setPosition({ 
          x: Math.max(20, Math.min(window.innerWidth - 340, defaultX)), 
          y: Math.max(window.innerHeight - 200, defaultY) 
        });
        setIsFirstCollapse(false);
      }
    }
    
    // Reset transitioning state after animation completes
    const duration = prefersReducedMotion ? 200 : 800;
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, duration);
    
    return () => clearTimeout(timer);
  }, [isCollapsed, isFirstCollapse]);

  // Update audio source when currentSong changes
  useEffect(() => {
    if (audioRef.current && currentSong?.audioUrl) {
      // Debug: Log current song details
      console.log('🎵 MusicPlayer: Loading song:', {
        title: currentSong.title,
        audioUrl: currentSong.audioUrl,
        imageUrl: currentSong.imageUrl,
        originalAudioUrl: currentSong.originalAudioUrl,
        originalImageUrl: currentSong.originalImageUrl
      });
      
      // Loading audio
      // Song details
      
      // Check if URL is valid
      if (!currentSong.audioUrl || currentSong.audioUrl === '' || currentSong.audioUrl === 'undefined') {
        // Invalid audio URL
        console.error('❌ MusicPlayer: Invalid audio URL provided:', currentSong.audioUrl);
        setAudioError('Invalid audio URL provided');
        setIsLoading(false);
        return;
      }
      
      // Validate URL format
      try {
        new URL(currentSong.audioUrl);
        console.log('✅ MusicPlayer: Valid audio URL format:', currentSong.audioUrl);
        // Valid audio URL format
      } catch (urlError) {
        // Invalid URL format
        console.error('❌ MusicPlayer: Invalid audio URL format:', currentSong.audioUrl, urlError);
        setAudioError('Invalid audio URL format');
        setIsLoading(false);
        return;
      }
      
      const audio = audioRef.current;
      audio.src = currentSong.audioUrl;
      // Setting audio src to
      setIsLoading(true); // Show loading when starting to load new song
      audio.load();
      // Called audio.load()
      
      // Set up event listeners for this audio source
      const handleCanPlay = async () => {
        try {
          // Audio ready, attempting to play...
          // Audio duration
          // Audio readyState
          setIsLoading(false);
          setAudioError(null); // Clear any previous errors
          
          // Try to play - this will work if user has interacted with the page
          const playPromise = audio.play();
          
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                // Auto-play successful
                setIsPlaying(true);
              })
              .catch((error) => {
                // Auto-play failed, waiting for user interaction
                // Don't set error here, just wait for user to click play
                setIsPlaying(false);
                setIsLoading(false);
              });
          }
        } catch (error) {
          console.error('❌ Audio setup error:', error);
          setIsPlaying(false);
          setIsLoading(false);
          setAudioError(`Audio setup failed: ${error.message}`);
        }
        audio.removeEventListener('canplay', handleCanPlay);
      };
      
      audio.addEventListener('canplay', handleCanPlay);
      
      // Add error handling
      const handleError = (e: Event) => {
        console.error('❌ Audio loading error:', e);
        const target = e.target as HTMLAudioElement;
        if (target && target.error) {
          console.error('❌ Audio error code:', target.error.code);
          console.error('❌ Audio error message:', target.error.message);
          
          // Try fallback URL if this is an IPFS URL and we have original URL
          if (currentSong.audioUrl.includes('gateway.pinata.cloud') && currentSong.originalAudioUrl && currentSong.originalAudioUrl !== currentSong.audioUrl) {
            // Trying original audio URL as fallback...
            target.src = currentSong.originalAudioUrl;
            target.load();
            return;
          }
          
          setAudioError(`Audio loading failed: ${target.error.message || 'Unknown error'}`);
        } else {
          setAudioError('Audio loading failed');
        }
        setIsLoading(false);
        setIsPlaying(false);
      };
      
      audio.addEventListener('error', handleError);
      
      // Cleanup listeners if component unmounts or song changes
      return () => {
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('error', handleError);
      };
    }
  }, [currentSong?.audioUrl]);

  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadStart = () => {
      // Audio loading started
      setIsLoading(true);
    };
    
    const handleCanPlay = () => {
      // Audio can play
      setIsLoading(false);
      setAudioError(null); // Clear any previous errors
    };
    
    const handleLoadedMetadata = () => {
      // Audio metadata loaded, duration
      setDuration(audio.duration);
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const handleEnded = () => {
      // Audio ended, repeat mode
      if (repeatMode === 2) {
        // Repeat one song
        // Repeating current song
        audio.currentTime = 0;
        audio.play().catch(console.error);
      } else {
        // Check if there's a next song or if we should repeat all
        let hasNext = false;
        
        if (isShuffled && shuffledPlaylist.length > 1) {
          const currentShuffledIndex = shuffledPlaylist.indexOf(currentIndex);
          hasNext = currentShuffledIndex < shuffledPlaylist.length - 1 || repeatMode === 1;
        } else {
          hasNext = currentIndex < playlist.length - 1 || repeatMode === 1;
        }
        
        if (hasNext) {
          // Moving to next song
          handleNext();
        } else {
          // End of playlist
          setIsPlaying(false);
        }
      }
    };

    const handleError = (e: any) => {
      console.error('❌ Audio error:', e);
      const audio = e.target as HTMLAudioElement;
      let errorMsg = 'Unknown audio error';
      
      if (audio?.error) {
        switch (audio.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMsg = 'Audio playback was aborted';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMsg = 'Network error while loading audio';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMsg = 'Audio decoding error';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMsg = 'Audio format not supported';
            break;
          default:
            errorMsg = `Audio error: ${audio.error.message || 'Unknown error'}`;
        }
      }
      
      setAudioError(errorMsg);
      setIsLoading(false);
      setIsPlaying(false);
    };

    const handleLoadedData = () => {
      // Audio data loaded
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [repeatMode, currentIndex, playlist.length, isShuffled, shuffledPlaylist]);

  // Volume control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Notify parent when playing state changes
  useEffect(() => {
    if (onPlayingChange) {
      onPlayingChange(isPlaying);
    }
  }, [isPlaying, onPlayingChange]);

  // Stop audio when onStopAudio is called
  useEffect(() => {
    if (onStopAudio) {
      const stopAudio = () => {
        if (audioRef.current && isPlaying) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setIsPlaying(false);
          setIsLoading(false);
          setAudioError(null);
        }
      };
      
      // Call stopAudio immediately when onStopAudio is provided
      stopAudio();
    }
  }, [onStopAudio, isPlaying]);

  const togglePlay = async () => {
    if (!audioRef.current || !currentSong) {
      console.warn('⚠️ No audio element or current song');
      return;
    }

    // Reset auto-collapse timer and expand player when user interacts
    resetAutoCollapseTimer();
    setIsCollapsed(false);

    const audio = audioRef.current;
    // Toggle play - Current state

    try {
      if (isPlaying) {
        // Pausing audio
        await audio.pause();
        setIsPlaying(false);
      } else {
        // Playing audio
        
        // Check if audio is ready
        if (audio.readyState < 2) {
          // Audio not ready, waiting...
          setIsLoading(true);
          
          // Wait for audio to be ready
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Audio load timeout')), 10000);
            
            const onCanPlay = () => {
              clearTimeout(timeout);
              audio.removeEventListener('canplay', onCanPlay);
              audio.removeEventListener('error', onError);
              resolve(true);
            };
            
            const onError = (e: any) => {
              clearTimeout(timeout);
              audio.removeEventListener('canplay', onCanPlay);
              audio.removeEventListener('error', onError);
              reject(e);
            };
            
            audio.addEventListener('canplay', onCanPlay);
            audio.addEventListener('error', onError);
          });
          
          setIsLoading(false);
        }
        
        // Try to play with user interaction
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          await playPromise;
          setIsPlaying(true);
          setAudioError(null); // Clear any previous errors
          // Audio playing successfully
        }
      }
    } catch (error) {
      console.error('❌ Audio playback error:', error);
      setIsPlaying(false);
      setIsLoading(false);
      
      // Provide user-friendly error message
      if (error.name === 'NotAllowedError') {
        setAudioError('Playback blocked by browser. Please interact with the page first.');
      } else if (error.name === 'NotSupportedError') {
        setAudioError('Audio format not supported by this browser.');
      } else {
        setAudioError(`Playback failed: ${error.message}`);
      }
      
      // Try to reload audio source if it's a network error
      if (currentSong?.audioUrl && (error.name === 'NetworkError' || error.name === 'MediaError')) {
        // Retrying with fresh audio source
        setTimeout(() => {
          if (audioRef.current && currentSong?.audioUrl) {
            audioRef.current.src = currentSong.audioUrl;
            audioRef.current.load();
          }
        }, 2000);
      }
    }
  };

  // Create shuffled playlist when shuffle is enabled
  useEffect(() => {
    if (isShuffled && playlist.length > 1) {
      const indices = Array.from({ length: playlist.length }, (_, i) => i);
      // Remove current index from shuffle
      const availableIndices = indices.filter(i => i !== currentIndex);
      
      // Shuffle the available indices
      for (let i = availableIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableIndices[i], availableIndices[j]] = [availableIndices[j], availableIndices[i]];
      }
      
      // Add current song at the beginning
      setShuffledPlaylist([currentIndex, ...availableIndices]);
      setOriginalIndex(currentIndex);
    } else {
      setShuffledPlaylist([]);
    }
  }, [isShuffled, playlist.length]);

  const handleNext = () => {
    if (!playlist.length) return;

    // Reset auto-collapse timer on interaction
    resetAutoCollapseTimer();
    setIsCollapsed(false);

    let nextIndex = currentIndex;

    if (isShuffled && shuffledPlaylist.length > 1) {
      // Find current position in shuffled playlist
      const currentShuffledIndex = shuffledPlaylist.indexOf(currentIndex);
      
      if (currentShuffledIndex < shuffledPlaylist.length - 1) {
        // Move to next in shuffled playlist
        nextIndex = shuffledPlaylist[currentShuffledIndex + 1];
      } else if (repeatMode === 1) {
        // Repeat all - go to first song in shuffled playlist
        nextIndex = shuffledPlaylist[0];
      } else {
        // End of shuffled playlist
        return;
      }
    } else {
      // Normal sequential mode
      if (currentIndex < playlist.length - 1) {
        nextIndex = currentIndex + 1;
      } else if (repeatMode === 1) {
        // Repeat all - go to first song
        nextIndex = 0;
      } else {
        // End of playlist
        return;
      }
    }

    const nextSong = playlist[nextIndex];
    if (nextSong && onSongChange) {
      onSongChange(nextSong, nextIndex);
    } else if (onNext) {
      onNext();
    }
  };

  const handlePrevious = () => {
    // Reset auto-collapse timer on interaction
    resetAutoCollapseTimer();
    setIsCollapsed(false);

    if (currentTime > 3) {
      // If more than 3 seconds played, restart current song
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      return;
    }

    if (!playlist.length) return;

    let prevIndex = currentIndex;

    if (isShuffled && shuffledPlaylist.length > 1) {
      // Find current position in shuffled playlist
      const currentShuffledIndex = shuffledPlaylist.indexOf(currentIndex);
      
      if (currentShuffledIndex > 0) {
        // Move to previous in shuffled playlist
        prevIndex = shuffledPlaylist[currentShuffledIndex - 1];
      } else if (repeatMode === 1) {
        // Repeat all - go to last song in shuffled playlist
        prevIndex = shuffledPlaylist[shuffledPlaylist.length - 1];
      } else {
        // Beginning of shuffled playlist
        return;
      }
    } else {
      // Normal sequential mode
      if (currentIndex > 0) {
        prevIndex = currentIndex - 1;
      } else if (repeatMode === 1) {
        // Repeat all - go to last song
        prevIndex = playlist.length - 1;
      } else {
        // Beginning of playlist
        return;
      }
    }

    const prevSong = playlist[prevIndex];
    if (prevSong && onSongChange) {
      onSongChange(prevSong, prevIndex);
    } else if (onPrevious) {
      onPrevious();
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    setIsMuted(false);
  };

  const retryAudioLoad = () => {
    if (!currentSong?.audioUrl || !audioRef.current) return;
    
    // Retrying audio load...
    setAudioError(null);
    setIsLoading(true);
    
    const audio = audioRef.current;
    audio.src = currentSong.audioUrl;
    audio.load();
  };

  const toggleRepeat = () => {
    setRepeatMode((prev) => (prev + 1) % 3);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AudioContextProvider audioRef={audioRef} isPlaying={isPlaying}>
      {/* Hidden audio element */}
      <audio 
        ref={audioRef} 
        preload="metadata"
        crossOrigin="anonymous"
        controls={false}
        style={{ display: 'none' }}
        onContextMenu={(e) => e.preventDefault()}
      />
      
      <div 
        ref={dragRef}
        className={cn(
          "shadow-2xl transform-gpu",
          isFirstCollapse && isCollapsed 
            ? "transition-none" // No transition on first collapse
            : prefersReducedMotion
              ? "transition-[width,height,border-radius,opacity,transform,box-shadow] duration-200 ease-linear"
              : "transition-[width,height,border-radius,opacity,transform,box-shadow] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "will-change-auto",
          isCollapsed 
            ? "fixed w-80 max-w-[90%] cursor-move" 
            : "fixed bottom-4 left-1/2 w-[96%] max-w-5xl -translate-x-1/2",
          "z-50",
          isDragging && "scale-[1.02] shadow-3xl transition-none",
          isTransitioning && "will-change-transform",
          className
        )}
        style={isCollapsed && position.x >= 0 && position.y >= 0 ? {
          left: `${position.x}px`,
          top: `${position.y}px`,
          transformOrigin: 'center bottom',
        } : isCollapsed ? {
          // Default position for collapsed state when no valid position is set - aligned with full mode bottom spacing
          left: `${Math.max(20, (window.innerWidth - 320) / 2)}px`,
          top: `${window.innerHeight - 80}px`, // Changed from 150px to 80px to match bottom-4 spacing
          transformOrigin: 'center bottom',
        } : {
          transformOrigin: 'center bottom',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onMouseEnter={() => {
          if (isCollapsed) {
            resetAutoCollapseTimer();
          }
        }}
        onMouseLeave={() => {
          if (!isCollapsed) {
            resetAutoCollapseTimer();
          }
        }}
      >
        <div className={cn(
          "relative bg-black/85 backdrop-blur-xl overflow-hidden border border-primary/20",
          prefersReducedMotion 
            ? "transition-[background-color,border-radius,opacity,backdrop-filter,height] duration-200 ease-linear transform-gpu"
            : "transition-[background-color,border-radius,opacity,backdrop-filter,height] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu",
          isCollapsed 
            ? "rounded-full h-16 opacity-100" 
            : "rounded-3xl opacity-100"
        )}>
          {/* Audio Visualizer Background - Full Coverage */}
          <AudioVisualizerBackground 
            isPlaying={isPlaying}
            className={cn(
              "absolute inset-0 z-0 w-full h-full pointer-events-none",
              prefersReducedMotion 
                ? "transition-[border-radius,opacity] duration-200 ease-linear"
                : "transition-[border-radius,opacity] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
              isCollapsed ? "rounded-full" : "rounded-3xl"
            )}
          />
          
          {/* Dynamic overlay for enhanced effect with more transparency */}
          <div className={cn(
            "absolute inset-0 z-1",
            prefersReducedMotion 
              ? "transition-[border-radius,background] duration-200 ease-linear"
              : "transition-[border-radius,background] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
            isCollapsed ? "rounded-full" : "rounded-3xl",
            isPlaying 
              ? "bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10" 
              : "bg-gradient-to-r from-gray-800/10 via-transparent to-gray-700/10"
          )} />
          
          {/* Collapsed State - Dynamic Island Style */}
          {isCollapsed && (
            <div className="relative z-10 h-16 px-4 flex items-center justify-between cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors duration-150 ease-out opacity-100">
              {/* Audio Visualizer Background for Collapsed State */}
              <div className="absolute inset-0 z-0 rounded-full overflow-hidden pointer-events-none">
                <AudioVisualizer 
                  isPlaying={isPlaying}
                  className={cn(
                    "w-full h-full opacity-30 pointer-events-none",
                    prefersReducedMotion 
                      ? "transition-opacity duration-200 ease-linear"
                      : "transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  )}
                />
              </div>
              
              <div 
                className="relative z-10 w-full flex items-center justify-between"
                onClick={(e) => {
                  if (!isDragging) {
                    toggleCollapsed();
                  }
                  e.stopPropagation();
                }}
              >
                {/* Left: Song info */}
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-primary/40 to-accent/40 flex-shrink-0 relative z-20">
                    {currentSong?.imageUrl ? (
                      <img 
                        src={currentSong.imageUrl} 
                        alt={currentSong?.title || "Song cover"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500/30 via-pink-500/30 to-blue-500/30" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 relative z-20">
                    <h3 className="font-medium text-white text-sm truncate">
                      {currentSong ? currentSong.title : "No song"}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {currentSong ? currentSong.artist : "Select a song"}
                    </p>
                  </div>
                </div>

                {/* Center: Spacer for visualizer */}
                <div className="flex-1" />

                {/* Right: Play button and expand */}
                <div className="flex items-center space-x-2 relative z-20">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-8 h-8 p-0 rounded-full transition-all duration-200 ease-out",
                      "bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500",
                      "hover:from-purple-400 hover:via-pink-400 hover:to-blue-400",
                      "hover:scale-110 hover:shadow-lg transform-gpu will-change-transform"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlay();
                    }}
                    disabled={isLoading || !currentSong?.audioUrl}
                  >
                    <div className="text-white">
                      {isLoading ? (
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Play className="w-3 h-3 ml-0.5" />
                      )}
                    </div>
                  </Button>
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          )}

          {/* Expanded State - Full Player */}
          {!isCollapsed && (
            <GlassCard className="relative z-10 mx-0 mb-0 rounded-3xl border-0 bg-gradient-to-r from-black/20 via-gray-900/15 to-black/20 backdrop-blur-sm opacity-100">
              {/* Audio Visualizer Background for Expanded State */}
              <div className="absolute inset-0 z-0 rounded-3xl overflow-hidden pointer-events-none">
                <AudioVisualizer 
                  isPlaying={isPlaying}
                  className={cn(
                    "w-full h-full opacity-20 pointer-events-none",
                    prefersReducedMotion 
                      ? "transition-opacity duration-200 ease-linear"
                      : "transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  )}
                />
              </div>
              
              <div className="relative z-10 px-4 py-3">
                <div className="grid grid-cols-12 gap-4 items-center relative z-10">
                {/* Left Section - Song Info */}
                <div className="col-span-4 lg:col-span-3 relative z-20">
                  <div className="flex items-center space-x-4 min-w-0">
                    {/* Album Cover */}
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-primary/40 to-accent/40 flex-shrink-0 group cursor-pointer">
                      {currentSong?.imageUrl ? (
                        <img 
                          src={currentSong.imageUrl} 
                          alt={currentSong?.title || "Song cover"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-pink-500/30 to-blue-500/30" />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Maximize2 className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    
                    {/* Song Details */}
                    <div className="min-w-0 flex-1 pr-2">
                      <h3 className="font-semibold text-white text-base mb-1 hover:underline cursor-pointer leading-tight">
                        {currentSong ? currentSong.title : "No song selected"}
                      </h3>
                      <p className="text-sm text-muted-foreground hover:underline cursor-pointer leading-tight">
                        {currentSong ? currentSong.artist : "Choose a song to play"}
                      </p>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "w-8 h-8 p-0 rounded-full transition-all duration-300 hover:scale-110 relative z-30",
                          isLiked 
                            ? "text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20" 
                            : "text-muted-foreground hover:text-white hover:bg-white/10"
                        )}
                        onClick={() => {
                          setIsLiked(!isLiked);
                          resetAutoCollapseTimer();
                        }}
                      >
                        <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Center Section - Player Controls */}
                <div className="col-span-4 lg:col-span-6 relative z-20">
                  <div className="flex flex-col items-center space-y-2">
                    {/* Control Buttons */}
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "w-8 h-8 p-0 rounded-full transition-all duration-300 hover:scale-110 relative z-30",
                          isShuffled 
                            ? "text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20" 
                            : "text-muted-foreground hover:text-white hover:bg-white/10"
                        )}
                        onClick={() => {
                          setIsShuffled(!isShuffled);
                          resetAutoCollapseTimer();
                        }}
                        title={isShuffled ? "Disable shuffle" : "Enable shuffle"}
                      >
                        <Shuffle className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0 rounded-full text-muted-foreground hover:text-white hover:bg-white/10 transition-all duration-300 hover:scale-110 relative z-30"
                        onClick={handlePrevious}
                        disabled={!playlist.length}
                        title="Previous"
                      >
                        <SkipBack className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="lg"
                        className={cn(
                          "w-10 h-10 p-0 rounded-full transition-all duration-300 shadow-lg group relative z-30",
                          "bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500",
                          "hover:from-purple-400 hover:via-pink-400 hover:to-blue-400",
                          "hover:scale-110 hover:shadow-xl hover:shadow-purple-500/25",
                          "active:scale-95"
                        )}
                        onClick={togglePlay}
                        disabled={isLoading || !currentSong?.audioUrl}
                        title={isPlaying ? "Pause" : currentSong ? "Play" : "No song selected"}
                      >
                        {/* Glow effect */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 opacity-20 blur-md group-hover:opacity-40 transition-opacity duration-300" />
                        
                        {/* Icon container */}
                        <div className="relative z-10 text-white">
                          {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : isPlaying ? (
                            <Pause className="w-5 h-5" />
                          ) : currentSong ? (
                            <Play className="w-5 h-5 ml-0.5" />
                          ) : (
                            <div className="w-5 h-5 flex items-center justify-center">
                              <div className="w-3 h-3 bg-white/50 rounded-full" />
                            </div>
                          )}
                        </div>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0 rounded-full text-muted-foreground hover:text-white hover:bg-white/10 transition-all duration-300 hover:scale-110 relative z-30"
                        onClick={handleNext}
                        disabled={!playlist.length}
                        title="Next"
                      >
                        <SkipForward className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "w-8 h-8 p-0 rounded-full transition-all duration-300 hover:scale-110 relative z-30",
                          repeatMode > 0 
                            ? "text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20" 
                            : "text-muted-foreground hover:text-white hover:bg-white/10"
                        )}
                        onClick={() => {
                          toggleRepeat();
                          resetAutoCollapseTimer();
                        }}
                        title={
                          repeatMode === 0 ? "Enable repeat" :
                          repeatMode === 1 ? "Repeat all" : "Repeat one"
                        }
                      >
                        <Repeat className="w-4 h-4" />
                        {repeatMode === 1 && (
                          <span className="absolute -top-1 -right-1 text-[8px] font-bold text-green-400 bg-black/80 rounded-full w-3 h-3 flex items-center justify-center">
                            ∞
                          </span>
                        )}
                        {repeatMode === 2 && (
                          <span className="absolute -top-1 -right-1 text-[8px] font-bold text-green-400 bg-black/80 rounded-full w-3 h-3 flex items-center justify-center">
                            1
                          </span>
                        )}
                      </Button>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="flex items-center space-x-3 w-full max-w-lg relative z-20">
                      <span className="text-xs text-gray-400 min-w-[35px] text-right font-mono">
                        {formatTime(currentTime)}
                      </span>
                      <div className="flex-1 relative group">
                        <Slider
                          value={[currentTime]}
                          max={duration || 100}
                          step={1}
                          className="flex-1"
                          onValueChange={(value) => {
                            handleSeek(value);
                            resetAutoCollapseTimer();
                          }}
                          disabled={!duration}
                        />
                      </div>
                      <span className="text-xs text-gray-400 min-w-[35px] font-mono">
                        {formatTime(duration)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Section - Volume & Options */}
                <div className="col-span-4 lg:col-span-3 relative z-20">
                  <div className="flex items-center justify-end space-x-2">
                    {/* Error Display */}
                    {audioError && (
                      <div className="flex items-center space-x-2 text-red-400 bg-red-500/10 px-3 py-2 rounded-lg relative z-30">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm flex-1">{audioError}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-8 h-8 p-0 rounded-full text-red-400 hover:text-white hover:bg-red-500/20 relative z-30"
                          onClick={() => {
                            retryAudioLoad();
                            resetAutoCollapseTimer();
                          }}
                          title="Retry loading audio"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </Button>
                      </div>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-8 h-8 p-0 rounded-full text-muted-foreground hover:text-white hover:bg-white/10 transition-all duration-300 hover:scale-110 relative z-30"
                      title="Share"
                      onClick={resetAutoCollapseTimer}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    
                    <div className="flex items-center space-x-2 min-w-[120px] relative z-30">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0 rounded-full text-muted-foreground hover:text-white hover:bg-white/10 transition-all duration-300 hover:scale-110"
                        onClick={() => {
                          toggleMute();
                          resetAutoCollapseTimer();
                        }}
                        title={isMuted ? "Unmute" : "Mute"}
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </Button>
                      <VolumeSlider
                        value={[isMuted ? 0 : volume * 100]}
                        max={100}
                        step={1}
                        className="w-20"
                        onValueChange={(value) => {
                          handleVolumeChange([value[0] / 100]);
                          resetAutoCollapseTimer();
                        }}
                      />
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-8 h-8 p-0 rounded-full text-muted-foreground hover:text-white hover:bg-white/10 transition-all duration-300 hover:scale-110 relative z-30"
                      title="More options"
                      onClick={resetAutoCollapseTimer}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </AudioContextProvider>
  );
};
