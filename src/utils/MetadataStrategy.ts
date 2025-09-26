/**
 * Hybrid Metadata Strategy for HiBeats Explorer
 * Combines OnChain data with IPFS metadata for optimal performance
 */

export interface OnChainMetadata {
  tokenId: bigint;
  creator: string;
  price: bigint;
  ipfsHash: string;
  createdAt: bigint;
  isListed: boolean;
  genre: string;
  duration: number;
}

export interface IPFSMetadata {
  name: string;
  description: string;
  image: string;
  audio: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  aiMetadata: {
    model: string;
    prompt: string;
    generatedAt: string;
    aiTrackId: string;
  };
}

export interface HybridTrackData extends OnChainMetadata {
  ipfsMetadata?: IPFSMetadata;
  isLoading?: boolean;
  error?: string;
}

export class MetadataStrategy {
  private ipfsGateway: string;
  private cache: Map<string, IPFSMetadata> = new Map();
  private pinataApiKey: string;

  constructor(ipfsGateway = 'https://gateway.pinata.cloud/ipfs/', pinataApiKey = '') {
    this.ipfsGateway = ipfsGateway;
    this.pinataApiKey = pinataApiKey;
  }

  /**
   * Strategy 1: Fast Explorer Loading
   * Load OnChain data first for immediate display
   */
  async getExplorerData(onChainData: OnChainMetadata[]): Promise<HybridTrackData[]> {
    // Return onchain data immediately for fast initial render - no loading indicators
    const hybridData: HybridTrackData[] = onChainData.map(track => ({
      ...track,
      isLoading: false // Don't show loading state in UI
    }));

    // Lazy load IPFS metadata in background
    this.batchLoadIPFSMetadata(hybridData);

    return hybridData;
  }

