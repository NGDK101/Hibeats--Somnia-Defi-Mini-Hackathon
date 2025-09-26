import React, { createContext, useContext, ReactNode } from 'react';
import { useSimplifiedWalletPersistence } from '@/hooks/useSimplifiedWalletPersistence';

interface WalletPersistenceContextType {
  isReconnecting: boolean;
  hasAttemptedReconnect: boolean;
  isInitializing: boolean;
  disconnectWallet: () => Promise<void>;
}

const WalletPersistenceContext = createContext<WalletPersistenceContextType | null>(null);

interface WalletPersistenceProviderProps {
  children: ReactNode;
}

export const WalletPersistenceProvider = ({ children }: WalletPersistenceProviderProps) => {
  const walletPersistence = useSimplifiedWalletPersistence();

  return (
    <WalletPersistenceContext.Provider value={walletPersistence}>
      {children}
    </WalletPersistenceContext.Provider>
  );
};

export const useWalletPersistenceContext = () => {
  const context = useContext(WalletPersistenceContext);
  if (!context) {
    throw new Error('useWalletPersistenceContext must be used within a WalletPersistenceProvider');
  }
  return context;
};