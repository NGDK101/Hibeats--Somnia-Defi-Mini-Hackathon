import { useEffect, useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { toast } from 'sonner';

/**
 * Simplified wallet persistence that works with RainbowKit's built-in persistence
 * - Relies on RainbowKit for wallet connection persistence
 * - Only manages loading states and user feedback
 * - No manual reconnection logic to avoid conflicts
 */
export const useSimplifiedWalletPersistence = () => {
  const { address, isConnected, isReconnecting: wagmiReconnecting } = useAccount();
  const { disconnect } = useDisconnect();

  const [isInitializing, setIsInitializing] = useState(true);
  const [hasCheckedConnection, setHasCheckedConnection] = useState(false);

  // Check for stored wallet data to determine if we should expect a connection
  const hasStoredWallet = () => {
    try {
      // Check wagmi's storage (updated key)
      const wagmiData = localStorage.getItem('hibeats.wagmi');
      if (wagmiData) {
        const data = JSON.parse(wagmiData);
        // Check if there's a valid connection state
        return data && (data.connections || data.state);
      }

      // Also check legacy RainbowKit storage
      const rainbowKitData = localStorage.getItem('hibeats.wallet');
      if (rainbowKitData) {
        const data = JSON.parse(rainbowKitData);
        return data && Object.keys(data).length > 0;
      }
    } catch (error) {
      console.error('Error checking stored wallet:', error);
    }
    return false;
  };

  // Initialize connection check
  useEffect(() => {
    const checkConnection = async () => {
      const hasStored = hasStoredWallet();

      if (hasStored) {
        console.log('🔍 Found stored wallet data, waiting for auto-reconnect...');
        // If we have stored data, wait for wagmi auto-reconnect
        setTimeout(() => {
          setIsInitializing(false);
          setHasCheckedConnection(true);
        }, 800); // Reduced from 1500ms to 800ms for better UX
      } else {
        console.log('📭 No stored wallet data found');
        // No stored connection, initialize immediately
        setIsInitializing(false);
        setHasCheckedConnection(true);
      }
    };

    checkConnection();
  }, []);

  // Handle successful connection
  useEffect(() => {
    if (isConnected && address) {
      setIsInitializing(false);
      setHasCheckedConnection(true);
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Wallet connected:', address?.slice(0, 6) + '...');
      }
    }
  }, [isConnected, address]);

  // Handle disconnection
  useEffect(() => {
    if (!isConnected && hasCheckedConnection && !wagmiReconnecting) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔌 Wallet disconnected');
      }
    }
  }, [isConnected, hasCheckedConnection, wagmiReconnecting]);

  // Manual disconnect function
  const disconnectWallet = async () => {
    try {
      console.log('👋 Disconnecting wallet...');
      await disconnect();
      toast.success('Wallet disconnected');
    } catch (error) {
      console.error('❌ Disconnect error:', error);
      toast.error('Failed to disconnect wallet');
    }
  };

  return {
    isInitializing,
    isReconnecting: wagmiReconnecting,
    hasAttemptedReconnect: hasCheckedConnection,
    disconnectWallet,
  };
};