import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAudioContext } from '@/hooks/useAudioContext';

interface AudioVisualizerBackgroundProps {
  isPlaying: boolean;
  className?: string;
}

export const AudioVisualizerBackground = ({ 
  isPlaying, 
  className 
}: AudioVisualizerBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [currentIntensity, setCurrentIntensity] = useState(0);
  const { getFrequencyData, isInitialized } = useAudioContext();

  // Define drawStaticBackground function with enhanced effects
  const drawStaticBackground = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Drawing enhanced static background with size
    
    // Main diagonal gradient with smoother colors
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.20)'); // Blue - more visible
    gradient.addColorStop(0.2, 'rgba(147, 51, 234, 0.18)'); // Purple - more visible  
    gradient.addColorStop(0.4, 'rgba(168, 85, 247, 0.20)'); // Violet - more visible
    gradient.addColorStop(0.6, 'rgba(236, 72, 153, 0.18)'); // Pink - more visible
    gradient.addColorStop(0.8, 'rgba(139, 69, 19, 0.15)'); // Brown accent
    gradient.addColorStop(1, 'rgba(30, 58, 138, 0.15)'); // Deep blue - more visible
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Enhanced radial gradient overlay for depth
    const radialGradient = ctx.createRadialGradient(
      canvas.width * 0.3, canvas.height * 0.3, 0,
      canvas.width * 0.3, canvas.height * 0.3, Math.max(canvas.width, canvas.height) / 1.5
    );
    radialGradient.addColorStop(0, 'rgba(147, 51, 234, 0.12)'); // Purple center
    radialGradient.addColorStop(0.4, 'rgba(59, 130, 246, 0.08)'); // Blue mid
    radialGradient.addColorStop(0.7, 'rgba(168, 85, 247, 0.06)'); // Violet
    radialGradient.addColorStop(1, 'rgba(0, 0, 0, 0.03)'); // Black edge
    
    ctx.fillStyle = radialGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add secondary radial for more depth
    const secondaryRadial = ctx.createRadialGradient(
      canvas.width * 0.7, canvas.height * 0.7, 0,
      canvas.width * 0.7, canvas.height * 0.7, Math.max(canvas.width, canvas.height) / 2
    );
    secondaryRadial.addColorStop(0, 'rgba(236, 72, 153, 0.10)'); // Pink accent
    secondaryRadial.addColorStop(0.5, 'rgba(59, 130, 246, 0.06)'); // Blue
    secondaryRadial.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Transparent
    
    ctx.fillStyle = secondaryRadial;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Enhanced static background drawn
  };

  // Debug logs
  useEffect(() => {
    // AudioVisualizerBackground mounted
    
    // Force initial draw
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Force initial canvas size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width || 320;
        canvas.height = rect.height || 240;
        
        // Forcing initial draw with size
        drawStaticBackground(ctx, canvas);
      }
    }
  }, []);

  useEffect(() => {
    // AudioVisualizerBackground state changed
  }, [isPlaying, isInitialized]);

  useEffect(() => {
    const canvas = canvasRef.current;
    
    // Canvas effect triggered
    
    if (!canvas) {
      // No canvas element
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      // Failed to get canvas context
      return;
    }

    // Starting drawing loop

    const draw = () => {
      // Draw function called
      
      if (!isPlaying || !isInitialized) {
        // Draw static gradient when not playing or not initialized
        // Drawing static background
        drawStaticBackground(ctx, canvas);
        return;
      }

      const dataArray = getFrequencyData();
      // Got frequency data
      
      if (!dataArray) {
        // No frequency data, drawing static background
        drawStaticBackground(ctx, canvas);
        animationFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      const bufferLength = dataArray.length;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Create gradient based on audio frequencies
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      
      // Calculate average frequency for color intensity
      const avgFreq = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      const intensity = avgFreq / 255;
      setCurrentIntensity(intensity);
      
      // Dynamic colors based on frequency data with enhanced smoothness
      const bassIntensity = dataArray.slice(0, 10).reduce((sum, val) => sum + val, 0) / (10 * 255);
      const midIntensity = dataArray.slice(10, 80).reduce((sum, val) => sum + val, 0) / (70 * 255);
      const trebleIntensity = dataArray.slice(80).reduce((sum, val) => sum + val, 0) / ((bufferLength - 80) * 255);
      
      // Enhanced gradient colors with smoother blending and more responsive opacity
      const bassColor = `rgba(${Math.floor(138 + 117 * bassIntensity)}, ${Math.floor(43 + 57 * bassIntensity)}, ${Math.floor(226 - 26 * bassIntensity)}, ${0.15 + 0.3 * bassIntensity})`;
      const midColor = `rgba(${Math.floor(236 - 36 * midIntensity)}, ${Math.floor(72 + 183 * midIntensity)}, ${Math.floor(153 - 3 * midIntensity)}, ${0.12 + 0.25 * midIntensity})`;
      const trebleColor = `rgba(${Math.floor(59 + 96 * trebleIntensity)}, ${Math.floor(130 + 70 * trebleIntensity)}, ${Math.floor(246 + 9 * trebleIntensity)}, ${0.15 + 0.3 * trebleIntensity})`;
      
      // Multi-layer gradient for enhanced depth and smoothness
      gradient.addColorStop(0, bassColor);
      gradient.addColorStop(0.15, `rgba(138, 43, 226, ${0.10 + 0.18 * bassIntensity})`);
      gradient.addColorStop(0.35, midColor);
      gradient.addColorStop(0.5, `rgba(147, 51, 234, ${0.08 + 0.15 * intensity})`); // Purple blend
      gradient.addColorStop(0.65, `rgba(59, 130, 246, ${0.10 + 0.18 * trebleIntensity})`);
      gradient.addColorStop(0.85, trebleColor);
      gradient.addColorStop(1, `rgba(30, 58, 138, ${0.08 + 0.18 * intensity})`); // Deep blue fade
      
      // Fill canvas with gradient
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Enhanced radial gradient overlay with dynamic positioning
      const centerX = canvas.width / 2 + (bassIntensity - 0.5) * 50; // Slight movement based on bass
      const centerY = canvas.height / 2 + (trebleIntensity - 0.5) * 30; // Slight movement based on treble
      const maxRadius = Math.max(canvas.width, canvas.height) / 1.8;
      
      const radialGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, maxRadius
      );
      
      // Dynamic radial colors based on frequency intensity
      radialGradient.addColorStop(0, `rgba(147, 51, 234, ${0.08 + 0.18 * intensity})`); // Purple center
      radialGradient.addColorStop(0.3, `rgba(138, 43, 226, ${0.06 + 0.15 * bassIntensity})`); // Purple-violet
      radialGradient.addColorStop(0.6, `rgba(59, 130, 246, ${0.04 + 0.12 * midIntensity})`); // Blue
      radialGradient.addColorStop(0.8, `rgba(30, 58, 138, ${0.03 + 0.08 * trebleIntensity})`); // Deep blue
      radialGradient.addColorStop(1, `rgba(0, 0, 0, ${0.02 + 0.05 * intensity})`); // Black edge
      
      ctx.fillStyle = radialGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add subtle secondary radial gradient for more depth
      const secondaryRadial = ctx.createRadialGradient(
        canvas.width * 0.7, canvas.height * 0.3, 0,
        canvas.width * 0.7, canvas.height * 0.3, maxRadius * 0.6
      );
      secondaryRadial.addColorStop(0, `rgba(236, 72, 153, ${0.05 + 0.10 * midIntensity})`); // Pink accent
      secondaryRadial.addColorStop(0.5, `rgba(168, 85, 247, ${0.03 + 0.08 * intensity})`); // Purple accent
      secondaryRadial.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Transparent
      
      ctx.fillStyle = secondaryRadial;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add frequency bars as more visible overlay
      drawFrequencyBars(ctx, canvas, dataArray, bufferLength, intensity);
      
      // Enhanced pulsing effect with multiple layers
      if (intensity > 0.1) {
        ctx.save();
        
        // Soft white overlay for brightness
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = `rgba(255, 255, 255, ${(intensity - 0.1) * 0.08})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Color overlay based on dominant frequency
        ctx.globalCompositeOperation = 'overlay';
        if (bassIntensity > midIntensity && bassIntensity > trebleIntensity) {
          // Bass dominant - purple overlay
          ctx.fillStyle = `rgba(147, 51, 234, ${bassIntensity * 0.06})`;
        } else if (midIntensity > trebleIntensity) {
          // Mid dominant - pink overlay
          ctx.fillStyle = `rgba(236, 72, 153, ${midIntensity * 0.06})`;
        } else {
          // Treble dominant - blue overlay
          ctx.fillStyle = `rgba(59, 130, 246, ${trebleIntensity * 0.06})`;
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.restore();
      }
      
      // Add subtle edge glow effect for high intensity
      if (intensity > 0.3) {
        ctx.save();
        ctx.shadowColor = `rgba(147, 51, 234, ${intensity * 0.4})`;
        ctx.shadowBlur = 20;
        ctx.globalCompositeOperation = 'screen';
        
        // Draw edge rectangles for glow effect
        ctx.strokeStyle = `rgba(255, 255, 255, ${intensity * 0.1})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        
        ctx.restore();
      }
      
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    const drawFrequencyBars = (
      ctx: CanvasRenderingContext2D, 
      canvas: HTMLCanvasElement, 
      dataArray: Uint8Array, 
      bufferLength: number, 
      intensity: number
    ) => {
      const barCount = 100; // More bars for smoother effect
      const barWidth = canvas.width / barCount;
      const step = Math.floor(bufferLength / barCount);
      
      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * step] || 0;
        const barHeight = (value / 255) * canvas.height * 0.25; // More visible height
        const x = i * barWidth;
        const y = canvas.height - barHeight;
        
        // Enhanced vertical gradient for bars with frequency-based colors
        const barGradient = ctx.createLinearGradient(x, y, x, canvas.height);
        
        // Color based on frequency range
        if (i < barCount * 0.3) {
          // Bass range - purple/violet
          barGradient.addColorStop(0, `rgba(147, 51, 234, ${intensity * 0.4})`);
          barGradient.addColorStop(0.5, `rgba(168, 85, 247, ${intensity * 0.3})`);
          barGradient.addColorStop(1, `rgba(138, 43, 226, ${intensity * 0.2})`);
        } else if (i < barCount * 0.7) {
          // Mid range - pink/magenta
          barGradient.addColorStop(0, `rgba(236, 72, 153, ${intensity * 0.4})`);
          barGradient.addColorStop(0.5, `rgba(219, 39, 119, ${intensity * 0.3})`);
          barGradient.addColorStop(1, `rgba(190, 18, 60, ${intensity * 0.2})`);
        } else {
          // Treble range - blue/cyan
          barGradient.addColorStop(0, `rgba(59, 130, 246, ${intensity * 0.4})`);
          barGradient.addColorStop(0.5, `rgba(37, 99, 235, ${intensity * 0.3})`);
          barGradient.addColorStop(1, `rgba(29, 78, 216, ${intensity * 0.2})`);
        }
        
        ctx.fillStyle = barGradient;
        ctx.fillRect(x, y, barWidth * 0.8, barHeight); // Slight gap between bars
        
        // Enhanced glow effect for high frequencies
        if (value > 150) {
          ctx.save();
          ctx.shadowBlur = 15;
          ctx.shadowColor = i < barCount * 0.3 
            ? `rgba(147, 51, 234, ${intensity * 0.5})` 
            : i < barCount * 0.7
            ? `rgba(236, 72, 153, ${intensity * 0.5})`
            : `rgba(59, 130, 246, ${intensity * 0.5})`;
          ctx.fillRect(x, y, barWidth * 0.8, barHeight);
          ctx.restore();
        }
        
        // Add reflection effect at the bottom
        if (barHeight > 10) {
          const reflectionGradient = ctx.createLinearGradient(x, canvas.height, x, canvas.height - 20);
          reflectionGradient.addColorStop(0, `rgba(255, 255, 255, ${intensity * 0.1})`);
          reflectionGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          
          ctx.fillStyle = reflectionGradient;
          ctx.fillRect(x, canvas.height - 20, barWidth * 0.8, 20);
        }
      }
    };

    if (isPlaying && isInitialized) {
      draw();
    } else {
      // Always draw static background even if not initialized
      drawStaticBackground(ctx, canvas);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
    }, [isPlaying, isInitialized, getFrequencyData]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Canvas resized
    };

    window.addEventListener('resize', handleResize);
    // Initial resize
    setTimeout(handleResize, 100); // Delay to ensure DOM is ready

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "absolute inset-0 w-full h-full pointer-events-none transition-all duration-300",
        isPlaying && currentIntensity > 0.3 ? "animate-music-wave" : "",
        className
      )}
      style={{
        filter: isPlaying 
          ? `blur(${0.1 + currentIntensity * 0.3}px) brightness(${1 + currentIntensity * 0.2}) saturate(${1 + currentIntensity * 0.3})` 
          : 'blur(0px) brightness(1) saturate(1.1)',
        transition: 'filter 0.4s ease, transform 0.4s ease, opacity 0.3s ease',
        transform: isPlaying && currentIntensity > 0.2 
          ? `scale(${1 + currentIntensity * 0.012}) rotate(${currentIntensity * 0.5}deg)` 
          : 'scale(1) rotate(0deg)',
        opacity: isPlaying ? 0.85 + (currentIntensity * 0.15) : 0.75,
        backgroundColor: 'transparent',
        minWidth: '100%',
        minHeight: '100%',
        mixBlendMode: isPlaying && currentIntensity > 0.3 ? 'screen' : 'normal'
      }}
    />
  );
};
