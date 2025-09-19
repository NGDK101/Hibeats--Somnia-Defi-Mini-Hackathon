import { IPFSMetadata, PinataResponse, SunoTrackData, SunoGenerateRequest } from "@/types/music";
import { toast } from "sonner";
import { IPFSTest } from "@/utils/IPFSTest";

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY || "";
const PINATA_SECRET_API_KEY = import.meta.env.VITE_PINATA_API_SECRET || "";
const PINATA_JWT = import.meta.env.VITE_PINATA_API_JWT || "";

// Debug environment variables (only in development)
if (import.meta.env.DEV) {
  console.log('🔧 IPFS Service Environment Check:', {
    hasApiKey: !!PINATA_API_KEY,
    hasSecretKey: !!PINATA_SECRET_API_KEY,
    hasJWT: !!PINATA_JWT,
    apiKeyLength: PINATA_API_KEY.length,
    secretKeyLength: PINATA_SECRET_API_KEY.length,
    jwtLength: PINATA_JWT.length
  });
}
const PINATA_BASE_URL = "https://api.pinata.cloud";

class IPFSService {
  private isConnectionTested = false;
  private connectionStatus: { success: boolean; method?: string; error?: string } | null = null;

  private getHash(response: PinataResponse): string {
    return response.cid || response.IpfsHash || '';
  }

  /**
   * Test IPFS connection before first upload
   */
  async testConnection(): Promise<boolean> {
    if (this.isConnectionTested && this.connectionStatus?.success) {
      return true;
    }

    try {
      console.log('🧪 Testing IPFS connection...');
      this.connectionStatus = await IPFSTest.testAuthentication();
      this.isConnectionTested = true;

      if (this.connectionStatus.success) {
        console.log(`✅ IPFS connection successful using ${this.connectionStatus.method}`);
        return true;
      } else {
        console.error('❌ IPFS connection failed:', this.connectionStatus.error);
        toast.error(`IPFS connection failed: ${this.connectionStatus.error}`);
        return false;
      }
    } catch (error) {
      console.error('❌ IPFS connection test error:', error);
      this.connectionStatus = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      return false;
    }
  }

  /**
   * Create fallback metadata URI (base64 encoded JSON)
   */
  createFallbackMetadataURI(metadata: IPFSMetadata): string {
    try {
      const jsonString = JSON.stringify(metadata, null, 2);
      const base64 = btoa(unescape(encodeURIComponent(jsonString)));
      return `data:application/json;base64,${base64}`;
    } catch (error) {
      console.error('Error creating fallback metadata URI:', error);
      throw new Error('Failed to create fallback metadata URI');
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      // Prefer JWT authentication if available (recommended by Pinata)
      if (PINATA_JWT) {
        if (import.meta.env.DEV) {
          console.log(`📡 Making IPFS request to: ${PINATA_BASE_URL}${endpoint} (using JWT)`);
        }

        const response = await fetch(`${PINATA_BASE_URL}${endpoint}`, {
          ...options,
          headers: {
            "Authorization": `Bearer ${PINATA_JWT}`,
            ...options.headers,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: { details: errorText } };
          }

          console.error('❌ IPFS Request Failed (JWT):', {
            status: response.status,
            statusText: response.statusText,
            errorData,
            endpoint
          });

          throw new Error(errorData.error?.details || errorData.message || `HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        if (import.meta.env.DEV) {
          console.log('✅ IPFS Request Success (JWT):', { endpoint, hasData: !!responseData });
        }
        return responseData;
      }

      // Fallback to API key authentication
      if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
        const missingVars = [];
        if (!PINATA_API_KEY) missingVars.push('VITE_PINATA_API_KEY');
        if (!PINATA_SECRET_API_KEY) missingVars.push('VITE_PINATA_API_SECRET');

        throw new Error(`Missing environment variables: ${missingVars.join(', ')}. Either provide PINATA_JWT or both API key and secret.`);
      }

      if (import.meta.env.DEV) {
        console.log(`📡 Making IPFS request to: ${PINATA_BASE_URL}${endpoint} (using API keys)`);
      }

      const response = await fetch(`${PINATA_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          "pinata_api_key": PINATA_API_KEY,
          "pinata_secret_api_key": PINATA_SECRET_API_KEY,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: { details: errorText } };
        }

        console.error('❌ IPFS Request Failed (API Keys):', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          endpoint
        });

        throw new Error(errorData.error?.details || errorData.message || `HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      if (import.meta.env.DEV) {
        console.log('✅ IPFS Request Success (API Keys):', { endpoint, hasData: !!responseData });
      }
      return responseData;

    } catch (error) {
      console.error('❌ IPFS Request Error:', error);
      throw error;
    }
  }

  async uploadFromUrl(url: string, filename: string, type: 'audio' | 'image', metadata?: {
    transactionHash?: string;
    taskId?: string;
    userAddress?: string;
    songTitle?: string;
    prompt?: string;
  }): Promise<PinataResponse> {
    try {
      // Download file from URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch file from URL: ${response.status}`);
      }

      const blob = await response.blob();

      const formData = new FormData();
      formData.append("file", blob, filename);

      // Enhanced metadata for Pinata
      const pinataMetadata = JSON.stringify({
        name: filename,
        keyvalues: {
          type: type,
          platform: "HiBeats",
          originalUrl: url,
          transactionHash: metadata?.transactionHash || "",
          taskId: metadata?.taskId || "",
          userAddress: metadata?.userAddress || "",
          songTitle: metadata?.songTitle || "",
          prompt: metadata?.prompt || "",
          uploadDate: new Date().toISOString(),
          fileSize: blob.size
        }
      });
      formData.append("pinataMetadata", pinataMetadata);

      const uploadResponse = await this.makeRequest<PinataResponse>("/pinning/pinFileToIPFS", {
        method: "POST",
        body: formData,
      });

      // console.log(`✅ Uploaded ${type} to IPFS:`, this.getHash(uploadResponse));
      return uploadResponse;
    } catch (error) {
      console.error(`IPFS Upload from URL Error (${type}):`, error);
      throw error;
    }
  }

