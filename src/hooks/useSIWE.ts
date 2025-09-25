import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';

interface SIWEState {
  isAuthenticated: boolean;
  message: string | null;
  signature: string | null;
  address: string | null;
  issuedAt: string | null;
  expirationTime: string | null;
}

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const useSIWE = () => {
  const { address, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [siweState, setSiweState] = useState<SIWEState>({
    isAuthenticated: false,
    message: null,
    signature: null,
    address: null,
    issuedAt: null,
    expirationTime: null
  });
  const [isPending, setIsPending] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const getStorageKey = (walletAddress: string) => {
    return `hibeats_siwe_${walletAddress.toLowerCase()}`;
  };

  const generateSIWEMessage = useCallback((walletAddress: string, chainId: number) => {
    const domain = window.location.host;
    const origin = window.location.origin;
    const issuedAt = new Date().toISOString();
    const expirationTime = new Date(Date.now() + SESSION_DURATION).toISOString();
    const nonce = Math.random().toString(36).substring(2, 10); // Shortened nonce

    const siweMessage = new SiweMessage({
      domain,
      address: walletAddress,
      statement: 'Sign in to HiBeats',
      uri: origin,
      version: '1',
      chainId,
      nonce,
      issuedAt,
      expirationTime
      // Removed resources to keep message shorter
    });

    return {
      message: siweMessage.prepareMessage(),
      siweMessage,
      issuedAt,
      expirationTime
    };
  }, []);

  const loadSIWEState = useCallback(() => {
    console.log('🔍 Loading SIWE state for:', address?.slice(0, 6) + '...');
    
    if (!address) {
      setSiweState({
        isAuthenticated: false,
        message: null,
        signature: null,
        address: null,
        issuedAt: null,
        expirationTime: null
      });
      setIsInitialized(true);
      return;
    }

    try {
      const storageKey = getStorageKey(address);
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        const parsed: SIWEState = JSON.parse(stored);
        
        // Validate SIWE message
        if (parsed.message && parsed.signature && parsed.expirationTime) {
          const now = new Date();
          const expiry = new Date(parsed.expirationTime);
          const isValid = now < expiry;
          
          console.log('📋 SIWE validation:', {
            hasMessage: !!parsed.message,
            hasSignature: !!parsed.signature,
            expiresAt: parsed.expirationTime,
            isValid
          });

          if (isValid) {
            // Simple validation: check if message contains the address
            const messageContainsAddress = parsed.message.toLowerCase().includes(address.toLowerCase());
            
            if (messageContainsAddress) {
              setSiweState({ ...parsed, isAuthenticated: true });
              console.log('✅ Valid SIWE session restored');
              setIsInitialized(true);
              return;
            } else {
              console.log('❌ Address mismatch in SIWE message');
            }
          }
        }
        
        // Clear invalid session
        console.log('🗑️ Expired or invalid SIWE session cleared');
        localStorage.removeItem(storageKey);
      }
      
      setSiweState({
        isAuthenticated: false,
        message: null,
        signature: null,
        address: null,
        issuedAt: null,
        expirationTime: null
      });
    } catch (error) {
      console.error('❌ Error loading SIWE state:', error);
      setSiweState({
        isAuthenticated: false,
        message: null,
        signature: null,
        address: null,
        issuedAt: null,
        expirationTime: null
      });
    }
    
    setIsInitialized(true);
  }, [address]);

  const signInWithEthereum = useCallback(async (): Promise<boolean> => {
    if (!address || !chainId) return false;

    setIsPending(true);
    console.log('🔐 Starting SIWE authentication...');
    
    try {
      const { message, siweMessage, issuedAt, expirationTime } = generateSIWEMessage(address, chainId);
      
      console.log('📝 SIWE Message:', message);
      
      const signature = await signMessageAsync({ 
        message,
        account: address as `0x${string}`
      });

      // Verify the signature (simplified for client-side)
      console.log('✅ SIWE message signed successfully');

      const newSiweState: SIWEState = {
        isAuthenticated: true,
        message,
        signature,
        address,
        issuedAt,
        expirationTime
      };

      // Save to localStorage
      const storageKey = getStorageKey(address);
      localStorage.setItem(storageKey, JSON.stringify(newSiweState));
      
      // Update state
      setSiweState(newSiweState);
      
      console.log('✅ SIWE authentication successful');
      return true;

    } catch (error: any) {
      console.error('❌ SIWE authentication failed:', error);
      return false;
    } finally {
      setIsPending(false);
    }
  }, [address, chainId, signMessageAsync, generateSIWEMessage]);

  const signOut = useCallback(() => {
    if (address) {
      const storageKey = getStorageKey(address);
      localStorage.removeItem(storageKey);
    }
    
    setSiweState({
      isAuthenticated: false,
      message: null,
      signature: null,
      address: null,
      issuedAt: null,
      expirationTime: null
    });
    
    console.log('🚪 SIWE sign out completed');
  }, [address]);

  const verifySession = useCallback(async (): Promise<boolean> => {
    if (!siweState.message || !siweState.signature || !address) {
      return false;
    }

    try {
      const siweMessage = new SiweMessage(siweState.message);
      
      // Simple validation - check expiration time
      if (siweState.expirationTime) {
        const now = new Date();
        const expiry = new Date(siweState.expirationTime);
        if (now > expiry) {
          console.log('🔍 SIWE session expired');
          return false;
        }
      }

      // Verify address matches
      if (siweMessage.address.toLowerCase() !== address.toLowerCase()) {
        console.log('🔍 SIWE address mismatch');
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ SIWE session verification failed:', error);
      return false;
    }
  }, [siweState, address]);

  // Load state when address changes
  useEffect(() => {
    loadSIWEState();
  }, [loadSIWEState]);

  return {
    siweState,
    isPending,
    isInitialized,
    signInWithEthereum,
    signOut,
    verifySession
  };
};