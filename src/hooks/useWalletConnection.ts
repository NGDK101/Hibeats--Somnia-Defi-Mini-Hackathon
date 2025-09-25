import { useCallback, useRef, useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { toast } from 'sonner';
import { useClickThrottle } from './useClickThrottle';

export const useWalletConnection = () => {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  
  const [connectionAttempted, setConnectionAttempted] = useState(false);
  const connectingRef = useRef(false);
  const connectionTimeoutRef = useRef<NodeJS.Timeout>();

  // Internal connect function
  const _internalConnect = useCallback(async () => {
    if (connectingRef.current || isConnecting || isReconnecting) {
      console.log('Connection already in progress, skipping...');
      return;
    }

    try {
      connectingRef.current = true;
      setConnectionAttempted(true);

      // Set a timeout for connection attempts
      connectionTimeoutRef.current = setTimeout(() => {
        if (connectingRef.current) {
          connectingRef.current = false;
          setConnectionAttempted(false);
          toast.error('Connection timeout. Please try again.');
        }
      }, 30000); // 30 second timeout

      const metamaskConnector = connectors.find(
        (connector) => connector.name === 'MetaMask' || connector.id === 'metaMask'
      );

      if (metamaskConnector) {
        await connect({ connector: metamaskConnector });
      } else {
        // Fallback to injected connector
        const injectedConnector = connectors.find(
          (connector) => connector.type === 'injected'
        );
        
        if (injectedConnector) {
          await connect({ connector: injectedConnector });
        } else {
          // Use first available connector
          const availableConnector = connectors[0];
          if (availableConnector) {
            await connect({ connector: availableConnector });
          } else {
            throw new Error('No wallet connectors available');
          }
        }
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      toast.error(error?.message || 'Failed to connect wallet');
    } finally {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      connectingRef.current = false;
    }
  }, [connect, connectors, isConnecting, isReconnecting]);

  // Throttled connection handler to prevent spam
  const { throttledCallback: handleConnect } = useClickThrottle(_internalConnect, 2000);

  // Handle connection errors
  useEffect(() => {
    if (error && connectionAttempted) {
      console.error('Wallet connection error:', error);
      
      // More specific error messages
      let errorMessage = 'Connection failed';
      
      if (error.message.includes('rejected')) {
        errorMessage = 'Connection rejected by user';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Connection timed out';
      } else if (error.message.includes('not found')) {
        errorMessage = 'Wallet not found. Please install MetaMask.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      setConnectionAttempted(false);
      connectingRef.current = false;
    }
  }, [error, connectionAttempted]);

  // Reset connection state when disconnected
  useEffect(() => {
    if (!isConnected && !isConnecting && !isReconnecting) {
      setConnectionAttempted(false);
      connectingRef.current = false;
      
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
    }
  }, [isConnected, isConnecting, isReconnecting]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
    };
  }, []);

  // Handle disconnect
  const handleDisconnect = useCallback(() => {
    try {
      disconnect();
      toast.success('Wallet disconnected');
    } catch (error: any) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect wallet');
    }
  }, [disconnect]);

  // Check if MetaMask is available
  const isMetaMaskAvailable = useCallback(() => {
    return typeof window !== 'undefined' && 
           typeof window.ethereum !== 'undefined' && 
           window.ethereum.isMetaMask;
  }, []);

  // Get connection status
  const connectionStatus = {
    isLoading: isConnecting || isReconnecting || isPending || connectingRef.current,
    isConnected,
    isAttempting: connectionAttempted,
    hasError: !!error && connectionAttempted,
  };

  return {
    // Connection methods
    handleConnect,
    handleDisconnect,
    
    // Connection status
    ...connectionStatus,
    
    // Wallet info
    address,
    connectors,
    
    // Utilities
    isMetaMaskAvailable,
  };
};