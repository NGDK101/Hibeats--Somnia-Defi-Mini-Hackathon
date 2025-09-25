import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Music,
  ListMusic,
  X,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  Clock,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationData } from '@/types/notifications';

interface NotificationDropdownProps {
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose }) => {
  const {
    notifications,
    recentNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    isLoading
  } = useNotifications();

  const [selectedTab, setSelectedTab] = useState<'all' | 'recent'>('all');
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const displayNotifications = selectedTab === 'recent' ? recentNotifications : notifications;

  const getNotificationIcon = (type: NotificationData['type']) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case 'song_mention':
        return <Music className="w-4 h-4 text-purple-500" />;
      case 'playlist_add':
        return <ListMusic className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const handleNotificationClick = async (notification: NotificationData) => {
    // Mark as read if unread
    if (!notification.isRead) {
      await markAsRead([notification.id]);
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      // In a real app, you'd use your router here
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    setDeletingIds(prev => new Set(prev).add(notificationId));

    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="w-96 bg-card/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-white" />
            <h3 className="text-lg font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshNotifications}
              disabled={isLoading}
              className="text-xs text-green-400 hover:text-green-300"
              title="Refresh from IPFS"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Sync
            </Button>

            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={isLoading}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-muted-foreground hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTab('all')}
            className={cn(
              'flex-1 text-xs h-8',
              selectedTab === 'all'
                ? 'bg-white/10 text-white'
                : 'text-muted-foreground hover:text-white'
            )}
          >
            All ({notifications.length})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTab('recent')}
            className={cn(
              'flex-1 text-xs h-8',
              selectedTab === 'recent'
                ? 'bg-white/10 text-white'
                : 'text-muted-foreground hover:text-white'
            )}
          >
            Recent ({recentNotifications.length})
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <ScrollArea className="h-96">
        <div className="p-2">
          <AnimatePresence>
            {displayNotifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <Bell className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  {selectedTab === 'recent' ? 'No recent notifications' : 'No notifications yet'}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {selectedTab === 'recent'
                    ? 'Notifications from the last 7 days will appear here'
                    : 'When someone interacts with your content, you\'ll see it here'
                  }
                </p>
              </motion.div>
            ) : (
              displayNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'p-3 rounded-xl cursor-pointer transition-all duration-200 group relative',
                    'hover:bg-white/5 active:bg-white/10',
                    !notification.isRead && 'bg-blue-500/10 border border-blue-500/20',
                    deletingIds.has(notification.id) && 'opacity-50 pointer-events-none'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={notification.fromUser.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm">
                          {notification.fromUser.username?.charAt(0).toUpperCase() ||
                           notification.fromUser.address.slice(2, 4).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Notification type icon */}
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-card border-2 border-white/10 rounded-full flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {notification.message}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead([notification.id]);
                              }}
                              className="h-6 w-6 text-blue-400 hover:text-blue-300"
                              title="Mark as read"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          )}

                          {notification.actionUrl && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-white"
                              title="Open"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleDeleteNotification(e, notification.id)}
                            disabled={deletingIds.has(notification.id)}
                            className="h-6 w-6 text-red-400 hover:text-red-300"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(notification.timestamp)}
                        </div>

                        {!notification.isRead && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-5">
                            New
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Footer */}
      {notifications.length > 0 && (
        <>
          <Separator className="bg-white/10" />
          <div className="p-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground hover:text-white"
              onClick={() => {
                // Navigate to full notifications page
                onClose();
              }}
            >
              <Settings className="w-4 h-4 mr-2" />
              View all notifications
            </Button>
          </div>
        </>
      )}
    </motion.div>
  );
};