  async uploadFile(file: Blob, filename: string): Promise<PinataResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file, filename);
      
      const pinataMetadata = JSON.stringify({
        name: filename,
        keyvalues: {
          type: "audio",
          platform: "HiBeats"
        }
      });
      formData.append("pinataMetadata", pinataMetadata);

      const response = await this.makeRequest<PinataResponse>("/pinning/pinFileToIPFS", {
        method: "POST",
        body: formData,
      });

      return response;
    } catch (error) {
      console.error("IPFS Upload Error:", error);
      toast.error(`Failed to upload to IPFS: ${error instanceof Error ? error.message : "Unknown error"}`);
      throw error;
    }
  }

  async uploadMetadata(metadata: IPFSMetadata): Promise<PinataResponse> {
    try {
      // Validate metadata before upload
      const validation = this.validateMetadataForUpload(metadata);
      if (!validation.isValid) {
        throw new Error(`Metadata validation failed: ${validation.errors.join(', ')}`);
      }

      // Test connection first
      const connectionOk = await this.testConnection();
      if (!connectionOk) {
        throw new Error('IPFS connection test failed');
      }

      console.log('📤 Uploading metadata to IPFS via Pinata:', {
        name: metadata.name,
        hasImage: !!metadata.image,
        hasAudio: !!metadata.audio_url,
        attributesCount: metadata.attributes.length
      });

      const response = await this.makeRequest<PinataResponse>("/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pinataContent: metadata,
          pinataMetadata: {
            name: `${metadata.name.replace(/[^a-zA-Z0-9]/g, '_')}_metadata_${Date.now()}.json`,
            keyvalues: {
              type: "nft-metadata",
              platform: "HiBeats",
              creator: metadata.created_by,
              model_used: metadata.model_used,
              genre: metadata.genre.join(', '),
              created_at: new Date().toISOString(),
              version: "1.0"
            }
          }
        }),
      });

      console.log('✅ Metadata uploaded successfully to IPFS:', {
        ipfsHash: this.getHash(response),
        pinataId: response.id,
        timestamp: new Date().toISOString()
      });

      return response;
    } catch (error) {
      console.error("❌ IPFS Metadata Upload Error:", error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('validation failed')) {
          toast.error(`Metadata validation error: ${error.message}`);
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          toast.error('IPFS authentication failed. Please check your Pinata credentials.');
        } else if (error.message.includes('413')) {
          toast.error('Metadata too large for IPFS upload.');
        } else if (error.message.includes('429')) {
          toast.error('IPFS upload rate limit exceeded. Please try again later.');
        } else {
          toast.error(`Failed to upload metadata to IPFS: ${error.message}`);
        }
      } else {
        toast.error('Failed to upload metadata to IPFS: Unknown error occurred');
      }

      throw error;
    }
  }

  /**
   * Validate metadata before IPFS upload
   */
  private validateMetadataForUpload(metadata: IPFSMetadata): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields validation
    if (!metadata.name || metadata.name.trim().length === 0) {
      errors.push("Metadata name is required");
    }

    if (!metadata.description || metadata.description.trim().length === 0) {
      errors.push("Metadata description is required");
    }

    if (!metadata.image || metadata.image.trim().length === 0) {
      errors.push("Metadata image URL is required");
    }

    if (!metadata.audio_url || metadata.audio_url.trim().length === 0) {
      errors.push("Metadata audio URL is required");
    }

    if (!metadata.created_by || metadata.created_by.trim().length === 0) {
      errors.push("Metadata creator address is required");
    }

    // Validate URLs
    if (metadata.image && !this.isValidUrl(metadata.image)) {
      errors.push("Invalid image URL format");
    }

    if (metadata.audio_url && !this.isValidUrl(metadata.audio_url)) {
      errors.push("Invalid audio URL format");
    }

    if (metadata.external_url && !this.isValidUrl(metadata.external_url)) {
      errors.push("Invalid external URL format");
    }

    // Validate attributes
    if (!Array.isArray(metadata.attributes) || metadata.attributes.length === 0) {
      errors.push("Metadata attributes array is required");
    } else {
      metadata.attributes.forEach((attr, index) => {
        if (!attr.trait_type || attr.trait_type.trim().length === 0) {
          errors.push(`Attribute ${index + 1}: trait_type is required`);
        }
        if (attr.value === undefined || attr.value === null) {
          errors.push(`Attribute ${index + 1}: value is required`);
        }
      });
    }

    // Validate numeric fields
    if (metadata.duration <= 0) {
      errors.push("Duration must be greater than 0");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'ipfs:';
    } catch {
      return false;
    }
  }

  /**
   * Upload NFT metadata with enhanced error handling and fallback support
   */
  async uploadNFTMetadata(metadata: IPFSMetadata, options?: {
    onProgress?: (stage: string, progress: number) => void;
    retryAttempts?: number;
    useFallback?: boolean;
  }): Promise<{ ipfsHash: string; gatewayUrl: string; pinataResponse?: PinataResponse; fallbackUri?: string }> {
    const { onProgress, retryAttempts = 3, useFallback = true } = options || {};

    onProgress?.('Validating metadata', 10);

    // Validate metadata
    const validation = this.validateMetadataForUpload(metadata);
    if (!validation.isValid) {
      throw new Error(`Metadata validation failed: ${validation.errors.join(', ')}`);
    }

    onProgress?.('Preparing upload', 30);

    let lastError: Error | null = null;

    // Try IPFS upload first
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        onProgress?.(`Uploading to IPFS (attempt ${attempt}/${retryAttempts})`, 50 + (attempt * 10));

        console.log(`🔄 IPFS Upload Attempt ${attempt}/${retryAttempts} for: ${metadata.name}`);

        const pinataResponse = await this.uploadMetadata(metadata);

        const ipfsHash = this.getHash(pinataResponse);
        const gatewayUrl = this.getGatewayUrl(ipfsHash);

        onProgress?.('Upload completed', 100);

        console.log('🎉 NFT Metadata uploaded successfully:', {
          name: metadata.name,
          ipfsHash,
          gatewayUrl,
          attempt,
          pinataId: pinataResponse.id
        });

        return {
          ipfsHash,
          gatewayUrl,
          pinataResponse
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown upload error');
        console.warn(`Upload attempt ${attempt} failed:`, lastError.message);

        if (attempt < retryAttempts) {
          // Wait before retry (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // IPFS upload failed, try fallback method if enabled
    if (useFallback) {
      try {
        console.warn('⚠️ IPFS upload failed, using fallback method (base64 encoded JSON)');
        onProgress?.('Creating fallback metadata', 90);

        const fallbackUri = this.createFallbackMetadataURI(metadata);

        // Create a fake hash for the fallback URI (first 46 chars of base64 content)
        const fallbackHash = `fallback_${Date.now()}_${metadata.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10)}`;

        onProgress?.('Fallback completed', 100);

        console.log('✅ Fallback metadata created:', {
          name: metadata.name,
          fallbackHash,
          uriLength: fallbackUri.length
        });

        toast.warning('IPFS upload failed, using local metadata storage. NFT will still work properly!');

        return {
          ipfsHash: fallbackHash,
          gatewayUrl: fallbackUri,
          fallbackUri
        };

      } catch (fallbackError) {
        console.error('❌ Fallback method also failed:', fallbackError);
        throw new Error(`Both IPFS upload and fallback failed: ${lastError?.message}`);
      }
    }

    // All attempts failed and no fallback
    const errorMessage = `Failed to upload metadata after ${retryAttempts} attempts: ${lastError?.message}`;
    console.error('❌ All IPFS upload attempts failed:', errorMessage);
    throw new Error(errorMessage);
  }

  /**
   * Verify if metadata exists on IPFS
   */
  async verifyMetadataUpload(ipfsHash: string): Promise<boolean> {
    try {
      const gatewayUrl = this.getGatewayUrl(ipfsHash);
      const response = await fetch(gatewayUrl, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.warn('Failed to verify metadata on IPFS:', error);
      return false;
    }
  }

  async uploadMusicWithMetadata(trackData: SunoTrackData, generationParams: any): Promise<{
    audioHash: string;
    imageHash: string;
    metadataHash: string;
  }> {
    try {
      // Upload audio file
      const audioResponse = await this.uploadFromUrl(
        trackData.audioUrl,
        `${trackData.title.replace(/\s+/g, "_")}_${trackData.id}.mp3`,
        'audio'
      );

      // Upload cover image
      const imageResponse = await this.uploadFromUrl(
        trackData.imageUrl,
        `${trackData.title.replace(/\s+/g, "_")}_${trackData.id}_cover.jpg`,
        'image'
      );

      // Create metadata
      const metadata: IPFSMetadata = {
        name: trackData.title,
        description: trackData.prompt,
        image: `ipfs://${this.getHash(imageResponse)}`,
        external_url: `https://gateway.pinata.cloud/ipfs/${this.getHash(audioResponse)}`,
        attributes: [
          {
            trait_type: "Genre",
            value: trackData.tags
          },
          {
            trait_type: "Duration",
            value: Math.round(trackData.duration)
          },
          {
            trait_type: "Model",
            value: trackData.modelName
          },
          {
            trait_type: "Generation Date",
            value: trackData.createTime
          }
        ],
        audio_url: `ipfs://${this.getHash(audioResponse)}`,
        duration: trackData.duration,
        genre: trackData.tags.split(", "),
        created_by: "HiBeats AI",
        model_used: trackData.modelName,
        generation_date: trackData.createTime
      };

      // Upload metadata
      const metadataResponse = await this.uploadMetadata(metadata);

      return {
        audioHash: this.getHash(audioResponse),
        imageHash: this.getHash(imageResponse),
        metadataHash: this.getHash(metadataResponse)
      };
    } catch (error) {
      console.error("IPFS Upload Process Error:", error);
      toast.error("Failed to upload to IPFS");
      throw error;
    }
  }

  async uploadIndividualSongWithCompleteMetadata(
    trackData: SunoTrackData,
    generationParams: SunoGenerateRequest,
    transactionHash: string,
    taskId: string,
    userAddress: string
  ): Promise<{
    audioHash: string;
    imageHash: string;
    metadataHash: string;
  }> {
    try {
      // console.log(`🎵 Uploading individual song: ${trackData.title}`);

      // Create proper filename with song title and ID
      const safeTitle = trackData.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
      const audioFilename = `${safeTitle}_${trackData.id}_HiBeats.mp3`;
      const imageFilename = `${safeTitle}_${trackData.id}_cover_HiBeats.jpg`;

      // Upload audio file with enhanced metadata
      const audioResponse = await this.uploadFromUrl(
        trackData.audioUrl,
        audioFilename,
        'audio',
        {
          transactionHash,
          taskId,
          userAddress,
          songTitle: trackData.title,
          prompt: trackData.prompt
        }
      );

      // Upload cover image with enhanced metadata
      const imageResponse = await this.uploadFromUrl(
        trackData.imageUrl,
        imageFilename,
        'image',
        {
          transactionHash,
          taskId,
          userAddress,
          songTitle: trackData.title,
          prompt: trackData.prompt
        }
      );

      // Create comprehensive metadata with all available data
      const metadata: IPFSMetadata = {
        name: trackData.title,
        description: `AI-generated music by HiBeats. Prompt: "${trackData.prompt}"`,
        image: `ipfs://${this.getHash(imageResponse)}`,
        external_url: `https://gateway.pinata.cloud/ipfs/${this.getHash(audioResponse)}`,
        attributes: [
          {
            trait_type: "Song ID",
            value: trackData.id
          },
          {
            trait_type: "Task ID",
            value: taskId
          },
          {
            trait_type: "Transaction Hash",
            value: transactionHash
          },
          {
            trait_type: "Creator Address",
            value: userAddress
          },
          {
            trait_type: "Genre",
            value: trackData.tags
          },
          {
            trait_type: "Duration",
            value: Math.round(trackData.duration)
          },
          {
            trait_type: "Model",
            value: trackData.modelName
          },
          {
            trait_type: "Generation Date",
            value: trackData.createTime
          },
          {
            trait_type: "Instrumental",
            value: generationParams.instrumental ? "Yes" : "No"
          },
          {
            trait_type: "Custom Mode",
            value: generationParams.customMode ? "Advanced" : "Simple"
          },
          {
            trait_type: "Platform",
            value: "HiBeats AI"
          }
        ],
        audio_url: `ipfs://${this.getHash(audioResponse)}`,
        duration: trackData.duration,
        genre: trackData.tags.split(", "),
        created_by: userAddress,
        model_used: trackData.modelName,
        generation_date: trackData.createTime,
        prompt: trackData.prompt,
        transaction_hash: transactionHash,
        task_id: taskId,
        instrumental: generationParams.instrumental,
        custom_mode: generationParams.customMode,
        style: generationParams.style,
        title_custom: generationParams.title,
        vocal_gender: generationParams.vocalGender,
        negative_tags: generationParams.negativeTags,
        style_weight: generationParams.styleWeight,
        weirdness_constraint: generationParams.weirdnessConstraint,
        audio_weight: generationParams.audioWeight
      };

      // Upload metadata with enhanced filename
      const metadataFilename = `${safeTitle}_${trackData.id}_metadata_HiBeats.json`;
      const metadataResponse = await this.uploadMetadataWithCustomName(metadata, metadataFilename);

      // console.log(`✅ Successfully uploaded song "${trackData.title}" to IPFS`);
      // console.log(`   Audio: ipfs://${this.getHash(audioResponse)}`);
      // console.log(`   Image: ipfs://${this.getHash(imageResponse)}`);
      // console.log(`   Metadata: ipfs://${this.getHash(metadataResponse)}`);

      return {
        audioHash: this.getHash(audioResponse),
        imageHash: this.getHash(imageResponse),
        metadataHash: this.getHash(metadataResponse)
      };
    } catch (error) {
      console.error(`❌ Failed to upload song "${trackData.title}" to IPFS:`, error);
      throw error;
    }
  }

  async uploadMetadataWithCustomName(metadata: IPFSMetadata, filename: string): Promise<PinataResponse> {
    try {
      const response = await this.makeRequest<PinataResponse>("/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pinataContent: metadata,
          pinataMetadata: {
            name: filename,
            keyvalues: {
              type: "metadata",
              platform: "HiBeats",
              song_title: metadata.name,
              creator: metadata.created_by
            }
          }
        }),
      });

      return response;
    } catch (error) {
      console.error("IPFS Metadata Upload Error:", error);
      toast.error(`Failed to upload metadata to IPFS: ${error instanceof Error ? error.message : "Unknown error"}`);
      throw error;
    }
  }

  getGatewayUrl(hash: string): string {
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
  }
}

export { IPFSService };
export const ipfsService = new IPFSService();