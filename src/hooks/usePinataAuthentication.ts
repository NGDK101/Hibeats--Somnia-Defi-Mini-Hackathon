import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';

interface PinataAuthState {
  isAuthenticated: boolean;
  signature: string | null;
  timestamp: number | null;
  ipfsHash: string | null;
}

const SESSION_DURATION = 3 * 24 * 60 * 60 * 1000; // 3 days
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || '';
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

export const usePinataAuthentication = () => {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [authState, setAuthState] = useState<PinataAuthState>({
    isAuthenticated: false,
    signature: null,
    timestamp: null,
    ipfsHash: null
  });
  const [isPending, setIsPending] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const getLocalStorageKey = (walletAddress: string) => {
    return `hibeats_pinata_auth_${walletAddress.toLowerCase()}`;
  };

  const pinJSONToIPFS = async (data: any) => {
    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PINATA_JWT}`
        },
        body: JSON.stringify({
          pinataContent: data,
          pinataMetadata: {
            name: `hibeats_session_${address}`,
            keyvalues: {
              address: address,
              type: 'authentication_session',
              timestamp: Date.now().toString()
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to pin to IPFS');
      }

      const result = await response.json();
      return result.IpfsHash;
    } catch (error) {
      console.error('❌ Pinata pinning error:', error);
      return null;
    }
  };

  const getJSONFromIPFS = async (ipfsHash: string) => {
    try {
      const response = await fetch(`${PINATA_GATEWAY}${ipfsHash}`);
      if (!response.ok) {
        throw new Error('Failed to fetch from IPFS');
      }
      return await response.json();
    } catch (error) {
      console.error('❌ IPFS retrieval error:', error);
      return null;
    }
  };

  const generateAuthMessage = (walletAddress: string) => {
    const timestamp = Date.now();
    return `Welcome to HiBeats! 🎵

Please sign this message to authenticate your wallet with decentralized session management.

Address: ${walletAddress}
Time: ${new Date(timestamp).toISOString()}
Nonce: ${timestamp}
Storage: IPFS via Pinata

This is free and secure - no gas fees required.`;
  };

  // Load auth state from localStorage (IPFS hash) and then from IPFS
  const loadAuthState = useCallback(async () => {
    console.log('🔍 Loading Pinata auth state for:', address?.slice(0, 6) + '...');
    
    if (!address) {
      setAuthState({
        isAuthenticated: false,
        signature: null,
        timestamp: null,
        ipfsHash: null
      });
      setIsInitialized(true);
      return;
    }

    try {
      const storageKey = getLocalStorageKey(address);
      const storedHash = localStorage.getItem(storageKey);
      
      if (storedHash) {
        console.log('📋 Found IPFS hash in localStorage:', storedHash.slice(0, 10) + '...');
        
        // Get session data from IPFS
        const sessionData = await getJSONFromIPFS(storedHash);
        
        if (sessionData && sessionData.timestamp) {
          const now = Date.now();
          const age = now - sessionData.timestamp;
          const isValid = age < SESSION_DURATION;
          
          console.log('📋 Pinata auth validation:', {
            hasData: !!sessionData,
            age: Math.round(age / 1000 / 60) + ' minutes',
            isValid
          });

          if (isValid && sessionData.signature) {
            setAuthState({
              isAuthenticated: true,
              signature: sessionData.signature,
              timestamp: sessionData.timestamp,
              ipfsHash: storedHash
            });
            console.log('✅ Valid Pinata auth restored from IPFS');
          } else {
            localStorage.removeItem(storageKey);
            setAuthState({
              isAuthenticated: false,
              signature: null,
              timestamp: null,
              ipfsHash: null
            });
            console.log('🗑️ Expired Pinata auth cleared');
          }
        } else {
          console.log('❌ Failed to retrieve session from IPFS');
          localStorage.removeItem(storageKey);
          setAuthState({
            isAuthenticated: false,
            signature: null,
            timestamp: null,
            ipfsHash: null
          });
        }
      } else {
        console.log('📄 No stored IPFS hash found');
        setAuthState({
          isAuthenticated: false,
          signature: null,
          timestamp: null,
          ipfsHash: null
        });
      }
    } catch (error) {
      console.error('❌ Error loading Pinata auth:', error);
      setAuthState({
        isAuthenticated: false,
        signature: null,
        timestamp: null,
        ipfsHash: null
      });
    }
    
    setIsInitialized(true);
  }, [address]);

  // Authenticate wallet and store in IPFS via Pinata
  const authenticateWallet = useCallback(async (): Promise<boolean> => {
    if (!address) return false;

    setIsPending(true);
    console.log('🔐 Starting Pinata authentication...');
    
    try {
      const message = generateAuthMessage(address);
      const signature = await signMessageAsync({ 
        message,
        account: address as `0x${string}`
      });
      const timestamp = Date.now();

      const sessionData = {
        address,
        signature,
        timestamp,
        expires: timestamp + SESSION_DURATION,
        message
      };

      console.log('📌 Pinning session to IPFS via Pinata...');
      const ipfsHash = await pinJSONToIPFS(sessionData);

      if (!ipfsHash) {
        throw new Error('Failed to pin session to IPFS');
      }

      console.log('✅ Session pinned to IPFS:', ipfsHash);

      const newAuthState: PinataAuthState = {
        isAuthenticated: true,
        signature,
        timestamp,
        ipfsHash
      };

      // Save IPFS hash to localStorage for quick access
      const storageKey = getLocalStorageKey(address);
      localStorage.setItem(storageKey, ipfsHash);
      
      // Update state
      setAuthState(newAuthState);
      
      console.log('✅ Pinata authentication successful');
      return true;

    } catch (error: any) {
      console.error('❌ Pinata authentication failed:', error);
      return false;
    } finally {
      setIsPending(false);
    }
  }, [address, signMessageAsync]);

  // Clear authentication
  const clearAuthentication = useCallback(() => {
    if (address) {
      const storageKey = getLocalStorageKey(address);
      localStorage.removeItem(storageKey);
    }
    
    setAuthState({
      isAuthenticated: false,
      signature: null,
      timestamp: null,
      ipfsHash: null
    });
    
    console.log('🗑️ Pinata authentication cleared');
  }, [address]);

  // Load state when address changes
  useEffect(() => {
    loadAuthState();
  }, [loadAuthState]);

  return {
    authState,
    isPending,
    isInitialized,
    authenticateWallet,
    clearAuthentication
  };
};