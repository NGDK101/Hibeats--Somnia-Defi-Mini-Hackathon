import { useCallback, useRef } from 'react';

interface UseClickDebounceOptions {
  delay?: number;
  maxWait?: number;
}

export const useClickDebounce = (
  callback: (...args: any[]) => void,
  options: UseClickDebounceOptions = {}
) => {
  const { delay = 300, maxWait = 1000 } = options;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxWaitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastExecutedRef = useRef<number>(0);
  const isExecutingRef = useRef<boolean>(false);

  const debouncedCallback = useCallback((...args: any[]) => {
    const now = Date.now();
    
    // Prevent execution if already executing
    if (isExecutingRef.current) {
      return;
    }

    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current);
    }

    // If maxWait time has passed since last execution, execute immediately
    if (now - lastExecutedRef.current >= maxWait) {
      isExecutingRef.current = true;
      lastExecutedRef.current = now;
      
      try {
        callback(...args);
      } finally {
        // Reset execution flag after a short delay
        setTimeout(() => {
          isExecutingRef.current = false;
        }, 100);
      }
      return;
    }

    // Set up debounced execution
    timeoutRef.current = setTimeout(() => {
      if (!isExecutingRef.current) {
        isExecutingRef.current = true;
        lastExecutedRef.current = Date.now();
        
        try {
          callback(...args);
        } finally {
          // Reset execution flag after a short delay
          setTimeout(() => {
            isExecutingRef.current = false;
          }, 100);
        }
      }
    }, delay);

    // Set up max wait timeout
    if (lastExecutedRef.current > 0) {
      maxWaitTimeoutRef.current = setTimeout(() => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        if (!isExecutingRef.current) {
          isExecutingRef.current = true;
          lastExecutedRef.current = Date.now();
          
          try {
            callback(...args);
          } finally {
            setTimeout(() => {
              isExecutingRef.current = false;
            }, 100);
          }
        }
      }, maxWait - (now - lastExecutedRef.current));
    }
  }, [callback, delay, maxWait]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current);
      maxWaitTimeoutRef.current = null;
    }
    isExecutingRef.current = false;
  }, []);

  return [debouncedCallback, cancel] as const;
};

export default useClickDebounce;