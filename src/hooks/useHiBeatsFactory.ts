import React from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { CONTRACT_ADDRESSES, HIBEATS_FACTORY_ABI, HIBEATS_NFT_ABI } from '../contracts';

export function useHiBeatsFactory() {
  const { address } = useAccount();
  const { data: balance } = useBalance({
    address: address,
  });

  // Read advanced generation fee from factory contract
  const { data: advancedGenerationFee } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_FACTORY,
    abi: HIBEATS_FACTORY_ABI,
    functionName: 'advancedGenerationFee',
  });

  // Read generation fee from factory contract
  const { data: generationFee } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_FACTORY,
    abi: HIBEATS_FACTORY_ABI,
    functionName: 'generationFee',
  });

  // Read user requests from factory contract
  const { data: userRequests, refetch: refetchUserRequests } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_FACTORY,
    abi: HIBEATS_FACTORY_ABI,
    functionName: 'getUserRequests',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Read daily generations left from factory contract
  const { data: dailyGenerationsLeft, refetch: refetchDailyGenerationsLeft } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_FACTORY,
    abi: HIBEATS_FACTORY_ABI,
    functionName: 'getDailyGenerationsLeft',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Read user task IDs from factory contract
  const { data: userTaskIds, refetch: refetchUserTaskIds } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_FACTORY,
    abi: HIBEATS_FACTORY_ABI,
    functionName: 'getUserTaskIds',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Read user completed task IDs from factory contract
  const { data: userCompletedTaskIds, refetch: refetchUserCompletedTaskIds } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_FACTORY,
    abi: HIBEATS_FACTORY_ABI,
    functionName: 'getUserCompletedTaskIds',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Debug logging for contract data

  // Debug logging for contract data
  React.useEffect(() => {
    if (userCompletedTaskIds) {
    }
  }, [userCompletedTaskIds, address]);

  // Write contract functions
  const { writeContract, data: hash, error, isPending } = useWriteContract();


  // Wait for transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Request generation function with transaction waiting
  const requestGeneration = async (params: {
    prompt: string;
    style: string;
    instrumental: boolean;
    mode: 'Simple' | 'Advanced';
    taskId: string; // Required task ID from Suno API
    title?: string;
    vocalGender?: string;
    model?: string;
    duration?: number;
    tempo?: string;
    key?: string;
    mood?: string;
    lyricsMode?: string;
    value?: bigint; // Payment amount (optional, will use appropriate fee if not provided)
  }) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    if (!params.taskId) {
      throw new Error('Task ID is required');
    }

    // Check if contract address is available
    if (!CONTRACT_ADDRESSES.HIBEATS_FACTORY) {
      throw new Error('Factory contract address not configured');
    }


    // Use provided value or get appropriate fee from contract
    let paymentValue: bigint;
    if (params.value !== undefined) {
      paymentValue = params.value;
    } else {
      if (params.mode === 'Simple') {
        paymentValue = (generationFee as bigint) || 1000000000000000n; // 0.001 ether fallback
      } else {
        paymentValue = (advancedGenerationFee as bigint) || 2000000000000000n; // 0.002 ether fallback
      }
    }

    // Check balance
    if (balance && balance.value < paymentValue) {
      throw new Error(`Insufficient balance. Required: ${(Number(paymentValue) / 1e18).toFixed(4)} STT, Available: ${(Number(balance.value) / 1e18).toFixed(4)} STT`);
    }

    return new Promise((resolve, reject) => {
      try {
        //   address: CONTRACT_ADDRESSES.HIBEATS_FACTORY,
        //   functionName: 'requestMusicGeneration',
        //   args: [
        //     params.prompt,
        //     params.style,
        //     params.instrumental,
        //     params.mode === 'Simple' ? 0 : 1,
        //     params.taskId,
        //     params.title || "",
        //     params.vocalGender || "",
        //     params.lyricsMode || ""
        //   ],
        //   value: paymentValue
        // });

        // Check if writeContract is available
        if (!writeContract) {
          throw new Error('writeContract function not available - wallet may not be properly connected');
        }

        // Call the write contract function
        writeContract({
          address: CONTRACT_ADDRESSES.HIBEATS_FACTORY,
          abi: HIBEATS_FACTORY_ABI,
          functionName: 'requestMusicGeneration',
          args: [
            params.prompt,
            params.style,
            params.instrumental,
            params.mode === 'Simple' ? 0 : 1, // Convert mode to enum index
            params.taskId,
            params.title || "",
            params.vocalGender || "",
            params.lyricsMode || ""
          ],
          value: paymentValue, // Use the calculated payment value
        } as any);


        // Set up a watcher for the hash to become available
        const checkHash = () => {
          if (hash) {
            resolve({ hash, value: paymentValue });
          } else if (error) {
            console.error('❌ Transaction error:', error);
            // Check if it's a user rejection
            if (error.message && error.message.includes('rejected')) {
              reject(new Error('Transaction rejected by user'));
            } else {
              reject(error);
            }
          } else {
            // Continue checking
            setTimeout(checkHash, 100);
          }
        };

        // Start checking immediately
        checkHash();

        // Timeout after 30 seconds
        // setTimeout(() => {
        //   reject(new Error('Transaction timeout - no hash received within 30 seconds'));
        // }, 300000);
      } catch (contractError) {
        console.error('❌ Contract call error:', contractError);
        reject(contractError);
      }
    });
  };

  // Complete music generation function - DISABLED (no longer needed)
  // const completeMusicGeneration = async (params: {
  //   requestId: bigint;
  //   metadataURI: string;
  //   duration: number;
  //   tags: string;
  //   modelName: string;
  //   createTime: number;
  // }): Promise<{ hash: string }> => {
  //   return new Promise((resolve, reject) => {
  //     reject(new Error('completeMusicGeneration is disabled - rewards now given directly on generation request'));
  //   });
  // };

  // New function to wait for transaction confirmation
  const waitForTransactionConfirmation = async (transactionHash: string): Promise<void> => {
    
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 30; // 30 attempts * 2 seconds = 60 seconds max wait

      const checkConfirmation = async () => {
        attempts++;

        try {
          // Direct blockchain check
          const { getPublicClient } = await import('wagmi/actions');
          const { config } = await import('../config/web3');
          const publicClient = getPublicClient(config);

          const receipt = await publicClient.getTransactionReceipt({
            hash: transactionHash as `0x${string}`,
          });

          if (receipt) {
            if (receipt.status === 'success') {
              resolve();
            } else {
              reject(new Error('Transaction failed'));
            }
          } else if (attempts >= maxAttempts) {
            reject(new Error('Transaction confirmation timeout'));
          } else {
            // Continue polling
            setTimeout(checkConfirmation, 2000);
          }
        } catch (error) {
          if (attempts >= maxAttempts) {
            reject(new Error(`Transaction confirmation failed: ${error}`));
          } else {
            // Continue polling on error
            setTimeout(checkConfirmation, 2000);
          }
        }
      };

      checkConfirmation();
    });
  };

  return {
    // Read functions
    userRequests: userRequests as bigint[] | undefined,
    refetchUserRequests,
    userTaskIds: userTaskIds as string[] | undefined,
    refetchUserTaskIds,
    userCompletedTaskIds: userCompletedTaskIds as string[] | undefined,
    refetchUserCompletedTaskIds,
    dailyGenerationsLeft: dailyGenerationsLeft as bigint | undefined,
    refetchDailyGenerationsLeft,
    generationFee: generationFee as bigint | undefined,
    advancedGenerationFee: advancedGenerationFee as bigint | undefined,

  // Write functions
  requestGeneration,
  waitForTransactionConfirmation,    // Transaction status
    hash,
    error,
    isPending,
    isConfirming,
    isSuccess,
  };
}
