import { SongLike, SongComment, SongInteraction } from '@/types/music';
import { toast } from 'sonner';

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY || "";
const PINATA_SECRET_API_KEY = import.meta.env.VITE_PINATA_API_SECRET || "";
const PINATA_JWT = import.meta.env.VITE_PINATA_API_JWT || "";
const PINATA_BASE_URL = "https://api.pinata.cloud";

// Cache for performance
const CACHE_KEY_PREFIX = 'hibeats_social_cache_';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: any;
  timestamp: number;
}

interface SocialData {
  songId: string;
  likes: SongLike[];
  comments: SongComment[];
  version: number;
  lastUpdated: number;
}

class SocialIPFSService {
  private cache = new Map<string, CacheEntry>();

  /**
   * Get cache key for a song
   */
  private getCacheKey(songId: string): string {
    return `${CACHE_KEY_PREFIX}${songId}`;
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(cacheKey: string): boolean {
    const entry = this.cache.get(cacheKey);
    if (!entry) return false;

    const now = Date.now();
    return (now - entry.timestamp) < CACHE_DURATION;
  }

  /**
   * Get data from cache
   */
  private getFromCache(songId: string): SocialData | null {
    const cacheKey = this.getCacheKey(songId);
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)?.data || null;
    }
    return null;
  }

  /**
   * Set data to cache
   */
  private setCache(songId: string, data: SocialData): void {
    const cacheKey = this.getCacheKey(songId);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Upload data to IPFS using Pinata
   */
  private async uploadToPinata(data: any, filename: string): Promise<string> {
    const formData = new FormData();
    const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    formData.append('file', jsonBlob, filename);

    const metadata = {
      name: filename,
      keyvalues: {
        type: 'social_interaction',
        songId: data.songId,
        version: data.version.toString()
      }
    };
    formData.append('pinataMetadata', JSON.stringify(metadata));

    const options = {
      cidVersion: 1,
    };
    formData.append('pinataOptions', JSON.stringify(options));

    try {
      const response = await fetch(`${PINATA_BASE_URL}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.IpfsHash || result.cid;
    } catch (error) {
      console.error('Error uploading to Pinata:', error);
      throw error;
    }
  }

  /**
   * Fetch data from IPFS
   */
  private async fetchFromIPFS(ipfsHash: string): Promise<SocialData> {
    try {
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching from IPFS:', error);
      throw error;
    }
  }

  /**
   * Get IPFS hash for song social data from localStorage registry
   */
  private getSongIPFSHash(songId: string): string | null {
    const registry = localStorage.getItem('hibeats_social_ipfs_registry');
    if (!registry) return null;

    try {
      const parsed = JSON.parse(registry);
      return parsed[songId] || null;
    } catch (error) {
      console.error('Error parsing IPFS registry:', error);
      return null;
    }
  }

  /**
   * Update IPFS hash for song in localStorage registry
   */
  private updateSongIPFSHash(songId: string, ipfsHash: string): void {
    let registry: Record<string, string> = {};

    try {
      const existing = localStorage.getItem('hibeats_social_ipfs_registry');
      if (existing) {
        registry = JSON.parse(existing);
      }
    } catch (error) {
      console.error('Error parsing existing registry:', error);
    }

    registry[songId] = ipfsHash;
    localStorage.setItem('hibeats_social_ipfs_registry', JSON.stringify(registry));
  }

  /**
   * Load social interactions for a song
   */
  async loadSongInteractions(songId: string): Promise<SongInteraction> {
    // Check cache first
    const cached = this.getFromCache(songId);
    if (cached) {
      return {
        songId,
        likes: cached.likes,
        comments: cached.comments,
        likeCount: cached.likes.length,
        commentCount: cached.comments.length,
        hasUserLiked: false // Will be calculated by hook
      };
    }

    try {
      const ipfsHash = this.getSongIPFSHash(songId);

      if (!ipfsHash) {
        // No data exists yet, return empty state
        const emptyData: SocialData = {
          songId,
          likes: [],
          comments: [],
          version: 1,
          lastUpdated: Date.now()
        };
        this.setCache(songId, emptyData);

        return {
          songId,
          likes: [],
          comments: [],
          likeCount: 0,
          commentCount: 0,
          hasUserLiked: false
        };
      }

      // Fetch from IPFS
      const socialData = await this.fetchFromIPFS(ipfsHash);
      this.setCache(songId, socialData);

      return {
        songId,
        likes: socialData.likes,
        comments: socialData.comments,
        likeCount: socialData.likes.length,
        commentCount: socialData.comments.length,
        hasUserLiked: false // Will be calculated by hook
      };
    } catch (error) {
      console.error('Error loading song interactions:', error);

      // Return empty state on error
      return {
        songId,
        likes: [],
        comments: [],
        likeCount: 0,
        commentCount: 0,
        hasUserLiked: false
      };
    }
  }

  /**
   * Save social interactions for a song to IPFS
   */
  async saveSongInteractions(songId: string, likes: SongLike[], comments: SongComment[]): Promise<boolean> {
    try {
      // Get existing data for version increment
      const existing = this.getFromCache(songId);
      const version = existing ? existing.version + 1 : 1;

      const socialData: SocialData = {
        songId,
        likes,
        comments,
        version,
        lastUpdated: Date.now()
      };

      // Upload to IPFS
      const filename = `social_${songId}_v${version}.json`;
      const ipfsHash = await this.uploadToPinata(socialData, filename);

      // Update registry
      this.updateSongIPFSHash(songId, ipfsHash);

      // Update cache
      this.setCache(songId, socialData);

      return true;
    } catch (error) {
      console.error('Error saving social interactions to IPFS:', error);
      toast.error('Failed to save to IPFS. Please try again.');
      return false;
    }
  }

  /**
   * Add a like to a song
   */
  async addLike(songId: string, userAddress: string): Promise<boolean> {
    try {
      const interactions = await this.loadSongInteractions(songId);

      // Check if already liked
      const existingLike = interactions.likes.find(like => like.userAddress === userAddress);
      if (existingLike) {
        return true; // Already liked
      }

      const newLike: SongLike = {
        id: `${songId}_${userAddress}_${Date.now()}`,
        songId,
        userAddress,
        timestamp: Date.now()
      };

      const updatedLikes = [...interactions.likes, newLike];
      return await this.saveSongInteractions(songId, updatedLikes, interactions.comments);
    } catch (error) {
      console.error('Error adding like:', error);
      return false;
    }
  }

  /**
   * Remove a like from a song
   */
  async removeLike(songId: string, userAddress: string): Promise<boolean> {
    try {
      const interactions = await this.loadSongInteractions(songId);
      const updatedLikes = interactions.likes.filter(like => like.userAddress !== userAddress);
      return await this.saveSongInteractions(songId, updatedLikes, interactions.comments);
    } catch (error) {
      console.error('Error removing like:', error);
      return false;
    }
  }

  /**
   * Add a comment to a song
   */
  async addComment(songId: string, userAddress: string, commentText: string): Promise<boolean> {
    try {
      const interactions = await this.loadSongInteractions(songId);

      const newComment: SongComment = {
        id: `${songId}_${userAddress}_${Date.now()}`,
        songId,
        userAddress,
        comment: commentText.trim(),
        timestamp: Date.now(),
        username: userAddress.slice(0, 6) + '...' + userAddress.slice(-4)
      };

      const updatedComments = [...interactions.comments, newComment];
      return await this.saveSongInteractions(songId, interactions.likes, updatedComments);
    } catch (error) {
      console.error('Error adding comment:', error);
      return false;
    }
  }

  /**
   * Edit a comment
   */
  async editComment(songId: string, commentId: string, userAddress: string, newText: string): Promise<boolean> {
    try {
      const interactions = await this.loadSongInteractions(songId);

      // Verify user owns the comment
      const commentIndex = interactions.comments.findIndex(c => c.id === commentId);
      if (commentIndex === -1) {
        throw new Error('Comment not found');
      }

      const comment = interactions.comments[commentIndex];
      if (comment.userAddress !== userAddress) {
        throw new Error('Unauthorized to edit this comment');
      }

      // Update comment
      const updatedComments = [...interactions.comments];
      updatedComments[commentIndex] = {
        ...comment,
        comment: newText.trim(),
        editedAt: Date.now()
      };

      return await this.saveSongInteractions(songId, interactions.likes, updatedComments);
    } catch (error) {
      console.error('Error editing comment:', error);
      return false;
    }
  }

  /**
   * Add a reply to a comment
   */
  async addReply(songId: string, parentCommentId: string, userAddress: string, replyText: string): Promise<boolean> {
    try {
      const interactions = await this.loadSongInteractions(songId);

      // Verify parent comment exists
      const parentComment = interactions.comments.find(c => c.id === parentCommentId);
      if (!parentComment) {
        throw new Error('Parent comment not found');
      }

      const newReply: SongComment = {
        id: `${songId}_${userAddress}_${Date.now()}`,
        songId,
        userAddress,
        comment: replyText.trim(),
        timestamp: Date.now(),
        username: userAddress.slice(0, 6) + '...' + userAddress.slice(-4),
        parentId: parentCommentId
      };

      const updatedComments = [...interactions.comments, newReply];
      return await this.saveSongInteractions(songId, interactions.likes, updatedComments);
    } catch (error) {
      console.error('Error adding reply:', error);
      return false;
    }
  }

  /**
   * Remove a comment from a song
   */
  async removeComment(songId: string, commentId: string, userAddress: string): Promise<boolean> {
    try {
      const interactions = await this.loadSongInteractions(songId);

      // Verify user owns the comment
      const comment = interactions.comments.find(c => c.id === commentId);
      if (!comment || comment.userAddress !== userAddress) {
        throw new Error('Unauthorized to delete this comment');
      }

      // Remove comment and all its replies
      const updatedComments = interactions.comments.filter(c =>
        c.id !== commentId && c.parentId !== commentId
      );

      return await this.saveSongInteractions(songId, interactions.likes, updatedComments);
    } catch (error) {
      console.error('Error removing comment:', error);
      return false;
    }
  }

  /**
   * Clear cache for a song (useful for testing)
   */
  clearCache(songId?: string): void {
    if (songId) {
      const cacheKey = this.getCacheKey(songId);
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
    }
  }
}

export const socialIPFSService = new SocialIPFSService();