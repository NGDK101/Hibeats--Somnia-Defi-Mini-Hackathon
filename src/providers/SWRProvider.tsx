import { ReactNode } from 'react';
import { SWRConfig } from 'swr';

interface SWRProviderProps {
  children: ReactNode;
}

// SWR Configuration for HiBeats - Optimized for Web3
const swrConfig = {
  // Cache settings - more aggressive for Web3 data
  dedupingInterval: 45000, // 45 seconds (increased from 30)
  focusThrottleInterval: 8000, // 8 seconds (increased from 5)
  
  // Error handling - more tolerant for blockchain delays
  errorRetryCount: 2, // Reduced from 3
  errorRetryInterval: 8000, // Increased from 5 seconds
  
  // Network optimization
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  revalidateIfStale: true,
  
  // Background revalidation - optimized for blockchain
  refreshInterval: 0, // Disable auto-refresh, let components control when needed
  
  // Add better cache management
  refreshWhenHidden: false,
  refreshWhenOffline: false,
  
  // Global error handler with better categorization
  onError: (error: any, key: string) => {
    console.warn('SWR Error for key:', key, error);
    
    // Don't spam errors for network issues
    if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('fetch')) {
      console.log('Network error, will retry automatically');
      return;
    }
    
    // Log blockchain-specific errors differently
    if (error?.code === 'CALL_EXCEPTION' || key.includes('contract')) {
      console.log('Blockchain call error:', error.message);
      return;
    }
  },
  
  // Optimize loading behavior
  onLoadingSlow: (key: string) => {
    console.log('Slow loading detected for:', key);
  },
  
  // Add success handler for debugging
  onSuccess: (data: any, key: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('SWR Success:', key, data);
    }
  }
};

export const SWRProvider = ({ children }: SWRProviderProps) => {
  return (
    <SWRConfig value={swrConfig}>
      {children}
    </SWRConfig>
  );
};

export default SWRProvider;