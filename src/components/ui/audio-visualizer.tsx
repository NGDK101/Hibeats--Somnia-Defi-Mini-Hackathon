import { useEffect, useRef } from "react";
import { useAudioContext } from '@/hooks/useAudioContext';

interface AudioVisualizerProps {
  isPlaying: boolean;
  className?: string;
}

export const AudioVisualizer = ({ isPlaying, className }: AudioVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  // const { frequencyData, isInitialized } = useAudioContext(); // Remove unused destructuring

  useEffect(() => {
    if (!audioRef.current || !canvasRef.current) return;

    const audio = audioRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    const setupAudioContext = async () => {
      try {
        if (!audioContextRef.current && isPlaying) {
          // console.log('🎧 Setting up audio context for visualizer');
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          analyserRef.current = audioContextRef.current.createAnalyser();
          
          // Only create source if not already created
          if (!sourceRef.current) {
            sourceRef.current = audioContextRef.current.createMediaElementSource(audio);
            sourceRef.current.connect(analyserRef.current);
          }
          
          analyserRef.current.connect(audioContextRef.current.destination);
          analyserRef.current.fftSize = 256;
          
          // Audio context setup complete
        }
      } catch (error) {
        // Error setting up audio context
      }
    };

    const draw = () => {
      if (!analyserRef.current || !ctx || !isPlaying) {
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current);
          animationIdRef.current = null;
        }
        return;
      }

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      // Clear canvas
      let barHeight: number;

      // Draw bars
      const barWidth = canvas.width / bufferLength;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

        // Create gradient
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, '#10b981');
        gradient.addColorStop(0.5, '#34d399');
        gradient.addColorStop(1, '#6ee7b7');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

        x += barWidth;
      }

      animationIdRef.current = requestAnimationFrame(draw);
    };

    if (isPlaying) {
      setupAudioContext().then(() => {
        if (audioContextRef.current?.state === 'suspended') {
          audioContextRef.current.resume();
        }
        draw();
      });
    } else if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
      // Clear canvas when not playing
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
  }, [isPlaying]);
        cancelAnimationFrame(animationIdRef.current);
  return (
    <>
      <audio ref={audioRef} style={{ display: 'none' }} />
      <canvas
        ref={canvasRef}
        width={200}
        height={60}
        className={`${className} transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-30'}`}
        style={{ imageRendering: 'pixelated' }}
      />
    </>
  );
};
      style={{ imageRendering: 'pixelated' }}
    />
  );
};
