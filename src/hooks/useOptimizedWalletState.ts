import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';

/**
 * OpenSea-style wallet state management
 * - Static-first approach
 * - Silent background reconnection
 * - No loading states shown to user
 * - Graceful feature availability
 */

export interface OptimizedWalletState {
  // Core states
  isConnected: boolean;
  address: string | undefined;

  // Feature availability (appears when ready, no loading states)
  isWalletReady: boolean;
  isAuthReady: boolean;

  // Background processes (hidden from user)
  isReconnecting: boolean;
  isAuthenticating: boolean;
}

export const useOptimizedWalletState = (): OptimizedWalletState => {
  const { address, isConnected } = useAccount();

  // Internal states (not exposed to UI)
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [walletReady, setWalletReady] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  // Check for existing wallet session synchronously
  const hasStoredWalletSession = useMemo(() => {
    try {
      const stored = localStorage.getItem('hibeats_wallet_connection');
      if (stored) {
        const state = JSON.parse(stored);
        const isRecent = Date.now() - state.timestamp < 7 * 24 * 60 * 60 * 1000;
        return isRecent && state.isConnected;
      }
    } catch {
      return false;
    }
    return false;
  }, []);

  // Check for existing auth session synchronously
  const hasStoredAuthSession = useMemo(() => {
    if (!address) return false;

    try {
      const authKey = `hibeats_auth_${address.toLowerCase()}`;
      const stored = localStorage.getItem(authKey);
      if (stored) {
        const authState = JSON.parse(stored);
        const age = Date.now() - (authState.timestamp || 0);
        const isValid = age < 3 * 24 * 60 * 60 * 1000; // 3 days
        return isValid && authState.signature;
      }
    } catch {
      return false;
    }
    return false;
  }, [address]);

  // Initialize wallet readiness
  useEffect(() => {
    if (isConnected && address) {
      // Wallet is ready immediately when connected
      setWalletReady(true);
      setIsReconnecting(false);
    } else if (hasStoredWalletSession) {
      // Background reconnection for stored session
      setIsReconnecting(true);
      setWalletReady(false);
    } else {
      // No wallet, show connect button
      setWalletReady(false);
      setIsReconnecting(false);
    }
  }, [isConnected, address, hasStoredWalletSession]);

  // Initialize auth readiness
  useEffect(() => {
    if (isConnected && address) {
      if (hasStoredAuthSession) {
        // Auth ready immediately for stored session
        setAuthReady(true);
        setIsAuthenticating(false);
      } else {
        // Need to authenticate, but don't block UI
        setAuthReady(false);
        setIsAuthenticating(false); // Let user manually trigger auth
      }
    } else {
      setAuthReady(false);
      setIsAuthenticating(false);
    }
  }, [isConnected, address, hasStoredAuthSession]);

  return {
    // Core states
    isConnected: isConnected || false,
    address,

    // Feature availability (graceful appearance)
    isWalletReady: walletReady,
    isAuthReady: authReady,

    // Background states (hidden from user)
    isReconnecting,
    isAuthenticating,
  };
};