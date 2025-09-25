import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const usePageTransition = (duration: number = 300) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startTransition = useCallback(() => {
    // Clear any existing timers
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }
    
    setIsLoading(true);
    
    // Set a safety timeout to ensure loading doesn't get stuck
    transitionTimerRef.current = setTimeout(() => {
      setIsLoading(false);
    }, duration + 100);
  }, [duration]);

  const stopTransition = useCallback(() => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setIsLoading(true);
    timerRef.current = setTimeout(() => {
      setIsLoading(false);
    }, duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [location.pathname, duration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  return { isLoading, startTransition, stopTransition };
};
