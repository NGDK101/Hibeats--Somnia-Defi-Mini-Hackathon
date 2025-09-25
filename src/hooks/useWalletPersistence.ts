import { useEffect, useCallback, useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { toast } from 'sonner';

const WALLET_STORAGE_KEY = 'hibeats_wallet_connection';
const CONNECTION_TIMEOUT = 8000; // Reduced from 15 seconds to 8 seconds

interface WalletConnectionState {
  isConnected: boolean;
  connectorId?: string;
  address?: string;
  timestamp: number;
}

export const useWalletPersistence = () => {
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [hasAttemptedReconnect, setHasAttemptedReconnect] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Save wallet connection state
  const saveConnectionState = useCallback(() => {
    if (isConnected && address && connector) {
      const state: WalletConnectionState = {
        isConnected: true,
        connectorId: connector.id,
        address,
        timestamp: Date.now(),
      };
      
      try {
        localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(state));
        console.log('💾 Wallet connection state saved:', {
          connectorId: connector.id,
          address: address.slice(0, 6) + '...' + address.slice(-4),
          timestamp: new Date(state.timestamp).toISOString()
        });
      } catch (error) {
        console.error('❌ Failed to save wallet state:', error);
      }
    }
  }, [isConnected, address, connector]);

  // Load wallet connection state
  const loadConnectionState = useCallback((): WalletConnectionState | null => {
    try {
      const stored = localStorage.getItem(WALLET_STORAGE_KEY);
      if (!stored) {
        console.log('📭 No stored wallet connection state found');
        return null;
      }

      const state: WalletConnectionState = JSON.parse(stored);
      
      // Check if connection is recent (within 7 days)
      const isRecent = Date.now() - state.timestamp < 7 * 24 * 60 * 60 * 1000;
      if (!isRecent) {
        console.log('⏰ Stored connection state expired, removing...');
        localStorage.removeItem(WALLET_STORAGE_KEY);
        return null;
      }

      console.log('📥 Loaded wallet connection state:', {
        connectorId: state.connectorId,
        address: state.address?.slice(0, 6) + '...' + state.address?.slice(-4),
        age: Math.round((Date.now() - state.timestamp) / 1000 / 60) + ' minutes ago'
      });

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

  // Attempt reconnection on mount with optimized timing
  useEffect(() => {
    // Check if there's a saved connection first
    const savedState = loadConnectionState();
    
    if (!savedState || !savedState.connectorId) {
      // No saved connection, initialize immediately
      setIsInitializing(false);
      setHasAttemptedReconnect(true);
      return;
    }

    // There is a saved connection, attempt to reconnect immediately
    if (!hasAttemptedReconnect) {
      console.log('🚀 Initializing wallet persistence with saved connection...');
      // Reduce delay for better UX
      const timer = setTimeout(() => {
        attemptReconnection();
      }, 100); // Reduced from 1000ms to 100ms

      return () => clearTimeout(timer);
    }
  }, [attemptReconnection, hasAttemptedReconnect, loadConnectionState]);

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
