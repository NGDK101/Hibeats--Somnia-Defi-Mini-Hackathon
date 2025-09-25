// Export all contract ABIs
export { HIBEATS_FACTORY_ABI } from './HiBeatsFactoryABI_new';
export { HIBEATS_NFT_ABI } from './HiBeatsNFTABI';
export { HIBEATS_TOKEN_ABI } from './HiBeatsTokenABI';
export { HIBEATS_MARKETPLACE_ABI } from './HiBeatsMarketplaceABI';
export { HiBeatsMarketplaceAdvancedABI } from './HiBeatsMarketplaceAdvancedABI';
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

// DEPRECATED: CompleteMusicGenerationParams - no longer needed
// Rewards are now given immediately on generation request
// export interface CompleteMusicGenerationParams {
//   requestId: number;
//   metadataURI: string;
//   duration: number;
//   tags: string;
//   modelName: string;
//   createTime: number;
// }

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
  displayName?: string;
  bio: string;
  avatarURI: string;
  bannerURI: string;
  website: string;
  twitter?: string;
  instagram?: string;
  spotify?: string;
  youtube?: string;
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

// Enhanced Marketplace Types
export interface CreatorProfile {
  creator: string;
  username: string;
  displayName: string;
  bio: string;
  bannerImageUrl: string;
  profileImageUrl: string;
  website: string;
  twitter: string;
  instagram: string;
  spotify: string;
  totalTracks: bigint;
  totalPlays: bigint;
  totalEarnings: bigint;
  followerCount: bigint;
  followingCount: bigint;
  joinedAt: bigint;
  isVerified: boolean;
  isActive: boolean;
}

export interface CreatorStats {
  totalTracks: bigint;
  totalPlays: bigint;
  totalEarnings: bigint;
  totalSales: bigint;
  totalListings: bigint;
  totalAuctions: bigint;
  averagePrice: bigint;
  highestSale: bigint;
  followerCount: bigint;
  followingCount: bigint;
  topGenres: string[];
  genreCounts: bigint[];
}

export interface EnhancedTrackInfo {
  tokenId: bigint;
  tokenURI: string;
  title: string;
  artist: string;
  genre: string;
  duration: bigint;
  prompt: string;
  modelUsed: string;
  createdAt: bigint;
  isRemixable: boolean;
  royaltyRate: bigint;
  isListed: boolean;
  isInAuction: boolean;
  currentPrice: bigint;
  isBeatsToken: boolean;
}

export interface EnhancedListing {
  seller: string;
  price: bigint;
  isBeatsToken: boolean;
  isActive: boolean;
  listedAt: bigint;
  expiresAt: bigint;
  category: string;
  tags: string[];
  tokenURI: string;
  title: string;
  artist: string;
  genre: string;
  duration: bigint;
  prompt: string;
  modelUsed: string;
  createdAt: bigint;
  isRemixable: boolean;
  royaltyRate: bigint;
}

export interface EnhancedAuction {
  seller: string;
  startPrice: bigint;
  reservePrice: bigint;
  currentBid: bigint;
  currentBidder: string;
  isBeatsToken: boolean;
  startTime: bigint;
  endTime: bigint;
  isActive: boolean;
  category: string;
  bidders: string[];
  bidAmounts: bigint[];
  tokenURI: string;
  title: string;
  artist: string;
  genre: string;
  duration: bigint;
  prompt: string;
  modelUsed: string;
  createdAt: bigint;
  isRemixable: boolean;
  royaltyRate: bigint;
}

export interface EnhancedOffer {
  buyer: string;
  amount: bigint;
  isBeatsToken: boolean;
  expiresAt: bigint;
  isActive: boolean;
  message: string;
  tokenURI: string;
  title: string;
  artist: string;
  genre: string;
  duration: bigint;
  prompt: string;
  modelUsed: string;
  createdAt: bigint;
  isRemixable: boolean;
  royaltyRate: bigint;
}

// Creator Profile Update Parameters
export interface CreatorProfileUpdateParams {
  username: string;
  displayName: string;
  bio: string;
  bannerImageUrl: string;
  profileImageUrl: string;
  website: string;
  twitter: string;
  instagram: string;
  spotify: string;
}

// Enhanced Marketplace Functions Parameters
export interface CreateAuctionParams {
  tokenId: bigint;
  startPrice: bigint;
  reservePrice: bigint;
  duration: bigint;
  isBeatsToken: boolean;
  category: string;
}

export interface PlaceBidParams {
  tokenId: bigint;
  bidAmount: bigint;
  isBeatsToken: boolean;
}

export interface MakeOfferParams {
  tokenId: bigint;
  amount: bigint;
  isBeatsToken: boolean;
  expirationTime: bigint;
  message: string;
}

export interface SearchCreatorsParams {
  query: string;
  offset: bigint;
  limit: bigint;
}

// Collection and Platform Stats
export interface CollectionStats {
  totalVolume: bigint;
  totalSales: bigint;
  averagePrice: bigint;
  totalListings: bigint;
  totalCreators: bigint;
  totalAuctions: bigint;
  floorPrice: bigint;
  topGenres: string[];
  genreCounts: bigint[];
}

export interface PlatformMetrics {
  totalRevenue: bigint;
  totalUsers: bigint;
  totalTracks: bigint;
  activeListings: bigint;
  activeAuctions: bigint;
  totalTransactions: bigint;
  averageTrackPrice: bigint;
  topPerformingGenres: string[];
}
