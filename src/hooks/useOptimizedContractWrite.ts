import { useCallback, useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { toast } from 'sonner';
import { useGasOptimization } from './useGasOptimization';
import type { Address, Abi } from 'viem';

export interface ContractWriteParams {
  address: Address;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
  value?: bigint;
  gasMultiplier?: number; // Multiplier for gas estimate (default 1.2)
}

export interface TransactionState {
  isLoading: boolean;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: string | null;
  hash?: string;
}

export const useOptimizedContractWrite = () => {
  const { address: userAddress } = useAccount();
  const { getOptimalGasSettings } = useGasOptimization();
  const [transactionState, setTransactionState] = useState<TransactionState>({
    isLoading: false,
    isPending: false,
    isConfirming: false,
    isSuccess: false,
    error: null,
  });

  const { 
    writeContractAsync, 
    data: hash, 
    error: writeError, 
    isPending: isWritePending 
  } = useWriteContract();
  
  const { 
    isLoading: isConfirming, 
    isSuccess,
    error: receiptError 
  } = useWaitForTransactionReceipt({ 
    hash,
    // Optimize confirmation polling
    pollingInterval: 2000, // Check every 2 seconds instead of default
  });

  // Optimized contract write with gas estimation
  const writeContract = useCallback(async (params: ContractWriteParams): Promise<string | null> => {
    if (!userAddress) {
      const error = 'Wallet not connected';
      setTransactionState(prev => ({ ...prev, error }));
      toast.error(error);
      return null;
    }

    try {
      setTransactionState({
        isLoading: true,
        isPending: true,
        isConfirming: false,
        isSuccess: false,
        error: null,
      });

      // Get optimal gas settings for faster transactions
      let gasSettings;
      try {
        console.log('⛽ Getting optimal gas settings...');
        gasSettings = await getOptimalGasSettings({
          address: params.address,
          abi: params.abi,
          functionName: params.functionName,
          args: params.args,
          value: params.value,
        });
        
        if (gasSettings) {
          console.log('✅ Gas settings optimized:', gasSettings);
        }
      } catch (gasError) {
        console.warn('⚠️ Gas optimization failed, using defaults:', gasError);
        gasSettings = null;
      }

      console.log('🚀 Executing contract write with params:', {
        address: params.address,
        functionName: params.functionName,
        args: params.args,
        ...gasSettings,
      });

      // Execute transaction with optimized gas settings
      const txHash = await writeContractAsync({
        address: params.address,
        abi: params.abi,
        functionName: params.functionName,
        args: params.args,
        value: params.value,
        // Apply gas optimizations if available
        ...(gasSettings || {}),
      } as any);

      setTransactionState(prev => ({
        ...prev,
        isPending: false,
        isConfirming: true,
        hash: txHash,
      }));

      console.log('✅ Transaction submitted:', txHash);
      toast.success('Transaction submitted! Waiting for confirmation...');
      
      return txHash;

    } catch (error: any) {
      console.error('❌ Contract write failed:', error);
      
      let errorMessage = 'Transaction failed';
      
      // Handle common error types
      if (error.message?.includes('rejected')) {
        errorMessage = 'Transaction was rejected by user';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction';
      } else if (error.message?.includes('gas')) {
        errorMessage = 'Gas estimation failed. Try adjusting gas settings.';
      } else if (error.message?.includes('nonce')) {
        errorMessage = 'Transaction nonce error. Please try again.';
      } else if (error.shortMessage) {
        errorMessage = error.shortMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setTransactionState({
        isLoading: false,
        isPending: false,
        isConfirming: false,
        isSuccess: false,
        error: errorMessage,
      });

      toast.error(errorMessage);
      return null;
    }
  }, [userAddress, writeContractAsync]);

  // Update state based on wagmi hooks
  useState(() => {
    setTransactionState(prev => ({
      ...prev,
      isLoading: isWritePending || isConfirming,
      isPending: isWritePending,
      isConfirming,
      isSuccess,
      error: writeError?.message || receiptError?.message || prev.error,
      hash: hash || prev.hash,
    }));
  });

  // Reset function to clear transaction state
  const reset = useCallback(() => {
    setTransactionState({
      isLoading: false,
      isPending: false,
      isConfirming: false,
      isSuccess: false,
      error: null,
    });
  }, []);

  // Success notification effect
  useState(() => {
    if (isSuccess && hash) {
      toast.success('Transaction confirmed successfully!');
      console.log('✅ Transaction confirmed:', hash);
    }
  });

  return {
    writeContract,
    reset,
    ...transactionState,
    // Legacy compatibility
    writeContractAsync: writeContract,
    isPending: transactionState.isPending,
    isLoading: transactionState.isLoading,
  };
};