import { ethers } from 'ethers';
import { UserProfile, FollowStats, CreatorLevel } from '@/types/music';

// Profile contract ABI (minimal for now)
const PROFILE_ABI = [
  "function createProfile(string username, string displayName, string bio, string avatar) external",
  "function updateProfile(string displayName, string bio, string avatar, string coverImage, string website) external",
  "function updateSocialLinks(string[] socialLinks) external",
  "function changeUsername(string newUsername) external",
  "function followUser(address user) external",
  "function unfollowUser(address user) external",
  "function verifyCreator(address user) external",
  "function updateStats(address user, uint256 trackCount, uint256 totalPlays, uint256 totalEarnings) external",
  
  "function profiles(address user) external view returns (string username, string displayName, string bio, string avatar, string coverImage, string website, string[] socialLinks, bool isVerified, bool isActive, uint256 createdAt, uint256 followerCount, uint256 followingCount, uint256 trackCount, uint256 totalPlays, uint256 totalEarnings)",
  "function getProfileByUsername(string username) external view returns (tuple(string username, string displayName, string bio, string avatar, string coverImage, string website, string[] socialLinks, bool isVerified, bool isActive, uint256 createdAt, uint256 followerCount, uint256 followingCount, uint256 trackCount, uint256 totalPlays, uint256 totalEarnings))",
  "function hasProfile(address user) external view returns (bool)",
  "function isFollowing(address follower, address following) external view returns (bool)",
  "function isFollower(address user, address follower) external view returns (bool)",
  "function getFollowStats(address user) external view returns (uint256 followers, uint256 following)",
  "function getCreatorLevel(address user) external view returns (uint8)",
  "function usernameToAddress(string username) external view returns (address)",
  
  "event ProfileCreated(address indexed user, string username)",
  "event ProfileUpdated(address indexed user)",
  "event UserFollowed(address indexed follower, address indexed following)",
  "event UserUnfollowed(address indexed follower, address indexed following)",
  "event ProfileVerified(address indexed user)"
];

// Contract address on Somnia testnet (to be updated after deployment)
const PROFILE_CONTRACT_ADDRESS = import.meta.env.VITE_HIBEATS_PROFILE_ADDRESS || "0x0000000000000000000000000000000000000000";

export class ProfileService {
  private contract: ethers.Contract | null = null;
  private provider: ethers.providers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  constructor() {
    this.initializeContract();
  }

