import { IPFSMetadata, PinataResponse, SunoTrackData } from "@/types/music";
import { toast } from "sonner";

const PINATA_API_KEY = "55907787b2b9d1438852";
const PINATA_BASE_URL = "https://api.pinata.cloud";

class IPFSService {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${PINATA_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "pinata_api_key": PINATA_API_KEY,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.details || `HTTP error! status: ${response.status}`);
    }

    return response.json();
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

  async uploadFromUrl(url: string, filename: string): Promise<PinataResponse> {
    try {
      // Fetch the file from URL
      const fileResponse = await fetch(url);
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file from URL: ${fileResponse.statusText}`);
      }
      
      const blob = await fileResponse.blob();
      return await this.uploadFile(blob, filename);
    } catch (error) {
      console.error("IPFS URL Upload Error:", error);
      throw error;
    }
  }

  async uploadMetadata(metadata: IPFSMetadata): Promise<PinataResponse> {
    try {
      const response = await this.makeRequest<PinataResponse>("/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pinataContent: metadata,
          pinataMetadata: {
            name: `${metadata.name}_metadata.json`,
            keyvalues: {
              type: "metadata",
              platform: "HiBeats"
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

  async uploadMusicWithMetadata(trackData: SunoTrackData, generationParams: any): Promise<{
    audioHash: string;
    imageHash: string;
    metadataHash: string;
  }> {
    try {
      toast.info("Uploading to IPFS...", { duration: 2000 });

      // Upload audio file
      const audioResponse = await this.uploadFromUrl(
        trackData.audioUrl,
        `${trackData.title.replace(/\s+/g, "_")}_${trackData.id}.mp3`
      );

      // Upload cover image
      const imageResponse = await this.uploadFromUrl(
        trackData.imageUrl,
        `${trackData.title.replace(/\s+/g, "_")}_${trackData.id}_cover.jpg`
      );

      // Create metadata
      const metadata: IPFSMetadata = {
        name: trackData.title,
        description: trackData.prompt,
        image: `ipfs://${imageResponse.IpfsHash}`,
        external_url: `https://gateway.pinata.cloud/ipfs/${audioResponse.IpfsHash}`,
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
        audio_url: `ipfs://${audioResponse.IpfsHash}`,
        duration: trackData.duration,
        genre: trackData.tags.split(", "),
        created_by: "HiBeats AI",
        model_used: trackData.modelName,
        generation_date: trackData.createTime
      };

      // Upload metadata
      const metadataResponse = await this.uploadMetadata(metadata);

      toast.success("Successfully uploaded to IPFS!");

      return {
        audioHash: audioResponse.IpfsHash,
        imageHash: imageResponse.IpfsHash,
        metadataHash: metadataResponse.IpfsHash
      };
    } catch (error) {
      console.error("IPFS Upload Process Error:", error);
      toast.error("Failed to upload to IPFS");
      throw error;
    }
  }

  getGatewayUrl(hash: string): string {
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
  }
}

export const ipfsService = new IPFSService();