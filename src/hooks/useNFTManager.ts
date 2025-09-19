import { useMarketplace } from './useMarketplace';
import { useSongStatus, type SongStatus } from './useSongStatus';
import { useFactoryMint } from './useFactoryMint';
import { useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { toast } from 'sonner';

export interface NFTActionParams {
  aiTrackId: string;
  tokenId?: bigint;
  price?: string;
  newPrice?: string;
  isBeatsToken?: boolean;
  duration?: number;
  category?: string;
  tags?: string[];
  // Song data for minting
  songData?: {
    title: string;
    artist?: string;
    imageUrl?: string;
    audioUrl?: string;
    genre?: string | string[];
    duration?: number;
    prompt?: string;
    modelUsed?: string;
    taskId?: string;
    createdAt?: string;
  };
}

export function useNFTManager() {
  const { address } = useAccount();
  const marketplace = useMarketplace();
  const factoryMint = useFactoryMint();

  // Get status button configuration
  const getActionButtonConfig = (status: SongStatus, isOwner: boolean, isListed: boolean) => {
    switch (status) {
      case 'not-minted':
        return {
          action: 'mint' as const,
          text: 'Mint NFT',
          disabled: false,
          variant: 'default' as const,
          color: 'bg-blue-600 hover:bg-blue-700',
        };
      
      case 'minted-not-listed':
        return {
          action: 'list' as const,
          text: 'List NFT',
          disabled: false,
          variant: 'default' as const,
          color: 'bg-green-600 hover:bg-green-700',
        };
      
      case 'minted-listed':
        return [
          {
            action: 'update' as const,
            text: 'Update Price',
            disabled: false,
            variant: 'outline' as const,
            color: 'border-orange-500 text-orange-600 hover:bg-orange-50',
          },
          {
            action: 'unlist' as const,
            text: 'Unlist NFT',
            disabled: false,
            variant: 'destructive' as const,
            color: 'bg-red-600 hover:bg-red-700',
          }
        ];
      
      case 'minted-not-owner':
        // ✅ NON-OWNER JUGA BISA MELAKUKAN ACTIONS
        return {
          action: 'list' as const,
          text: 'List NFT',
          disabled: false,
          variant: 'default' as const,
          color: 'bg-green-600 hover:bg-green-700',
        };
      
      case 'error':
      default:
        return {
          action: 'error' as const,
          text: 'Error',
          disabled: true,
          variant: 'destructive' as const,
          color: 'bg-gray-400 cursor-not-allowed',
        };
    }
  };

  // Handle mint action
  const handleMint = async (params: NFTActionParams) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!params.songData) {
      toast.error('Song data is required for minting');
      return;
    }

    const { songData } = params;

    try {
      // Factory minting doesn't require authorization - anyone can mint!
      console.log('🏭 Using Factory contract for minting - no authorization required!');

      // Prepare genre (convert array to string if needed)
      const genreStr = Array.isArray(songData.genre) 
        ? songData.genre[0] || 'Electronic'
        : songData.genre || 'Electronic';

      // Prepare tags (convert array to comma-separated string)
      const tagsStr = Array.isArray(songData.genre)
        ? songData.genre.join(',')
        : genreStr;

      // Create metadata URI (could be IPFS URL or simple JSON)
      const metadata = {
        name: songData.title,
        description: `AI-generated music track: ${songData.title}`,
        image: songData.imageUrl || '',
        animation_url: songData.audioUrl || '',
        external_url: '',
        attributes: [
          { trait_type: 'Genre', value: genreStr },
          { trait_type: 'Artist', value: songData.artist || 'AI Generated' },
          { trait_type: 'Duration', value: `${songData.duration || 30}s` },
          { trait_type: 'Model', value: songData.modelUsed || 'V3_5' },
        ]
      };

      // For now, we'll use a simple JSON string as metadata URI
      // In production, this should be uploaded to IPFS
      const metadataURI = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;

      const mintTrackParams = {
        to: address,
        metadataURI,
        aiTrackId: params.aiTrackId,
        taskId: songData.taskId || params.aiTrackId,
        genre: genreStr,
        duration: songData.duration || 30,
        modelUsed: songData.modelUsed || 'V3_5',
        isRemixable: true, // Default to true
        royaltyRate: 1000, // 10% in basis points (1000 = 10%)
        prompt: songData.prompt || `Generate ${genreStr} music`,
        tags: tagsStr,
        aiCreatedAt: songData.createdAt ? Math.floor(new Date(songData.createdAt).getTime() / 1000) : Math.floor(Date.now() / 1000),
      };

      console.log('🎵 Minting NFT via NFT contract with parameters:', mintTrackParams);

      const result = await factoryMint.mintTrack(mintTrackParams);
      
      if (result.success) {
        toast.success('🎉 NFT minted successfully via NFT contract! No authorization needed!');
        return true;
      } else {
        throw new Error(result.error || 'Failed to mint NFT via NFT contract');
      }
    } catch (error) {
      console.error('Error minting NFT via Factory:', error);
      
      // Enhanced error handling
      if (error instanceof Error) {
        if (error.message.includes('insufficient funds')) {
          toast.error('Insufficient funds for minting fee and gas');
        } else if (error.message.includes('rejected')) {
          toast.error('Transaction was cancelled');
        } else if (error.message.includes('already minted')) {
          toast.error('This track has already been minted as NFT');
        } else {
          toast.error(`Failed to mint NFT: ${error.message}`);
        }
      } else {
        toast.error('Failed to mint NFT via Factory');
      }
      throw error;
    }
  };

  // Handle list action
  const handleList = async (params: NFTActionParams & { tokenId: bigint }) => {
    if (!params.price) {
      toast.error('Please provide a price for listing');
      return;
    }

    try {
      await marketplace.listNFT({
        tokenId: params.tokenId,
        price: parseEther(params.price),
        isBeatsToken: params.isBeatsToken || false,
        duration: BigInt(params.duration || 2592000), // 30 days default
        category: params.category || 'Music',
        tags: params.tags || [],
      });
      
      toast.success('NFT listed successfully!');
    } catch (error) {
      console.error('Error listing NFT:', error);
      toast.error('Failed to list NFT');
      throw error;
    }
  };

  // Handle update price action
  const handleUpdatePrice = async (tokenId: bigint, newPrice: string) => {
    if (!newPrice) {
      toast.error('Please provide a new price');
      return;
    }

    try {
      await marketplace.updateListingPrice(tokenId, parseEther(newPrice));
      toast.success('Price updated successfully!');
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error('Failed to update price');
      throw error;
    }
  };

  // Handle unlist action
  const handleUnlist = async (tokenId: bigint) => {
    try {
      await marketplace.unlistNFT(tokenId);
      toast.success('NFT unlisted successfully! It has been returned to your NFT collection.');
    } catch (error) {
      console.error('Error unlisting NFT:', error);
      toast.error('Failed to unlist NFT');
      throw error;
    }
  };

  // Main action handler that routes based on current status
  const handleAction = async (
    action: 'mint' | 'list' | 'update' | 'unlist' | 'view',
    params: NFTActionParams & { tokenId?: bigint; newPrice?: string }
  ) => {
    switch (action) {
      case 'mint':
        return await handleMint(params);
      
      case 'list':
        if (!params.tokenId) {
          throw new Error('Token ID required for listing');
        }
        return await handleList({ ...params, tokenId: params.tokenId });
      
      case 'update':
        if (!params.tokenId || !params.newPrice) {
          throw new Error('Token ID and new price required for update');
        }
        return await handleUpdatePrice(params.tokenId, params.newPrice);
      
      case 'unlist':
        if (!params.tokenId) {
          throw new Error('Token ID required for unlisting');
        }
        return await handleUnlist(params.tokenId);
      
      case 'view':
        // Handle view action - maybe navigate to NFT detail page
        console.log('Viewing NFT:', params.tokenId);
        break;
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  };

  return {
    // Status checking
    useSongStatus,
    
    // Button configuration
    getActionButtonConfig,
    
    // Actions
    handleAction,
    handleMint,
    handleList,
    handleUpdatePrice,
    handleUnlist,
    
    // State from underlying hooks
    isLoading: marketplace.isLoading || factoryMint.isLoading,
    error: marketplace.error || factoryMint.error,
    
    // Direct access to underlying hooks
    marketplace,
    factoryMint,
  };
}

// Utility function to get status text for UI display
export function getStatusText(status: SongStatus): string {
  switch (status) {
    case 'not-minted':
      return 'Ready to mint';
    case 'minted-not-listed':
      return 'Minted - Ready to list';
    case 'minted-listed':
      return 'Listed on marketplace';
    case 'minted-not-owner':
      return 'Minted - Available to list';
    case 'error':
      return 'Error checking status';
    default:
      return 'Unknown status';
  }
}

// Utility function to get status color for UI
export function getStatusColor(status: SongStatus): string {
  switch (status) {
    case 'not-minted':
      return 'text-blue-600';
    case 'minted-not-listed':
      return 'text-green-600';
    case 'minted-listed':
      return 'text-orange-600';
    case 'minted-not-owner':
      return 'text-green-600';
    case 'error':
      return 'text-red-600';
    default:
      return 'text-gray-500';
  }
}