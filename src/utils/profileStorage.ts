import { SocialProfile } from '@/hooks/useSocial';

export interface StoredProfile extends Omit<SocialProfile, 'address' | 'createdAt'> {
  address: string;
  createdAt: string; // Store as ISO string
  lastUpdated: string;
}

export interface FollowRelationship {
  follower: string;
  following: string;
  timestamp: string;
}

export interface SocialStorage {
  profiles: Record<string, StoredProfile>;
  followRelationships: FollowRelationship[];
  userStats: Record<string, {
    followerCount: number;
    followingCount: number;
    lastCalculated: string;
  }>;
}

const STORAGE_KEY = 'hibeats_social_data';

class ProfileStorageManager {
  private getStorage(): SocialStorage {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading profile storage:', error);
    }
    
    return {
      profiles: {},
      followRelationships: [],
      userStats: {}
    };
  }

  private saveStorage(data: SocialStorage): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving profile storage:', error);
    }
  }

  // Profile management
  getProfile(address: string): SocialProfile | null {
    const storage = this.getStorage();
    const stored = storage.profiles[address.toLowerCase()];
    
    if (!stored) return null;

    return {
      ...stored,
      address,
      createdAt: Date.parse(stored.createdAt)
    };
  }

  saveProfile(profile: SocialProfile): void {
    const storage = this.getStorage();
    const stored: StoredProfile = {
      ...profile,
      address: profile.address.toLowerCase(),
      createdAt: new Date(profile.createdAt).toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    storage.profiles[profile.address.toLowerCase()] = stored;
    this.saveStorage(storage);
  }

  updateProfile(address: string, updates: Partial<SocialProfile>): SocialProfile | null {
    const current = this.getProfile(address);
    if (!current) return null;

    const updated = {
      ...current,
      ...updates,
      address, // Keep original address
      lastUpdated: new Date().toISOString()
    };

    this.saveProfile(updated);
    return updated;
  }

  // Follow system
  followUser(followerAddress: string, followingAddress: string): boolean {
    if (followerAddress.toLowerCase() === followingAddress.toLowerCase()) {
      return false; // Can't follow yourself
    }

    const storage = this.getStorage();
    const relationship: FollowRelationship = {
      follower: followerAddress.toLowerCase(),
      following: followingAddress.toLowerCase(),
      timestamp: new Date().toISOString()
    };

    // Check if already following
    const exists = storage.followRelationships.some(
      r => r.follower === relationship.follower && r.following === relationship.following
    );

    if (exists) return false;

    storage.followRelationships.push(relationship);
    this.updateStats(storage);
    this.saveStorage(storage);
    return true;
  }

  unfollowUser(followerAddress: string, followingAddress: string): boolean {
    const storage = this.getStorage();
    const initialLength = storage.followRelationships.length;
    
    storage.followRelationships = storage.followRelationships.filter(
      r => !(r.follower === followerAddress.toLowerCase() && r.following === followingAddress.toLowerCase())
    );

    if (storage.followRelationships.length < initialLength) {
      this.updateStats(storage);
      this.saveStorage(storage);
      return true;
    }
    return false;
  }

  isFollowing(followerAddress: string, followingAddress: string): boolean {
    const storage = this.getStorage();
    return storage.followRelationships.some(
      r => r.follower === followerAddress.toLowerCase() && r.following === followingAddress.toLowerCase()
    );
  }

  getFollowers(address: string): string[] {
    const storage = this.getStorage();
    return storage.followRelationships
      .filter(r => r.following === address.toLowerCase())
      .map(r => r.follower);
  }

  getFollowing(address: string): string[] {
    const storage = this.getStorage();
    return storage.followRelationships
      .filter(r => r.follower === address.toLowerCase())
      .map(r => r.following);
  }

  // Stats calculation
  private updateStats(storage: SocialStorage): void {
    const stats: Record<string, { followerCount: number; followingCount: number; lastCalculated: string }> = {};
    
    // Calculate stats for all users
    const allUsers = new Set([
      ...storage.followRelationships.map(r => r.follower),
      ...storage.followRelationships.map(r => r.following),
      ...Object.keys(storage.profiles)
    ]);

    for (const user of allUsers) {
      const followerCount = storage.followRelationships.filter(r => r.following === user).length;
      const followingCount = storage.followRelationships.filter(r => r.follower === user).length;
      
      stats[user] = {
        followerCount,
        followingCount,
        lastCalculated: new Date().toISOString()
      };
    }

    storage.userStats = stats;
  }

  getStats(address: string): { followerCount: number; followingCount: number } {
    const storage = this.getStorage();
    const stats = storage.userStats[address.toLowerCase()];
    
    if (!stats || Date.now() - Date.parse(stats.lastCalculated) > 60000) { // Recalculate if older than 1 minute
      this.updateStats(storage);
      this.saveStorage(storage);
      return storage.userStats[address.toLowerCase()] || { followerCount: 0, followingCount: 0 };
    }
    
    return { followerCount: stats.followerCount, followingCount: stats.followingCount };
  }

  // Create default profile for new users
  createDefaultProfile(address: string): SocialProfile {
    const now = Date.now();
    
    const defaultProfile: SocialProfile = {
      address,
      username: `user_${address.slice(-6)}`,
      displayName: ``,
      bio: '',
      avatar: '',
      coverImage: '',
      website: '',
      isVerified: false,
      followerCount: 0,
      followingCount: 0,
      trackCount: 0,
      totalPlays: 0,
      totalEarnings: 0,
      createdAt: now,
      creatorLevel: 'NEWCOMER'
    };

    this.saveProfile(defaultProfile);
    return defaultProfile;
  }

  // Export/Import for backup
  exportData(): SocialStorage {
    return this.getStorage();
  }

  importData(data: SocialStorage): void {
    this.saveStorage(data);
  }

  // Clear all data
  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const profileStorage = new ProfileStorageManager();