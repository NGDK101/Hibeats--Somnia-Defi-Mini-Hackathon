import { useCallback, useRef } from 'react';

export const useClickThrottle = (callback: () => void | Promise<void>, delay: number = 1000) => {
  const isThrottledRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const throttledCallback = useCallback(async () => {
    if (isThrottledRef.current) {
      return;
    }

    isThrottledRef.current = true;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    try {
      await callback();
    } finally {
      // Set timeout to reset throttle
      timeoutRef.current = setTimeout(() => {
        isThrottledRef.current = false;
      }, delay);
    }
  }, [callback, delay]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    isThrottledRef.current = false;
  }, []);

  return { throttledCallback, cleanup, isThrottled: isThrottledRef.current };
};

export const useDebounce = (callback: () => void | Promise<void>, delay: number = 300) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      await callback();
    }, delay);
  }, [callback, delay]);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { debouncedCallback, cleanup };
};