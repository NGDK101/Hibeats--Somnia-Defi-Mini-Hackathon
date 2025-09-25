import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_ADDRESSES, HIBEATS_FACTORY_ABI, HIBEATS_NFT_ABI } from '@/contracts';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useIPFS } from './useIPFS';

export interface MintMetadata {
  title: string;
  description: string;
  artist: string;
  genre: string[];
  duration: number;
  imageUrl: string;
  audioUrl: string;
  aiTrackId: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export function useFactoryMint() {
  const { address } = useAccount();
  const { uploadToIPFS, isUploading } = useIPFS();
  const [isLoading, setIsLoading] = useState(false);
  
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const mintNFT = async (metadata: MintMetadata) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);

      // Upload metadata to IPFS
      const metadataHash = await uploadToIPFS(metadata);

      if (!metadataHash) {
        throw new Error('Failed to upload metadata to IPFS');
      }

      // Mint NFT through NFT contract directly
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_NFT,
        abi: HIBEATS_NFT_ABI,
        functionName: 'mintTrack',
        args: [
          address,                              // to
          `ipfs://${metadataHash}`,            // metadataURI
          metadata.aiTrackId,                   // aiTrackId
          metadata.aiTrackId,                   // taskId (use same as aiTrackId)
          metadata.genre.join(','),             // genre
          BigInt(metadata.duration),            // duration
          'AI Generated',                       // modelUsed
          true,                                 // isRemixable
          1000,                                 // royaltyRate (10%)
          metadata.description,                 // prompt
          metadata.genre.join(','),             // tags
          BigInt(Math.floor(Date.now() / 1000)) // aiCreatedAt
        ],
      });

      toast.success('NFT minting initiated!');
    } catch (err) {
      console.error('Error minting NFT:', err);
      toast.error('Failed to mint NFT');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSuccess) {
      setIsLoading(false);
      toast.dismiss('complete-generation');
      toast.success('Music generation completed successfully!');
    }
  }, [isSuccess]);

  useEffect(() => {
    if (error) {
      setIsLoading(false);
      toast.dismiss('complete-generation');
      toast.error('Operation failed: ' + error.message);
    }
  }, [error]);

  const mintTrack = async (params: {
    to: string;
    metadataURI: string;
    aiTrackId: string;
    taskId: string;
    genre: string;
    duration: number;
    modelUsed: string;
    isRemixable: boolean;
    royaltyRate: number;
    prompt: string;
    tags: string;
    aiCreatedAt: number;
  }) => {
    if (!address) {
      return { success: false, error: 'Please connect your wallet first' };
    }

    try {
      setIsLoading(true);


      // Call mintTrack on NFT contract directly
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_NFT,
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
          BigInt(params.aiCreatedAt),
        ],
        value: parseEther('0.001'), // Minting fee
      });

      return { success: true };
    } catch (err: any) {
      console.error('Error calling mintTrack:', err);
      setIsLoading(false);
      return { success: false, error: err.message || 'Failed to mint track' };
    }
  };

  return {
    mintNFT,
    mintTrack,
    isLoading: isLoading || isPending || isConfirming || isUploading,
    hash,
    error,
  };
}