  private async initializeContract() {
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        this.provider = new ethers.providers.Web3Provider((window as any).ethereum);
        this.signer = this.provider.getSigner();
        this.contract = new ethers.Contract(PROFILE_CONTRACT_ADDRESS, PROFILE_ABI, this.signer);
      }
    } catch (error) {
      console.error('Failed to initialize profile contract:', error);
    }
  }

  // Profile Management Functions

  async createProfile(profileData: {
    username: string;
    displayName: string;
    bio: string;
    avatar: string;
  }): Promise<ethers.ContractTransaction> {
    if (!this.contract || !this.signer) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    try {
      const tx = await this.contract.createProfile(
        profileData.username,
        profileData.displayName,
        profileData.bio,
        profileData.avatar
      );
      
      // console.log('Profile creation transaction:', tx.hash);
      return tx;
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  }

  async updateProfile(updates: {
    displayName: string;
    bio: string;
    avatar: string;
    coverImage: string;
    website: string;
  }): Promise<ethers.ContractTransaction> {
    if (!this.contract || !this.signer) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    try {
      const tx = await this.contract.updateProfile(
        updates.displayName,
        updates.bio,
        updates.avatar,
        updates.coverImage,
        updates.website
      );
      
      // console.log('Profile update transaction:', tx.hash);
      return tx;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  async updateSocialLinks(socialLinks: string[]): Promise<ethers.ContractTransaction> {
    if (!this.contract || !this.signer) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    try {
      const tx = await this.contract.updateSocialLinks(socialLinks);
      // console.log('Social links update transaction:', tx.hash);
      return tx;
    } catch (error) {
      console.error('Error updating social links:', error);
      throw error;
    }
  }

  async changeUsername(newUsername: string): Promise<ethers.ContractTransaction> {
    if (!this.contract || !this.signer) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    try {
      const tx = await this.contract.changeUsername(newUsername);
      // console.log('Username change transaction:', tx.hash);
      return tx;
    } catch (error) {
      console.error('Error changing username:', error);
      throw error;
    }
  }

  // Social Functions

  async followUser(userAddress: string): Promise<ethers.ContractTransaction> {
    if (!this.contract || !this.signer) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    try {
      const tx = await this.contract.followUser(userAddress);
      // console.log('Follow user transaction:', tx.hash);
      return tx;
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  }

  async unfollowUser(userAddress: string): Promise<ethers.ContractTransaction> {
    if (!this.contract || !this.signer) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    try {
      const tx = await this.contract.unfollowUser(userAddress);
      // console.log('Unfollow user transaction:', tx.hash);
      return tx;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  }

  // Query Functions

  async getProfile(userAddress: string): Promise<UserProfile | null> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const hasProfile = await this.contract.hasProfile(userAddress);
      if (!hasProfile) {
        return null;
      }

      const profileData = await this.contract.profiles(userAddress);
      
      return {
        address: userAddress,
        username: profileData.username,
        displayName: profileData.displayName,
        bio: profileData.bio,
        avatar: profileData.avatar,
        coverImage: profileData.coverImage,
        website: profileData.website,
        socialLinks: profileData.socialLinks,
        isVerified: profileData.isVerified,
        isActive: profileData.isActive,
        createdAt: profileData.createdAt.toNumber(),
        followerCount: profileData.followerCount.toNumber(),
        followingCount: profileData.followingCount.toNumber(),
        trackCount: profileData.trackCount.toNumber(),
        totalPlays: profileData.totalPlays.toNumber(),
        totalEarnings: parseFloat(ethers.utils.formatEther(profileData.totalEarnings))
      };
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }

  async getProfileByUsername(username: string): Promise<UserProfile | null> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const userAddress = await this.contract.usernameToAddress(username);
      if (userAddress === ethers.constants.AddressZero) {
        return null;
      }

      return await this.getProfile(userAddress);
    } catch (error) {
      console.error('Error getting profile by username:', error);
      return null;
    }
  }

  async hasProfile(userAddress: string): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.hasProfile(userAddress);
    } catch (error) {
      console.error('Error checking if user has profile:', error);
      return false;
    }
  }

  async isFollowing(followerAddress: string, followingAddress: string): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.isFollowing(followerAddress, followingAddress);
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }

  async getFollowStats(userAddress: string): Promise<FollowStats> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const [followers, following] = await this.contract.getFollowStats(userAddress);
      
      return {
        followerCount: followers.toNumber(),
        followingCount: following.toNumber()
      };
    } catch (error) {
      console.error('Error getting follow stats:', error);
      return {
        followerCount: 0,
        followingCount: 0
      };
    }
  }

  async getCreatorLevel(userAddress: string): Promise<CreatorLevel> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const level = await this.contract.getCreatorLevel(userAddress);
      
      switch (level) {
        case 0: return CreatorLevel.NEWCOMER;
        case 1: return CreatorLevel.RISING;
        case 2: return CreatorLevel.ESTABLISHED;
        case 3: return CreatorLevel.LEGEND;
        default: return CreatorLevel.NEWCOMER;
      }
    } catch (error) {
      console.error('Error getting creator level:', error);
      return CreatorLevel.NEWCOMER;
    }
  }

  // Utility Functions

  async checkUsernameAvailability(username: string): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const userAddress = await this.contract.usernameToAddress(username);
      return userAddress === ethers.constants.AddressZero;
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  }

  // Event Listeners

  onProfileCreated(callback: (userAddress: string, username: string) => void) {
    if (!this.contract) return;

    this.contract.on('ProfileCreated', (userAddress, username) => {
      // console.log('Profile created:', userAddress, username);
      callback(userAddress, username);
    });
  }

  onProfileUpdated(callback: (userAddress: string) => void) {
    if (!this.contract) return;

    this.contract.on('ProfileUpdated', (userAddress) => {
      // console.log('Profile updated:', userAddress);
      callback(userAddress);
    });
  }

  onUserFollowed(callback: (follower: string, following: string) => void) {
    if (!this.contract) return;

    this.contract.on('UserFollowed', (follower, following) => {
      // console.log('User followed:', follower, following);
      callback(follower, following);
    });
  }

  onUserUnfollowed(callback: (follower: string, following: string) => void) {
    if (!this.contract) return;

    this.contract.on('UserUnfollowed', (follower, following) => {
      // console.log('User unfollowed:', follower, following);
      callback(follower, following);
    });
  }

  // Cleanup
  removeAllListeners() {
    if (this.contract) {
      this.contract.removeAllListeners();
    }
  }
}

// Export singleton instance
export const profileService = new ProfileService();
