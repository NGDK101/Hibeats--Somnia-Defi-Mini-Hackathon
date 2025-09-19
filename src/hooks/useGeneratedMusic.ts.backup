import { useState, useCallback, useEffect } from "react";
import { useAccount } from "wagmi";
import { GeneratedMusic, SunoGenerateRequest } from "@/types/music";
import { sunoService } from "@/services/sunoService";
import { ipfsService } from "@/services/ipfsService";
import { useHiBeatsFactory } from "./useHiBeatsFactory";
import { toast } from "sonner";

// Interface untuk callback response
interface SunoCallbackResponse {
  code: number;
  msg: string;
  data: {
    callbackType: "complete";
    task_id: string;
    data: Array<{
      id: string;
      audio_url: string;
      source_audio_url: string;
      stream_audio_url: string;
      source_stream_audio_url: string;
      image_url: string;
      source_image_url: string;
      prompt: string;
      model_name: string;
      title: string;
      tags: string;
      createTime: string;
      duration: number;
      lyrics?: string;
    }>;
  };
}

// Interface untuk NFT metadata
interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  audio_url: string;
  duration: number;
  genre: string[];
  created_by: string;
  model_used: string;
  generation_date: string;
  prompt: string;
  transaction_hash: string;
  task_id: string;
  instrumental: boolean;
  custom_mode: boolean;
  style?: string;
  title_custom?: string;
  vocal_gender?: string;
  negative_tags?: string;
}

// Konstanta untuk jumlah lagu per generation
const EXPECTED_TRACKS_PER_TASK = 2;

// Utility function untuk smart logging - hanya log jika ada perubahan atau interval waktu
const createSmartLogger = () => {
  const lastLogs = new Map<string, number>();
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return (key: string, message: string, data?: any, minInterval: number = 30000) => {
    if (!isDevelopment) return; // Only log in development mode
    
    const now = Date.now();
    const lastLog = lastLogs.get(key) || 0;
    
    if (now - lastLog > minInterval) {
      const prefix = `[HiBeats-${key}]`;
      if (data) {
        console.log(`${prefix} ${message}`, data);
      } else {
        console.log(`${prefix} ${message}`);
      }
      lastLogs.set(key, now);
    }
  };
};

const smartLog = createSmartLogger();

