import { NotificationData, CreateNotificationParams, NotificationSettings } from '@/types/notifications';
import { socialIPFSService } from './socialIPFSService';

const STORAGE_KEY = 'hibeats_notifications';
const SETTINGS_KEY = 'hibeats_notification_settings';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface NotificationStorage {
  notifications: NotificationData[];
  lastSync: number;
}

class NotificationService {
  private listeners: Set<(notifications: NotificationData[]) => void> = new Set();
  private cache: Map<string, NotificationStorage> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  /**
   * Initialize notification service for a user
   */
  async initialize(userAddress: string): Promise<void> {
    if (this.isInitialized) return;

    await this.loadNotifications(userAddress);
    this.startPeriodicCheck(userAddress);
    this.isInitialized = true;
  }

  /**
   * Cleanup when user disconnects
   */
  cleanup(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.listeners.clear();
    this.isInitialized = false;
  }

  /**
   * Subscribe to notification updates
   */
  subscribe(callback: (notifications: NotificationData[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Create a new notification
   */
  async createNotification(params: CreateNotificationParams): Promise<boolean> {
    try {
      const notification: NotificationData = {
        id: `${params.type}_${params.fromUser.address}_${params.toUser}_${Date.now()}`,
        type: params.type,
        title: this.generateTitle(params),
        message: this.generateMessage(params),
        timestamp: Date.now(),
        isRead: false,
        fromUser: params.fromUser,
        toUser: params.toUser,
        metadata: params.metadata,
        actionUrl: this.generateActionUrl(params)
      };

      // Get existing notifications for the recipient
      const existingNotifications = await this.getNotifications(params.toUser);

      // Add new notification to the beginning
      const updatedNotifications = [notification, ...existingNotifications];

      // Keep only last 100 notifications
      const trimmedNotifications = updatedNotifications.slice(0, 100);

      // Save to storage
      await this.saveNotifications(params.toUser, trimmedNotifications);

      // Notify listeners
      this.notifyListeners(trimmedNotifications);

      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(userAddress: string): Promise<NotificationData[]> {
    const cacheKey = userAddress.toLowerCase();
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.lastSync < CACHE_DURATION) {
      return cached.notifications;
    }

    return this.loadNotifications(userAddress);
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(userAddress: string, notificationIds: string[]): Promise<boolean> {
    try {
      const notifications = await this.getNotifications(userAddress);
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        isRead: notificationIds.includes(notification.id) ? true : notification.isRead
      }));

      await this.saveNotifications(userAddress, updatedNotifications);
      this.notifyListeners(updatedNotifications);

      return true;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userAddress: string): Promise<boolean> {
    try {
      const notifications = await this.getNotifications(userAddress);
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        isRead: true
      }));

      await this.saveNotifications(userAddress, updatedNotifications);
      this.notifyListeners(updatedNotifications);

      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(userAddress: string, notificationId: string): Promise<boolean> {
    try {
      const notifications = await this.getNotifications(userAddress);
      const updatedNotifications = notifications.filter(n => n.id !== notificationId);

      await this.saveNotifications(userAddress, updatedNotifications);
      this.notifyListeners(updatedNotifications);

      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userAddress: string): Promise<number> {
    const notifications = await this.getNotifications(userAddress);
    return notifications.filter(n => !n.isRead).length;
  }

  /**
   * Get notification settings
   */
  getSettings(): NotificationSettings {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }

    // Default settings
    return {
      likes: true,
      comments: true,
      follows: true,
      songMentions: true,
      playlistAdds: true,
      emailNotifications: false,
      pushNotifications: true
    };
  }

  /**
   * Update notification settings
   */
  updateSettings(settings: NotificationSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  /**
   * Load notifications from localStorage
   */
  private async loadNotifications(userAddress: string): Promise<NotificationData[]> {
    try {
      const cacheKey = userAddress.toLowerCase();
      const stored = localStorage.getItem(`${STORAGE_KEY}_${cacheKey}`);

      if (stored) {
        const parsed: NotificationStorage = JSON.parse(stored);
        this.cache.set(cacheKey, parsed);
        return parsed.notifications;
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }

    return [];
  }

  /**
   * Save notifications to localStorage
   */
  private async saveNotifications(userAddress: string, notifications: NotificationData[]): Promise<void> {
    try {
      const cacheKey = userAddress.toLowerCase();
      const storage: NotificationStorage = {
        notifications,
        lastSync: Date.now()
      };

      localStorage.setItem(`${STORAGE_KEY}_${cacheKey}`, JSON.stringify(storage));
      this.cache.set(cacheKey, storage);
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  /**
   * Start periodic check for new notifications
   */
  private startPeriodicCheck(userAddress: string): void {
    // Check every 30 seconds for new notifications
    this.checkInterval = setInterval(async () => {
      try {
        // In a real app, this would check a backend API
        // For now, we'll just refresh from localStorage
        const notifications = await this.loadNotifications(userAddress);
        this.notifyListeners(notifications);
      } catch (error) {
        console.error('Error in periodic notification check:', error);
      }
    }, 30000);
  }

  /**
   * Notify all listeners of notification updates
   */
  private notifyListeners(notifications: NotificationData[]): void {
    this.listeners.forEach(callback => {
      try {
        callback(notifications);
      } catch (error) {
        console.error('Error notifying listener:', error);
      }
    });
  }

  /**
   * Generate notification title based on type
   */
  private generateTitle(params: CreateNotificationParams): string {
    const username = params.fromUser.username || `${params.fromUser.address.slice(0, 6)}...${params.fromUser.address.slice(-4)}`;

    switch (params.type) {
      case 'like':
        return 'New Like';
      case 'comment':
        return 'New Comment';
      case 'follow':
        return 'New Follower';
      case 'unfollow':
        return 'Unfollowed';
      case 'song_mention':
        return 'Song Mentioned';
      case 'playlist_add':
        return 'Added to Playlist';
      default:
        return 'New Notification';
    }
  }

  /**
   * Generate notification message based on type
   */
  private generateMessage(params: CreateNotificationParams): string {
    const username = params.fromUser.username || `${params.fromUser.address.slice(0, 6)}...${params.fromUser.address.slice(-4)}`;

    switch (params.type) {
      case 'like':
        return `${username} liked your song "${params.metadata?.songTitle || 'Unknown'}"`;
      case 'comment':
        return `${username} commented on your song "${params.metadata?.songTitle || 'Unknown'}"`;
      case 'follow':
        return `${username} started following you`;
      case 'unfollow':
        return `${username} unfollowed you`;
      case 'song_mention':
        return `${username} mentioned your song "${params.metadata?.songTitle || 'Unknown'}"`;
      case 'playlist_add':
        return `${username} added your song to playlist "${params.metadata?.playlistName || 'Unknown'}"`;
      default:
        return `${username} interacted with your content`;
    }
  }

  /**
   * Generate action URL for navigation
   */
  private generateActionUrl(params: CreateNotificationParams): string | undefined {
    switch (params.type) {
      case 'like':
      case 'comment':
        return params.metadata?.songId ? `/song/${params.metadata.songId}` : undefined;
      case 'follow':
      case 'unfollow':
        return `/profile/${params.fromUser.address}`;
      case 'playlist_add':
        return params.metadata?.playlistId ? `/playlist/${params.metadata.playlistId}` : undefined;
      default:
        return undefined;
    }
  }
}

export const notificationService = new NotificationService();