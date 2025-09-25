import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, HIBEATS_INTERACTION_MANAGER_ABI, HIBEATS_NFT_ABI } from '../contracts';
import { useMemo } from 'react';

export interface RealContractAddresses {
  hiBeatsToken: string;
  hiBeatsNFT: string;
  hiBeatsFactory: string;
  hiBeatsMarketplace: string;
  hiBeatsRoyalties: string;
  hiBeatsProfile: string;
  hiBeatsPlaylist: string;
  hiBeatsDiscovery: string;
  hiBeatsStaking: string;
  hiBeatsAnalytics: string;
  interactionManager: string;
}

export function useContractAddresses() {
  // Get all contract addresses from the interaction manager
  const { data: tokenAddress } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_INTERACTION_MANAGER,
    abi: HIBEATS_INTERACTION_MANAGER_ABI,
    functionName: 'hiBeatsToken',
  });

  const { data: nftAddress } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_INTERACTION_MANAGER,
    abi: HIBEATS_INTERACTION_MANAGER_ABI,
    functionName: 'hiBeatsNFT',
  });

  const { data: factoryAddress } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_INTERACTION_MANAGER,
    abi: HIBEATS_INTERACTION_MANAGER_ABI,
    functionName: 'hiBeatsFactory',
  });

  const { data: marketplaceAddress } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_INTERACTION_MANAGER,
    abi: HIBEATS_INTERACTION_MANAGER_ABI,
    functionName: 'hiBeatsMarketplace',
  });

  const { data: royaltiesAddress } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_INTERACTION_MANAGER,
    abi: HIBEATS_INTERACTION_MANAGER_ABI,
    functionName: 'hiBeatsRoyalties',
  });

  const { data: profileAddress } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_INTERACTION_MANAGER,
    abi: HIBEATS_INTERACTION_MANAGER_ABI,
    functionName: 'hiBeatsProfile',
  });

  const { data: playlistAddress } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_INTERACTION_MANAGER,
    abi: HIBEATS_INTERACTION_MANAGER_ABI,
    functionName: 'hiBeatsPlaylist',
  });

  const { data: discoveryAddress } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_INTERACTION_MANAGER,
    abi: HIBEATS_INTERACTION_MANAGER_ABI,
    functionName: 'hiBeatsDiscovery',
  });

  const { data: stakingAddress } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_INTERACTION_MANAGER,
    abi: HIBEATS_INTERACTION_MANAGER_ABI,
    functionName: 'hiBeatsStaking',
  });

  const { data: analyticsAddress } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_INTERACTION_MANAGER,
    abi: HIBEATS_INTERACTION_MANAGER_ABI,
    functionName: 'hiBeatsAnalytics',
  });

  // Combine all addresses
  const contractAddresses: RealContractAddresses = useMemo(() => ({
    hiBeatsToken: (tokenAddress as string) || CONTRACT_ADDRESSES.HIBEATS_TOKEN,
    hiBeatsNFT: (nftAddress as string) || CONTRACT_ADDRESSES.HIBEATS_NFT,
    hiBeatsFactory: (factoryAddress as string) || CONTRACT_ADDRESSES.HIBEATS_FACTORY,
    hiBeatsMarketplace: (marketplaceAddress as string) || CONTRACT_ADDRESSES.HIBEATS_MARKETPLACE,
    hiBeatsRoyalties: (royaltiesAddress as string) || CONTRACT_ADDRESSES.HIBEATS_ROYALTIES,
    hiBeatsProfile: (profileAddress as string) || CONTRACT_ADDRESSES.HIBEATS_PROFILE,
    hiBeatsPlaylist: (playlistAddress as string) || CONTRACT_ADDRESSES.HIBEATS_PLAYLIST,
    hiBeatsDiscovery: (discoveryAddress as string) || CONTRACT_ADDRESSES.HIBEATS_DISCOVERY,
    hiBeatsStaking: (stakingAddress as string) || CONTRACT_ADDRESSES.HIBEATS_STAKING,
    hiBeatsAnalytics: (analyticsAddress as string) || CONTRACT_ADDRESSES.HIBEATS_ANALYTICS,
    interactionManager: CONTRACT_ADDRESSES.HIBEATS_INTERACTION_MANAGER,
  }), [
    tokenAddress,
    nftAddress,
    factoryAddress,
    marketplaceAddress,
    royaltiesAddress,
    profileAddress,
    playlistAddress,
    discoveryAddress,
    stakingAddress,
    analyticsAddress,
  ]);

  const isLoading = [
    tokenAddress,
    nftAddress,
    factoryAddress,
    marketplaceAddress,
    royaltiesAddress,
    profileAddress,
    playlistAddress,
    discoveryAddress,
    stakingAddress,
    analyticsAddress,
  ].some(addr => addr === undefined);

  return {
    contractAddresses,
    isLoading,
    // Individual addresses for convenience
    ...contractAddresses,
  };
}

// Hook to get real creator details from NFT contract
export function useCreatorDetails(tokenId: number) {
  const { hiBeatsNFT } = useContractAddresses();

  const { data: ownerData } = useReadContract({
    address: hiBeatsNFT as `0x${string}`,
    abi: HIBEATS_NFT_ABI,
    functionName: 'ownerOf',
    args: [BigInt(tokenId)],
    query: {
      enabled: !!hiBeatsNFT && tokenId > 0,
    },
  });

  const { data: creatorData } = useReadContract({
    address: hiBeatsNFT as `0x${string}`,
    abi: HIBEATS_NFT_ABI,
    functionName: 'getTrackInfo',
    args: [BigInt(tokenId)],
    query: {
      enabled: !!hiBeatsNFT && tokenId > 0,
    },
  });

  const { data: tokenURIData } = useReadContract({
    address: hiBeatsNFT as `0x${string}`,
    abi: HIBEATS_NFT_ABI,
    functionName: 'tokenURI',
    args: [BigInt(tokenId)],
    query: {
      enabled: !!hiBeatsNFT && tokenId > 0,
    },
  });

  return {
    owner: ownerData as string | undefined,
    creator: creatorData as any,
    tokenURI: tokenURIData as string | undefined,
    isLoading: !ownerData && !creatorData && !tokenURIData,
  };
}