  /**
   * Strategy 2: Batch IPFS Loading
   * Load IPFS metadata in batches to prevent rate limiting
   */
  private async batchLoadIPFSMetadata(tracks: HybridTrackData[]) {
    // Filter out tracks that are already cached or don't have valid hashes
    const tracksToLoad = tracks.filter(track =>
      track.ipfsHash &&
      !this.cache.has(track.ipfsHash) &&
      track.isLoading !== false // Don't reload tracks that have already been processed
    );

    if (tracksToLoad.length === 0) {
      return;
    }

    const batchSize = 5;
    const batches = this.chunkArray(tracksToLoad, batchSize);

    for (const batch of batches) {
      await Promise.allSettled(
        batch.map(track => this.loadIPFSMetadata(track))
      );

      // Small delay between batches to prevent overwhelming IPFS gateways
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  /**
   * Strategy 3: Cached IPFS Loading
   * Use cache to prevent redundant IPFS calls
   */
  private async loadIPFSMetadata(track: HybridTrackData): Promise<void> {
    try {
      // Check cache first
      if (this.cache.has(track.ipfsHash)) {
        track.ipfsMetadata = this.cache.get(track.ipfsHash);
        track.isLoading = false;
        return;
      }

      // Don't set isLoading to true - we want silent background loading
      const metadata = await this.fetchFromIPFS(track.ipfsHash);

      // Cache the result
      this.cache.set(track.ipfsHash, metadata);

      // Update track data
      track.ipfsMetadata = metadata;
      track.isLoading = false;
      track.error = undefined; // Clear any previous errors
    } catch (error) {
      // Silent error handling - don't spam console
      track.error = 'Failed to load metadata';
      track.isLoading = false;
    }
  }

  /**
   * Strategy 4: Fallback Gateways
   * Use multiple IPFS gateways for reliability
   */
  private async fetchFromIPFS(ipfsHash: string): Promise<IPFSMetadata> {
    const gateways = [
      'https://gateway.pinata.cloud/ipfs/',
      'https://ipfs.io/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
      'https://dweb.link/ipfs/'
    ];

    for (const gateway of gateways) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(`${gateway}${ipfsHash}`, {
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        // Only log in development and for the first gateway failure
        if (process.env.NODE_ENV === 'development' && gateway === gateways[0]) {
          console.warn(`IPFS gateway failed for ${ipfsHash}, trying fallbacks...`);
        }
        continue;
      }
    }

    throw new Error(`All IPFS gateways failed for ${ipfsHash}`);
  }

  /**
   * Strategy 5: Enhanced Search Optimization
   * Use onchain data for fast filtering, IPFS for detailed view
   * Supports fuzzy matching and weighted results
   */
  searchTracks(tracks: HybridTrackData[], query: string): HybridTrackData[] {
    if (!query || query.trim().length === 0) {
      return tracks;
    }

    const lowerQuery = query.toLowerCase().trim();
    const searchTerms = lowerQuery.split(' ').filter(term => term.length > 0);

    const scoredTracks = tracks.map(track => {
      let score = 0;
      const searchableText = this.getSearchableText(track);

      // Exact matches get highest score
      if (searchableText.toLowerCase().includes(lowerQuery)) {
        score += 100;
      }

      // Partial matches for each search term
      searchTerms.forEach(term => {
        if (searchableText.toLowerCase().includes(term)) {
          score += 50;
        }

        // Genre matching gets bonus points
        if (track.genre.toLowerCase().includes(term)) {
          score += 30;
        }

        // Token ID exact match
        if (track.tokenId.toString() === term) {
          score += 80;
        }

        // Artist/creator partial match
        if (track.creator.toLowerCase().includes(term)) {
          score += 40;
        }
      });

      // Fuzzy matching for typos (simple levenshtein-like)
      if (score === 0) {
        score += this.fuzzyMatchScore(searchableText.toLowerCase(), lowerQuery);
      }

      return { track, score };
    });

    // Filter out tracks with no match and sort by relevance
    return scoredTracks
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ track }) => track);
  }

  /**
   * Get all searchable text from a track
   */
  private getSearchableText(track: HybridTrackData): string {
    const parts = [
      track.genre,
      track.tokenId.toString(),
      track.creator
    ];

    if (track.ipfsMetadata) {
      parts.push(
        track.ipfsMetadata.name,
        track.ipfsMetadata.description,
        track.ipfsMetadata.aiMetadata?.prompt || '',
        ...(track.ipfsMetadata.attributes?.map(attr => `${attr.trait_type} ${attr.value}`) || [])
      );
    }

    return parts.filter(Boolean).join(' ');
  }

  /**
   * Simple fuzzy matching for typo tolerance
   */
  private fuzzyMatchScore(text: string, query: string): number {
    if (query.length < 3) return 0;

    let matches = 0;
    const queryChars = query.split('');

    for (const char of queryChars) {
      if (text.includes(char)) {
        matches++;
      }
    }

    const similarity = matches / query.length;
    return similarity > 0.6 ? Math.floor(similarity * 20) : 0;
  }

  /**
   * Strategy 6: Progressive Enhancement
   * Start with basic data, enhance with IPFS metadata
   */
  getDisplayData(track: HybridTrackData) {
    return {
      // Always available (onchain)
      id: track.tokenId.toString(),
      creator: track.creator,
      price: track.price,
      genre: track.genre,
      createdAt: new Date(Number(track.createdAt) * 1000).toISOString(),
      isListed: track.isListed,
      
      // Progressive enhancement (IPFS)
      title: track.ipfsMetadata?.name || `Track #${track.tokenId}`,
      description: track.ipfsMetadata?.description || 'Loading...',
      imageUrl: track.ipfsMetadata?.image ? 
        this.formatIPFSUrl(track.ipfsMetadata.image) : 
        '/default-music-cover.jpg',
      audioUrl: track.ipfsMetadata?.audio ? 
        this.formatIPFSUrl(track.ipfsMetadata.audio) : 
        '',
      
      // Enhanced metadata
      attributes: track.ipfsMetadata?.attributes || [],
      aiMetadata: track.ipfsMetadata?.aiMetadata,
      // Remove loading indicators for clean UI - loading happens in background
      isLoadingMetadata: false, // Always false for clean UI
      metadataError: track.error
    };
  }

  /**
   * Utility: Format IPFS URLs for proper gateway access
   */
  private formatIPFSUrl(ipfsUrl: string): string {
    if (ipfsUrl.startsWith('ipfs://')) {
      return ipfsUrl.replace('ipfs://', this.ipfsGateway);
    }
    return ipfsUrl;
  }

  /**
   * Utility: Chunk array into smaller batches
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Strategy 7: Preload Popular Tracks
   * Cache metadata for trending/featured tracks with deduplication
   */
  async preloadPopularTracks(popularHashes: string[]) {
    if (!popularHashes || popularHashes.length === 0) {
      return;
    }

    // Filter out already cached hashes to prevent spam loading
    const uncachedHashes = popularHashes.filter(hash => !this.cache.has(hash));

    if (uncachedHashes.length === 0) {
      return;
    }

    // Load in smaller batches to prevent overwhelming gateways
    const batchSize = 2; // Even smaller batches
    const batches = this.chunkArray(uncachedHashes, batchSize);

    for (const batch of batches) {
      await Promise.allSettled(
        batch.map(async (hash) => {
          // Double-check cache before loading (in case of race conditions)
          if (this.cache.has(hash)) {
            return;
          }

          try {
            const metadata = await this.fetchFromIPFS(hash);
            this.cache.set(hash, metadata);
          } catch (error) {
            // Silent fail - no logging for background preloading
          }
        })
      );

      // Longer delay between batches for popular tracks
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

/**
 * Usage Example:
 * 
 * const metadataStrategy = new MetadataStrategy();
 * 
 * // 1. Load explorer data (fast initial render)
 * const explorerData = await metadataStrategy.getExplorerData(onChainTracks);
 * 
 * // 2. Search with hybrid approach
 * const searchResults = metadataStrategy.searchTracks(explorerData, "electronic");
 * 
 * // 3. Get display data with progressive enhancement
 * const displayTrack = metadataStrategy.getDisplayData(track);
 */