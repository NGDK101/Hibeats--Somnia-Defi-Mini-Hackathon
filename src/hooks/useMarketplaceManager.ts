import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { toast } from 'sonner';
import { CONTRACT_ADDRESSES, HIBEATS_MARKETPLACE_ABI, type ModifyListingParams } from '../contracts';

export const useMarketplaceManager = () => {
  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isTransactionLoading, isSuccess: isTransactionSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Read marketplace functions
  const { data: minListingPrice } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
    abi: HIBEATS_MARKETPLACE_ABI,
    functionName: 'minListingPrice',
  });

  const { data: platformFeeRate } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
    abi: HIBEATS_MARKETPLACE_ABI,
    functionName: 'platformFeeRate',
  });

  // List NFT function
  const listNFT = async (params: {
    tokenId: bigint;
    price: string;
    isBeatsToken: boolean;
    duration: number;
    category: string;
    tags: string[];
  }) => {
    try {
      console.log('🏪 Listing NFT with parameters:', params);

      const priceInWei = parseEther(params.price);
      const durationInSeconds = BigInt(params.duration * 24 * 60 * 60); // Convert days to seconds

      const result = await writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
        abi: HIBEATS_MARKETPLACE_ABI,
        functionName: 'listToken',
        args: [
          params.tokenId,
          priceInWei,
          params.isBeatsToken,
          durationInSeconds,
          params.category,
          params.tags,
        ],
      });

      toast.success('🎯 NFT listing transaction submitted!');
      return { success: true, hash: result };
    } catch (error: any) {
      console.error('❌ Failed to list NFT:', error);
      toast.error(`Failed to list NFT: ${error.message || 'Unknown error'}`);
      return { success: false, error: error.message };
    }
  };

  // Modify listing function
  const modifyListing = async (params: ModifyListingParams) => {
    try {
      console.log('✏️ Modifying listing with parameters:', params);

      const result = await writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
        abi: HIBEATS_MARKETPLACE_ABI,
        functionName: 'modifyListing',
        args: [
          params.tokenId,
          params.newPrice,
          params.newIsBeatsToken,
          params.newDuration,
          params.newCategory,
          params.newTags,
        ],
      });

      toast.success('🔄 Listing modification transaction submitted!');
      return { success: true, hash: result };
    } catch (error: any) {
      console.error('❌ Failed to modify listing:', error);
      toast.error(`Failed to modify listing: ${error.message || 'Unknown error'}`);
      return { success: false, error: error.message };
    }
  };

  // Unlist NFT function
  const unlistNFT = async (tokenId: bigint) => {
    try {
      console.log('🗑️ Unlisting NFT:', tokenId);

      const result = await writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
        abi: HIBEATS_MARKETPLACE_ABI,
        functionName: 'unlistToken',
        args: [tokenId],
      });

      toast.success('📤 NFT unlisting transaction submitted!');
      return { success: true, hash: result };
    } catch (error: any) {
      console.error('❌ Failed to unlist NFT:', error);
      toast.error(`Failed to unlist NFT: ${error.message || 'Unknown error'}`);
      return { success: false, error: error.message };
    }
  };

  // Buy NFT function
  const buyNFT = async (tokenId: bigint, price: bigint, isBeatsToken: boolean) => {
    try {
      console.log('💰 Buying NFT:', { tokenId, price: formatEther(price), isBeatsToken });

      const result = await writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
        abi: HIBEATS_MARKETPLACE_ABI,
        functionName: 'buyToken',
        args: [tokenId],
        value: isBeatsToken ? 0n : price, // Only send ETH if not using BEATS token
      });

      toast.success('🛒 NFT purchase transaction submitted!');
      return { success: true, hash: result };
    } catch (error: any) {
      console.error('❌ Failed to buy NFT:', error);
      toast.error(`Failed to buy NFT: ${error.message || 'Unknown error'}`);
      return { success: false, error: error.message };
    }
  };

  // Get listing info
  const getListingInfo = (tokenId: bigint) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
      abi: HIBEATS_MARKETPLACE_ABI,
      functionName: 'listings',
      args: [tokenId],
    });
  };

  return {
    // Write functions
    listNFT,
    modifyListing,
    unlistNFT,
    buyNFT,
    
    // Read functions
    getListingInfo,
    
    // Data
    minListingPrice,
    platformFeeRate,
    
    // Transaction states
    isPending,
    isTransactionLoading,
    isTransactionSuccess,
    hash,
  };
};