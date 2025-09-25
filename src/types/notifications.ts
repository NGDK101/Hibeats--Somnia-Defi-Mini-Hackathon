export interface NotificationData {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'unfollow' | 'song_mention' | 'playlist_add';
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  fromUser: {
    address: string;
    username?: string;
    avatar?: string;
  };
  toUser: string; // recipient address
  metadata?: {
    songId?: string;
    songTitle?: string;
    commentId?: string;
    commentText?: string;
    playlistId?: string;
    playlistName?: string;
  };
  actionUrl?: string; // URL to navigate when clicked
}

export interface NotificationSettings {
  likes: boolean;
  comments: boolean;
  follows: boolean;
  songMentions: boolean;
  playlistAdds: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface NotificationState {
  notifications: NotificationData[];
  unreadCount: number;
  settings: NotificationSettings;
  isLoading: boolean;
  lastChecked: number;
}

export type NotificationType = NotificationData['type'];

export interface CreateNotificationParams {
  type: NotificationType;
  fromUser: {
    address: string;
    username?: string;
    avatar?: string;
  };
  toUser: string;
  metadata?: NotificationData['metadata'];
}