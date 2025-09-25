import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useCreatorFollowers, useFollowedCreators } from '../../hooks/useMarketplaceData';
import { useCreatorProfile } from '../../hooks/useEnhancedMarketplace';
import { useEnhancedMarketplace } from '../../hooks/useEnhancedMarketplace';

interface FollowersModalProps {
  creatorAddress: string;
  type: 'followers' | 'following';
  onClose: () => void;
}

export const FollowersModal: React.FC<FollowersModalProps> = ({
  creatorAddress,
  type,
  onClose,
}) => {
  const { address } = useAccount();
  const { followCreator, unfollowCreator } = useEnhancedMarketplace();

  const { followers, isLoading: followersLoading } = useCreatorFollowers(
    type === 'followers' ? creatorAddress : undefined
  );
  const { followedCreators, isLoading: followingLoading } = useFollowedCreators(
    type === 'following' ? creatorAddress : undefined
  );

  const addresses = type === 'followers' ? followers : followedCreators;
  const isLoading = type === 'followers' ? followersLoading : followingLoading;

  const handleFollowToggle = async (targetAddress: string, isCurrentlyFollowing: boolean) => {
    if (!address) return;

    try {
      if (isCurrentlyFollowing) {
        await unfollowCreator(targetAddress);
      } else {
        await followCreator(targetAddress);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            {type === 'followers' ? 'Followers' : 'Following'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading...</p>
            </div>
          ) : !addresses || addresses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-2">
                No {type === 'followers' ? 'followers' : 'following'} yet
              </p>
              <p className="text-gray-500 text-sm">
                {type === 'followers'
                  ? 'People who follow you will appear here'
                  : 'Creators you follow will appear here'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((userAddress) => (
                <UserCard
                  key={userAddress}
                  userAddress={userAddress}
                  currentUserAddress={address}
                  onFollowToggle={handleFollowToggle}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// User Card Component
const UserCard: React.FC<{
  userAddress: string;
  currentUserAddress?: string;
  onFollowToggle: (address: string, isFollowing: boolean) => void;
}> = ({ userAddress, currentUserAddress, onFollowToggle }) => {
  const { profile } = useCreatorProfile(userAddress);
  const [isFollowing, setIsFollowing] = useState(false);

  // In a real app, you'd check if current user is following this user
  useEffect(() => {
    // This would be replaced with actual follow status check
    setIsFollowing(false);
  }, [userAddress, currentUserAddress]);

  const handleFollowClick = () => {
    onFollowToggle(userAddress, isFollowing);
    setIsFollowing(!isFollowing);
  };

  const displayName = profile?.displayName || profile?.username || 'Unknown User';
  const username = profile?.username || userAddress.slice(0, 8) + '...';

  return (
    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
      <div className="flex items-center space-x-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-600">
          {profile?.profileImageUrl ? (
            <img
              src={profile.profileImageUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* User Info */}
        <div>
          <div className="flex items-center gap-2">
            <p className="text-white font-medium">{displayName}</p>
            {profile?.isVerified && (
              <span className="text-blue-400 text-xs">✓</span>
            )}
          </div>
          <p className="text-gray-400 text-sm">@{username}</p>
        </div>
      </div>

      {/* Follow Button */}
      {currentUserAddress && currentUserAddress !== userAddress && (
        <button
          onClick={handleFollowClick}
          className={`px-4 py-1 rounded-lg text-sm font-medium transition-colors ${
            isFollowing
              ? 'bg-gray-600 hover:bg-gray-700 text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {isFollowing ? 'Unfollow' : 'Follow'}
        </button>
      )}
    </div>
  );
};

export default FollowersModal;