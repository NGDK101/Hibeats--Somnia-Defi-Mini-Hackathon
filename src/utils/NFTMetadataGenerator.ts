import { IPFSMetadata } from "@/types/music";

/**
 * Utility class for generating standardized NFT metadata for HiBeats music NFTs
 */
export class NFTMetadataGenerator {
  /**
   * Generate ERC721 compliant metadata for music NFT
   */
  static generateMusicMetadata(params: {
    name: string;
    description: string;
    image: string;
    audioUrl: string;
    duration: number;
    genre: string | string[];
    creator: string;
    modelUsed: string;
    prompt?: string;
    tags?: string;
    sunoId?: string;
    taskId?: string;
    royaltyRate?: number;
    isRemixable?: boolean;
    creationDate?: string;
    customCover?: boolean;
  }): IPFSMetadata {
    const {
      name,
      description,
      image,
      audioUrl,
      duration,
      genre,
      creator,
      modelUsed,
      prompt,
      tags,
      sunoId,
      taskId,
      royaltyRate = 5,
      isRemixable = true,
      creationDate = new Date().toISOString(),
      customCover = false
    } = params;

    // Ensure genre is array
    const genreArray = Array.isArray(genre) ? genre : [genre];

    // Create attributes array
    const attributes = [
      {
        trait_type: "Genre",
        value: genreArray.join(", ")
      },
      {
        trait_type: "Duration",
        value: duration
      },
      {
        trait_type: "Model",
        value: modelUsed
      },
      {
        trait_type: "Creator",
        value: creator
      },
      {
        trait_type: "Royalty Rate",
        value: `${royaltyRate}%`
      },
      {
        trait_type: "Remixable",
        value: isRemixable ? "Yes" : "No"
      },
      {
        trait_type: "Creation Date",
        value: creationDate
      }
    ];

    // Add optional attributes
    if (sunoId) {
      attributes.push({
        trait_type: "Suno ID",
        value: sunoId
      });
    }

    if (taskId) {
      attributes.push({
        trait_type: "Task ID",
        value: taskId
      });
    }

    if (tags) {
      attributes.push({
        trait_type: "Tags",
        value: tags
      });
    }

    if (customCover) {
      attributes.push({
        trait_type: "Custom Cover",
        value: "Yes"
      });
    }

    return {
      name,
      description,
      image,
      external_url: audioUrl,
      attributes,
      audio_url: audioUrl,
      duration,
      genre: genreArray,
      created_by: creator,
      model_used: modelUsed,
      generation_date: creationDate,
      prompt,
      task_id: taskId,
      instrumental: false, // Default to false, can be updated if needed
      custom_mode: false,
      style: genreArray[0] || "Unknown",
      vocal_gender: "Mixed", // Default
      negative_tags: ""
    };
  }

  /**
   * Validate metadata structure
   */
  static validateMetadata(metadata: IPFSMetadata): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!metadata.name || metadata.name.trim().length === 0) {
      errors.push("Name is required");
    }

    if (!metadata.description || metadata.description.trim().length === 0) {
      errors.push("Description is required");
    }

    if (!metadata.image || metadata.image.trim().length === 0) {
      errors.push("Image URL is required");
    }

    if (!metadata.audio_url || metadata.audio_url.trim().length === 0) {
      errors.push("Audio URL is required");
    }

    if (!metadata.created_by || metadata.created_by.trim().length === 0) {
      errors.push("Creator address is required");
    }

    if (!metadata.model_used || metadata.model_used.trim().length === 0) {
      errors.push("Model used is required");
    }

    if (!Array.isArray(metadata.attributes) || metadata.attributes.length === 0) {
      errors.push("Attributes array is required and cannot be empty");
    }

    if (metadata.duration <= 0) {
      errors.push("Duration must be greater than 0");
    }

    if (!Array.isArray(metadata.genre) || metadata.genre.length === 0) {
      errors.push("Genre array is required and cannot be empty");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate metadata filename
   */
  static generateMetadataFilename(name: string, tokenId?: string): string {
    const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    const timestamp = Date.now();
    const id = tokenId ? `_${tokenId}` : "";
    return `${sanitizedName}_metadata${id}_${timestamp}.json`;
  }

  /**
   * Create metadata preview for UI display
   */
  static createMetadataPreview(metadata: IPFSMetadata): {
    name: string;
    description: string;
    image: string;
    attributes: Array<{ trait_type: string; value: string | number }>;
    audioUrl: string;
    duration: string;
    genre: string;
    creator: string;
  } {
    return {
      name: metadata.name,
      description: metadata.description,
      image: metadata.image,
      attributes: metadata.attributes,
      audioUrl: metadata.audio_url,
      duration: `${Math.floor(metadata.duration / 60)}:${(metadata.duration % 60).toString().padStart(2, '0')}`,
      genre: metadata.genre.join(", "),
      creator: `${metadata.created_by.slice(0, 6)}...${metadata.created_by.slice(-4)}`
    };
  }
}