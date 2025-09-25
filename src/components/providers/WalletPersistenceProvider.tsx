import { ReactNode, useEffect } from 'react';
import { useWalletPersistence } from '@/hooks/useWalletPersistence';
import { useAccount } from 'wagmi';

interface WalletPersistenceProviderProps {
  children: ReactNode;
}

export const WalletPersistenceProvider = ({ children }: WalletPersistenceProviderProps) => {
  const { isConnected } = useAccount();
  const { isReconnecting, hasAttemptedReconnect, isInitializing } = useWalletPersistence();

  // Optional: Add loading state while attempting reconnection
  useEffect(() => {
    if (isInitializing) {
      console.log('🔄 Wallet initialization in progress...');
    }
    
    if (isReconnecting) {
      console.log('🔄 Wallet reconnection in progress...');
    }
    
    if (hasAttemptedReconnect && !isInitializing) {
      console.log('✅ Wallet persistence initialization complete');
    }
  }, [isReconnecting, hasAttemptedReconnect, isInitializing]);

  // Show app immediately - the loading states are handled by individual components
  return <>{children}</>;
};