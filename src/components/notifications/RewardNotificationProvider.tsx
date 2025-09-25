import React from 'react';
import { toast } from 'sonner';

interface RewardNotificationProviderProps {
  children: React.ReactNode;
}

export const RewardNotificationProvider: React.FC<RewardNotificationProviderProps> = ({ children }) => {
  return <>{children}</>;
};

// Export functions directly instead of hook
export const showRewardNotification = (
  type: string,
  amount: string,
  transactionHash: string,
  streakBonus?: any
) => {
  const rewardIcons: Record<string, string> = {
    DAILY_LOGIN: '🌅',
    MUSIC_GENERATION: '🎵',
    SOCIAL_INTERACTION: '💬',
    ACHIEVEMENT: '🏆',
  };
  
  const icon = rewardIcons[type] || '🎁';
  toast.success(`${icon} Reward earned! +${amount} BEATS`, {
    duration: 3000,
    position: 'top-right',
  });
};

export const showQuickRewardFeedback = (type: string, amount: string) => {
  const rewardData: Record<string, { icon: string; message: string }> = {
    DAILY_LOGIN: { icon: '🌅', message: 'Daily check-in completed!' },
    MUSIC_GENERATION: { icon: '🎵', message: 'Music created successfully!' },
    SOCIAL_INTERACTION: { icon: '💬', message: 'Social reward earned!' },
    ACHIEVEMENT: { icon: '🏆', message: 'Achievement unlocked!' },
  };

  const data = rewardData[type] || { icon: '🎁', message: 'Reward earned!' };
  
  toast.success(`${data.icon} ${data.message} +${amount} BEATS`, {
    duration: 3000,
    position: 'top-right',
  });
};

// Keep the hook for backward compatibility
export const useRewardNotifications = () => {
  return {
    showRewardNotification,
    showQuickRewardFeedback,
  };
};