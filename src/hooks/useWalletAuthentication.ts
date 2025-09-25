import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';

interface AuthState {
  isAuthenticated: boolean;
  signature: string | null;
  timestamp: number | null;
}

const SESSION_DURATION = 3 * 24 * 60 * 60 * 1000; // 3 days

export const useWalletAuthentication = () => {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    signature: null,
    timestamp: null
  });
  const [isPending, setIsPending] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const getStorageKey = (walletAddress: string) => {
    return `hibeats_auth_${walletAddress.toLowerCase()}`;
  };

  const generateAuthMessage = (walletAddress: string) => {
    const timestamp = Date.now();
    return `Welcome to HiBeats! 🎵

Please sign this message to authenticate your wallet.

Address: ${walletAddress}
Time: ${new Date(timestamp).toISOString()}
Nonce: ${timestamp}

This is free and secure - no gas fees required.`;
  };

  // Preload auth state for potential reconnection
  const preloadAuthForAddress = useCallback((walletAddress: string) => {
    try {
      const storageKey = getStorageKey(walletAddress);
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        const parsed: AuthState = JSON.parse(stored);
        const now = Date.now();
        const age = parsed.timestamp ? now - parsed.timestamp : Infinity;
        const isValid = age < SESSION_DURATION;
        
        if (isValid && parsed.signature) {
          return { ...parsed, isAuthenticated: true };
        } else {
          localStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      console.error('❌ Error preloading auth:', error);
    }
    
    return {
      isAuthenticated: false,
      signature: null,
      timestamp: null
    };
  }, []);

  // Load auth state on address change with immediate execution
  const loadAuthState = useCallback(() => {
    console.log('🔍 Loading auth state for:', address?.slice(0, 6) + '...');
    
    if (!address) {
      setAuthState({
        isAuthenticated: false,
        signature: null,
        timestamp: null
      });
      setIsInitialized(true);
      return;
    }

    try {
      const storageKey = getStorageKey(address);
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        const parsed: AuthState = JSON.parse(stored);
        const now = Date.now();
        const age = parsed.timestamp ? now - parsed.timestamp : Infinity;
        const isValid = age < SESSION_DURATION;
        
        console.log('📋 Auth validation:', {
          hasStored: true,
          age: Math.round(age / 1000 / 60) + ' minutes',
          isValid
        });

        if (isValid && parsed.signature) {
          setAuthState({ ...parsed, isAuthenticated: true });
          console.log('✅ Valid auth restored');
        } else {
          localStorage.removeItem(storageKey);
          setAuthState({
            isAuthenticated: false,
            signature: null,
            timestamp: null
          });
          console.log('🗑️ Expired auth cleared');
        }
      } else {
        console.log('📄 No stored auth found');
        setAuthState({
          isAuthenticated: false,
          signature: null,
          timestamp: null
        });
      }
    } catch (error) {
      console.error('❌ Error loading auth:', error);
      setAuthState({
        isAuthenticated: false,
        signature: null,
        timestamp: null
      });
    }
    
    setIsInitialized(true);
  }, [address]);

  // Authenticate wallet
  const authenticateWallet = useCallback(async (): Promise<boolean> => {
    if (!address) return false;

    setIsPending(true);
    console.log('🔐 Starting authentication...');
    
    try {
      const message = generateAuthMessage(address);
      const signature = await signMessageAsync({ 
        message,
        account: address as `0x${string}`
      });
      const timestamp = Date.now();

      const newAuthState: AuthState = {
        isAuthenticated: true,
        signature,
        timestamp
      };

      // Save to localStorage
      const storageKey = getStorageKey(address);
      localStorage.setItem(storageKey, JSON.stringify(newAuthState));
      
      // Update state
      setAuthState(newAuthState);
      
      console.log('✅ Authentication successful');
      return true;

    } catch (error: any) {
      console.error('❌ Authentication failed:', error);
      return false;
    } finally {
      setIsPending(false);
    }
  }, [address, signMessageAsync]);

  // Clear authentication
  const clearAuthentication = useCallback(() => {
    if (address) {
      const storageKey = getStorageKey(address);
      localStorage.removeItem(storageKey);
    }
    
    setAuthState({
      isAuthenticated: false,
      signature: null,
      timestamp: null
    });
    
    console.log('🗑️ Authentication cleared');
  }, [address]);

  // Initialize with preloading strategy
  useEffect(() => {
    // Check if there's any stored wallet connection to preload auth
    const checkStoredConnections = () => {
      try {
        const walletStorageKey = 'hibeats_wallet_connection';
        const walletStored = localStorage.getItem(walletStorageKey);
        
        if (walletStored) {
          const walletState = JSON.parse(walletStored);
          if (walletState.address && walletState.isConnected) {
            // Preload auth for this address immediately
            console.log('🚀 Preloading auth for stored address:', walletState.address.slice(0, 6) + '...');
            const preloadedAuth = preloadAuthForAddress(walletState.address);
            
            // Only set if we don't have current address yet
            if (!address && preloadedAuth.isAuthenticated) {
              setAuthState(preloadedAuth);
              setIsInitialized(true);
              console.log('✅ Preloaded auth state');
              return;
            }
          }
        }
      } catch (error) {
        console.error('❌ Error preloading auth:', error);
      }
      
      // Default initialization if no preload
      if (!address) {
        setIsInitialized(true);
      }
    };

    checkStoredConnections();
  }, []); // Run once on mount

  // Handle address changes
  useEffect(() => {
    if (address) {
      // Reset and reload for new address
      setIsInitialized(false);
      loadAuthState();
    }
  }, [address, loadAuthState]);

  return {
    authState,
    isPending,
    isInitialized,
    authenticateWallet,
    clearAuthentication,
    preloadAuthForAddress, // Export for external use
  };
};