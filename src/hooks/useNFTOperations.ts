import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, useTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, HIBEATS_NFT_ABI, HIBEATS_MARKETPLACE_ABI, type NFTMintParams } from '../contracts';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

export function useNFTOperations(onNFTMinted?: (taskId: string) => void) {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  
  // Write contract operations
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  // Wait for transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Get transaction receipt for detailed information
  const { data: transactionReceipt } = useTransactionReceipt({
    hash,
  });

  // Read user's NFT balance
  const { data: userBalance, refetch: refetchBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_NFT,
    abi: HIBEATS_NFT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Read total supply
  const { data: totalSupply } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_NFT,
    abi: HIBEATS_NFT_ABI,
    functionName: 'totalSupply',
  });

  // Read minting fee
  const { data: mintingFee } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_NFT,
    abi: HIBEATS_NFT_ABI,
    functionName: 'mintingFee',
  });

  // Read user's library (owned NFTs)
  const { data: userLibrary, refetch: refetchLibrary } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_NFT,
    abi: HIBEATS_NFT_ABI,
    functionName: 'getUserLibrary',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Authorization check (no longer needed - commented out)
  // const { data: isAuthorized, refetch: refetchAuth } = useReadContract({
  //   address: CONTRACT_ADDRESSES.HIBEATS_NFT,
  //   abi: HIBEATS_NFT_ABI,
  //   functionName: 'authorizedCreators',
  //   args: address ? [address] : undefined,
  //   enabled: !!address,
  // });

  // Function to check authorization status (no longer required)
  const checkAuthorization = async (userAddress: string): Promise<boolean> => {
    // Authorization is no longer required for minting
    // Anyone can mint NFTs now
    return true;
  };

  // Read all tracks
  const { data: allTracks } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_NFT,
    abi: HIBEATS_NFT_ABI,
    functionName: 'getAllTracks',
    args: [0n, 1000n], // offset: 0, limit: 1000 tracks
  });

  // Validate metadata URI
  const validateMetadataURI = async (uri: string): Promise<{ isValid: boolean; error?: string }> => {
    try {
      if (!uri) {
        return { isValid: false, error: 'Metadata URI is required' };
      }

      if (uri.startsWith('ipfs://')) {
        // For IPFS URIs, we can try to resolve them
        const ipfsGateway = uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
        const response = await fetch(ipfsGateway, { method: 'HEAD' });

        if (!response.ok) {
          return { isValid: false, error: 'IPFS metadata not accessible' };
        }

        // Check if it's JSON
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          return { isValid: false, error: 'Metadata must be JSON format' };
        }

        return { isValid: true };
      } else if (uri.startsWith('http')) {
        // For HTTP URIs, basic validation
        const response = await fetch(uri, { method: 'HEAD' });

        if (!response.ok) {
          return { isValid: false, error: 'Metadata URI not accessible' };
        }

        return { isValid: true };
      } else {
        return { isValid: false, error: 'Invalid URI format. Must start with ipfs:// or http' };
      }
    } catch (error) {
      console.error('Metadata validation error:', error);
      return { isValid: false, error: 'Failed to validate metadata URI' };
    }
  };
  const mintNFT = async (params: NFTMintParams) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Validate required parameters
    if (!params.to || !params.metadataURI || !params.sunoId || !params.taskId) {
      toast.error('Missing required parameters for NFT minting');
      return;
    }

    // Validate metadata URI format
    if (!params.metadataURI.startsWith('ipfs://') && !params.metadataURI.startsWith('http')) {
      toast.error('Invalid metadata URI format. Must start with ipfs:// or http');
      return;
    }

    // Validate metadata accessibility
    toast.loading('Validating metadata...', { id: 'metadata-validation' });
    const metadataValidation = await validateMetadataURI(params.metadataURI);
    toast.dismiss('metadata-validation');

    if (!metadataValidation.isValid) {
      toast.error(`Metadata validation failed: ${metadataValidation.error}`);
      return;
    }

    // Note: Removed authorization check - let the smart contract handle authorization
    // If user is not authorized, they will get a clear error message from the contract

    // Validate royalty percentage
    if (params.royaltyPercentage < 0 || params.royaltyPercentage > 100) {
      toast.error('Royalty percentage must be between 0 and 100');
      return;
    }

    // Validate duration
    if (params.duration <= 0) {
      toast.error('Duration must be greater than 0');
      return;
    }

    // Validate wallet address format
    if (!params.to.startsWith('0x') || params.to.length !== 42) {
      toast.error('Invalid recipient address format');
      return;
    }

    // Validate genre
    if (!params.genre || params.genre.trim().length === 0) {
      toast.error('Genre is required');
      return;
    }

    // Validate model used
    if (!params.modelUsed || params.modelUsed.trim().length === 0) {
      toast.error('Model used is required');
      return;
    }

    // Check if minting fee is available
    if (!mintingFee) {
      toast.error('Unable to fetch minting fee. Please try again.');
      return;
    }

    try {
      setIsLoading(true);

      // Log custom cover image if provided
      if (params.customCoverImage) {
        console.log('🎨 Minting NFT with custom cover image:', params.customCoverImage);
      }

      console.log('🏷️ Minting NFT with params:', {
        to: params.to,
        metadataURI: params.metadataURI,
        sunoId: params.sunoId,
        taskId: params.taskId,
        genre: params.genre,
        duration: params.duration,
        modelUsed: params.modelUsed,
        isRemixable: params.isRemixable,
        royaltyPercentage: params.royaltyPercentage
      });

      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_NFT as `0x${string}`,
        abi: HIBEATS_NFT_ABI,
        functionName: 'mintTrack',
        args: [
          params.to as `0x${string}`,
          params.metadataURI,
          params.sunoId,
          params.taskId,
          params.genre,
          BigInt(params.duration),
          params.modelUsed,
          params.isRemixable,
          BigInt(params.royaltyPercentage),
          params.prompt,
          params.tags,
          BigInt(params.sunoCreatedAt)
        ],
        value: mintingFee, // Include the minting fee
      } as any);

      toast.success('NFT minting transaction initiated! Please wait for confirmation...');
    } catch (err) {
      console.error('Error minting NFT:', err);

      // More specific error messages
      if (err instanceof Error) {
        if (err.message.includes('User rejected')) {
          toast.error('Transaction was cancelled by user');
        } else if (err.message.includes('insufficient funds')) {
          toast.error('Insufficient funds for minting fee and gas');
        } else if (err.message.includes('already minted') || err.message.includes('Track already minted')) {
          toast.error('This track has already been minted as NFT');
        } else if (err.message.includes('Insufficient minting fee')) {
          toast.error('Insufficient minting fee. Please ensure you have enough STT tokens.');
        } else {
          toast.error(`Failed to mint NFT: ${err.message}`);
        }
      } else {
        toast.error('Failed to mint NFT: Unknown error occurred');
      }

      setIsLoading(false);
    }
  };

  // Approve NFT for marketplace
  const approveNFT = async (tokenId: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_NFT as `0x${string}`,
        abi: HIBEATS_NFT_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE, tokenId],
      } as any);

      toast.success('NFT approved for marketplace!');
    } catch (err) {
      console.error('Error approving NFT:', err);
      toast.error('Failed to approve NFT');
      setIsLoading(false);
    }
  };

  // Transfer NFT
  const transferNFT = async (from: string, to: string, tokenId: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_NFT as `0x${string}`,
        abi: HIBEATS_NFT_ABI,
        functionName: 'transferFrom',
        args: [from as `0x${string}`, to as `0x${string}`, tokenId],
      } as any);

      toast.success('NFT transfer initiated!');
    } catch (err) {
      console.error('Error transferring NFT:', err);
      toast.error('Failed to transfer NFT');
      setIsLoading(false);
    }
  };

  // Get NFT owner
  const getNFTOwner = (tokenId: bigint) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_NFT,
      abi: HIBEATS_NFT_ABI,
      functionName: 'ownerOf',
      args: [tokenId],
    });
  };

  // Get NFT metadata URI
  const getNFTMetadata = (tokenId: bigint) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_NFT,
      abi: HIBEATS_NFT_ABI,
      functionName: 'tokenURI',
      args: [tokenId],
    });
  };

  // Get track info
  const getTrackInfo = (tokenId: bigint) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_NFT,
      abi: HIBEATS_NFT_ABI,
      functionName: 'getTrackInfo',
      args: [tokenId],
    });
  };

  // Check if NFT is approved
  const getApproved = (tokenId: bigint) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_NFT,
      abi: HIBEATS_NFT_ABI,
      functionName: 'getApproved',
      args: [tokenId],
    });
  };

  // Effects
  useEffect(() => {
    if (isSuccess && hash) {
      setIsLoading(false);
      refetchBalance();
      refetchLibrary();

      // Determine the type of successful transaction
      if (hash) {
        toast.success('🎉 Transaction completed successfully! Your NFT has been minted.');
        console.log('✅ Transaction successful:', hash);
      }

      // Call callback if NFT was minted successfully
      if (onNFTMinted) {
        // The callback will be called from the component with the specific taskId
      }
    }
  }, [isSuccess, hash, refetchBalance, refetchLibrary, onNFTMinted]);

  useEffect(() => {
    if (error) {
      setIsLoading(false);
      console.error('❌ Transaction failed:', error);

      // More specific error handling
      if (error.message.includes('User rejected')) {
        toast.error('Transaction cancelled by user');
      } else if (error.message.includes('insufficient funds')) {
        toast.error('Insufficient funds for transaction');
      } else if (error.message.includes('gas')) {
        toast.error('Gas estimation failed. Please try again.');
      } else if (error.message.includes('nonce')) {
        toast.error('Transaction nonce error. Please refresh and try again.');
      } else {
        toast.error(`Transaction failed: ${error.message}`);
      }
    }
  }, [error]);

  useEffect(() => {
    if (isConfirming) {
      toast.loading('Confirming transaction...', { id: 'tx-confirm' });
    } else {
      toast.dismiss('tx-confirm');
    }
  }, [isConfirming]);

  return {
    // Actions
    mintNFT,
    approveNFT,
    transferNFT,
    validateMetadataURI,
    checkAuthorization,

    // Queries
    getNFTOwner,
    getNFTMetadata,
    getTrackInfo,
    getApproved,

    // Data
    userBalance: userBalance || 0n,
    totalSupply: totalSupply || 0n,
    userLibrary: userLibrary || [],
    allTracks: allTracks || [[], []], // Default to empty arrays for tokenIds and tracks
    mintingFee: mintingFee || 0n,
    isAuthorized: true, // Authorization no longer required

    // Refetch functions
    refetchBalance,
    refetchLibrary,

    // Transaction data
    transactionHash: hash,
    transactionReceipt,
    blockNumber: transactionReceipt?.blockNumber,
    gasUsed: transactionReceipt?.gasUsed?.toString(),

    // State
    isLoading: isLoading || isPending || isConfirming,
    hash,
    error,
  };
}
