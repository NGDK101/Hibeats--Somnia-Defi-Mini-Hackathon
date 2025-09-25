import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';

interface SIWEPinataAuthState {
  isAuthenticated: boolean;
  siweMessage: string | null;
  signature: string | null;
  address: string | null;
  ipfsHash: string | null;
  expirationTime: string | null;
}

const SESSION_DURATION = (import.meta.env.VITE_SESSION_DURATION_DAYS || 3) * 24 * 60 * 60 * 1000; // Default 3 days
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT || '';
const PINATA_GATEWAY = import.meta.env.VITE_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';
const SIWE_DOMAIN = import.meta.env.VITE_SIWE_DOMAIN || 'hibeats.xyz';
const SIWE_URI = import.meta.env.VITE_SIWE_URI || 'https://hibeats.xyz';
const SIWE_STATEMENT = import.meta.env.VITE_SIWE_STATEMENT || 'Sign in to HiBeats - Decentralized Music Platform 🎵';
const AUTH_STORAGE_PREFIX = import.meta.env.VITE_AUTH_STORAGE_PREFIX || 'hibeats_siwe_pinata';
const DEBUG_AUTH = import.meta.env.VITE_DEBUG_AUTH === 'true';
const TERMS_URL = import.meta.env.VITE_TERMS_URL || 'https://hibeats.xyz/terms';
const PRIVACY_URL = import.meta.env.VITE_PRIVACY_URL || 'https://hibeats.xyz/privacy';
const EIP_4361_URL = import.meta.env.VITE_EIP_4361_URL || 'https://eips.ethereum.org/EIPS/eip-4361';

