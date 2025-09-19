// Export all contract ABIs
export { HIBEATS_FACTORY_ABI } from './HiBeatsFactoryABI_new';
export { HIBEATS_NFT_ABI } from './HiBeatsNFTABI';
export { HIBEATS_TOKEN_ABI } from './HiBeatsTokenABI';
export { HIBEATS_MARKETPLACE_ABI } from './HiBeatsMarketplaceABI';
export { HIBEATS_PROFILE_ABI } from './HiBeatsProfileABI';
export { HIBEATS_ROYALTIES_ABI } from './HiBeatsRoyaltiesABI';
export { HIBEATS_PLAYLIST_ABI } from './HiBeatsPlaylistABI';
export { HIBEATS_STAKING_ABI } from './HiBeatsStakingABI';
export { HIBEATS_ANALYTICS_ABI } from './HiBeatsAnalyticsABI';
export { HIBEATS_DISCOVERY_ABI } from './HiBeatsDiscoveryABI';
export { HIBEATS_GOVERNANCE_ABI } from './HiBeatsGovernanceABI';
export { HIBEATS_INTERACTION_MANAGER_ABI } from './HiBeatsInteractionManagerABI';

// Contract addresses from environment
export { CONTRACT_ADDRESSES } from '../config/web3';

// Type definitions for contract interactions
export interface TrackInfo {
  sunoId: string;
  genre: string;
  duration: bigint;
  creator: string;
  createdAt: bigint;
  modelUsed: string;
  isRemixable: boolean;
  royaltyRate: bigint;
}

export interface GenerationRequest {
  user: string;
  prompt: string;
  genre: string;
  instrumental: boolean;
  status: number;
  requestTime: bigint;
  fulfillTime: bigint;
  sunoId: string;
  tokenId: bigint;
}

export interface MarketplaceListing {
  seller: string;
  price: bigint;
  isAuction: boolean;
  isActive: boolean;
  endTime: bigint;
  highestBidder: string;
  highestBid: bigint;
  acceptsTokens: boolean;
}

export interface UserProfile {
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  coverImage: string;
  website: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: bigint;
  followerCount: bigint;
  followingCount: bigint;
  trackCount: bigint;
  totalPlays: bigint;
  totalEarnings: bigint;
}

// Contract interaction types
export interface MusicGenerationParams {
  prompt: string;
  genre: string;
  instrumental: boolean;
  mode: 'Simple' | 'Advanced';
}

export interface NFTMintParams {
  to: string;
  sunoId: string;
  taskId: string;
  metadataURI: string;
  genre: string;
  duration: number;
  modelUsed: string;
  isRemixable: boolean;
  royaltyPercentage: number;
  prompt: string;
  tags: string;
  sunoCreatedAt: number;
  customCoverImage?: string; // Optional custom cover image URL
}

export interface DirectMintParams {
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
}

export interface CompleteMusicGenerationParams {
  requestId: number;
  metadataURI: string;
  duration: number;
  tags: string;
  modelName: string;
  createTime: number;
}

export interface MarketplaceListParams {
  tokenId: bigint;
  price: bigint;
  isBeatsToken?: boolean; // Whether to accept BEATS token payments
  duration: bigint;
  category?: string;
  tags?: string[];
}

export interface ProfileCreateParams {
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
}

// Additional types for new hooks
export interface ProfileData {
  username: string;
  bio: string;
  avatarURI: string;
  bannerURI: string;
  website: string;
  socialLinks: string[];
  musicGenres: string[];
  isVerified?: boolean;
}

export interface PlaylistMetadata {
  name: string;
  description: string;
  coverImageURI: string;
  isPublic: boolean;
  tags?: string[];
  genre?: string;
}

export interface RoyaltyInfo {
  recipient: string;
  percentage: bigint;
  splits?: string[];
}

// New interfaces for updated functionality
export interface ModifyListingParams {
  tokenId: bigint;
  newPrice: bigint;
  newIsBeatsToken: boolean;
  newDuration: bigint;
  newCategory: string;
  newTags: string[];
}

export interface RewardSettings {
  rewardAmount: bigint;
  rewardsEnabled: boolean;
}

export interface MintWithRewardParams extends DirectMintParams {
  expectReward: boolean;
}
