import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';

interface SimpleSIWEState {
  isAuthenticated: boolean;
  message: string | null;
  signature: string | null;
  address: string | null;
  issuedAt: string | null;
  expirationTime: string | null;
  domain: string | null;
  nonce: string | null;
}

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const useSimpleSIWE = () => {
  const { address, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [siweState, setSiweState] = useState<SimpleSIWEState>({
    isAuthenticated: false,
    message: null,
    signature: null,
    address: null,
    issuedAt: null,
    expirationTime: null,
    domain: null,
    nonce: null
  });
  const [isPending, setIsPending] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const getStorageKey = (walletAddress: string) => {
    return `hibeats_siwe_${walletAddress.toLowerCase()}`;
  };

  // Generate SIWE-compliant message manually
  const generateSIWEMessage = useCallback((walletAddress: string, chainId: number) => {
    const domain = window.location.host;
    const uri = window.location.origin;
    const issuedAt = new Date().toISOString();
    const expirationTime = new Date(Date.now() + SESSION_DURATION).toISOString();
    const nonce = Math.random().toString(36).substring(2, 10);

    // SIWE standard message format (EIP-4361)
    const message = `${domain} wants you to sign in with your Ethereum account:
${walletAddress}

Sign in to HiBeats

URI: ${uri}
Version: 1
Chain ID: ${chainId}
Nonce: ${nonce}
Issued At: ${issuedAt}
Expiration Time: ${expirationTime}`;

    return {
      message,
      domain,
      uri,
      issuedAt,
      expirationTime,
      nonce
    };
  }, []);

  const loadSIWEState = useCallback(() => {
    console.log('🔍 Loading Simple SIWE state for:', address?.slice(0, 6) + '...');
    
    if (!address) {
      setSiweState({
        isAuthenticated: false,
        message: null,
        signature: null,
        address: null,
        issuedAt: null,
        expirationTime: null,
        domain: null,
        nonce: null
      });
      setIsInitialized(true);
      return;
    }

    try {
      const storageKey = getStorageKey(address);
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        const parsed: SimpleSIWEState = JSON.parse(stored);
        
        // Validate SIWE session
        if (parsed.message && parsed.signature && parsed.expirationTime) {
          const now = new Date();
          const expiry = new Date(parsed.expirationTime);
          const isValid = now < expiry;
          
          console.log('📋 Simple SIWE validation:', {
            hasMessage: !!parsed.message,
            hasSignature: !!parsed.signature,
            expiresAt: parsed.expirationTime,
            isValid
          });

          if (isValid) {
            // Verify address in message
            const messageContainsAddress = parsed.message.includes(address);
            const addressMatches = parsed.address?.toLowerCase() === address.toLowerCase();
            
            if (messageContainsAddress && addressMatches) {
              setSiweState({ ...parsed, isAuthenticated: true });
              console.log('✅ Valid Simple SIWE session restored');
              setIsInitialized(true);
              return;
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
        expirationTime: null,
        domain: null,
        nonce: null
      });
    } catch (error) {
      console.error('❌ Error loading Simple SIWE state:', error);
      setSiweState({
        isAuthenticated: false,
        message: null,
        signature: null,
        address: null,
        issuedAt: null,
        expirationTime: null,
        domain: null,
        nonce: null
      });
    }
    
    setIsInitialized(true);
  }, [address]);

  const signInWithEthereum = useCallback(async (): Promise<boolean> => {
    if (!address || !chainId) return false;

    setIsPending(true);
    console.log('🔐 Starting Simple SIWE authentication...');
    
    try {
      const { message, domain, uri, issuedAt, expirationTime, nonce } = generateSIWEMessage(address, chainId);
      
      console.log('📝 SIWE Message:', message);
      
      const signature = await signMessageAsync({ 
        message,
        account: address as `0x${string}`
      });

      const newSiweState: SimpleSIWEState = {
        isAuthenticated: true,
        message,
        signature,
        address,
        issuedAt,
        expirationTime,
        domain,
        nonce
      };

      // Save to localStorage
      const storageKey = getStorageKey(address);
      localStorage.setItem(storageKey, JSON.stringify(newSiweState));
      
      // Update state
      setSiweState(newSiweState);
      
      console.log('✅ Simple SIWE authentication successful');
      return true;

    } catch (error: any) {
      console.error('❌ Simple SIWE authentication failed:', error);
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
      expirationTime: null,
      domain: null,
      nonce: null
    });
    
    console.log('🚪 Simple SIWE sign out completed');
  }, [address]);

  const verifySession = useCallback((): boolean => {
    if (!siweState.message || !siweState.signature || !address) {
      return false;
    }

    // Simple validation
    if (siweState.expirationTime) {
      const now = new Date();
      const expiry = new Date(siweState.expirationTime);
      if (now > expiry) {
        console.log('🔍 SIWE session expired');
        return false;
      }
    }

    // Verify address matches
    const addressMatches = siweState.address?.toLowerCase() === address.toLowerCase();
    const messageContainsAddress = siweState.message.includes(address);
    
    if (!addressMatches || !messageContainsAddress) {
      console.log('🔍 SIWE address mismatch');
      return false;
    }

    return true;
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