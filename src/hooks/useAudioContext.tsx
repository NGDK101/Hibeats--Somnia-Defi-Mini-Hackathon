import React, { createContext, useContext, useRef, useEffect, useState, ReactNode } from 'react';

interface AudioContextData {
  analyser: AnalyserNode | null;
  isInitialized: boolean;
  frequencyData: Uint8Array | null;
  getFrequencyData: () => Uint8Array | null;
}

const AudioContextContext = createContext<AudioContextData>({
  analyser: null,
  isInitialized: false,
  frequencyData: null,
  getFrequencyData: () => null
});

interface AudioContextProviderProps {
  children: ReactNode;
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
}

export const AudioContextProvider = ({ children, audioRef, isPlaying }: AudioContextProviderProps) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const frequencyDataRef = useRef<Uint8Array | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const initializeAudioContext = async () => {
      if (!audioRef.current || isInitialized) {
        return;
      }

      try {
        
        // Create audio context with fallback for older browsers
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) {
          return;
        }
        
        const audioContext = new AudioContextClass();
        // console.log('🎧 Audio context created, state:', audioContext.state);
        
        // Resume audio context if it's suspended (required by some browsers)
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        
        const analyser = audioContext.createAnalyser();
        
        // Configure analyser
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        
        // Create source and connect
        const source = audioContext.createMediaElementSource(audioRef.current);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        // console.log('🎧 Audio nodes connected successfully');
        
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        sourceRef.current = source;
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        frequencyDataRef.current = dataArray;
        setFrequencyData(dataArray);
        setIsInitialized(true);
      } catch (error) {
        // Audio context initialization failed
      }
    };

    // Try to initialize when audioRef is available
    if (audioRef.current && !isInitialized) {
      initializeAudioContext();
    }
  }, [audioRef, isInitialized]);

  // Also try to initialize when playing starts
  useEffect(() => {
    if (isPlaying && !isInitialized && audioRef.current) {
      // console.log('🎧 Attempting to initialize audio context on play');
      const initializeAudioContext = async () => {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContextClass) {
            return;
          }
          
          const audioContext = new AudioContextClass();
          
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
          }
          
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.8;
          
          const source = audioContext.createMediaElementSource(audioRef.current!);
          source.connect(analyser);
          analyser.connect(audioContext.destination);
          
          audioContextRef.current = audioContext;
          analyserRef.current = analyser;
          sourceRef.current = source;
          
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          frequencyDataRef.current = dataArray;
          setFrequencyData(dataArray);
          setIsInitialized(true);
          
          // console.log('✅ Shared audio context initialized (triggered by play)');
        } catch (error) {
          // Audio context initialization failed on play
        }
      };
      
      initializeAudioContext();
    }
  }, [isPlaying, isInitialized, audioRef]);

  useEffect(() => {
    // No need for continuous updating here
    // Each visualizer will call getFrequencyData when needed
  }, [isPlaying, isInitialized]);

  const getFrequencyData = () => {
    if (analyserRef.current && frequencyDataRef.current) {
      analyserRef.current.getByteFrequencyData(frequencyDataRef.current as any);
      return frequencyDataRef.current;
    }
    return null;
  };

  useEffect(() => {
    return () => {
      // Cleanup
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const contextValue: AudioContextData = {
    analyser: analyserRef.current,
    isInitialized,
    frequencyData: frequencyDataRef.current,
    getFrequencyData
  };

  return (
    <AudioContextContext.Provider value={contextValue}>
      {children}
    </AudioContextContext.Provider>
  );
};

export const useAudioContext = () => {
  const context = useContext(AudioContextContext);
  if (!context) {
    throw new Error('useAudioContext must be used within AudioContextProvider');
  }
  return context;
};
