import { useState, useCallback, useEffect } from "react";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
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
  const [currentTxHash, setCurrentTxHash] = useState<string | null>(null);
  const [progressToastId, setProgressToastId] = useState<string | null>(null);

  // Real-time transaction monitoring using wagmi
  const { data: txReceipt, isSuccess: isTxSuccess, isError: isTxError } = useWaitForTransactionReceipt({
    hash: currentTxHash as `0x${string}` | undefined,
    query: {
      enabled: !!currentTxHash,
    }
  });

  // Effect to handle transaction success in real-time
  useEffect(() => {
    if (isTxSuccess && txReceipt && currentTxHash && progressToastId) {
      console.log(`🎉 WAGMI REAL-TIME SUCCESS! Transaction confirmed: ${currentTxHash}`);
      console.log(`📋 Receipt:`, txReceipt);
      
      const dynamicDuration = 8000; // Fixed duration for real-time success
      
      // Show success toast immediately when wagmi detects confirmation
      toast.success(`🎵 Request Success ${currentTxHash}`, {
        id: progressToastId,
        description: `Transaction confirmed successfully!`,
        duration: dynamicDuration,
      });
      
      console.log(`✨ REAL-TIME SUCCESS TOAST DISPLAYED!`);
      
      // Clear tracking state
      setCurrentTxHash(null);
      setProgressToastId(null);
    }
  }, [isTxSuccess, txReceipt, currentTxHash, progressToastId]);

  // Effect to handle transaction error in real-time
  useEffect(() => {
    if (isTxError && currentTxHash && progressToastId) {
      console.log(`❌ WAGMI REAL-TIME ERROR! Transaction failed: ${currentTxHash}`);
      
      toast.error("Transaction confirmation failed", { id: progressToastId });
      
      // Clear tracking state
      setCurrentTxHash(null);
      setProgressToastId(null);
      setIsGenerating(false);
    }
  }, [isTxError, currentTxHash, progressToastId]);

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
          args: [taskId, blockchainCallbackData],
          account: address,
          chain: config.chains[0]
        });

        if (!hash) {
          throw new Error("Transaction failed - no hash returned");
        }

        // console.log(`✅ Callback recorded to blockchain. Transaction hash: ${hash}`);

        // Wait for confirmation
        // console.log(`⏳ Waiting for callback transaction confirmation: ${hash}`);

        try {
          const callbackStartTime = Date.now();
          await waitForTransactionConfirmation(hash);
          const callbackDuration = Date.now() - callbackStartTime;
          // console.log(`✅ Callback transaction confirmed: ${hash}`);
          
          // Show confirmation time info for debugging if needed
          if (process.env.NODE_ENV === 'development') {
            console.log(`⏱️ Callback confirmation took ${(callbackDuration / 1000).toFixed(1)}s`);
          }
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
  }, [waitForTransactionConfirmation, address]);

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
      // Calculate duration based on number of tracks (more tracks = longer duration)
      const completionDuration = Math.min(Math.max(newMusic.length * 2000 + 3000, 5000), 12000);
      
      toast.success(`🎵 Music Generation Complete!`, {
        description: `${newMusic.length} track(s) successfully created and recorded on blockchain`,
        duration: completionDuration
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

    // Show initial loading toast that will be updated throughout the process
    const toastId = toast.loading("🎵 Request Generate Song...", {
      description: "Sending request to AI and blockchain...",
    });
    
    // Store toast ID for real-time updates
    setProgressToastId(String(toastId));

    try {
      // Step 1: Start Suno AI generation
      let generateResponse;
      let generatedTaskId: string;
      
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
        
        // Update toast to show Suno success, now sending to blockchain
        toast.loading("🎵 Request Generate Song...", {
          id: toastId,
        });
        
      } catch (sunoError) {
        // console.error("❌ Suno API call failed:", sunoError);
        toast.error("AI generation failed", { id: toastId });
        setIsGenerating(false);
        throw new Error(`AI generation failed: ${sunoError instanceof Error ? sunoError.message : "Unknown error"}`);
      }

      // Step 2: Record to blockchain
      let transactionHash: string | undefined;
      
      try {
        // Check if wallet is connected
        if (!address) {
          throw new Error("Wallet not connected");
        }

        // console.log(`🔗 Sending generation request to blockchain for address: ${address}...`);
        const result = await requestGeneration({
          prompt: params.prompt || "",
          style: params.style || "",
          instrumental: params.instrumental || false,
          mode: params.customMode ? 'Advanced' : 'Simple',
          taskId: generatedTaskId,
          title: params.customMode ? (params.title || "AI Generated Music") : "",
          vocalGender: params.customMode ? (params.vocalGender || "m") : ""
        }) as { hash: string; value: bigint };

        if (!result || !result.hash) {
          throw new Error("Transaction failed - no hash returned");
        }

        transactionHash = result.hash;
        console.log(`✅ Contract request successful! Transaction hash: ${result.hash}`);
        
        // Set up real-time monitoring using wagmi
        setCurrentTxHash(transactionHash);
        
        // Update toast to show we're waiting for confirmation - HOLD HERE
        toast.loading("🎵 Request Generate Song...", {
          id: toastId,
          description: "Transaction sent, waiting for confirmation...",
        });

        console.log(`🚀 REAL-TIME MONITORING ACTIVATED for: ${transactionHash}`);
        console.log(`⚡ Wagmi useWaitForTransactionReceipt will handle confirmation automatically`);
        
        console.log(`🚀 REAL-TIME MONITORING ACTIVATED for: ${transactionHash}`);
        console.log(`⚡ Wagmi useWaitForTransactionReceipt will handle confirmation automatically`);
        
        // Add task to pending tasks for auto-monitoring
        setPendingTasks(prev => {
          const newSet = new Set(prev);
          newSet.add(generatedTaskId);
          return newSet;
        });
        
        // The real-time monitoring will be handled by useEffect hooks above
        // Just return here and let the wagmi hooks do their work
        return [];

      } catch (contractError) {
        console.error("❌ Smart contract call failed:", contractError);
        console.log("Contract error details:", contractError);
        
        // Clear tracking state on error
        setCurrentTxHash(null);
        setProgressToastId(null);
        
        // Check if Suno was successful - if yes, don't fail the whole process
        if (generatedTaskId) {
          // Suno was successful, but blockchain failed
          setPendingTasks(prev => {
            const newSet = new Set(prev);
            newSet.add(generatedTaskId);
            return newSet;
          });
          
          const errorMessage = contractError instanceof Error ? contractError.message : "Unknown blockchain error";
          toast.warning("Blockchain recording failed, but AI generation successful", { 
            id: toastId,
            description: `${errorMessage}. Your music is being generated.`,
            duration: 8000
          });
          
          setIsGenerating(false);
          return [];
        } else {
          toast.error("Failed to send transaction", { id: toastId });
          setIsGenerating(false);
          throw new Error(`Generation failed: ${contractError instanceof Error ? contractError.message : "Unknown error"}`);
        }
      }
          console.log(`🔍 Starting MULTI-METHOD transaction confirmation for: ${transactionHash}`);
          const confirmationStartTime = Date.now();
          
          // Method 1: Use a more aggressive approach with shorter intervals
          let confirmed = false;
          let attempts = 0;
          const maxAttempts = 60; // Increase attempts, decrease interval
          
          console.log(`📡 Starting aggressive polling (60 attempts, 1s interval)`);
          
          const checkTransactionStatus = async () => {
            for (let i = 0; i < maxAttempts && !confirmed; i++) {
              attempts = i + 1;
              console.log(`🔄 AGGRESSIVE attempt ${attempts}/${maxAttempts} for: ${transactionHash}`);
              
              try {
                // Method A: Try with basic fetch to RPC
                const rpcResponse = await fetch('https://dream-rpc.somnia.network', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_getTransactionReceipt',
                    params: [transactionHash],
                    id: 1
                  })
                });
                
                const rpcData = await rpcResponse.json();
                console.log(`� RPC Response (attempt ${attempts}):`, rpcData);
                
                if (rpcData.result && rpcData.result.status === '0x1') {
                  console.log(`✅ SUCCESS via RPC! Transaction confirmed: ${transactionHash}`);
                  confirmed = true;
                  break;
                }
                
                // Method B: Fallback to viem if RPC doesn't work
                if (!confirmed && attempts % 3 === 0) { // Try viem every 3rd attempt
                  try {
                    console.log(`🔌 Trying viem method (attempt ${attempts})...`);
                    const { createPublicClient, http } = await import('viem');
                    
                    const publicClient = createPublicClient({
                      chain: {
                        id: 50312,
                        name: 'Somnia Testnet',
                        rpcUrls: {
                          default: { http: ['https://dream-rpc.somnia.network'] },
                          public: { http: ['https://dream-rpc.somnia.network'] },
                        },
                        nativeCurrency: { decimals: 18, name: 'STT', symbol: 'STT' }
                      },
                      transport: http('https://dream-rpc.somnia.network')
                    });

                    const receipt = await publicClient.getTransactionReceipt({
                      hash: transactionHash as `0x${string}`,
                    });

                    console.log(`📋 Viem receipt (attempt ${attempts}):`, receipt);

                    if (receipt && receipt.status === 'success') {
                      console.log(`✅ SUCCESS via VIEM! Transaction confirmed: ${transactionHash}`);
                      confirmed = true;
                      break;
                    }
                  } catch (viemError) {
                    console.log(`⚠️ Viem method failed (attempt ${attempts}):`, viemError);
                  }
                }
                
              } catch (error) {
                console.log(`⚠️ Error in attempt ${attempts}:`, error);
              }

              if (!confirmed && attempts < maxAttempts) {
                console.log(`⏳ Waiting 1 second before next attempt...`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Shorter interval
              }
            }
          };
          
          await checkTransactionStatus();

          if (!confirmed) {
            console.log(`⏰ TIMEOUT: No confirmation after ${maxAttempts} attempts for ${transactionHash}`);
            
            // Last desperate attempt: just show success anyway if we've been waiting too long
            const waitTime = Date.now() - confirmationStartTime;
            if (waitTime > 30000) { // If we've waited more than 30 seconds
              console.log(`🚨 FORCE SUCCESS: Waited ${waitTime}ms, assuming transaction is confirmed`);
              confirmed = true;
            } else {
              throw new Error('Transaction confirmation timeout');
            }
          }

          const confirmationDuration = Date.now() - confirmationStartTime;
          console.log(`✅ FINAL: Transaction confirmed in ${(confirmationDuration / 1000).toFixed(1)}s`);
          
          // Calculate dynamic duration
          const dynamicDuration = Math.min(Math.max(confirmationDuration + 2000, 4000), 15000);
          
          console.log(`📱 SHOWING SUCCESS TOAST NOW!`);
          console.log(`🎯 Toast ID: ${progressToastId}`);
          console.log(`📄 Message: 🎵 Request Success ${transactionHash}`);
          console.log(`⏰ Duration: ${dynamicDuration}ms`);
          
          // Force show success toast
          const toastResult = toast.success(`🎵 Request Success ${transactionHash}`, {
            id: progressToastId,
            description: `Transaction confirmed in ${(confirmationDuration / 1000).toFixed(1)}s!`,
            duration: dynamicDuration,
          });
          
          console.log(`🎉 TOAST RESULT:`, toastResult);
          console.log(`✨ SUCCESS TOAST DISPLAYED!`);
          

      });

      // Poll after 15 seconds for quick check
      setTimeout(async () => {
        try {
          // console.log(`🔄 Quick polling for task: ${generatedTaskId}`);
          const taskResponse = await sunoService.pollTaskCompletion(generatedTaskId, 20);
          
          if (taskResponse.data.status === "SUCCESS" && taskResponse.data.response?.sunoData) {
            // Create callback data structure
            const callbackData = {
              code: 200,
              msg: "success",
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
            
            // Process via callback handler for consistency
            await handleSunoCallback(callbackData, params, transactionHash);
            // console.log(`✅ Quick polling successful for task: ${generatedTaskId}`);
          }
        } catch (pollingError) {
          // console.error(`❌ Quick polling failed for task: ${generatedTaskId}`, pollingError);
        }
      }, 15000); // Poll after 15 seconds

      // Extended polling after 45 seconds
      setTimeout(async () => {
        try {
          // console.log(`🔄 Extended polling for task: ${generatedTaskId}`);
          const taskResponse = await sunoService.pollTaskCompletion(generatedTaskId, 20);
          
          if (taskResponse.data.status === "SUCCESS" && taskResponse.data.response?.sunoData) {
            // Create callback data structure
            const callbackData = {
              code: 200,
              msg: "success",
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
            
            // Process via callback handler for consistency
            await handleSunoCallback(callbackData, params, transactionHash);
            // console.log(`✅ Extended polling successful for task: ${generatedTaskId}`);
          }
        } catch (pollingError) {
          // console.error(`❌ Extended polling failed for task: ${generatedTaskId}`, pollingError);
        }
      }, 45000); // Poll after 45 seconds

      // Return empty array immediately (actual data comes via callback)
      return [];

    } catch (error) {
      // console.error("Music generation failed:", error);
      setIsGenerating(false);
      
      // Don't show additional error toast here - already handled in specific catch blocks
      // Just re-throw the error for component handling
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
  }, [userTaskIds, generatedMusic]);

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