import React, { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
    completeMusicGeneration,
    hash,
    isPending,
    isSuccess,
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

  // Expose contract status for UI
  const contractHash = hash;
  const isContractPending = isPending;
  const isContractSuccess = isSuccess;

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMusic, setGeneratedMusic] = useState<GeneratedMusic[]>([]);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [pendingTasks, setPendingTasks] = useState<Set<string>>(new Set());
  const [currentTxHash, setCurrentTxHash] = useState<string | null>(null);
  const [progressToastId, setProgressToastId] = useState<string | null>(null);
  const [isFetchingSongs, setIsFetchingSongs] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(0); // Force UI refresh

  // Track tasks that have been completed to prevent spam transactions
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  // Calculate pending tasks from smart contract data and check Suno status
  const contractPendingTasks = React.useMemo(() => {
    if (!userTaskIds || !userCompletedTaskIds) {
      return new Set<string>();
    }

    const completedSet = new Set(userCompletedTaskIds);
    const pendingFromContract = userTaskIds.filter(taskId => !completedSet.has(taskId));

    // Merge with local pending tasks to ensure we don't lose any
    const allPending = new Set([...pendingFromContract, ...Array.from(pendingTasks)]);

    return allPending;
  }, [userTaskIds, userCompletedTaskIds, pendingTasks]);

  // Function to check task status from Suno API
  const checkTaskStatusFromSuno = useCallback(async (taskId: string) => {
    try {
      const taskResponse = await sunoService.getTaskStatus(taskId);

      if (taskResponse.code === 200) {
        const status = taskResponse.data.status;

        // Try different response structures - consistent with fetchSongsFromSuno
        let tracksData = null;
        if (taskResponse.data?.response?.sunoData) {
          tracksData = taskResponse.data.response.sunoData;
        } else if (taskResponse.data?.response?.data) {
          tracksData = taskResponse.data.response.data;
        } else if (taskResponse.data?.data) {
          tracksData = taskResponse.data.data;
        } else if (Array.isArray(taskResponse.data)) {
          tracksData = taskResponse.data;
        }

        return {
          taskId,
          status, // SUCCESS, PENDING, FAILED, etc.
          hasData: !!(tracksData && tracksData.length > 0),
          tracksCount: tracksData ? tracksData.length : 0,
          data: tracksData
        };
      }

      return {
        taskId,
        status: 'UNKNOWN',
        hasData: false,
        tracksCount: 0,
        data: null
      };
    } catch (error) {
      console.error(`Error checking task ${taskId} status:`, error);
      return {
        taskId,
        status: 'ERROR',
        hasData: false,
        tracksCount: 0,
        data: null
      };
    }
  }, []);

  // Enhanced pending tasks with Suno status
  const [taskStatuses, setTaskStatuses] = useState<Map<string, { status: string; lastChecked: number; hasData: boolean; tracksCount: number }>>(new Map());

  // Function to update task status
  const updateTaskStatus = useCallback(async (taskId: string) => {
    const sunoStatus = await checkTaskStatusFromSuno(taskId);

    console.log(`🔍 UPDATE TASK STATUS: ${taskId} -> ${sunoStatus.status} (hasData: ${sunoStatus.hasData})`);

    setTaskStatuses(prev => {
      const newMap = new Map(prev);
      newMap.set(taskId, {
        status: sunoStatus.status,
        lastChecked: Date.now(),
        hasData: sunoStatus.hasData,
        tracksCount: sunoStatus.tracksCount
      });
      return newMap;
    });

    return sunoStatus;
  }, [checkTaskStatusFromSuno]);

  // Function to check all pending tasks status
  const checkAllPendingTasksStatus = useCallback(async () => {
    if (!contractPendingTasks || contractPendingTasks.size === 0) {
      console.log('🔍 CHECK PENDING: No pending tasks to check');
      return;
    }

    const tasksToCheck = Array.from(contractPendingTasks);
    console.log('🔍 CHECK PENDING: Checking tasks:', tasksToCheck);

    const statusPromises = tasksToCheck.map(taskId => updateTaskStatus(taskId));

    try {
      await Promise.all(statusPromises);
      console.log(`✅ Checked status for ${tasksToCheck.length} pending tasks`);
    } catch (error) {
      console.error('Error checking pending tasks status:', error);
    }
  }, [contractPendingTasks, updateTaskStatus]);

  // Auto-check pending tasks status periodically
  useEffect(() => {
    if (!contractPendingTasks || contractPendingTasks.size === 0) {
      return;
    }

    // More frequent checking when there are pending tasks (every 5 seconds for real-time updates)
    const interval = setInterval(() => {
      checkAllPendingTasksStatus();
    }, 5000); // Check every 5 seconds when there are pending tasks

    // Initial check
    checkAllPendingTasksStatus();

    return () => clearInterval(interval);
  }, [contractPendingTasks, checkAllPendingTasksStatus]);

  // Effect to handle when hash becomes available from wagmi (real-time txhash detection)
  useEffect(() => {
    console.log(`🔍 HASH EFFECT CHECK: hash=${!!hash}, progressToastId=${!!progressToastId}, currentTxHash=${!!currentTxHash}`);

    if (hash && progressToastId) {
      console.log(`🎯 WAGMI HASH DETECTED: ${hash}`);

      // Set the real txhash from wagmi
      setCurrentTxHash(hash);

      // Update toast with the actual txhash
      toast.loading("Generation song sent", {
        id: progressToastId,
        description: `Transaction submitted successfully`,
        action: {
          label: "View Transaction",
          onClick: () => window.open(`https://shannon-explorer.somnia.network/tx/${hash}`, '_blank'),
        },
      });

      console.log(`✨ TOAST UPDATED WITH REAL TXHASH: ${hash}`);
    }
  }, [hash, progressToastId]);

  // Additional effect to handle hash updates when toast becomes available
  useEffect(() => {
    if (hash && progressToastId && !currentTxHash) {
      console.log(`🔄 LATE HASH UPDATE: ${hash}`);

      setCurrentTxHash(hash);

      toast.loading("Generation song sent", {
        id: progressToastId,
        description: `Transaction submitted successfully`,
        action: {
          label: "View Transaction",
          onClick: () => window.open(`https://shannon-explorer.somnia.network/tx/${hash}`, '_blank'),
        },
      });

      console.log(`✨ LATE TOAST UPDATED WITH TXHASH: ${hash}`);
    }
  }, [progressToastId, hash, currentTxHash]);

  // Helper function to create explorer link
  const createExplorerLink = useCallback((txHash: string) => {
    return `https://shannon-explorer.somnia.network/tx/${txHash}`;
  }, []);

  // Real-time transaction monitoring using wagmi
  const { data: txReceipt, isSuccess: isTxSuccess, isError: isTxError } = useWaitForTransactionReceipt({
    hash: currentTxHash as `0x${string}` | undefined,
    query: {
      enabled: !!currentTxHash,
    }
  });

  // Debug effect to monitor hash availability
  useEffect(() => {
    if (hash) {
      console.log(`� HASH AVAILABLE FROM WAGMI: ${hash}`);
    } else {
      console.log(`❌ NO HASH FROM WAGMI YET`);
    }
  }, [hash]);

  // Effect to handle transaction success in real-time (simplified)
  useEffect(() => {
    if (isTxSuccess && txReceipt && currentTxHash && progressToastId) {
      console.log(`🎉 WAGMI REAL-TIME SUCCESS! Transaction confirmed: ${currentTxHash}`);
      console.log(`📋 Receipt:`, txReceipt);
      
      // Show success toast immediately when wagmi detects confirmation
      toast.success(`Generation song sent`, {
        id: progressToastId,
        description: `Transaction confirmed successfully`,
        action: {
          label: "View Transaction",
          onClick: () => window.open(`https://shannon-explorer.somnia.network/tx/${currentTxHash}`, '_blank'),
        },
        duration: 8000,
      });
      
      console.log(`✨ WAGMI SUCCESS TOAST DISPLAYED!`);
      
      // Clear tracking state and stop generating
      setCurrentTxHash(null);
      setProgressToastId(null);
      setIsGenerating(false);
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
      return;
    }

    try {
      // Force refresh contract data
      await refetchUserTaskIds?.();
      await refetchUserCompletedTaskIds?.();
      await refetchUserRequests?.();

      // Get user requests
      const userReqs = userRequests;

      // Get user task IDs
      const userTaskIdsData = userTaskIds;

      // Get completed task IDs
      const completedTaskIdsData = userCompletedTaskIds;

      // Debug filtering logic
      generatedMusic.forEach(song => {
        const isInContract = (completedTaskIdsData && completedTaskIdsData.includes(song.taskId)) ||
                           (userTaskIdsData && userTaskIdsData.includes(song.taskId));
        const isPending = pendingTasks.has(song.taskId);
        const shouldShow = isInContract || isPending;
      });

    } catch (error) {
      console.error("❌ Error debugging contract data:", error);
    }
  }, [address, userRequests, userTaskIds, userCompletedTaskIds, generatedMusic, pendingTasks, currentTaskId, isGenerating, refetchUserTaskIds, refetchUserCompletedTaskIds, refetchUserRequests]);

  // Function to fetch songs for React Query caching
  const fetchSongsForCache = useCallback(async (): Promise<GeneratedMusic[]> => {
    if (!address || !userTaskIds || userTaskIds.length === 0) {
      smartLog('fetch-cache', 'No address or task IDs available for fetching songs');
      return [];
    }

    smartLog('fetch-cache', `Fetching ${userTaskIds.length} task IDs from Suno API for cache`);

    try {
      const fetchedSongs: GeneratedMusic[] = [];

      for (const taskId of userTaskIds) {
        try {
          smartLog('fetch-cache', `Fetching task ID: ${taskId}`);

          const taskResponse = await sunoService.getTaskStatus(taskId);

          // Try different response structures - consistent with other functions
          let tracksData = null;
          if (taskResponse.data?.response?.sunoData) {
            tracksData = taskResponse.data.response.sunoData;
          } else if (taskResponse.data?.response?.data) {
            tracksData = taskResponse.data.response.data;
          } else if (taskResponse.data?.data) {
            tracksData = taskResponse.data.data;
          } else if (Array.isArray(taskResponse.data)) {
            tracksData = taskResponse.data;
          }

          if (taskResponse.code === 200 && taskResponse.data.status === "SUCCESS" && tracksData) {
            // Process each track in the task
            for (let index = 0; index < tracksData.length; index++) {
              const trackData = tracksData[index];
              const version = `v${index + 1}`; // v1, v2, v3, etc.

              console.log(`🏷️ Assigning version "${version}" to track: ${trackData.title || 'Untitled'} (taskId: ${taskId})`);

              const musicItem: GeneratedMusic = {
                id: trackData.id || `suno-${taskId}-${Date.now()}`,
                title: trackData.title || "Untitled",
                artist: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "HiBeats User",
                duration: Math.round(trackData.duration || 0),
                audioUrl: trackData.audioUrl || trackData.audio_url || "",
                imageUrl: trackData.imageUrl || trackData.image_url || trackData.source_image_url || "https://via.placeholder.com/400x400/1e1e1e/ffffff?text=Music",
                originalAudioUrl: trackData.audioUrl || trackData.audio_url,
                originalImageUrl: trackData.imageUrl || trackData.image_url || trackData.source_image_url,
                genre: trackData.tags ? trackData.tags.split(", ").filter(tag => tag.trim()) : [],
                lyrics: trackData.lyrics || undefined,
                taskId: taskId,
                version: version, // Add version identifier
                createdAt: trackData.createTime || new Date().toISOString()
              };

              // Validate URLs
              if (musicItem.audioUrl && musicItem.audioUrl !== "") {
                try {
                  new URL(musicItem.audioUrl);
                } catch (e) {
                  musicItem.audioUrl = "";
                }
              }

              if (musicItem.imageUrl && musicItem.imageUrl !== "" && !musicItem.imageUrl.includes('via.placeholder.com')) {
                try {
                  new URL(musicItem.imageUrl);
                } catch (e) {
                  musicItem.imageUrl = "https://via.placeholder.com/400x400/1e1e1e/ffffff?text=Music";
                }
              }

              fetchedSongs.push(musicItem);
            }
          }
        } catch (taskError) {
          console.error(`❌ Error fetching task ${taskId}:`, taskError);
        }
      }

      smartLog('fetch-cache', `Successfully fetched ${fetchedSongs.length} songs for cache`);
      return fetchedSongs;
    } catch (error) {
      console.error("❌ Error in fetchSongsForCache:", error);
      throw error;
    }
  }, [address, userTaskIds]);

  // React Query for cached song fetching
  const {
    data: cachedSongs,
    isLoading: isLoadingCachedSongs,
    error: cachedSongsError,
    refetch: refetchCachedSongs
  } = useQuery({
    queryKey: ['songs', address, userTaskIds?.join(',')],
    queryFn: fetchSongsForCache,
    enabled: !!address && !!userTaskIds && userTaskIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
  });

  // Function to fetch songs from Suno API based on task IDs from contract
  const fetchSongsFromSuno = useCallback(async () => {
    if (!address || !userTaskIds || userTaskIds.length === 0) {
      smartLog('fetch-songs', 'No address or task IDs available for fetching songs');
      return;
    }

    setIsFetchingSongs(true);
    smartLog('fetch-songs', `Starting to fetch ${userTaskIds.length} task IDs from Suno API`);

    try {
      const fetchedSongs: GeneratedMusic[] = [];

      for (const taskId of userTaskIds) {
        try {
          smartLog('fetch-songs', `Fetching task ID: ${taskId}`);
          
          const taskResponse = await sunoService.getTaskStatus(taskId);
          
          // Debug: Log the actual response structure
          console.log(`🔍 Task ${taskId} response structure:`, JSON.stringify(taskResponse, null, 2));
          
          // Try different response structures - add more fallback options
          let tracksData = null;
          if (taskResponse.data?.response?.sunoData) {
            tracksData = taskResponse.data.response.sunoData;
            console.log(`✅ Using response.sunoData structure for task ${taskId}`);
          } else if (taskResponse.data?.response?.data) {
            tracksData = taskResponse.data.response.data;
            console.log(`✅ Using response.response.data structure for task ${taskId}`);
          } else if (taskResponse.data?.data) {
            tracksData = taskResponse.data.data;
            console.log(`✅ Using response.data structure for task ${taskId}`);
          } else if (Array.isArray(taskResponse.data)) {
            tracksData = taskResponse.data;
            console.log(`✅ Using direct array structure for task ${taskId}`);
          }
          
          if (taskResponse.code === 200 && taskResponse.data.status === "SUCCESS" && tracksData) {
            // Process each track in the task
            for (let index = 0; index < tracksData.length; index++) {
              const trackData = tracksData[index];
              const version = `v${index + 1}`; // v1, v2, v3, etc.

              console.log(`🏷️ Assigning version "${version}" to track: ${trackData.title || 'Untitled'} (taskId: ${taskId})`);

              const musicItem: GeneratedMusic = {
                id: trackData.id || `suno-${taskId}-${Date.now()}`,
                title: trackData.title || "Untitled",
                artist: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "HiBeats User",
                duration: Math.round(trackData.duration || 0),
                audioUrl: trackData.audioUrl || trackData.audio_url || "",
                imageUrl: trackData.imageUrl || trackData.image_url || trackData.source_image_url || "https://via.placeholder.com/400x400/1e1e1e/ffffff?text=Music",
                originalAudioUrl: trackData.audioUrl || trackData.audio_url,
                originalImageUrl: trackData.imageUrl || trackData.image_url || trackData.source_image_url,
                genre: trackData.tags ? trackData.tags.split(", ").filter(tag => tag.trim()) : [],
                lyrics: trackData.lyrics || undefined,
                taskId: taskId,
                version: version, // Add version identifier
                createdAt: trackData.createTime || new Date().toISOString()
              };

              // Debug: Log URLs for troubleshooting
              console.log(`🎵 Song URLs for ${musicItem.title}:`, {
                audioUrl: musicItem.audioUrl,
                imageUrl: musicItem.imageUrl,
                originalAudioUrl: musicItem.originalAudioUrl,
                originalImageUrl: musicItem.originalImageUrl
              });

              // Validate URLs are accessible
              if (musicItem.audioUrl && musicItem.audioUrl !== "") {
                try {
                  new URL(musicItem.audioUrl);
                  console.log(`✅ Audio URL valid: ${musicItem.audioUrl}`);
                } catch (e) {
                  console.error(`❌ Audio URL invalid: ${musicItem.audioUrl}`);
                  musicItem.audioUrl = "";
                }
              }

              if (musicItem.imageUrl && musicItem.imageUrl !== "" && !musicItem.imageUrl.includes('via.placeholder.com')) {
                try {
                  new URL(musicItem.imageUrl);
                  console.log(`✅ Image URL valid: ${musicItem.imageUrl}`);
                } catch (e) {
                  console.error(`❌ Image URL invalid: ${musicItem.imageUrl}`);
                  musicItem.imageUrl = "https://via.placeholder.com/400x400/1e1e1e/ffffff?text=Music";
                }
              }

              fetchedSongs.push(musicItem);
              smartLog('fetch-songs', `Added song: ${musicItem.title} from task ${taskId}`);
            }
          } else {
            smartLog('fetch-songs', `Task ${taskId} not ready or failed: ${taskResponse.data?.status || 'Unknown status'}`);
          }
        } catch (taskError) {
          console.error(`❌ Error fetching task ${taskId}:`, taskError);
          smartLog('fetch-songs', `Failed to fetch task ${taskId}: ${taskError instanceof Error ? taskError.message : 'Unknown error'}`);
        }
      }

      // Update generated music state with fetched songs
      if (fetchedSongs.length > 0) {
        console.log('🔄 UPDATING GENERATED MUSIC STATE:', {
          fetchedSongsCount: fetchedSongs.length,
          currentGeneratedMusicCount: generatedMusic.length,
          fetchedSongs: fetchedSongs.map(s => ({ id: s.id, title: s.title, taskId: s.taskId, audioUrl: s.audioUrl?.substring(0, 50) }))
        });

        setGeneratedMusic(prev => {
          // Filter out songs that already exist (by ID)
          const filteredNewSongs = fetchedSongs.filter(newSong => {
            const existsById = prev.some(existingSong => existingSong.id === newSong.id);
            return !existsById;
          });

          console.log('🔄 FILTERED NEW SONGS:', {
            filteredCount: filteredNewSongs.length,
            filteredSongs: filteredNewSongs.map(s => ({ id: s.id, title: s.title, taskId: s.taskId }))
          });

          if (filteredNewSongs.length === 0) {
            smartLog('fetch-songs', 'No new songs to add (all already exist)');
            return prev;
          }

          const updated = [...filteredNewSongs, ...prev];
          smartLog('fetch-songs', `Added ${filteredNewSongs.length} new songs to library`);
          return updated;
        });

        // toast.success(`🎵 Fetched ${fetchedSongs.length} songs`);
      } else {
        smartLog('fetch-songs', 'No songs were fetched');
        // toast.info("No songs found for your task IDs");
      }

    } catch (error) {
      console.error("❌ Error fetching songs", error);
      // toast.error(`Failed to fetch songs: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsFetchingSongs(false);
    }
  }, [address, userTaskIds]);

  // Effect to auto-fetch songs when task status changes to SUCCESS
  useEffect(() => {
    const completedTasks = Array.from(taskStatuses.entries())
      .filter(([taskId, status]) => status.status === 'SUCCESS' && status.hasData)
      .map(([taskId]) => taskId);

    console.log('🔍 AUTO-FETCH CHECK:', {
      taskStatusesSize: taskStatuses.size,
      completedTasks: completedTasks.length,
      taskStatuses: Array.from(taskStatuses.entries()).map(([id, status]) => ({ id, status: status.status, hasData: status.hasData }))
    });

    if (completedTasks.length > 0) {
      smartLog('auto-fetch', `🎯 Detected ${completedTasks.length} completed tasks, fetching latest data...`);

      // Fetch songs for completed tasks to get complete URLs
      fetchSongsFromSuno().catch(error => {
        console.error('Error auto-fetching completed songs:', error);
      });
    }
  }, [taskStatuses, fetchSongsFromSuno]);

  // Cache API utilities for songs storage
  const CACHE_NAME = 'hibeats-songs-cache-v1';
  const SONGS_CACHE_KEY = 'user-songs-data';

  // Function to save songs to Cache Storage
  const saveSongsToCache = useCallback(async (songs: GeneratedMusic[], userAddress: string) => {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cacheData = {
        songs,
        timestamp: Date.now(),
        userAddress
      };

      const response = new Response(JSON.stringify(cacheData), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=3600' // Cache for 1 hour
        }
      });

      await cache.put(SONGS_CACHE_KEY, response);
      smartLog('cache-save', `� Saved ${songs.length} songs to Cache Storage for ${userAddress}`);
    } catch (error) {
      console.error('❌ Error saving songs to Cache Storage:', error);
      // Cache API might not be available in some environments
      smartLog('cache-error', `Cache Storage not available, songs will be fetched fresh on reload`);
    }
  }, []);

  // Function to load songs from Cache Storage
  const loadSongsFromCache = useCallback(async (userAddress: string): Promise<GeneratedMusic[] | null> => {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(SONGS_CACHE_KEY);

      if (cachedResponse) {
        const cacheData = await cachedResponse.json();

        // Check if cache is for the same user and not too old (24 hours)
        if (cacheData.userAddress === userAddress &&
            (Date.now() - cacheData.timestamp) < 24 * 60 * 60 * 1000) {
          smartLog('cache-load', `📦 Loaded ${cacheData.songs.length} songs from Cache Storage for ${userAddress}`);
          return cacheData.songs;
        } else {
          // Cache is stale or for different user, remove it
          await cache.delete(SONGS_CACHE_KEY);
          smartLog('cache-expired', `🗑️ Removed expired cache for ${userAddress}`);
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Error loading songs from Cache Storage:', error);
      return null;
    }
  }, []);

  // Function to clear old cache entries
  const clearOldCache = useCallback(async () => {
    try {
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name =>
        name.startsWith('hibeats-songs-cache-') && name !== CACHE_NAME
      );

      await Promise.all(oldCaches.map(name => caches.delete(name)));
      if (oldCaches.length > 0) {
        smartLog('cache-cleanup', `🧹 Cleaned up ${oldCaches.length} old cache versions`);
      }
    } catch (error) {
      console.error('❌ Error clearing old cache:', error);
    }
  }, []);

  // Load completed music from Cache Storage on mount
  useEffect(() => {
    if (address) {
      smartLog('cache-load-init', `📦 Loading cached songs for address: ${address}`);
      loadSongsFromCache(address).then((cachedSongs) => {
        if (cachedSongs && cachedSongs.length > 0) {
          setGeneratedMusic(cachedSongs);
          smartLog('cache-load-success', `✅ Loaded ${cachedSongs.length} songs from cache for ${address}`);
        } else {
          smartLog('cache-load-empty', `ℹ️ No cached songs found for ${address}`);
        }
      }).catch((error) => {
        console.error('❌ Error loading cached songs:', error);
        smartLog('cache-load-error', `❌ Failed to load cached songs: ${error instanceof Error ? error.message : 'Unknown error'}`);
      });
    } else {
      smartLog('cache-load-no-address', `ℹ️ No address available, clearing music state`);
      // Clear state when no address
      setGeneratedMusic([]);
    }
  }, [address, loadSongsFromCache]);

  // Save songs to Cache Storage whenever generatedMusic changes
  useEffect(() => {
    if (address && generatedMusic.length > 0) {
      // Save all songs including those without complete audio URLs
      // This ensures callback data is cached even if URLs are not yet available
      const songsToCache = generatedMusic.filter(song =>
        !song.id.startsWith('pending-') // Exclude only truly pending placeholder songs
      );

      if (songsToCache.length > 0) {
        saveSongsToCache(songsToCache, address);
        smartLog('cache-auto-save', `💾 Auto-saved ${songsToCache.length} songs to cache (including incomplete ones)`);
      }
    }
  }, [address, generatedMusic, saveSongsToCache]);

  // Clear old cache versions on mount
  useEffect(() => {
    clearOldCache();
  }, [clearOldCache]);

  // Use cached songs from React Query when available and no local songs exist
  useEffect(() => {
    if (cachedSongs && Array.isArray(cachedSongs) && cachedSongs.length > 0 && generatedMusic.length === 0 && !isLoadingCachedSongs) {
      smartLog('cache-react-query', `📦 Using React Query cached songs: ${cachedSongs.length} songs`);
      setGeneratedMusic(cachedSongs as GeneratedMusic[]);
    }
  }, [cachedSongs, generatedMusic.length, isLoadingCachedSongs]);

  // Fungsi untuk menangani callback response dari Suno
  const handleSunoCallback = useCallback(async (callbackData: SunoCallbackResponse, generationParams?: SunoGenerateRequest, transactionHash?: string) => {
    console.log('🎯 SUNO CALLBACK RECEIVED:', {
      taskId: callbackData.data.task_id,
      callbackType: callbackData.data.callbackType,
      tracksCount: callbackData.data.data?.length || 0
    });

    try {
      smartLog('callback-received', `🎯 Suno callback received for task: ${callbackData.data.task_id}`);

      if (callbackData.code !== 200 || callbackData.data.callbackType !== "complete") {
        smartLog('callback-error', `❌ Invalid callback: code=${callbackData.code}, type=${callbackData.data.callbackType}`);
        toast.error("Invalid callback data received");
        return;
      }

      if (!callbackData.data.data || callbackData.data.data.length === 0) {
        smartLog('callback-error', `❌ No track data in callback for task: ${callbackData.data.task_id}`);
        toast.error("No track data received in callback");
        return;
      }

      smartLog('callback-processing', `✅ Processing ${callbackData.data.data.length} tracks for task: ${callbackData.data.task_id}`);

      // Step 1: Record callback to blockchain FIRST
      /*
      let blockchainTxHash: string;
      try {
        blockchainTxHash = await recordCallbackToBlockchain(
          callbackData.data.task_id,
          callbackData,
          generationParams,
          transactionHash
        );
      } catch (blockchainError) {
        toast.error("Failed to record callback to blockchain");
        // Continue with IPFS upload even if blockchain recording fails
      }
      */

      const newMusic: GeneratedMusic[] = [];

      for (const trackData of callbackData.data.data) {
        try {
          // Validasi track data
          if (!trackData.id || !trackData.title) {
            continue;
          }

          // Step 2: Create NFT metadata sesuai data callback
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

          // Step 2: Upload individual song with complete metadata to IPFS (only if params are available)
          let ipfsResult;
          let audioIpfsUrl = trackData.audio_url;
          let imageIpfsUrl = trackData.image_url || trackData.source_image_url;
          let metadataHash = "";

          if (generationParams && transactionHash) {
            try {
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

            } catch (uploadError) {
              // Keep original URLs as fallback
              audioIpfsUrl = trackData.audio_url || "";
              imageIpfsUrl = trackData.image_url || trackData.source_image_url || "";
            }
          } else {
            // Keep original URLs
            audioIpfsUrl = trackData.audio_url || "";
            imageIpfsUrl = trackData.image_url || trackData.source_image_url || "";
          }

          // Step 3: Create music item with NFT metadata and task ID for display
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

          newMusic.push(musicItem);

        } catch (error) {
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

      // Step 4: Update display state dengan musik baru - REPLACE placeholders with real songs
      setGeneratedMusic(prev => {
        // Filter out songs that already exist (by ID only - allow multiple songs per taskId)
        const filteredNewMusic = newMusic.filter(newSong => {
          const existsById = prev.some(existingSong => existingSong.id === newSong.id);

          if (existsById) {
            return false;
          }

          return true;
        });

        console.log('🔄 CALLBACK UPDATING STATE:', {
          newMusicCount: newMusic.length,
          filteredNewMusicCount: filteredNewMusic.length,
          currentStateCount: prev.length,
          newSongs: filteredNewMusic.map(s => ({ id: s.id, title: s.title, taskId: s.taskId, audioUrl: s.audioUrl?.substring(0, 50) }))
        });

        if (filteredNewMusic.length === 0) {
          smartLog('callback-no-new', `ℹ️ No new songs to add (all already exist) for task: ${callbackData.data.task_id}`);
          return prev;
        }

        // Remove placeholders for this taskId and add new songs
        const withoutPlaceholders = prev.filter(song =>
          !(song.taskId === callbackData.data.task_id && song.id.startsWith('pending-'))
        );

        const updated = [...filteredNewMusic, ...withoutPlaceholders];
        smartLog('callback-state-updated', `✅ Replaced ${prev.length - withoutPlaceholders.length} placeholders with ${filteredNewMusic.length} real songs for task: ${callbackData.data.task_id}`);

        return updated;
      });      // Step 5: Clean up pending tasks
      console.log('🔄 REMOVING FROM PENDING TASKS:', callbackData.data.task_id);
      setPendingTasks(prev => {
        const updated = new Set(prev);
        const wasRemoved = updated.delete(callbackData.data.task_id);
        console.log('🔄 PENDING TASKS UPDATED:', {
          taskId: callbackData.data.task_id,
          wasRemoved,
          remainingCount: updated.size
        });
        return updated;
      });

      // Single final success toast with all information
      const completionDuration = Math.min(Math.max(newMusic.length * 2000 + 3000, 5000), 12000);
      
      toast.success(`🎵 Music Generation Complete!`, {
        description: `${newMusic.length} track(s) successfully created`,
        duration: completionDuration
      });

      // Refresh contract data to update completed task IDs
      try {
        await refetchUserCompletedTaskIds?.();
        await refetchUserTaskIds?.();
        smartLog('callback-refresh', '✅ Refreshed contract data after callback processing');
      } catch (refreshError) {
        console.error('❌ Error refreshing contract data:', refreshError);
      }

      // Immediately update task status to SUCCESS
      console.log('🔄 UPDATING TASK STATUS IMMEDIATELY:', callbackData.data.task_id);
      setTaskStatuses(prev => {
        const newMap = new Map(prev);
        newMap.set(callbackData.data.task_id, {
          status: 'SUCCESS',
          lastChecked: Date.now(),
          hasData: true,
          tracksCount: callbackData.data.data.length
        });
        return newMap;
      });

      // Remove from pending tasks immediately
      setPendingTasks(prev => {
        const updated = new Set(prev);
        updated.delete(callbackData.data.task_id);
        console.log('🗑️ REMOVED FROM PENDING TASKS:', callbackData.data.task_id);
        return updated;
      });

      // Force UI refresh
      setForceRefresh(prev => prev + 1);

      // Immediately fetch the completed song data to update UI
      console.log('🚀 IMMEDIATE FETCH FOR COMPLETED TASK:', callbackData.data.task_id);
      setTimeout(async () => {
        try {
          await fetchSongsFromSuno();
          console.log('✅ IMMEDIATE FETCH COMPLETED');
        } catch (error) {
          console.error('❌ IMMEDIATE FETCH FAILED:', error);
        }
      }, 1000); // Small delay to ensure state updates are processed

    } catch (error) {
      toast.error(`Failed to process callback: ${error instanceof Error ? error.message : "Unknown error"}`);
      
      // Update generating status to false even on error to prevent UI stuck
      setIsGenerating(false);
    }
  }, [createNFTMetadata, address, waitForTransactionConfirmation, refetchUserCompletedTaskIds, refetchUserTaskIds]);

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
      console.error("❌ Error refreshing data:", error);
    }
  }, [refetchUserTaskIds, refetchUserCompletedTaskIds, refetchUserRequests, refetchDailyGenerationsLeft, userTaskIds, userCompletedTaskIds, generatedMusic.length]);

  // Function to clear songs that don't have valid blockchain task IDs
  const clearInvalidSongs = useCallback(() => {
    if (!userTaskIds || userTaskIds.length === 0) {
      return;
    }

    setGeneratedMusic(prev => {
      const validSongs = prev.filter(song => {
        if (!song.taskId) {
          return false;
        }

        const isValid = userTaskIds.includes(song.taskId);
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

    // Create unique toast ID to prevent conflicts
    const uniqueToastId = `music-gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Show initial loading toast that will be updated throughout the process
    toast.loading("Generating song...", {
      id: uniqueToastId,
      description: "Sending request to AI...",
    });
    
    // Store unique toast ID for real-time updates
    setProgressToastId(uniqueToastId);
    
    console.log(`🆔 UNIQUE TOAST ID SAVED: ${uniqueToastId}`);

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
        
        // Update toast to show Suno success, now sending to blockchain
        toast.loading("Generating song...", {
          id: uniqueToastId,
          description: "AI generation started, preparing transaction...",
        });
        
      } catch (sunoError) {
        toast.error("AI generation failed", { id: uniqueToastId });
        setIsGenerating(false);
        throw new Error(`AI generation failed: ${sunoError instanceof Error ? sunoError.message : "Unknown error"}`);
      }

      // Step 2: Record to blockchain
      // Transaction hash will be obtained from wagmi hash state

      // Check if wallet is connected
      if (!address) {
        console.error('❌ Wallet not connected - address is null/undefined');
        throw new Error("Wallet not connected");
      }

      console.log('✅ Wallet connected, address:', address);

      // Check if we're on the correct network (Somnia Testnet)
      const targetChainId = 50312; // Somnia Testnet
      console.log('🔍 Checking network... Target chain ID:', targetChainId);

      // Note: Network checking would require useNetwork hook from wagmi
      // For now, we'll proceed and let MetaMask handle network switching if needed

      // Call requestGeneration and await it to ensure proper error handling
      console.log('🚀 CALLING requestGeneration with params:', {
        prompt: params.prompt || "",
        style: params.style || "",
        instrumental: params.instrumental || false,
        mode: params.customMode ? 'Advanced' : 'Simple',
        taskId: generatedTaskId,
        title: params.customMode ? (params.title || "AI Generated Music") : "",
        vocalGender: params.customMode ? (params.vocalGender || "m") : ""
      });

      try {
        const result = await requestGeneration({
          prompt: params.prompt || "",
          style: params.style || "",
          instrumental: params.instrumental || false,
          mode: params.customMode ? 'Advanced' : 'Simple',
          taskId: generatedTaskId,
          title: params.customMode ? (params.title || "AI Generated Music") : "",
          vocalGender: params.customMode ? (params.vocalGender || "m") : ""
        });

        console.log('✅ requestGeneration completed with result:', result);
      } catch (requestError) {
        console.error("❌ Request generation failed:", requestError);
        toast.error(`Failed to send transaction: ${requestError instanceof Error ? requestError.message : "Unknown error"}`, { id: uniqueToastId });
        setProgressToastId(null);
        setIsGenerating(false);
        throw requestError;
      }

      console.log(`✅ Contract request initiated! Waiting for user approval...`);

      // Add task to pending tasks for auto-monitoring
      setPendingTasks(prev => {
        const newSet = new Set(prev);
        newSet.add(generatedTaskId);
        return newSet;
      });

      // Update toast to show transaction submitted
      toast.loading("Generating song...", {
        id: uniqueToastId,
        description: "Transaction submitted, waiting for confirmation...",
      });

      // Wait for transaction confirmation
      console.log('⏳ Waiting for transaction confirmation...');

      // The music generation will be completed asynchronously via callback
      // For now, return empty array - the actual music will be added when callback is received
      return [];
      setTimeout(async () => {
        try {
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
                  source_image_url: track.ImageUrl,
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
            await handleSunoCallback(callbackData, params, currentTxHash || undefined);
          }
        } catch (pollingError) {
          // Ignore polling errors
        }
      }, 15000); // Poll after 15 seconds

      // Extended polling after 45 seconds
      setTimeout(async () => {
        try {
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
                  source_image_url: track.ImageUrl,
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
            await handleSunoCallback(callbackData, params, currentTxHash || undefined);
          }
        } catch (pollingError) {
          // Ignore polling errors
        }
      }, 45000); // Poll after 45 seconds

      // Return empty array immediately (actual data comes via callback)
      return [];

    } catch (error) {
      setIsGenerating(false);
      
      // Don't show additional error toast here - already handled in specific catch blocks
      // Just re-throw the error for component handling
      throw error;
    } finally {
      // Don't clear currentTaskId immediately, keep it for status tracking
    }
  }, [handleSunoCallback, requestGeneration, address, setPendingTasks, setIsGenerating, setCurrentTaskId]);

  const clearGeneratedMusic = useCallback(() => {
    setGeneratedMusic([]);
  }, []);

  // Manual check untuk task yang mungkin miss callback
  const checkMissingTask = useCallback(async (taskId: string) => {
    try {
      // Check if task has already been completed to prevent spam transactions
      if (completedTasks.has(taskId)) {
        smartLog('check-missing', `⚠️ Task ${taskId} already completed, skipping checkMissingTask`);
        return;
      }

      // Check if task ID already exists in generated music
      const existingSongsCount = generatedMusic.filter(song => song.taskId === taskId).length;
      if (existingSongsCount >= EXPECTED_TRACKS_PER_TASK) {
        return;
      }

      // Poll Suno API untuk task ID
      const taskResponse = await sunoService.pollTaskCompletion(taskId, 20);
      
      if (taskResponse.data.status === "SUCCESS" && taskResponse.data.response?.sunoData) {
        const tracks = taskResponse.data.response.sunoData;
        
        // Filter out songs that already exist in generated music (by ID, not by taskId)
        const newTracks = tracks.filter(track => 
          !generatedMusic.some(song => song.id === track.id)
        );
        
        if (newTracks.length > 0) {
          // Create callback data structure
          const callbackData = {
            code: 200,
            msg: "success",
            data: {
              callbackType: "complete" as const,
              task_id: taskId,
              data: newTracks.map(track => ({
                id: track.id,
                audio_url: track.audioUrl,
                source_audio_url: track.audioUrl,
                stream_audio_url: track.streamAudioUrl || track.audioUrl,
                source_stream_audio_url: track.streamAudioUrl || track.audioUrl,
                image_url: track.imageUrl,
                source_image_url: track.ImageUrl,
                prompt: track.prompt,
                model_name: track.modelName,
                title: track.title,
                tags: track.tags,
                createTime: track.createTime,
                duration: track.duration
              }))
            }
          };
          
          // Process callback tanpa generation params (missing task scenario)
          await handleSunoCallback(callbackData);
          
          // Clean up any potential duplicates
          setTimeout(() => removeDuplicateSongs(), 1000);
        }
      }
    } catch (error) {
      console.error(`❌ Error checking missing task ${taskId}:`, error);
    }
  }, [handleSunoCallback, generatedMusic, removeDuplicateSongs, completedTasks]);

  // Function to add uploaded music from contract events
  const addUploadedMusic = useCallback((uploadedMusic: GeneratedMusic) => {
    // Early validation - check if user task ID is valid
    const isValidTaskId = userTaskIds && userTaskIds.includes(uploadedMusic.taskId);
    
    if (!isValidTaskId) {
      return;
    }

    // Check if song already exists (by ID, not by taskId since multiple songs can share taskId)
    const alreadyExistsById = generatedMusic.some(song => song.id === uploadedMusic.id);
    
    if (alreadyExistsById) {
      return;
    }

    // Add to the beginning of the list
    setGeneratedMusic(prev => [uploadedMusic, ...prev]);
  }, [userTaskIds, generatedMusic]);

  // Function to update a specific song
  const updateMusic = useCallback((id: string, updates: Partial<GeneratedMusic>) => {
    setGeneratedMusic(prevMusic =>
      prevMusic.map(music =>
        music.id === id ? { ...music, ...updates } : music
      )
    );
  }, []);

  // Fungsi untuk mengambil data lagu dari Suno berdasarkan task IDs dari contract
  const fetchSongsFromSunoByTaskIds = useCallback(async () => {
    if (!address || !userTaskIds || userTaskIds.length === 0) {
      return;
    }

    setIsFetchingSongs(true);
    try {
      const newSongs: GeneratedMusic[] = [];

      for (const taskId of userTaskIds) {
        try {
          // Skip jika lagu dengan taskId ini sudah ada
          const existingSong = generatedMusic.find(song => song.taskId === taskId);
          if (existingSong) {
            continue;
          }

          // Ambil data dari Suno API
          const taskResponse = await sunoService.getTaskStatus(taskId);
          
          if (taskResponse.code === 200 && taskResponse.data.status === "SUCCESS" && taskResponse.data.data) {
            // Proses setiap track dalam response
            for (const trackData of taskResponse.data.data) {
              const musicItem: GeneratedMusic = {
                id: trackData.id,
                title: trackData.title || "Untitled",
                artist: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "HiBeats User",
                duration: Math.round(trackData.duration || 0),
                audioUrl: trackData.audio_url || "",
                imageUrl: trackData.image_url || trackData.source_image_url || "https://via.placeholder.com/400x400/1e1e1e/ffffff?text=Music",
                originalAudioUrl: trackData.audio_url,
                originalImageUrl: trackData.image_url || trackData.source_image_url,
                genre: trackData.tags ? trackData.tags.split(", ").filter(tag => tag.trim()) : [],
                lyrics: trackData.lyrics || undefined,
                taskId: taskId,
                createdAt: trackData.createTime || new Date().toISOString(),
                metadata: {
                  description: trackData.prompt || "",
                  prompt: trackData.prompt || "",
                  model_used: trackData.model_name || "",
                  instrumental: false,
                  custom_mode: true,
                  style: "",
                  title_custom: trackData.title || "",
                  vocal_gender: "",
                  negative_tags: ""
                }
              };

              newSongs.push(musicItem);
            }
          }
        } catch (error) {
          console.error(`Error fetching task ${taskId}:`, error);
          // Continue dengan task ID lainnya
        }
      }

      // Tambahkan lagu baru ke state
      if (newSongs.length > 0) {
        setGeneratedMusic(prev => {
          // Filter out songs that already exist
          const filteredNewSongs = newSongs.filter(newSong => {
            return !prev.some(existingSong => existingSong.id === newSong.id);
          });
          
          if (filteredNewSongs.length === 0) {
            return prev;
          }
          
          return [...filteredNewSongs, ...prev];
        });

        toast.success(`✅ Fetched ${newSongs.length} song(s)`);
      }

    } catch (error) {
      console.error("Error fetching songs from Suno:", error);
      toast.error("Failed to fetch songs from Suno API");
    } finally {
      setIsFetchingSongs(false);
    }
  }, [address, userTaskIds, generatedMusic]);

  // Computed values untuk return
  const userSongs = generatedMusic.filter(song => {
    // Show songs that either:
    // 1. Have valid task IDs from blockchain (completed or pending)
    // 2. Are currently pending generation
    const isFromValidTask = userCompletedTaskIds?.includes(song.taskId) || 
                           userTaskIds?.includes(song.taskId);
    const isPendingTask = pendingTasks.has(song.taskId);
    
    return isFromValidTask || isPendingTask;
  });

  // Debug function untuk status
  const getDebugInfo = useCallback(() => {
    // Count duplicate songs and task IDs
    const songIds = generatedMusic.map(song => song.id);
    const taskIds = generatedMusic.map(song => song.taskId).filter(Boolean);
    
    const duplicateSongIds = songIds.filter((id, index) => songIds.indexOf(id) !== index);
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
  }, [address, generatedMusic, pendingTasks, currentTaskId]);

  return {
    generatedMusic: userSongs,
    isGenerating,
    currentTaskId,
    generateMusic,
    clearGeneratedMusic,
    checkMissingTask,
    addUploadedMusic,
    updateMusic,

    // Contract data
    generationFee,
    advancedGenerationFee,
    userRequests,
    userTaskIds,
    userCompletedTaskIds,
    dailyGenerationsLeft,
    pendingTasks: contractPendingTasks,
    taskStatuses,

    // Task status utilities
    checkTaskStatusFromSuno,
    updateTaskStatus,
    checkAllPendingTasksStatus,

    // Debug utilities
    getDebugInfo,
    debugContractData,
    forceRefreshAllData,
    clearInvalidSongs,
    removeDuplicateSongs,

    // Fetch songs utilities
    fetchSongsFromSuno,

    // React Query cached data
    cachedSongs,
    isLoadingCachedSongs,
    cachedSongsError,
    refetchCachedSongs,

    // Contract status
    contractHash,
    isContractPending,
    isContractSuccess,

    // Fetch songs state
    isFetchingSongs,
    
    // Force refresh trigger
    forceRefresh,

    // Task completion utilities
    markTaskAsCompleted: (taskId: string) => {
      setCompletedTasks(prev => new Set([...prev, taskId]));
      console.log(`✅ Task ${taskId} marked as completed`);
    }
  };
};