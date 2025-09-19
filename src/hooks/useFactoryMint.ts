import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, HIBEATS_NFT_ABI, HIBEATS_FACTORY_ABI, type DirectMintParams, type CompleteMusicGenerationParams } from '../contracts';
import { toast } from 'sonner';
import { useState } from 'react';

export function useFactoryMint() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  
  // Write contract operations
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  // Wait for transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Read minting fee from NFT contract
  const { data: mintingFee } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_NFT,
    abi: HIBEATS_NFT_ABI,
    functionName: 'mintingFee',
  });

  // Check authorization (not needed for Factory mint, but for UI display)
  const checkAuthorization = async (userAddress: string): Promise<boolean> => {
    // Factory minting doesn't require individual authorization
    // Anyone can mint through the factory
    return true;
  };

  // Mint NFT directly through NFT contract (Factory directMint removed)
  const mintTrack = async (params: DirectMintParams) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return { success: false, error: 'Wallet not connected' };
    }

    // Validate required parameters
    if (!params.to || !params.metadataURI || !params.aiTrackId || !params.taskId) {
      const error = 'Missing required parameters for NFT minting';
      toast.error(error);
      return { success: false, error };
    }

    // Validate metadata URI format
    if (!params.metadataURI.startsWith('ipfs://') && 
        !params.metadataURI.startsWith('http') && 
        !params.metadataURI.startsWith('data:')) {
      const error = 'Invalid metadata URI format. Must start with ipfs://, http, or data:';
      toast.error(error);
      return { success: false, error };
    }

    // Validate royalty rate (should be in basis points, max 10000 = 100%)
    if (params.royaltyRate < 0 || params.royaltyRate > 10000) {
      const error = 'Royalty rate must be between 0 and 10000 (0-100%)';
      toast.error(error);
      return { success: false, error };
    }

    // Validate duration
    if (params.duration <= 0) {
      const error = 'Duration must be greater than 0';
      toast.error(error);
      return { success: false, error };
    }

    // Validate wallet address format
    if (!params.to.startsWith('0x') || params.to.length !== 42) {
      const error = 'Invalid recipient address format';
      toast.error(error);
      return { success: false, error };
    }

    // Check contract address
    if (!CONTRACT_ADDRESSES.HIBEATS_NFT) {
      const error = 'NFT contract address not configured';
      toast.error(error);
      return { success: false, error };
    }

    // Check if minting fee is available
    if (!mintingFee) {
      const error = 'Unable to fetch minting fee. Please try again.';
      toast.error(error);
      return { success: false, error };
    }

    try {
      setIsLoading(true);

      console.log('� Minting NFT directly through NFT contract with params:', {
        to: params.to,
        metadataURI: params.metadataURI,
        aiTrackId: params.aiTrackId,
        taskId: params.taskId,
        genre: params.genre,
        duration: params.duration,
        modelUsed: params.modelUsed,
        isRemixable: params.isRemixable,
        royaltyRate: params.royaltyRate,
        fee: mintingFee?.toString()
      });

      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_NFT as `0x${string}`,
        abi: HIBEATS_NFT_ABI,
        functionName: 'mintTrack',
        args: [
          params.to as `0x${string}`,
          params.metadataURI,
          params.aiTrackId,
          params.taskId,
          params.genre,
          BigInt(params.duration),
          params.modelUsed,
          params.isRemixable,
          BigInt(params.royaltyRate),
          params.prompt,
          params.tags,
          BigInt(params.aiCreatedAt)
        ],
        value: mintingFee, // Include the minting fee
      } as any);

      toast.success('🎉 NFT minting initiated! No authorization required!');
      return { success: true };

    } catch (err) {
      console.error('Error minting NFT via Factory:', err);

      let errorMessage = 'Failed to mint NFT via Factory';
      
      if (err instanceof Error) {
        if (err.message.includes('User rejected')) {
          errorMessage = 'Transaction was cancelled by user';
        } else if (err.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for minting fee and gas';
        } else if (err.message.includes('already minted')) {
          errorMessage = 'This track has already been minted as NFT';
        } else {
          errorMessage = `Failed to mint NFT: ${err.message}`;
        }
      }

      toast.error(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  // Complete music generation through Factory contract
  const completeMusicGeneration = async (params: CompleteMusicGenerationParams) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return { success: false, error: 'Wallet not connected' };
    }

    // Validate required parameters with specific error messages
    if (!params.requestId || params.requestId <= 0) {
      const error = 'Invalid request ID for completing music generation';
      toast.error(error);
      return { success: false, error };
    }
    
    if (!params.metadataURI || params.metadataURI.trim().length === 0) {
      const error = 'Metadata URI is required for completing music generation';
      toast.error(error);
      return { success: false, error };
    }
    
    if (!params.modelName || params.modelName.trim().length === 0) {
      const error = 'Model name is required for completing music generation';
      toast.error(error);
      return { success: false, error };
    }
    
    if (!params.tags || params.tags.trim().length === 0) {
      const error = 'Tags are required for completing music generation';
      toast.error(error);
      return { success: false, error };
    }
    
    if (!params.duration || params.duration <= 0) {
      const error = 'Valid duration is required for completing music generation';
      toast.error(error);
      return { success: false, error };
    }

    // Check contract configuration
    if (!CONTRACT_ADDRESSES.HIBEATS_FACTORY) {
      const error = 'Factory contract address not configured';
      toast.error(error);
      return { success: false, error };
    }

    try {
      setIsLoading(true);

      console.log('🏭 Completing music generation through Factory with params:', {
        requestId: params.requestId,
        requestIdType: typeof params.requestId,
        metadataURI: params.metadataURI,
        metadataURILength: params.metadataURI?.length,
        duration: params.duration,
        durationType: typeof params.duration,
        tags: params.tags,
        tagsLength: params.tags?.length,
        modelName: params.modelName,
        modelNameLength: params.modelName?.length,
        createTime: params.createTime,
        createTimeType: typeof params.createTime,
        contractAddress: CONTRACT_ADDRESSES.HIBEATS_FACTORY
      });

      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_FACTORY as `0x${string}`,
        abi: HIBEATS_FACTORY_ABI,
        functionName: 'completeMusicGeneration',
        args: [
          BigInt(params.requestId),
          params.metadataURI,
          BigInt(params.duration),
          params.tags,
          params.modelName,
          BigInt(params.createTime)
        ],
      } as any);

      toast.success('🎉 Music generation completion initiated! This will mint the NFT automatically.');
      return { success: true };

    } catch (err) {
      console.error('Error completing music generation:', err);

      let errorMessage = 'Failed to complete music generation';
      
      if (err instanceof Error) {
        console.error('Full error details:', {
          message: err.message,
          name: err.name,
          stack: err.stack
        });
        
        if (err.message.includes('User rejected')) {
          errorMessage = 'Transaction was cancelled by user';
        } else if (err.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for gas';
        } else if (err.message.includes('Unauthorized caller')) {
          errorMessage = 'Unauthorized: Only IPFS service or owner can complete generation';
        } else if (err.message.includes('Request already completed')) {
          errorMessage = 'This music generation request has already been completed';
        } else if (err.message.includes('Invalid request ID')) {
          errorMessage = 'Invalid request ID provided';
        } else if (err.message.includes('revert')) {
          // Extract revert reason from error message
          const revertMatch = err.message.match(/revert (.+?)(?:\s|$)/);
          if (revertMatch) {
            errorMessage = `Contract error: ${revertMatch[1]}`;
          } else {
            errorMessage = 'Transaction reverted by contract';
          }
        } else if (err.message.includes('CALL_EXCEPTION')) {
          errorMessage = 'Contract call failed - check parameters and contract state';
        } else {
          errorMessage = `Failed to complete generation: ${err.message}`;
        }
      }

      toast.error(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  return {
    // Main functions
    mintTrack,
    completeMusicGeneration,
    checkAuthorization,
    
    // States
    isLoading: isLoading || isPending || isConfirming,
    isSuccess,
    error,
    hash,
    
    // Fee info
    mintingFee,
    
    // Contract addresses
    nftAddress: CONTRACT_ADDRESSES.HIBEATS_NFT,
    factoryAddress: CONTRACT_ADDRESSES.HIBEATS_FACTORY,
  };
}