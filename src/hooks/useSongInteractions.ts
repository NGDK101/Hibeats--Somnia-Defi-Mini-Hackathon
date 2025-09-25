import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { SongLike, SongComment, SongInteraction } from '@/types/music';
import { socialIPFSService } from '@/services/socialIPFSService';
import { toast } from 'sonner';

export const useSongInteractions = (songId: string) => {
  const { address } = useAccount();
  const [interactions, setInteractions] = useState<SongInteraction>({
    songId,
    likes: [],
    comments: [],
    likeCount: 0,
    commentCount: 0,
    hasUserLiked: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load interactions from IPFS
  const loadInteractions = useCallback(async () => {
    setIsLoading(true);
    try {
      const interactions = await socialIPFSService.loadSongInteractions(songId);
      const hasUserLiked = address ? interactions.likes.some(like => like.userAddress === address) : false;

      setInteractions({
        ...interactions,
        hasUserLiked,
      });
    } catch (error) {
      console.error('Error loading song interactions:', error);
      // Set empty state on error
      setInteractions({
        songId,
        likes: [],
        comments: [],
        likeCount: 0,
        commentCount: 0,
        hasUserLiked: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, [songId, address]);


  // Toggle like
  const toggleLike = useCallback(async () => {
    if (!address) {
      toast.error('Please connect your wallet to like songs');
      return;
    }

    setIsLoading(true);
    try {
      const isCurrentlyLiked = interactions.hasUserLiked;
      let success = false;

      if (isCurrentlyLiked) {
        // Remove like
        success = await socialIPFSService.removeLike(songId, address);
        if (success) {
          toast.success('Removed from liked songs');
        }
      } else {
        // Add like
        success = await socialIPFSService.addLike(songId, address);
        if (success) {
          toast.success('Added to liked songs');
        }
      }

      if (success) {
        // Reload interactions from IPFS to get updated state
        await loadInteractions();
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like status');
    } finally {
      setIsLoading(false);
    }
  }, [address, songId, interactions.hasUserLiked, loadInteractions]);

  // Add comment
  const addComment = useCallback(async (commentText: string) => {
    if (!address) {
      toast.error('Please connect your wallet to comment');
      return false;
    }

    if (!commentText.trim()) {
      toast.error('Comment cannot be empty');
      return false;
    }

    setIsLoading(true);
    try {
      const success = await socialIPFSService.addComment(songId, address, commentText);

      if (success) {
        // Reload interactions from IPFS to get updated state
        await loadInteractions();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, songId, loadInteractions]);

  // Delete comment (only for the user who posted it)
  const deleteComment = useCallback(async (commentId: string) => {
    if (!address) return;

    setIsLoading(true);
    try {
      const success = await socialIPFSService.removeComment(songId, commentId, address);

      if (success) {
        toast.success('Comment deleted');
        // Reload interactions from IPFS to get updated state
        await loadInteractions();
      } else {
        toast.error('Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('You can only delete your own comments');
    } finally {
      setIsLoading(false);
    }
  }, [address, songId, loadInteractions]);

  // Load interactions on mount and when dependencies change
  useEffect(() => {
    loadInteractions().catch(error => {
      console.error('Error in useEffect loadInteractions:', error);
    });
  }, [loadInteractions]);

  // Edit comment
  const editComment = useCallback(async (commentId: string, newText: string) => {
    if (!address) {
      toast.error('Please connect your wallet to edit comments');
      return false;
    }

    if (!newText.trim()) {
      toast.error('Comment cannot be empty');
      return false;
    }

    setIsLoading(true);
    try {
      const success = await socialIPFSService.editComment(songId, commentId, address, newText);

      if (success) {
        await loadInteractions();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error editing comment:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, songId, loadInteractions]);

  // Add reply to comment
  const addReply = useCallback(async (parentCommentId: string, replyText: string) => {
    if (!address) {
      toast.error('Please connect your wallet to reply');
      return false;
    }

    if (!replyText.trim()) {
      toast.error('Reply cannot be empty');
      return false;
    }

    setIsLoading(true);
    try {
      const success = await socialIPFSService.addReply(songId, parentCommentId, address, replyText);

      if (success) {
        await loadInteractions();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, songId, loadInteractions]);

  return {
    interactions,
    isLoading,
    toggleLike,
    addComment,
    editComment,
    addReply,
    deleteComment,
    refreshInteractions: loadInteractions,
  };
};