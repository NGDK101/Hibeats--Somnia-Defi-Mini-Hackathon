import { useEffect, useCallback } from 'react';
import { useAccount, useConnectors } from 'wagmi';
import { toast } from 'sonner';

export const useRainbowKitConnectionFix = () => {
  const { isConnecting, isReconnecting, isConnected } = useAccount();
  const connectors = useConnectors();

  // Monitor connection state and provide feedback
  useEffect(() => {
    if (isConnecting) {
      console.log('🔄 Connection in progress...');
    }
    
    if (isReconnecting) {
      console.log('🔄 Reconnecting...');
    }
  }, [isConnecting, isReconnecting]);

  // Handle successful connection
  useEffect(() => {
    if (isConnected) {
      console.log('✅ Wallet connected successfully');
    }
  }, [isConnected]);

  // Prevent multiple connection attempts
  const isConnectionInProgress = isConnecting || isReconnecting;

  // Custom connection handler with better error handling
  const handleConnectionError = useCallback((error: Error) => {
    console.error('Wallet connection error:', error);
    
    if (error.message.includes('rejected')) {
      toast.error('Connection was rejected by user');
    } else if (error.message.includes('already pending')) {
      toast.warning('Connection already in progress');
    } else if (error.message.includes('timeout')) {
      toast.error('Connection timed out. Please try again.');
    } else if (error.message.includes('not found')) {
      toast.error('Wallet not found. Please install MetaMask or another supported wallet.');
    } else {
      toast.error(`Connection failed: ${error.message}`);
    }
  }, []);

  // Check if MetaMask is available
  const isMetaMaskAvailable = useCallback(() => {
    return typeof window !== 'undefined' && 
           typeof window.ethereum !== 'undefined' && 
           window.ethereum.isMetaMask;
  }, []);

  // Get MetaMask connector
  const getMetaMaskConnector = useCallback(() => {
    return connectors.find(
      (connector) => connector.name === 'MetaMask' || connector.id === 'metaMask'
    );
  }, [connectors]);

  // Force refresh connectors if needed
  const refreshConnectors = useCallback(async () => {
    try {
      // Force a re-render by checking wallet availability
      if (typeof window !== 'undefined' && window.ethereum) {
        // Request accounts to wake up MetaMask
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      }
    } catch (error) {
      console.log('Could not refresh connectors:', error);
    }
  }, []);

  return {
    isConnectionInProgress,
    isMetaMaskAvailable,
    getMetaMaskConnector,
    handleConnectionError,
    refreshConnectors,
    connectors,
  };
};