import { useState, useCallback } from "react";
import { GeneratedMusic, SunoGenerateRequest } from "@/types/music";
import { sunoService } from "@/services/sunoService";
import { ipfsService } from "@/services/ipfsService";
import { toast } from "sonner";

export const useGeneratedMusic = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMusic, setGeneratedMusic] = useState<GeneratedMusic[]>([]);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  const generateMusic = useCallback(async (params: SunoGenerateRequest): Promise<GeneratedMusic[]> => {
    setIsGenerating(true);
    setCurrentTaskId(null);

    try {
      // Step 1: Start generation
      toast.info("Starting music generation...", { duration: 2000 });
      const generateResponse = await sunoService.generateMusic(params);
      setCurrentTaskId(generateResponse.data.taskId);

      // Step 2: Poll for completion
      toast.info("Generating music... This may take 30-60 seconds", { 
        duration: 5000,
        description: `Task ID: ${generateResponse.data.taskId}`
      });
      
      const taskResponse = await sunoService.pollTaskCompletion(generateResponse.data.taskId);

      if (!taskResponse.data.response?.sunoData || taskResponse.data.response.sunoData.length === 0) {
        throw new Error("No music data received from generation");
      }

      // Step 3: Process each generated track
      const newMusic: GeneratedMusic[] = [];
      
      for (const trackData of taskResponse.data.response.sunoData) {
        try {
          // Upload to IPFS
          const ipfsHashes = await ipfsService.uploadMusicWithMetadata(trackData, params);
          
          const musicItem: GeneratedMusic = {
            id: trackData.id,
            title: trackData.title || "Untitled",
            artist: "HiBeats AI",
            duration: Math.round(trackData.duration),
            audioUrl: trackData.audioUrl,
            imageUrl: trackData.imageUrl,
            genre: trackData.tags ? trackData.tags.split(", ") : [],
            ipfsHash: ipfsHashes.metadataHash,
            metadata: {
              name: trackData.title,
              description: trackData.prompt,
              image: `ipfs://${ipfsHashes.imageHash}`,
              external_url: `https://gateway.pinata.cloud/ipfs/${ipfsHashes.audioHash}`,
              attributes: [
                { trait_type: "Genre", value: trackData.tags },
                { trait_type: "Duration", value: Math.round(trackData.duration) },
                { trait_type: "Model", value: trackData.modelName },
                { trait_type: "Generation Date", value: trackData.createTime }
              ],
              audio_url: `ipfs://${ipfsHashes.audioHash}`,
              duration: trackData.duration,
              genre: trackData.tags ? trackData.tags.split(", ") : [],
              created_by: "HiBeats AI",
              model_used: trackData.modelName,
              generation_date: trackData.createTime
            },
            taskId: generateResponse.data.taskId,
            createdAt: trackData.createTime
          };

          newMusic.push(musicItem);
        } catch (ipfsError) {
          console.error("IPFS upload failed for track:", trackData.id, ipfsError);
          
          // Still add the track even if IPFS upload fails
          const musicItem: GeneratedMusic = {
            id: trackData.id,
            title: trackData.title || "Untitled",
            artist: "HiBeats AI",
            duration: Math.round(trackData.duration),
            audioUrl: trackData.audioUrl,
            imageUrl: trackData.imageUrl,
            genre: trackData.tags ? trackData.tags.split(", ") : [],
            taskId: generateResponse.data.taskId,
            createdAt: trackData.createTime
          };

          newMusic.push(musicItem);
          toast.warning(`Track generated but IPFS upload failed for: ${trackData.title}`);
        }
      }

      // Update state
      setGeneratedMusic(prev => [...newMusic, ...prev]);
      
      toast.success(`Successfully generated ${newMusic.length} track(s)!`, {
        description: "Your music is ready to play and stored on IPFS"
      });

      return newMusic;

    } catch (error) {
      console.error("Music generation failed:", error);
      toast.error(`Generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      throw error;
    } finally {
      setIsGenerating(false);
      setCurrentTaskId(null);
    }
  }, []);

  const clearGeneratedMusic = useCallback(() => {
    setGeneratedMusic([]);
  }, []);

  return {
    generateMusic,
    isGenerating,
    generatedMusic,
    currentTaskId,
    clearGeneratedMusic
  };
};