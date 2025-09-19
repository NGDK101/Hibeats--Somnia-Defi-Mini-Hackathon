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
  // console.log(`🔍 Contract data for ${address}:`);
  // console.log(`- userTaskIds:`, userTaskIds);
  // console.log(`- userCompletedTaskIds:`, userCompletedTaskIds);

  // Debug logging for contract data
  React.useEffect(() => {
    if (userCompletedTaskIds) {
      // console.log(`🔗 Contract data loaded for ${address}:`);
      // console.log(`✅ Completed Task IDs:`, userCompletedTaskIds);
    }
  }, [userCompletedTaskIds, address]);

  // Write contract functions
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  console.log('🔍 useWriteContract status:', { hash, error, isPending });

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

    console.log('🏭 Using factory contract address:', CONTRACT_ADDRESSES.HIBEATS_FACTORY);

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
        console.log('🔄 CALLING writeContract with params:', {
          address: CONTRACT_ADDRESSES.HIBEATS_FACTORY,
          functionName: 'requestMusicGeneration',
          args: [
            params.prompt,
            params.style,
            params.instrumental,
            params.mode === 'Simple' ? 0 : 1,
            params.taskId,
            params.title || "",
            params.vocalGender || "",
            params.lyricsMode || ""
          ],
          value: paymentValue
        });

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

        console.log('✅ writeContract called, waiting for hash...');

        // Set up a watcher for the hash to become available
        const checkHash = () => {
          if (hash) {
            console.log('🎯 Transaction hash detected:', hash);
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

  // Complete music generation function
  const completeMusicGeneration = async (params: {
    requestId: bigint;
    metadataURI: string;
    duration: number;
    tags: string;
    modelName: string;
    createTime: number;
  }): Promise<{ hash: string }> => {
    console.log('🎵 Completing music generation with params:', params);

    return new Promise((resolve, reject) => {
      try {
        writeContract({
          address: CONTRACT_ADDRESSES.HIBEATS_FACTORY,
          abi: HIBEATS_FACTORY_ABI,
          functionName: 'completeMusicGeneration',
          args: [
            params.requestId,
            params.metadataURI,
            BigInt(params.duration),
            params.tags,
            params.modelName,
            BigInt(params.createTime)
          ],
        } as any);

        console.log('✅ writeContract called for completeMusicGeneration, waiting for hash...');

        // Set up a watcher for the hash to become available
        const checkHash = () => {
          if (hash) {
            console.log('🎯 Complete music generation hash detected:', hash);
            resolve({ hash });
          } else if (error) {
            console.error('❌ Complete music generation error:', error);
            reject(error);
          } else {
            // Continue checking
            setTimeout(checkHash, 100);
          }
        };

        // Start checking immediately
        checkHash();

        // Timeout after 30 seconds
        setTimeout(() => {
          reject(new Error('Complete music generation timeout - no hash received within 30 seconds'));
        }, 30000);
      } catch (contractError) {
        console.error('❌ Complete music generation contract call error:', contractError);
        reject(contractError);
      }
    });
  };

  // New function to wait for transaction confirmation
  const waitForTransactionConfirmation = async (transactionHash: string): Promise<void> => {
    console.log(`⏳ Waiting for transaction confirmation: ${transactionHash}`);
    
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 30; // 30 attempts * 2 seconds = 60 seconds max wait

      const checkConfirmation = async () => {
        attempts++;
        console.log(`🔍 Checking confirmation attempt ${attempts}/${maxAttempts} for ${transactionHash}`);

        try {
          // Direct blockchain check
          const { getPublicClient } = await import('wagmi/actions');
          const { config } = await import('../config/web3');
          const publicClient = getPublicClient(config);

          const receipt = await publicClient.getTransactionReceipt({
            hash: transactionHash as `0x${string}`,
          });

          if (receipt) {
            console.log(`📋 Transaction receipt found:`, receipt);
            if (receipt.status === 'success') {
              console.log(`✅ Transaction confirmed successfully: ${transactionHash}`);
              resolve();
            } else {
              console.log(`❌ Transaction failed with status: ${receipt.status}`);
              reject(new Error('Transaction failed'));
            }
          } else if (attempts >= maxAttempts) {
            console.log(`⏰ Transaction confirmation timeout after ${maxAttempts} attempts`);
            reject(new Error('Transaction confirmation timeout'));
          } else {
            // Continue polling
            console.log(`⏳ No receipt yet, will check again in 2s...`);
            setTimeout(checkConfirmation, 2000);
          }
        } catch (error) {
          console.log(`⚠️ Error checking confirmation (attempt ${attempts}):`, error);
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
    completeMusicGeneration,
    waitForTransactionConfirmation,

    // Transaction status
    hash,
    error,
    isPending,
    isConfirming,
    isSuccess,
  };
}
