import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_ADDRESSES, HIBEATS_FACTORY_ABI, type MusicGenerationParams } from '../contracts';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { ipfsService } from '../services/ipfsService';

export function useMusicGeneration() {
  const { address } = useAccount();
  const [isGenerating, setIsGenerating] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Read generation fee
  const { data: generationFee } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_FACTORY,
    abi: HIBEATS_FACTORY_ABI,
    functionName: 'generationFee',
  });

  // Read advanced generation fee
  const { data: advancedGenerationFee } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_FACTORY,
    abi: HIBEATS_FACTORY_ABI,
    functionName: 'advancedGenerationFee',
  });

  // Read daily generations left
  const { data: dailyLeft, refetch: refetchDailyLeft } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_FACTORY,
    abi: HIBEATS_FACTORY_ABI,
    functionName: 'getDailyGenerationsLeft',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  // Read daily generations used
  const { data: dailyUsed, refetch: refetchDailyUsed } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_FACTORY,
    abi: HIBEATS_FACTORY_ABI,
    functionName: 'getDailyGenerationsUsed',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  // Write contract for generation request
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const uploadCustomImage = async (file: File) => {
    try {
      setIsUploadingImage(true);
      const response = await ipfsService.uploadFile(file, `custom_cover_${Date.now()}.jpg`);
      const imageUrl = ipfsService.getGatewayUrl(response.IpfsHash);
      setCustomImageUrl(imageUrl);
      toast.success('Image uploaded to IPFS successfully!');
      return imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image to IPFS');
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const importFromIPFS = async (ipfsHash: string) => {
    try {
      const imageUrl = ipfsService.getGatewayUrl(ipfsHash);
      setCustomImageUrl(imageUrl);
      toast.success('Image imported from IPFS successfully!');
      return imageUrl;
    } catch (error) {
      console.error('Error importing from IPFS:', error);
      toast.error('Failed to import from IPFS');
      return null;
    }
  };

  const requestGeneration = async (params: MusicGenerationParams) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    const fee = params.mode === 'Simple' ? generationFee : advancedGenerationFee;
    if (!fee) {
      toast.error('Unable to get generation fee');
      return;
    }

    if (dailyLeft === 0n) {
      toast.error('You have reached your daily generation limit');
      return;
    }

    try {
      setIsGenerating(true);
      
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_FACTORY,
        abi: HIBEATS_FACTORY_ABI,
        functionName: 'requestMusicGeneration',
        args: [params.prompt, params.genre, params.instrumental ? 1 : 0, params.mode === 'Simple' ? 0 : 1, 'temp-task-id'], // Mode as enum index
        value: fee,
      });

      toast.success('Music generation request submitted!');
    } catch (err) {
      console.error('Error requesting generation:', err);
      toast.error('Failed to request music generation');
    }
  };

  // Read generation request details
  const getGenerationRequest = (requestId: bigint) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_FACTORY,
      abi: HIBEATS_FACTORY_ABI,
      functionName: 'getGenerationRequest',
      args: [requestId],
    });
  };

  // Effect to handle successful generation
  useEffect(() => {
    if (isSuccess) {
      setIsGenerating(false);
      refetchDailyLeft();
      refetchDailyUsed();
      toast.success('Music generation completed!');
    }
  }, [isSuccess, refetchDailyLeft, refetchDailyUsed]);

  // Effect to handle errors
  useEffect(() => {
    if (error) {
      setIsGenerating(false);
      toast.error('Generation failed: ' + error.message);
    }
  }, [error]);

  return {
    requestGeneration,
    getGenerationRequest,
    generationFee,
    dailyLeft: dailyLeft || 0n,
    dailyUsed: dailyUsed || 0n,
    isGenerating: isGenerating || isPending || isConfirming,
    hash,
    error,
    uploadCustomImage,
    importFromIPFS,
    customImageUrl,
    isUploadingImage,
  };
}
