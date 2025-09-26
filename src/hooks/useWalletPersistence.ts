import { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { toast } from 'sonner';

const WALLET_STORAGE_KEY = 'hibeats_wallet_connection';
const CONNECTION_TIMEOUT = 15000; // 15 seconds for reliable reconnection

interface WalletConnectionState {
  isConnected: boolean;
  connectorId?: string;
  address?: string;
  timestamp: number;
}

// Debounce utility function
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Pre-load wallet state to determine initial state immediately
const getInitialState = () => {
  try {
    const stored = localStorage.getItem(WALLET_STORAGE_KEY);
    if (!stored) return { hasStoredState: false, isInitializing: false };

    const state: WalletConnectionState = JSON.parse(stored);
    const isRecent = Date.now() - state.timestamp < 7 * 24 * 60 * 60 * 1000;

    return {
      hasStoredState: isRecent,
      isInitializing: isRecent // Only initialize if we have recent stored state
    };
  } catch {
    return { hasStoredState: false, isInitializing: false };
  }
};

export const useWalletPersistence = () => {
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [hasAttemptedReconnect, setHasAttemptedReconnect] = useState(false);

  // Initialize based on stored state - prevent flicker by starting with correct state
  const initialState = useMemo(() => getInitialState(), []);
  const [isInitializing, setIsInitializing] = useState(initialState.isInitializing);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Track last saved state to prevent duplicate saves
  const lastSavedState = useRef<string | null>(null);

  // Debounced save function to prevent excessive saves
  const debouncedSave = useCallback(
    debounce((connectedState: boolean, userAddress: string, userConnector: any) => {
      if (connectedState && userAddress && userConnector) {
        const state: WalletConnectionState = {
          isConnected: true,
          connectorId: userConnector.id,
          address: userAddress,
          timestamp: Date.now(),
        };

        const stateString = JSON.stringify(state);

        // Skip save if state hasn't changed (except timestamp)
        const stateWithoutTimestamp = JSON.stringify({
          ...state,
          timestamp: 0
        });

        if (lastSavedState.current === stateWithoutTimestamp) {
          return; // Skip duplicate save
        }

        try {
          localStorage.setItem(WALLET_STORAGE_KEY, stateString);
          lastSavedState.current = stateWithoutTimestamp;

          // Reduce console noise - only log in development
          if (process.env.NODE_ENV === 'development') {
            console.log('💾 Wallet connection state saved:', {
              connectorId: userConnector.id,
              address: userAddress.slice(0, 6) + '...' + userAddress.slice(-4),
              timestamp: new Date(state.timestamp).toISOString()
            });
          }
        } catch (error) {
          console.error('❌ Failed to save wallet state:', error);
        }
      }
    }, 500), // Reduced debounce from 1000ms to 500ms for better UX
    []
  );

  // Save wallet connection state
  const saveConnectionState = useCallback(() => {
    debouncedSave(isConnected, address || '', connector);
  }, [isConnected, address, connector, debouncedSave]);

  // Load wallet connection state
  const loadConnectionState = useCallback((): WalletConnectionState | null => {
    try {
      const stored = localStorage.getItem(WALLET_STORAGE_KEY);
      if (!stored) {
        // Only log in development mode
        if (process.env.NODE_ENV === 'development') {
          console.log('📭 No stored wallet connection state found');
        }
        return null;
      }

      const state: WalletConnectionState = JSON.parse(stored);
      
      // Check if connection is recent (within 7 days)
      const isRecent = Date.now() - state.timestamp < 7 * 24 * 60 * 60 * 1000;
      if (!isRecent) {
        if (process.env.NODE_ENV === 'development') {
          console.log('⏰ Stored connection state expired, removing...');
        }
        localStorage.removeItem(WALLET_STORAGE_KEY);
        return null;
      }

      // Reduce logging frequency
      if (process.env.NODE_ENV === 'development') {
        console.log('📥 Loaded wallet connection state:', {
          connectorId: state.connectorId,
          address: state.address?.slice(0, 6) + '...' + state.address?.slice(-4),
          age: Math.round((Date.now() - state.timestamp) / 1000 / 60) + ' minutes ago'
        });
      }

      return state;
    } catch (error) {
      console.error('❌ Failed to load wallet state:', error);
      localStorage.removeItem(WALLET_STORAGE_KEY);
      return null;
    }
  }, []);

  // Clear connection state
  const clearConnectionState = useCallback(() => {
    try {
      localStorage.removeItem(WALLET_STORAGE_KEY);
      console.log('🧹 Wallet connection state cleared');
    } catch (error) {
      console.error('❌ Failed to clear wallet state:', error);
    }
  }, []);

  // Auto-reconnect on app load
  const attemptReconnection = useCallback(async () => {
    if (hasAttemptedReconnect || isConnected || isReconnecting) {
      setIsInitializing(false);
      return;
    }

    const savedState = loadConnectionState();
    if (!savedState || !savedState.connectorId) {
      setHasAttemptedReconnect(true);
      setIsInitializing(false);
      return;
    }

    // Find the connector that was previously connected
    const targetConnector = connectors.find(c => c.id === savedState.connectorId);
    if (!targetConnector) {
      console.log('⚠️ Previous connector not found, clearing state. Available connectors:', 
        connectors.map(c => c.name).join(', '));
      clearConnectionState();
      setHasAttemptedReconnect(true);
      setIsInitializing(false);
      return;
    }

    try {
      setIsReconnecting(true);
      console.log('🔄 Attempting to reconnect with:', targetConnector.name);
      
      // Set timeout for reconnection
      const timeoutId = setTimeout(() => {
        setIsReconnecting(false);
        setHasAttemptedReconnect(true);
        setIsInitializing(false);
        console.log('⏰ Reconnection timeout reached');
      }, CONNECTION_TIMEOUT);

      // Attempt connection
      await connect({ connector: targetConnector });
      clearTimeout(timeoutId);
      
      console.log('✅ Successfully reconnected with', targetConnector.name);
      
    } catch (error: any) {
      console.error('❌ Reconnection failed:', error);
      clearConnectionState();
      
      // Show user-friendly message only for unexpected errors
      if (error && !error.message?.includes('rejected') && !error.message?.includes('User rejected')) {
        console.log('🔔 Showing reconnection error to user');
        toast.error('Failed to restore wallet connection. Please connect manually.');
      } else {
        console.log('🤫 User rejected reconnection, not showing error toast');
      }
    } finally {
      setIsReconnecting(false);
      setHasAttemptedReconnect(true);
      setIsInitializing(false);
    }
  }, [
    hasAttemptedReconnect, 
    isConnected, 
    isReconnecting, 
    loadConnectionState, 
    connectors, 
    connect, 
    clearConnectionState
  ]);

  // Save state when connected
  useEffect(() => {
    if (isConnected && address && connector) {
      saveConnectionState();
      setIsInitializing(false);
    }
  }, [isConnected, address, connector, saveConnectionState]);

  // Clear state when disconnected manually
  useEffect(() => {
    if (!isConnected && hasAttemptedReconnect && !isReconnecting) {
      // Only clear if this wasn't an auto-reconnection attempt
      const savedState = loadConnectionState();
      if (savedState) {
        console.log('🔌 User manually disconnected, clearing stored state');
        clearConnectionState();
      }
    }
  }, [isConnected, hasAttemptedReconnect, isReconnecting, clearConnectionState, loadConnectionState]);

  // Attempt reconnection on mount with immediate execution
  useEffect(() => {
    // If already connected during page load, skip reconnection
    if (isConnected && address) {
      setIsInitializing(false);
      setHasAttemptedReconnect(true);
      return;
    }

    // Check if there's a saved connection
    const savedState = loadConnectionState();

    if (!savedState || !savedState.connectorId) {
      // No saved connection, initialize immediately
      setIsInitializing(false);
      setHasAttemptedReconnect(true);
      return;
    }

    // There is a saved connection, attempt to reconnect immediately
    if (!hasAttemptedReconnect) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Initializing wallet persistence with saved connection...');
      }

      // Execute immediately to prevent flicker
      attemptReconnection();
    }
  }, [attemptReconnection, hasAttemptedReconnect, loadConnectionState, isConnected, address]);

  // Handle page visibility change (when user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected && hasAttemptedReconnect) {
        // Reset reconnection attempt when page becomes visible again
        console.log('👀 Page became visible, resetting reconnection state...');
        setHasAttemptedReconnect(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isConnected, hasAttemptedReconnect]);

  // Manual disconnect function that clears state
  const disconnectWallet = useCallback(async () => {
    try {
      console.log('👋 Manually disconnecting wallet...');
      clearConnectionState();
      await disconnect();
      toast.success('Wallet disconnected');
    } catch (error) {
      console.error('❌ Disconnect error:', error);
      toast.error('Failed to disconnect wallet');
    }
  }, [disconnect, clearConnectionState]);

  return {
    isReconnecting,
    hasAttemptedReconnect,
    isInitializing,
    disconnectWallet,
    clearConnectionState,
    saveConnectionState,
  };
};
