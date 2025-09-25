import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Send, Trash2, User, Edit3, Reply, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSongInteractions } from '@/hooks/useSongInteractions';
import { useNotifications } from '@/hooks/useNotifications';
import { useAccount } from 'wagmi';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { IPFSStatusIndicator } from './IPFSStatusIndicator';

interface SongInteractionsProps {
  songId: string;
  songTitle?: string;
  songOwner?: string; // Address of the song owner for notifications
  className?: string;
  compact?: boolean;
}

export const SongInteractions: React.FC<SongInteractionsProps> = ({
  songId,
  songTitle = 'Unknown Song',
  songOwner,
  className,
  compact = false,
}) => {
  const { address } = useAccount();
  const { interactions, isLoading, toggleLike, addComment, editComment, addReply, deleteComment } = useSongInteractions(songId);
  const { registerUserSong } = useNotifications();
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleToggleLike = async () => {
    if (!address) return;

    // Register song for the owner to enable notifications
    if (songOwner) {
      registerUserSong(songId, songTitle);
    }

    await toggleLike();
    // Notifications will be automatically detected from IPFS social interactions
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !address) return;

    // Register song for the owner to enable notifications
    if (songOwner) {
      registerUserSong(songId, songTitle);
    }

    const success = await addComment(newComment);
    if (success) {
      setNewComment('');
      // Notifications will be automatically detected from IPFS social interactions
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editingText.trim()) return;

    const success = await editComment(commentId, editingText);
    if (success) {
      setEditingCommentId(null);
      setEditingText('');
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyText.trim()) return;

    const success = await addReply(parentId, replyText);
    if (success) {
      setReplyingToId(null);
      setReplyText('');
    }
  };

  const startEdit = (comment: any) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.comment);
  };

  const cancelEdit = () => {
    setEditingCommentId(null);
    setEditingText('');
  };

  const startReply = (commentId: string) => {
    setReplyingToId(commentId);
    setReplyText('');
  };

  const cancelReply = () => {
    setReplyingToId(null);
    setReplyText('');
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleLike}
          disabled={isLoading}
          className={cn(
            "flex items-center gap-2 p-2 h-auto transition-all duration-200",
            interactions.hasUserLiked
              ? "text-red-500 hover:text-red-600"
              : "text-muted-foreground hover:text-red-500"
          )}
        >
          <Heart
            className={cn(
              "w-4 h-4 transition-all duration-200",
              interactions.hasUserLiked ? "fill-current" : ""
            )}
          />
          <span className="text-sm font-medium">{interactions.likeCount}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 p-2 h-auto text-muted-foreground hover:text-blue-500 transition-all duration-200"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm font-medium">{interactions.commentCount}</span>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={handleToggleLike}
          disabled={isLoading}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200",
            interactions.hasUserLiked
              ? "text-red-500 bg-red-500/10 hover:bg-red-500/20"
              : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
          )}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Heart
              className={cn(
                "w-5 h-5 transition-all duration-200",
                interactions.hasUserLiked ? "fill-current" : ""
              )}
            />
          )}
          <span className="font-semibold">{interactions.likeCount}</span>
          <span className="text-sm">Like{interactions.likeCount !== 1 ? 's' : ''}</span>
        </Button>

        <Button
          variant="ghost"
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-all duration-200"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-semibold">{interactions.commentCount}</span>
          <span className="text-sm">Comment{interactions.commentCount !== 1 ? 's' : ''}</span>
        </Button>
        </div>

      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {address && (
              <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onSubmit={handleSubmitComment}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-3"
              >
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="bg-transparent border-white/10 text-white placeholder-muted-foreground resize-none min-h-[80px] focus:border-blue-500/50"
                  maxLength={500}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {newComment.length}/500
                    </span>
                  </div>
                  <Button
                    type="submit"
                    disabled={!newComment.trim() || isLoading}
                    className="bg-gradient-button hover:opacity-90 text-black rounded-full px-6"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                        Saving to IPFS...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Post
                      </>
                    )}
                  </Button>
                </div>
              </motion.form>
            )}

            {interactions.comments.length > 0 ? (
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-3">
                  {interactions.comments
                    .filter(comment => !comment.parentId)
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .map((comment, index) => (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <span className="text-sm font-semibold text-white">
                                {comment.username || `${comment.userAddress.slice(0, 6)}...${comment.userAddress.slice(-4)}`}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs border-white/20 text-muted-foreground">
                                  {formatTimestamp(comment.timestamp)}
                                  {comment.editedAt && (
                                    <span className="ml-1 text-xs">(edited)</span>
                                  )}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startReply(comment.id)}
                              className="p-1 h-auto text-muted-foreground hover:text-blue-500"
                              title="Reply"
                            >
                              <Reply className="w-3 h-3" />
                            </Button>

                            {comment.userAddress === address && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-1 h-auto text-muted-foreground hover:text-white"
                                  >
                                    <MoreHorizontal className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-card border-white/10">
                                  <DropdownMenuItem
                                    onClick={() => startEdit(comment)}
                                    className="text-white hover:bg-white/10"
                                  >
                                    <Edit3 className="w-3 h-3 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => deleteComment(comment.id)}
                                    className="text-red-400 hover:bg-red-500/10"
                                  >
                                    <Trash2 className="w-3 h-3 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>

                        {editingCommentId === comment.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="bg-transparent border-white/10 text-white placeholder-muted-foreground resize-none min-h-[60px]"
                              maxLength={500}
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelEdit}
                                className="text-muted-foreground hover:text-white"
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleEditComment(comment.id)}
                                disabled={!editingText.trim() || isLoading}
                                className="bg-gradient-button hover:opacity-90 text-black rounded-full"
                              >
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-white/90 leading-relaxed">
                            {comment.comment}
                          </p>
                        )}

                        {replyingToId === comment.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-3 pt-3 border-t border-white/10"
                          >
                            <div className="space-y-2">
                              <Textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={`Reply to ${comment.username || 'user'}...`}
                                className="bg-transparent border-white/10 text-white placeholder-muted-foreground resize-none min-h-[60px]"
                                maxLength={500}
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={cancelReply}
                                  className="text-muted-foreground hover:text-white"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleReply(comment.id)}
                                  disabled={!replyText.trim() || isLoading}
                                  className="bg-gradient-button hover:opacity-90 text-black rounded-full"
                                >
                                  Reply
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {interactions.comments
                          .filter(reply => reply.parentId === comment.id)
                          .length > 0 && (
                          <div className="mt-3 ml-6 space-y-2">
                            {interactions.comments
                              .filter(reply => reply.parentId === comment.id)
                              .sort((a, b) => a.timestamp - b.timestamp)
                              .map((reply) => (
                                <div
                                  key={reply.id}
                                  className="bg-white/3 backdrop-blur-xl border border-white/5 rounded-lg p-3"
                                >
                                  <div className="flex items-start justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                                        <User className="w-3 h-3 text-white" />
                                      </div>
                                      <span className="text-xs font-semibold text-white">
                                        {reply.username || `${reply.userAddress.slice(0, 6)}...${reply.userAddress.slice(-4)}`}
                                      </span>
                                      <Badge variant="outline" className="text-xs border-white/20 text-muted-foreground">
                                        {formatTimestamp(reply.timestamp)}
                                      </Badge>
                                    </div>
                                    {reply.userAddress === address && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteComment(reply.id)}
                                        className="p-1 h-auto text-muted-foreground hover:text-red-500"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
                                  <p className="text-xs text-white/80 leading-relaxed ml-8">
                                    {reply.comment}
                                  </p>
                                </div>
                              ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                </div>
              </ScrollArea>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center py-8 text-muted-foreground"
              >
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No comments yet</p>
                <p className="text-sm">Be the first to share your thoughts!</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};