export const useGeneratedMusic = () => {
  const { address } = useAccount();
  const { 
    requestGeneration, 
    isPending: isContractPending, 
    isSuccess: isContractSuccess, 
    hash: contractHash, 
    generationFee,
    advancedGenerationFee,
    userRequests,
    refetchUserRequests,
    userTaskIds,
    refetchUserTaskIds,
    userCompletedTaskIds,
    refetchUserCompletedTaskIds,
    dailyGenerationsLeft,
    refetchDailyGenerationsLeft,
    waitForTransactionConfirmation
  } = useHiBeatsFactory();

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMusic, setGeneratedMusic] = useState<GeneratedMusic[]>([]);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [pendingTasks, setPendingTasks] = useState<Set<string>>(new Set());

  // Fungsi untuk record callback ke blockchain
  const recordCallbackToBlockchain = useCallback(async (
    taskId: string,
    callbackData: SunoCallbackResponse,
    generationParams?: SunoGenerateRequest,
    transactionHash?: string
  ) => {
    try {
      // console.log(`📝 Recording callback to blockchain for task: ${taskId}`);

      // Import writeContract untuk memanggil processSunoCallback
      const { writeContract } = await import('wagmi/actions');
      const { config } = await import('../config/web3');
      const { CONTRACT_ADDRESSES, HIBEATS_FACTORY_ABI } = await import('../contracts');

      // Prepare callback data untuk blockchain
      const blockchainCallbackData = {
        taskId: taskId,
        status: "SUCCESS",
        sunoIds: callbackData.data.data.map(track => track.id),
        audioUrls: callbackData.data.data.map(track => track.audio_url),
        imageUrls: callbackData.data.data.map(track => track.image_url || track.source_image_url),
        titles: callbackData.data.data.map(track => track.title),
        tags: callbackData.data.data.map(track => track.tags),
        durations: callbackData.data.data.map(track => BigInt(Math.round(track.duration || 0))),
        errorMessage: ""
      };

      // console.log(`🔗 Calling processSunoCallback with:`, blockchainCallbackData);

      // Call processSunoCallback on blockchain
      // console.log(`🔗 Calling processSunoCallback with:`, blockchainCallbackData);

      try {
        // Check if wallet is connected
        if (!address) {
          throw new Error("Wallet not connected");
        }

        // console.log(`🔗 Calling processSunoCallback for address: ${address}...`);
        const hash = await writeContract(config, {
          address: CONTRACT_ADDRESSES.HIBEATS_FACTORY,
          abi: HIBEATS_FACTORY_ABI,
          functionName: 'processSunoCallback',
          args: [taskId, blockchainCallbackData]
        });

        if (!hash) {
          throw new Error("Transaction failed - no hash returned");
        }

        // console.log(`✅ Callback recorded to blockchain. Transaction hash: ${hash}`);

        // Wait for confirmation
        // console.log(`⏳ Waiting for callback transaction confirmation: ${hash}`);

        try {
          await waitForTransactionConfirmation(hash);
          // console.log(`✅ Callback transaction confirmed: ${hash}`);
        } catch (confirmationError) {
          // console.error("❌ Transaction confirmation failed:", confirmationError);
          toast.error("Callback confirmation failed");
          throw confirmationError;
        }

        return hash;
      } catch (contractError) {
        // console.error("❌ Failed to send callback transaction:", contractError);
        toast.error("Failed to record callback");
        throw contractError;
      }
    } catch (error) {
      // console.error("❌ Failed to record callback to blockchain:", error);
      toast.error("Failed to record callback to blockchain");
      throw error;
    }
  }, [waitForTransactionConfirmation]);

  // Fungsi untuk membuat NFT metadata lengkap
  const createNFTMetadata = useCallback((
    trackData: any,
    generationParams?: SunoGenerateRequest,
    transactionHash?: string,
    taskId?: string,
    userAddress?: string
  ): NFTMetadata => {
    const metadata: NFTMetadata = {
      name: trackData.title || "AI Generated Music",
      description: `AI-generated music by HiBeats. Prompt: "${trackData.prompt}"`,
      image: trackData.image_url || trackData.source_image_url || "https://via.placeholder.com/400x400/1e1e1e/ffffff?text=Music",
      external_url: trackData.audio_url,
      attributes: [
        { trait_type: "Song ID", value: trackData.id },
        { trait_type: "Task ID", value: taskId || "" },
        { trait_type: "Transaction Hash", value: transactionHash || "" },
        { trait_type: "Creator Address", value: userAddress || "" },
        { trait_type: "Genre", value: trackData.tags || "" },
        { trait_type: "Duration", value: Math.round(trackData.duration || 0) },
        { trait_type: "Model", value: trackData.model_name || "unknown" },
        { trait_type: "Generation Date", value: trackData.createTime || new Date().toISOString() },
        { trait_type: "Instrumental", value: generationParams?.instrumental ? "Yes" : "No" },
        { trait_type: "Custom Mode", value: generationParams?.customMode ? "Advanced" : "Simple" },
        { trait_type: "Platform", value: "HiBeats AI" }
      ],
      audio_url: trackData.audio_url,
      duration: trackData.duration || 0,
      genre: trackData.tags ? trackData.tags.split(", ").filter((tag: string) => tag.trim()) : [],
      created_by: userAddress || "HiBeats User",
      model_used: trackData.model_name || "unknown",
      generation_date: trackData.createTime || new Date().toISOString(),
      prompt: trackData.prompt,
      transaction_hash: transactionHash || "",
      task_id: taskId || "",
      instrumental: generationParams?.instrumental || false,
      custom_mode: generationParams?.customMode || false,
      style: generationParams?.style,
      title_custom: generationParams?.title,
      vocal_gender: generationParams?.vocalGender,
      negative_tags: generationParams?.negativeTags
    };

    return metadata;
  }, []);

  // Debug function to display stored contract data
  const debugContractData = useCallback(async () => {
    if (!address) {
      // console.log("❌ No wallet connected");
      return;
    }

    try {
      // console.log("🔍 Debugging contract data for address:", address);

      // Force refresh contract data
      // console.log("🔄 Force refreshing contract data...");
      await refetchUserTaskIds?.();
      await refetchUserCompletedTaskIds?.();
      await refetchUserRequests?.();

      // Get user requests
      const userReqs = userRequests;
      // console.log("📋 User requests:", userReqs);

      // Get user task IDs
      const userTaskIdsData = userTaskIds;
      // console.log("🎯 User task IDs:", userTaskIdsData);

      // Get completed task IDs
      const completedTaskIdsData = userCompletedTaskIds;
      // console.log("✅ User completed task IDs:", completedTaskIdsData);

      // Show current state
      // console.log("📊 Current State:");
      // console.log("- Generated music count:", generatedMusic.length);
      // console.log("- Pending tasks count:", pendingTasks.size);
      // console.log("- Current task ID:", currentTaskId);
      // console.log("- Is generating:", isGenerating);

      // Debug filtering logic
      // console.log("🔍 DEBUG FILTERING:");
      generatedMusic.forEach(song => {
        const isInContract = (completedTaskIdsData && completedTaskIdsData.includes(song.taskId)) ||
                           (userTaskIdsData && userTaskIdsData.includes(song.taskId));
        const isPending = pendingTasks.has(song.taskId);
        const shouldShow = isInContract || isPending;

        // console.log(`🎵 Song: ${song.title}`);
        // console.log(`   - Task ID: ${song.taskId}`);
        // console.log(`   - In Contract: ${isInContract}`);
        // console.log(`   - Is Pending: ${isPending}`);
        // console.log(`   - Should Show: ${shouldShow}`);
        // console.log(`   - Song ID: ${song.id}`);
      });

    } catch (error) {
      // console.error("❌ Error debugging contract data:", error);
    }
  }, [address, userRequests, userTaskIds, userCompletedTaskIds, generatedMusic, pendingTasks, currentTaskId, isGenerating, refetchUserTaskIds, refetchUserCompletedTaskIds, refetchUserRequests]);

  // Load completed music from localStorage on mount (only as cache, primary source is blockchain)
  useEffect(() => {
    if (address) {
      // REMOVED: No longer loading from localStorage - only use blockchain task IDs and Suno API
      // console.log(`📚 Skipping localStorage load for ${address} - using only blockchain task IDs and Suno API`);
    } else {
      // Clear state when no address
      setGeneratedMusic([]);
    }
  }, [address]);

  // Fungsi untuk menangani callback response dari Suno
  const handleSunoCallback = useCallback(async (callbackData: SunoCallbackResponse, generationParams?: SunoGenerateRequest, transactionHash?: string) => {
    try {
      // console.log(`🎯 Step 0: Callback Received - handleSunoCallback called with task_id: ${callbackData.data.task_id}`);
      // console.log(`📊 Callback data contains ${callbackData.data.data.length} tracks`);
      // console.log(`📊 Callback data:`, callbackData);

      if (callbackData.code !== 200 || callbackData.data.callbackType !== "complete") {
        // console.error("❌ Invalid callback data:", callbackData);
        toast.error("Invalid callback data received");
        return;
      }

      if (!callbackData.data.data || callbackData.data.data.length === 0) {
        // console.error("❌ No track data in callback");
        toast.error("No track data received in callback");
        return;
      }

      // Step 1: Record callback to blockchain FIRST
      // console.log(`📝 Step 1: Recording callback to blockchain for task ${callbackData.data.task_id}`);

      let blockchainTxHash: string;
      try {
        blockchainTxHash = await recordCallbackToBlockchain(
          callbackData.data.task_id,
          callbackData,
          generationParams,
          transactionHash
        );
        // console.log(`✅ Step 1 Complete: Callback recorded to blockchain with tx: ${blockchainTxHash}`);
      } catch (blockchainError) {
        // console.error("❌ Failed to record callback to blockchain:", blockchainError);
        toast.error("Failed to record callback to blockchain");
        // Continue with IPFS upload even if blockchain recording fails
      }

      const newMusic: GeneratedMusic[] = [];

      for (const trackData of callbackData.data.data) {
        try {
          // Validasi track data
          if (!trackData.id || !trackData.title) {
            // console.warn("⚠️ Skipping invalid track data:", trackData);
            continue;
          }

          // Step 2: Create NFT metadata sesuai data callback
          // console.log(`🎨 Step 2: Creating NFT metadata for ${trackData.title}`);
          const nftMetadata = createNFTMetadata(
            trackData,
            generationParams,
            transactionHash,
            callbackData.data.task_id,
            address || ""
          );

          if (process.env.NODE_ENV === 'development') {
            console.log(`[HiBeats-NFT] ✅ Step 2 Complete: NFT Metadata created for ${trackData.title}`);
            console.log(`[HiBeats-NFT] 📋 NFT Metadata:`, {
              name: nftMetadata.name,
              taskId: nftMetadata.task_id,
              attributes: nftMetadata.attributes.length
            });
          }

          // Upload individual song with complete metadata to IPFS (only if params are available)
          let ipfsResult;
          let audioIpfsUrl = trackData.audio_url;
          let imageIpfsUrl = trackData.image_url || trackData.source_image_url;
          let metadataHash = "";

          if (generationParams && transactionHash) {
            try {
              // console.log(`🎵 Processing song: ${trackData.title}`);

              // Use the new individual upload method with complete metadata
              ipfsResult = await ipfsService.uploadIndividualSongWithCompleteMetadata(
                {
                  id: trackData.id,
                  audioUrl: trackData.audio_url,
                  streamAudioUrl: trackData.stream_audio_url || trackData.audio_url,
                  imageUrl: trackData.image_url || trackData.source_image_url,
                  prompt: trackData.prompt,
                  modelName: trackData.model_name,
                  title: trackData.title,
                  tags: trackData.tags,
                  createTime: trackData.createTime,
                  duration: trackData.duration
                },
                generationParams, // Generation parameters
                transactionHash, // Transaction hash
                callbackData.data.task_id, // Task ID
                address || "" // User address
              );

              // Update URLs with IPFS hashes
              audioIpfsUrl = ipfsService.getGatewayUrl(ipfsResult.audioHash);
              imageIpfsUrl = ipfsService.getGatewayUrl(ipfsResult.imageHash);
              metadataHash = ipfsResult.metadataHash;

              // console.log(`✅ Song "${trackData.title}" uploaded to IPFS successfully`);

            } catch (uploadError) {
              // console.warn(`⚠️ IPFS upload failed for "${trackData.title}", using original URLs:`, uploadError);
              // Keep original URLs as fallback
              audioIpfsUrl = trackData.audio_url || "";
              imageIpfsUrl = trackData.image_url || trackData.source_image_url || "";
            }
          } else {
            // console.log(`⏭️ Skipping IPFS upload for "${trackData.title}" - generation params not available`);
            // Keep original URLs
            audioIpfsUrl = trackData.audio_url || "";
            imageIpfsUrl = trackData.image_url || trackData.source_image_url || "";
          }

          // Step 3: Create music item with NFT metadata and task ID for display
          // console.log(`🎵 Step 3: Creating music item for display with task ID: ${callbackData.data.task_id}`);
          const musicItem: GeneratedMusic = {
            id: trackData.id,
            title: trackData.title || "Untitled",
            artist: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "HiBeats User",
            duration: Math.round(trackData.duration || 0),
            audioUrl: audioIpfsUrl,
            imageUrl: imageIpfsUrl || "https://via.placeholder.com/400x400/1e1e1e/ffffff?text=" + encodeURIComponent(trackData.title || "Music"),
            originalAudioUrl: trackData.audio_url, // Store original URL for fallback
            originalImageUrl: trackData.image_url || trackData.source_image_url, // Store original URL for fallback
            genre: trackData.tags ? trackData.tags.split(", ").filter(tag => tag.trim()) : [],
            lyrics: trackData.lyrics || undefined,
            ipfsHash: metadataHash, // Store metadata hash
            taskId: callbackData.data.task_id, // Use task ID from callback for display grouping
            createdAt: trackData.createTime || new Date().toISOString(),
            // Use the created NFT metadata
            metadata: nftMetadata
          };

          // console.log(`✅ Music item created for display:`, {
          //   id: musicItem.id,
          //   title: musicItem.title,
          //   taskId: musicItem.taskId,
          //   hasMetadata: !!musicItem.metadata
          // });

          newMusic.push(musicItem);

        } catch (error) {
          // console.error("❌ Failed to process track:", trackData.id, error);

          // Fallback: tambahkan track minimal
          const musicItem: GeneratedMusic = {
            id: trackData.id || `fallback-${Date.now()}`,
            title: trackData.title || "Untitled",
            artist: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "HiBeats User",
            duration: Math.round(trackData.duration || 0),
            audioUrl: trackData.audio_url || "",
            imageUrl: trackData.image_url || trackData.source_image_url || "https://via.placeholder.com/400x400/1e1e1e/ffffff?text=Music",
            originalAudioUrl: trackData.audio_url, // Store original URL for fallback
            originalImageUrl: trackData.image_url || trackData.source_image_url, // Store original URL for fallback
            genre: trackData.tags ? trackData.tags.split(", ") : [],
            taskId: callbackData.data.task_id,
            createdAt: trackData.createTime || new Date().toISOString()
          };

          newMusic.push(musicItem);
        }
      }

      // Step 4: Update display state dengan musik baru
      // console.log(`🎵 Step 4: Updating display state for task ${callbackData.data.task_id}`);
      setGeneratedMusic(prev => {
        // Filter out songs that already exist (by ID only - allow multiple songs per taskId)
        const filteredNewMusic = newMusic.filter(newSong => {
          const existsById = prev.some(existingSong => existingSong.id === newSong.id);
          
          if (existsById) {
            // console.log(`⏭️ Song with ID ${newSong.id} already exists, skipping`);
            return false;
          }
          
          // Allow multiple songs with same taskId (2 tracks per generation)
          // console.log(`✅ Adding new song: ${newSong.title} (ID: ${newSong.id}, TaskID: ${newSong.taskId})`);
          return true;
        });
        
        if (filteredNewMusic.length === 0) {
          // console.log(`⚠️ All ${newMusic.length} songs already exist, skipping update`);
          return prev;
        }
        
        const updated = [...filteredNewMusic, ...prev];
        // console.log(`✅ Step 4 Complete: Added ${filteredNewMusic.length} new songs to display`);
        // console.log(`📊 Total songs in library: ${updated.length}`);
        
        // Add explicit confirmation for display update
        
        return updated;
      });
      
      // Step 5: Clean up pending tasks
      // console.log(`🧹 Step 5: Cleaning up pending tasks for ${callbackData.data.task_id}`);
      setPendingTasks(prev => {
        const updated = new Set(prev);
        updated.delete(callbackData.data.task_id);
        // console.log(`✅ Step 5 Complete: Removed task ${callbackData.data.task_id} from pending tasks`);
        return updated;
      });

      // Remove any placeholder songs for this task
      setGeneratedMusic(prev => {
        const filtered = prev.filter(song => song.taskId !== callbackData.data.task_id || !song.id.startsWith('pending-'));
        if (filtered.length !== prev.length) {
          // console.log(`🗑️ Removed ${prev.length - filtered.length} placeholder songs for completed task ${callbackData.data.task_id}`);
        }
        return filtered;
      });
      
      // Step 6: Success notification and final logging
      // console.log(`🎉 PROCESS COMPLETE: Successfully processed callback for task ${callbackData.data.task_id}`);
      // console.log(`📊 Summary:`);
      // console.log(`   - Task ID: ${callbackData.data.task_id}`);
      // console.log(`   - Tracks received: ${callbackData.data.data.length}`);
      // console.log(`   - Tracks processed: ${newMusic.length}`);
      // console.log(`   - ✅ Block Record: ${transactionHash ? 'Yes' : 'No'}`);
      // console.log(`   - ✅ Record Callback: ${blockchainTxHash ? 'Yes' : 'No'}`);
      // console.log(`   - ✅ NFT Metadata: Yes`);
      // console.log(`   - ✅ Display: Yes (added to My Workspace)`);

      // Single final success toast with all information
      toast.success(`🎵 Music Generation Complete!`, {
        description: `${newMusic.length} track(s) successfully created and recorded on blockchain`,
        duration: 6000
      });

      // Clean up any potential duplicates after adding new music
      setTimeout(() => removeDuplicateSongs(), 1000);

      smartLog('callback-complete', `🎵 handleSunoCallback completed successfully, added ${newMusic.length} tracks`);
      
      // Update generating status to false after successful callback processing
      setIsGenerating(false);
      
      return newMusic;

    } catch (error) {
      // console.error("Callback processing failed:", error);
      toast.error(`Failed to process callback: ${error instanceof Error ? error.message : "Unknown error"}`);
      
      // Update generating status to false even on error to prevent UI stuck
      setIsGenerating(false);
    }
  }, [recordCallbackToBlockchain, createNFTMetadata, address, waitForTransactionConfirmation]);

  // Effect untuk listen pada callback events dari Suno API
  useEffect(() => {
    // Listener untuk window message events (untuk callback dari webhook/iframe)
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SUNO_CALLBACK') {
        handleSunoCallback(event.data.payload);
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [handleSunoCallback]);

  // Auto-monitoring effect untuk pending tasks - REMOVED
  // Logging sekarang hanya terjadi saat event spesifik:
  // - Generate music
  // - Record callback to blockchain
  // - Callback processing
  // - Transaction confirmations

  // Function to force refresh all data
  const forceRefreshAllData = useCallback(async () => {
    smartLog('force-refresh', "🔄 Force refreshing ALL data...");
    try {
      await refetchUserTaskIds?.();
      await refetchUserCompletedTaskIds?.();
      await refetchUserRequests?.();
      await refetchDailyGenerationsLeft?.();

      smartLog('force-refresh-complete', "✅ All data refreshed");
      smartLog('force-refresh-details', "📊 Current state:", {
        userTaskIds: userTaskIds?.length || 0,
        userCompletedTaskIds: userCompletedTaskIds?.length || 0,
        generatedMusic: generatedMusic.length
      }, 10000);

      // Trigger auto-load effect by updating dependencies
      setTimeout(() => {
        // console.log("🔄 Triggering auto-load effect...");
      }, 1000);

    } catch (error) {
      // console.error("❌ Error refreshing data:", error);
    }
  }, [refetchUserTaskIds, refetchUserCompletedTaskIds, refetchUserRequests, refetchDailyGenerationsLeft, userTaskIds, userCompletedTaskIds, generatedMusic.length]);

  // Function to clear songs that don't have valid blockchain task IDs
  const clearInvalidSongs = useCallback(() => {
    if (!userTaskIds || userTaskIds.length === 0) {
      // console.log("No blockchain task IDs available, skipping cleanup");
      return;
    }

    setGeneratedMusic(prev => {
      const validSongs = prev.filter(song => {
        if (!song.taskId) {
          // console.log(`🗑️ Removing song without task ID: ${song.title}`);
          return false;
        }

        const isValid = userTaskIds.includes(song.taskId);
        if (!isValid) {
          // console.log(`🗑️ Removing song with invalid task ID: ${song.title} (${song.taskId})`);
        }
        return isValid;
      });

      const removedCount = prev.length - validSongs.length;
      if (removedCount > 0 && process.env.NODE_ENV === 'development') {
        console.log(`Cleaned up ${removedCount} invalid songs from state`);
      }

      return validSongs;
    });
  }, [userTaskIds]);

  // Function to remove duplicate songs (by ID only - allow multiple songs per taskId)
  const removeDuplicateSongs = useCallback(() => {
    setGeneratedMusic(prev => {
      const seenIds = new Set<string>();
      const uniqueSongs: GeneratedMusic[] = [];
      const duplicates: GeneratedMusic[] = [];

      for (const song of prev) {
        const isDuplicateById = seenIds.has(song.id);

        if (isDuplicateById) {
          duplicates.push(song);
          smartLog(`duplicate-${song.id}`, `🗑️ Removing duplicate song: ${song.title} (ID: ${song.id}, TaskID: ${song.taskId})`, null, 30000);
        } else {
          uniqueSongs.push(song);
          seenIds.add(song.id);
        }
      }

      if (duplicates.length > 0) {
        // Count songs per taskId for reference
        const taskIdCounts: { [key: string]: number } = {};
        uniqueSongs.forEach(song => {
          if (song.taskId) {
            taskIdCounts[song.taskId] = (taskIdCounts[song.taskId] || 0) + 1;
          }
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[HiBeats-Cleanup] 🧹 Cleaned up ${duplicates.length} duplicate songs`);
          console.log(`[HiBeats-Cleanup] 📊 Current taskId distribution:`, taskIdCounts);
        }
      }

      return uniqueSongs;
    });
  }, []);

  const generateMusic = useCallback(async (params: SunoGenerateRequest): Promise<GeneratedMusic[]> => {
    setIsGenerating(true);
    setCurrentTaskId(null);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[HiBeats-Generation] 🚀 STARTING GENERATION PROCESS`);
      console.log(`[HiBeats-Generation] 📋 Generation Parameters:`, params);
    }

    try {
      // Show initial loading toast that will be updated throughout the process
      const progressToastId = toast.loading("🎵 Request Generate Song...", {
        description: "Sending request to AI and blockchain...",
      });

      // Combined Step: Start AI Generation + Blockchain Recording
      // console.log(`🎵 Starting combined AI generation and blockchain recording process`);
      
      let generateResponse;
      let generatedTaskId: string;
      let transactionHash: string | undefined;
      
      // Step 1: Start Suno AI generation
      try {
        generateResponse = await sunoService.generateMusic({
          ...params,
          customMode: params.customMode,
          instrumental: params.instrumental,
          model: params.model,
          callBackUrl: `${window.location.origin}/api/suno-callback`
        });
        
        generatedTaskId = generateResponse.data.taskId;
        setCurrentTaskId(generatedTaskId);
        // console.log(`🎯 Suno API Success: Generated task ID: ${generatedTaskId}`);
        
        // Update progress toast - Suno successful
        toast.loading("🎵 Request Generate Song...", {
          id: progressToastId,
          description: "AI request successful, recording to blockchain...",
        });
        
      } catch (sunoError) {
        // console.error("❌ Suno API call failed:", sunoError);
        toast.error("Failed to send request to AI", { id: progressToastId });
        setIsGenerating(false);
        throw new Error(`AI generation failed: ${sunoError instanceof Error ? sunoError.message : "Unknown error"}`);
      }

      // Step 2: Record to blockchain
      try {
        // Check if wallet is connected
        if (!address) {
          toast.error("Wallet not connected", { id: progressToastId });
          throw new Error("Wallet not connected");
        }

        // console.log(`🔗 Sending generation request to blockchain for address: ${address}...`);
        const result = await requestGeneration({
          prompt: params.prompt || "",
          style: params.style || "",
          instrumental: params.instrumental || false,
          mode: params.customMode ? 'Advanced' : 'Simple',
          taskId: generatedTaskId, // Use REAL Suno task ID
          title: params.customMode ? (params.title || "AI Generated Music") : "",
          vocalGender: params.customMode ? (params.vocalGender || "m") : ""
        });

        if (!result || !result.hash) {
          toast.error("Blockchain transaction failed", { id: progressToastId });
          throw new Error("Transaction failed - no hash returned");
        }

        transactionHash = result.hash;
        // console.log(`✅ Contract request successful! Transaction hash: ${result.hash}`);

        // Update progress toast - blockchain request sent
        toast.loading("🎵 Request Generate Song...", {
          id: progressToastId,
          description: "Waiting for transaction confirmation...",
        });

        // Step 3: Wait for transaction confirmation
        try {
          await waitForTransactionConfirmation(transactionHash);
          // console.log(`✅ Generation transaction confirmed: ${transactionHash}`);
          
          // Final success toast - both Suno + Blockchain complete
          toast.success("✅ Request Success!", {
            id: progressToastId,
            description: `TX: ${transactionHash.slice(0, 10)}...${transactionHash.slice(-8)} - AI generating your music...`,
            duration: 6000,
          });
        } catch (confirmationError) {
          // console.error("❌ Generation transaction confirmation failed:", confirmationError);
          toast.error("Transaction confirmation failed", { id: progressToastId });
          setIsGenerating(false);
          throw new Error("Transaction confirmation failed");
        }

      } catch (contractError) {
        // console.error("❌ Smart contract call failed:", contractError);
        toast.error("Blockchain transaction failed", { id: progressToastId });
        setIsGenerating(false);
        throw new Error(`Generation failed: ${contractError instanceof Error ? contractError.message : "Unknown error"}`);
      }
            description: "Request sent but confirmation failed. Check your transaction status.",
            duration: 5000,
          });
          throw new Error("Transaction confirmation failed");
        }

      } catch (contractError) {
        // console.error("❌ Smart contract call failed:", contractError);
        setIsGenerating(false);
        
        // More specific error message for blockchain issues
        if (contractError instanceof Error && contractError.message.includes("Transaction failed - no hash returned")) {
          toast.error("Blockchain Recording Failed", {
            description: "AI request successful, but failed to record on blockchain. Please try again.",
            duration: 5000,
          });
        } else {
          toast.error("Blockchain Error", {
            description: contractError instanceof Error ? contractError.message : "Unknown blockchain error",
            duration: 5000,
          });
        }
        
        throw new Error(`Blockchain recording failed: ${contractError instanceof Error ? contractError.message : "Unknown error"}`);
      }

      // Step 3: Block Record -> Wait
      // console.log(`⏳ Step 3: Block Record -> Wait - AI music generation in progress`);
      // console.log(`🎯 Task ID for monitoring: ${generatedTaskId}`);

      // Add task to pending tasks for auto-monitoring
      setPendingTasks(prev => {
        const newSet = new Set(prev);
        newSet.add(generatedTaskId);
        // console.log(`📝 Added task ${generatedTaskId} to pending tasks. Total pending: ${newSet.size}`);
        return newSet;
      });

      // Step 4: Wait -> Callback (will be handled by handleSunoCallback when Suno sends callback)
      // console.log(`🔄 Step 4: Wait -> Callback - Waiting for Suno callback...`);
      // console.log(`📡 Callback will be processed by handleSunoCallback when received`);
      // console.log(`🎵 Full process flow: Generate -> API Call -> Block Record -> Wait -> Callback -> Record Callback -> NFT Metadata -> Display`);

      // Poll setelah 15 detik untuk cek cepat
      setTimeout(async () => {
        try {
          // console.log(`🔄 Quick polling for task: ${generatedTaskId}`);
          const taskResponse = await sunoService.pollTaskCompletion(generatedTaskId, 20);
          // console.log(`📊 Poll response for ${generatedTaskId}:`, {
          //   status: taskResponse.data.status,
          //   hasData: !!taskResponse.data.response?.sunoData,
          //   dataLength: taskResponse.data.response?.sunoData?.length || 0
          // });
          
          if (taskResponse.data.response?.sunoData && taskResponse.data.response.sunoData.length > 0) {
            // console.log(`✅ Poll successful! Processing ${taskResponse.data.response.sunoData.length} tracks`);
            // Konversi ke format callback untuk consistency
            const callbackData = {
              code: 200,
              msg: "All generated successfully.",
              data: {
                callbackType: "complete" as const,
                task_id: generatedTaskId,
                data: taskResponse.data.response.sunoData.map(track => ({
                  id: track.id,
                  audio_url: track.audioUrl,
                  source_audio_url: track.audioUrl,
                  stream_audio_url: track.streamAudioUrl || track.audioUrl,
                  source_stream_audio_url: track.streamAudioUrl || track.audioUrl,
                  image_url: track.imageUrl,
                  source_image_url: track.imageUrl,
                  prompt: track.prompt,
                  model_name: track.modelName,
                  title: track.title,
                  tags: track.tags,
                  createTime: track.createTime,
                  duration: track.duration
                }))
              }
            };
            
            // Process via callback handler untuk consistency
            await handleSunoCallback(callbackData, params, transactionHash);
            // console.log(`✅ Quick polling successful for task: ${generatedTaskId}`);
          } else {
            // console.log(`⏳ Poll response received but no data yet for task: ${generatedTaskId}`);
          }
        } catch (pollingError) {
          // console.error(`❌ Quick polling failed for task: ${generatedTaskId}`, pollingError);
        }
      }, 15000); // Poll after 15 seconds
      
      // Poll setelah 45 detik untuk backup jika masih belum ada
      setTimeout(async () => {
        try {
          // console.log(`🔄 Extended polling for task: ${generatedTaskId}`);
          const taskResponse = await sunoService.pollTaskCompletion(generatedTaskId, 20);
          
          if (taskResponse.data.response?.sunoData && taskResponse.data.response.sunoData.length > 0) {
            // Konversi ke format callback untuk consistency
            const callbackData = {
              code: 200,
              msg: "All generated successfully.",
              data: {
                callbackType: "complete" as const,
                task_id: generatedTaskId,
                data: taskResponse.data.response.sunoData.map(track => ({
                  id: track.id,
                  audio_url: track.audioUrl,
                  source_audio_url: track.audioUrl,
                  stream_audio_url: track.streamAudioUrl || track.audioUrl,
                  source_stream_audio_url: track.streamAudioUrl || track.audioUrl,
                  image_url: track.imageUrl,
                  source_image_url: track.imageUrl,
                  prompt: track.prompt,
                  model_name: track.modelName,
                  title: track.title,
                  tags: track.tags,
                  createTime: track.createTime,
                  duration: track.duration
                }))
              }
            };
            
            // Process via callback handler untuk consistency
            await handleSunoCallback(callbackData, params, transactionHash);
            // console.log(`✅ Extended polling successful for task: ${generatedTaskId}`);
          }
        } catch (pollingError) {
          // console.error(`❌ Extended polling failed for task: ${generatedTaskId}`, pollingError);
        }
      }, 45000); // Poll after 45 seconds

      // Return task info immediately
      return [];

    } catch (error) {
      // console.error("Music generation failed:", error);
      setIsGenerating(false);
      
      // Only show general error if no specific error was already shown
      if (error instanceof Error && error.message.includes("AI generation failed")) {
        // Suno-specific error already handled above
        return [];
      } else if (error instanceof Error && error.message.includes("Blockchain recording failed")) {
        // Blockchain-specific error already handled above
        return [];
      } else {
        // General error
        toast.error("Generation Process Failed", {
          description: error instanceof Error ? error.message : "Unknown error occurred",
          duration: 5000,
        });
      }
      
      throw error;
    } finally {
      // Don't clear currentTaskId immediately, keep it for status tracking
    }
  }, [handleSunoCallback, requestGeneration, address, waitForTransactionConfirmation, setPendingTasks, setIsGenerating, setCurrentTaskId]);

  const clearGeneratedMusic = useCallback(() => {
    setGeneratedMusic([]);
  }, []);

  // Manual check untuk task yang mungkin miss callback
  const checkMissingTask = useCallback(async (taskId: string) => {
    try {
      // Check if task ID already exists in generated music
      const existingSongsCount = generatedMusic.filter(song => song.taskId === taskId).length;
      if (existingSongsCount >= EXPECTED_TRACKS_PER_TASK) {
        // console.log(`⏭️ Task ${taskId} already has ${existingSongsCount}/${EXPECTED_TRACKS_PER_TASK} expected songs in library, skipping check`);
        return;
      } else if (existingSongsCount > 0) {
        // console.log(`🔄 Task ${taskId} has ${existingSongsCount}/${EXPECTED_TRACKS_PER_TASK} songs, checking for missing tracks`);
      }

      const taskResponse = await sunoService.getTaskStatus(taskId);
      
      if (taskResponse.data.status === "SUCCESS" && taskResponse.data.response?.sunoData) {
        // Double-check for duplicates before processing
        const hasDuplicates = taskResponse.data.response.sunoData.some(track => 
          generatedMusic.some(song => song.id === track.id)
        );
        
        if (hasDuplicates) {
          // console.log(`⚠️ Some tracks from task ${taskId} already exist, filtering duplicates`);
        }

        // Konversi ke format callback
        const callbackData = {
          code: 200,
          msg: "All generated successfully.",
          data: {
            callbackType: "complete" as const,
            task_id: taskId,
            data: taskResponse.data.response.sunoData.map(track => ({
              id: track.id,
              audio_url: track.audioUrl,
              source_audio_url: track.audioUrl,
              stream_audio_url: track.streamAudioUrl || track.audioUrl,
              source_stream_audio_url: track.streamAudioUrl || track.audioUrl,
              image_url: track.imageUrl,
              source_image_url: track.imageUrl,
              prompt: track.prompt,
              model_name: track.modelName,
              title: track.title,
              tags: track.tags,
              createTime: track.createTime,
              duration: track.duration
            }))
          }
        };
        
        await handleSunoCallback(callbackData);
        
        // Clean up any potential duplicates after adding new music
        setTimeout(() => removeDuplicateSongs(), 1000);
        
        toast.success(`Successfully retrieved missing tracks for task ${taskId}!`);
      } else {
        toast.warning(`Task ${taskId} is still processing or failed. Status: ${taskResponse.data.status}`);
      }
    } catch (error) {
      smartLog('check-missing-error', "Failed to check missing task:", error, 30000);
      toast.error(`Failed to check task ${taskId}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }, [handleSunoCallback, generatedMusic, removeDuplicateSongs]);

  // Fungsi untuk menambahkan/update lyrics ke lagu yang sudah ada
  const updateSongLyrics = useCallback((songId: string, lyrics: string) => {
    setGeneratedMusic(prevMusic => 
      prevMusic.map(song => 
        song.id === songId 
          ? { ...song, lyrics: lyrics.trim() || undefined }
          : song
      )
    );
    toast.success("Lyrics updated successfully!");
  }, []);

  // Function to add uploaded music to the library (only if it has a valid blockchain task ID)
  const addUploadedMusic = useCallback((uploadedMusic: GeneratedMusic) => {
    if (!uploadedMusic.taskId) {
      // console.warn("Cannot add uploaded music without blockchain task ID:", uploadedMusic.title);
      toast.error("Cannot add music without valid blockchain task ID");
      return;
    }

    // Check if this task ID exists in blockchain
    const isValidTaskId = userTaskIds && userTaskIds.includes(uploadedMusic.taskId);
    if (!isValidTaskId) {
      // console.warn("Task ID not found in blockchain:", uploadedMusic.taskId);
      toast.error("Invalid task ID - not found in blockchain");
      return;
    }

    // Check for duplicates (by ID only - allow multiple songs per taskId)
    const alreadyExistsById = generatedMusic.some(song => song.id === uploadedMusic.id);
    
    if (alreadyExistsById) {
      // console.warn("Uploaded music with same ID already exists:", uploadedMusic.title);
      toast.warning("This music is already in your library");
      return;
    }

    // Allow multiple songs with same taskId (for manual uploads of 2nd track)
    // console.log("Adding uploaded music:", uploadedMusic.title, "(TaskID:", uploadedMusic.taskId + ")");

    setGeneratedMusic(prev => [uploadedMusic, ...prev]);
    // console.log("Added uploaded music to library:", uploadedMusic.title);
  }, [userTaskIds]);

  // Function to update song with IPFS hash
  const updateSongWithIPFS = useCallback((songId: string, ipfsHash: string, updatedMetadata?: any) => {
    setGeneratedMusic(prevMusic => 
      prevMusic.map(song => 
        song.id === songId 
          ? { 
              ...song, 
              ipfsHash, 
              metadata: updatedMetadata || song.metadata
            }
          : song
      )
    );
    toast.success("Song updated with IPFS data!");
  }, []);

  return {
    generateMusic,
    isGenerating,
    generatedMusic,
    currentTaskId,
    clearGeneratedMusic,
    handleSunoCallback,
    checkMissingTask,
    updateSongLyrics,
    addUploadedMusic,
    updateSongWithIPFS,
    pendingTasks,
    userRequests,
    refetchUserRequests,
    waitForTransactionConfirmation,
    // Smart contract related
    isContractPending,
    isContractSuccess,
    contractHash,
    generationFee,
    advancedGenerationFee,
    // New contract read functions
    dailyGenerationsLeft,
    refetchDailyGenerationsLeft,
    userTaskIds,
    refetchUserTaskIds,
    userCompletedTaskIds,
    refetchUserCompletedTaskIds,
    // Debug functions
    debugInfo: () => {
      // Check for duplicates
      const songIds = generatedMusic.map(song => song.id);
      const uniqueSongIds = new Set(songIds);
      const duplicateSongIds = songIds.filter((id, index) => songIds.indexOf(id) !== index);
      
      const taskIds = generatedMusic.map(song => song.taskId).filter(Boolean);
      const uniqueTaskIds = new Set(taskIds);
      const duplicateTaskIds = taskIds.filter((id, index) => taskIds.indexOf(id) !== index);
      
      // Find actual duplicate songs (only by ID, not by taskId since multiple songs can share taskId)
      const duplicateSongs = generatedMusic.filter(song => {
        const countById = generatedMusic.filter(s => s.id === song.id).length;
        return countById > 1;
      });
      
      // Count songs per taskId for reference
      const taskIdCounts: { [key: string]: number } = {};
      generatedMusic.forEach(song => {
        if (song.taskId) {
          taskIdCounts[song.taskId] = (taskIdCounts[song.taskId] || 0) + 1;
        }
      });
      
      return {
        address,
        generatedMusicCount: generatedMusic.length,
        pendingTasksCount: pendingTasks.size,
        currentTaskId,
        duplicates: {
          count: duplicateSongs.length,
          songIds: duplicateSongIds.length > 0 ? [...new Set(duplicateSongIds)] : [],
          taskIds: duplicateTaskIds.length > 0 ? [...new Set(duplicateTaskIds)] : [],
          hasDuplicates: duplicateSongIds.length > 0 || duplicateTaskIds.length > 0,
          duplicateSongs: duplicateSongs.map(song => ({
            id: song.id,
            title: song.title,
            taskId: song.taskId
          })),
          taskIdDistribution: taskIdCounts
        }
      };
    },
    debugContractData,
    forceRefreshAllData,
    clearInvalidSongs,
    removeDuplicateSongs
  };
};