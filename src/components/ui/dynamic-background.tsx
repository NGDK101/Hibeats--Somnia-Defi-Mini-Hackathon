import { useEffect, useState } from "react";
import { GeneratedMusic } from "@/types/music";

interface DynamicBackgroundProps {
  currentSong?: GeneratedMusic;
  isPlaying: boolean;
}

export const DynamicBackground = ({ currentSong, isPlaying }: DynamicBackgroundProps) => {
  const [dominantColors, setDominantColors] = useState({
    primary: "#1a1a1a",
    secondary: "#2a2a2a", 
    accent: "#3a3a3a"
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  // Extract dominant colors from image
  const extractColorsFromImage = async (imageUrl: string) => {
    return new Promise<{primary: string, secondary: string, accent: string}>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            resolve({ primary: "#1a1a1a", secondary: "#2a2a2a", accent: "#3a3a3a" });
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Sample colors from different regions
          const colors: {r: number, g: number, b: number}[] = [];
          const step = 4;
          
          for (let i = 0; i < data.length; i += step * 4) {
            colors.push({
              r: data[i],
              g: data[i + 1],
              b: data[i + 2]
            });
          }

          // Get dominant colors
          const sortedColors = colors
            .filter(color => {
              // Filter out very dark or very light colors
              const brightness = (color.r + color.g + color.b) / 3;
              return brightness > 30 && brightness < 220;
            })
            .sort((a, b) => {
              // Sort by color intensity
              const aIntensity = Math.max(a.r, a.g, a.b) - Math.min(a.r, a.g, a.b);
              const bIntensity = Math.max(b.r, b.g, b.b) - Math.min(b.r, b.g, b.b);
              return bIntensity - aIntensity;
            });

          if (sortedColors.length >= 3) {
            const primary = sortedColors[0];
            const secondary = sortedColors[Math.floor(sortedColors.length / 3)];
            const accent = sortedColors[Math.floor(sortedColors.length * 2 / 3)];
            
            resolve({
              primary: `rgb(${primary.r}, ${primary.g}, ${primary.b})`,
              secondary: `rgb(${secondary.r}, ${secondary.g}, ${secondary.b})`,
              accent: `rgb(${accent.r}, ${accent.g}, ${accent.b})`
            });
          } else {
            // Fallback colors
            resolve({ primary: "#4a1a4a", secondary: "#2a2a4a", accent: "#1a4a2a" });
          }
        } catch (error) {
          resolve({ primary: "#1a1a1a", secondary: "#2a2a2a", accent: "#3a3a3a" });
        }
      };

      img.onerror = () => {
        resolve({ primary: "#1a1a1a", secondary: "#2a2a2a", accent: "#3a3a3a" });
      };

      img.src = imageUrl;
    });
  };

  useEffect(() => {
    if (currentSong?.imageUrl) {
      setIsLoaded(false);
      
      const img = new Image();
      img.onload = () => {
        setBackgroundImage(currentSong.imageUrl);
        
        extractColorsFromImage(currentSong.imageUrl).then((colors) => {
          setDominantColors(colors);
          setIsLoaded(true);
        });
      };
      img.onerror = () => {
        setIsLoaded(false);
      };
      img.src = currentSong.imageUrl;
    } else {
      setDominantColors({ primary: "#1a1a1a", secondary: "#2a2a2a", accent: "#3a3a3a" });
      setBackgroundImage(null);
      setIsLoaded(false);
    }
  }, [currentSong?.imageUrl, isPlaying]);

  return (
    <>
      {/* Main Background Image from Song */}
      {currentSong?.imageUrl && (
        <div 
          className="fixed inset-0 transition-all duration-1000 ease-in-out"
          style={{
            backgroundImage: `url(${currentSong.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: isPlaying 
              ? 'blur(40px) brightness(0.4) saturate(1.3) contrast(1.1)' 
              : 'blur(30px) brightness(0.3) saturate(1.2)',
            transform: isPlaying ? 'scale(1.15)' : 'scale(1.1)',
            zIndex: -50
          }}
        />
      )}
      
      {/* Enhanced blur overlay for current playing song */}
      {backgroundImage && (
        <div 
          className={`fixed inset-0 transition-all duration-3000 ease-in-out ${
            isLoaded ? 'opacity-100' : 'opacity-70'
          }`}
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: `blur(${isPlaying ? '50px' : '40px'}) brightness(${isPlaying ? '0.4' : '0.3'}) saturate(1.3) contrast(1.1)`,
            transform: isPlaying ? 'scale(1.15)' : 'scale(1.05)',
            transition: 'all 3s ease-in-out, opacity 1s ease-in-out',
            zIndex: -30
          }}
        />
      )}
      
      {/* Gradient Overlays based on extracted colors */}
      <div 
        className={`fixed inset-0 transition-all duration-3000 ease-in-out ${
          isLoaded ? 'opacity-60' : 'opacity-40'
        }`}
        style={{
          background: currentSong && isLoaded ? `
            radial-gradient(ellipse at top left, ${dominantColors.primary}40 0%, transparent 60%),
            radial-gradient(ellipse at top right, ${dominantColors.secondary}30 0%, transparent 55%),
            radial-gradient(ellipse at bottom left, ${dominantColors.accent}35 0%, transparent 75%),
            radial-gradient(ellipse at bottom right, ${dominantColors.primary}25 0%, transparent 65%),
            linear-gradient(135deg, ${dominantColors.secondary}20 0%, ${dominantColors.primary}15 50%, ${dominantColors.accent}10 100%)
          ` : 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
          zIndex: -20
        }}
      />
      
      {/* Main dynamic background */}
      <div 
        className="fixed inset-0 transition-all duration-2000 ease-in-out bg-black/20"
        style={{ zIndex: -10 }}
      />

      {/* Song info overlay (subtle) */}
      {currentSong && isLoaded && (
        <div 
          className="fixed bottom-32 left-8 opacity-20 pointer-events-none"
          style={{ zIndex: -5 }}
        >
          <h1 className="text-6xl font-bold text-white/40 mb-2 max-w-2xl truncate">
            {currentSong.title}
          </h1>
          <p className="text-2xl text-white/30 max-w-xl truncate">
            {currentSong.artist}
          </p>
        </div>
      )}
      
      {/* Animated particles/visualizer when playing */}
      {isPlaying && currentSong && isLoaded && (
        <>
          {/* Floating particles */}
          <div 
            className="fixed inset-0 overflow-hidden pointer-events-none"
            style={{ zIndex: -5 }}
          >
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full opacity-20 animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${20 + Math.random() * 40}px`,
                  height: `${20 + Math.random() * 40}px`,
                  backgroundColor: Object.values(dominantColors)[i % 3],
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${3 + Math.random() * 4}s`
                }}
              />
            ))}
          </div>

          {/* Subtle moving gradients */}
          <div 
            className="fixed inset-0 opacity-30"
            style={{ zIndex: -8 }}
          >
            <div 
              className="absolute inset-0 animate-spin-slow"
              style={{
                background: `conic-gradient(from 0deg, ${dominantColors.primary}40, transparent, ${dominantColors.secondary}30, transparent, ${dominantColors.accent}20, transparent)`,
                animationDuration: '20s'
              }}
            />
          </div>

          {/* Pulsing overlay synchronized with music */}
          <div 
            className="fixed inset-0 animate-pulse opacity-10"
            style={{
              background: `radial-gradient(circle, ${dominantColors.primary}60 0%, transparent 70%)`,
              animationDuration: '2s',
              zIndex: -6
            }}
          />
        </>
      )}

      {/* Overlay to ensure content readability */}
      <div 
        className="fixed inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70 backdrop-blur-[0.5px]"
        style={{ zIndex: -4 }}
      />
      
      {/* Additional dark overlay for better text contrast */}
      <div 
        className="fixed inset-0 bg-black/30"
        style={{ zIndex: -3 }}
      />
    </>
  );
};