export const useSIWEPinataAuth = () => {
  const { address, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [authState, setAuthState] = useState<SIWEPinataAuthState>({
    isAuthenticated: false,
    siweMessage: null,
    signature: null,
    address: null,
    ipfsHash: null,
    expirationTime: null
  });
  const [isPending, setIsPending] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const getLocalStorageKey = (walletAddress: string) => {
    return `${AUTH_STORAGE_PREFIX}_${walletAddress.toLowerCase()}`;
  };

  const generateNonce = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  // Pin SIWE session data to IPFS via Pinata
  const pinSIWESessionToIPFS = async (sessionData: any) => {
    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PINATA_JWT}`
        },
        body: JSON.stringify({
          pinataContent: sessionData,
          pinataMetadata: {
            name: `hibeats_siwe_session_${address}`,
            keyvalues: {
              address: address,
              type: 'siwe_authentication_session',
              standard: 'EIP-4361',
              timestamp: Date.now().toString(),
              chainId: chainId?.toString() || '1',
              domain: SIWE_DOMAIN,
              environment: import.meta.env.VITE_ENVIRONMENT || 'development'
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Pinata API error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ SIWE session pinned to IPFS:', result.IpfsHash);
      return result.IpfsHash;
    } catch (error) {
      console.error('❌ Pinata pinning error:', error);
      return null;
    }
  };

  // Get SIWE session data from IPFS
  const getSIWESessionFromIPFS = async (ipfsHash: string) => {
    try {
      console.log('📥 Fetching SIWE session from IPFS:', ipfsHash.slice(0, 10) + '...');
      const response = await fetch(`${PINATA_GATEWAY}${ipfsHash}`);
      
      if (!response.ok) {
        throw new Error(`IPFS fetch error: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ SIWE session retrieved from IPFS');
      return data;
    } catch (error) {
      console.error('❌ IPFS retrieval error:', error);
      return null;
    }
  };

  // Generate SIWE message (EIP-4361 compliant)
  const generateSIWEMessage = useCallback((walletAddress: string, chainId: number) => {
    const domain = SIWE_DOMAIN;
    const origin = SIWE_URI;
    const issuedAt = new Date().toISOString();
    const expirationTime = new Date(Date.now() + SESSION_DURATION).toISOString();
    const nonce = generateNonce();

    const siweMessage = new SiweMessage({
      domain,
      address: walletAddress,
      statement: SIWE_STATEMENT,
      uri: origin,
      version: '1',
      chainId,
      nonce,
      issuedAt,
      expirationTime,
      resources: [
        TERMS_URL,
        PRIVACY_URL,
        EIP_4361_URL
      ]
    });

    if (DEBUG_AUTH) {
      console.log('🔧 SIWE Message Configuration:', {
        domain,
        uri: origin,
        statement: SIWE_STATEMENT,
        sessionDuration: `${SESSION_DURATION / (24 * 60 * 60 * 1000)} days`,
        expirationTime
      });
    }

    return {
      siweMessage,
      messageText: siweMessage.prepareMessage(),
      expirationTime
    };
  }, []);

  // Load SIWE auth state from localStorage (IPFS hash) then IPFS
  const loadSIWEAuthState = useCallback(async () => {
    console.log('🔍 Loading SIWE+Pinata auth state for:', address?.slice(0, 6) + '...');
    
    if (!address) {
      setAuthState({
        isAuthenticated: false,
        siweMessage: null,
        signature: null,
        address: null,
        ipfsHash: null,
        expirationTime: null
      });
      setIsInitialized(true);
      return;
    }

    try {
      const storageKey = getLocalStorageKey(address);
      const storedHash = localStorage.getItem(storageKey);
      
      if (storedHash) {
        console.log('📋 Found SIWE IPFS hash:', storedHash.slice(0, 10) + '...');
        
        // Get SIWE session data from IPFS
        const sessionData = await getSIWESessionFromIPFS(storedHash);
        
        if (sessionData && sessionData.expirationTime) {
          const now = new Date();
          const expiry = new Date(sessionData.expirationTime);
          const isValid = now < expiry;
          
          console.log('📋 SIWE+Pinata validation:', {
            hasSession: !!sessionData,
            expiresAt: sessionData.expirationTime,
            isValid,
            standard: 'EIP-4361'
          });

          if (isValid && sessionData.signature && sessionData.siweMessage) {
            // Additional SIWE message validation
            try {
              const parsedSiwe = new SiweMessage(sessionData.siweMessage);
              if (parsedSiwe.address.toLowerCase() === address.toLowerCase()) {
                setAuthState({
                  isAuthenticated: true,
                  siweMessage: sessionData.siweMessage,
                  signature: sessionData.signature,
                  address: sessionData.address,
                  ipfsHash: storedHash,
                  expirationTime: sessionData.expirationTime
                });
                console.log('✅ Valid SIWE+Pinata session restored');
                setIsInitialized(true);
                return;
              }
            } catch (parseError) {
              console.error('❌ SIWE message parsing failed:', parseError);
            }
          }
        }
        
        // Clear invalid/expired session
        console.log('🗑️ Expired/invalid SIWE+Pinata session cleared');
        localStorage.removeItem(storageKey);
      }
      
      setAuthState({
        isAuthenticated: false,
        siweMessage: null,
        signature: null,
        address: null,
        ipfsHash: null,
        expirationTime: null
      });
    } catch (error) {
      console.error('❌ Error loading SIWE+Pinata auth:', error);
      setAuthState({
        isAuthenticated: false,
        siweMessage: null,
        signature: null,
        address: null,
        ipfsHash: null,
        expirationTime: null
      });
    }
    
    setIsInitialized(true);
  }, [address]);

  // Sign-In With Ethereum + Store to Pinata IPFS
  const signInWithEthereumPinata = useCallback(async (): Promise<boolean> => {
    if (!address || !chainId) {
      console.error('❌ Missing address or chainId');
      return false;
    }

    setIsPending(true);
    console.log('🔐 Starting SIWE+Pinata authentication...');
    
    try {
      // Generate SIWE message (EIP-4361)
      const { siweMessage, messageText, expirationTime } = generateSIWEMessage(address, chainId);
      
      console.log('📝 SIWE Message (EIP-4361):\n', messageText);
      
      // User signs SIWE message
      const signature = await signMessageAsync({ 
        message: messageText,
        account: address as `0x${string}`
      });

      console.log('✅ SIWE message signed');

      // Prepare session data for IPFS
      const sessionData = {
        siweMessage: messageText,
        signature,
        address,
        chainId,
        issuedAt: siweMessage.issuedAt,
        expirationTime,
        nonce: siweMessage.nonce,
        domain: siweMessage.domain,
        uri: siweMessage.uri,
        version: siweMessage.version,
        standard: 'EIP-4361',
        storage: 'IPFS-Pinata'
      };

      console.log('📌 Pinning SIWE session to IPFS...');
      const ipfsHash = await pinSIWESessionToIPFS(sessionData);

      if (!ipfsHash) {
        throw new Error('Failed to pin SIWE session to IPFS');
      }

      const newAuthState: SIWEPinataAuthState = {
        isAuthenticated: true,
        siweMessage: messageText,
        signature,
        address,
        ipfsHash,
        expirationTime
      };

      // Save IPFS hash to localStorage for quick access
      const storageKey = getLocalStorageKey(address);
      localStorage.setItem(storageKey, ipfsHash);
      
      // Update state
      setAuthState(newAuthState);
      
      console.log('✅ SIWE+Pinata authentication successful!');
      console.log('📦 Session stored on IPFS:', `https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
      return true;

    } catch (error: any) {
      console.error('❌ SIWE+Pinata authentication failed:', error);
      
      if (error?.message?.includes('User rejected')) {
        console.log('ℹ️ User rejected SIWE signature request');
      }
      
      return false;
    } finally {
      setIsPending(false);
    }
  }, [address, chainId, signMessageAsync, generateSIWEMessage]);

  // Sign out and clear session
  const signOut = useCallback(() => {
    if (address) {
      const storageKey = getLocalStorageKey(address);
      localStorage.removeItem(storageKey);
      console.log('🗑️ SIWE+Pinata session cleared for', address.slice(0, 6) + '...');
    }
    
    setAuthState({
      isAuthenticated: false,
      siweMessage: null,
      signature: null,
      address: null,
      ipfsHash: null,
      expirationTime: null
    });
    
    console.log('🚪 SIWE+Pinata sign out completed');
  }, [address]);

  // Load state when address changes
  useEffect(() => {
    loadSIWEAuthState();
  }, [loadSIWEAuthState]);

  return {
    authState,
    isPending,
    isInitialized,
    signInWithEthereumPinata,
    signOut
  };
};