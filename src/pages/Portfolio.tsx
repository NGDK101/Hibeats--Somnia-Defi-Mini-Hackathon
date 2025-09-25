import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useCreatorProfile } from '../hooks/useEnhancedMarketplace';
import { CreateProfileForm } from '../components/Profile/CreateProfileForm';
import { UpdateProfileForm } from '../components/Profile/UpdateProfileForm';
import { ProfileDisplay } from '../components/Profile/ProfileDisplay';
import { ProfileStats } from '../components/Profile/ProfileStats';
import { FollowersModal } from '../components/Profile/FollowersModal';

export const Portfolio: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'tracks' | 'activity'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState<'followers' | 'following' | null>(null);

  const { profile, stats, tracks, isLoading, refetch } = useCreatorProfile(address);

  // Auto-refetch when address changes
  useEffect(() => {
    if (address) {
      refetch();
    }
  }, [address, refetch]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Portfolio</h1>
          <p className="text-gray-300 mb-8">Connect your wallet to view your portfolio</p>
          <div className="bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
            <p className="text-gray-400">Please connect your wallet to continue</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-white">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  const hasProfile = !!profile;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">My Portfolio</h1>
          <p className="text-gray-300">Manage your creator profile and track your performance</p>
        </div>

        {/* Profile Section */}
        {!hasProfile ? (
          <CreateProfileSection onSuccess={refetch} />
        ) : isEditing ? (
          <UpdateProfileSection
            profile={profile}
            onSuccess={() => {
              setIsEditing(false);
              refetch();
            }}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <>
            {/* Profile Display */}
            <ProfileDisplay
              profile={profile}
              stats={stats}
              onEdit={() => setIsEditing(true)}
              onShowFollowers={(type) => setShowFollowersModal(type)}
            />

            {/* Navigation Tabs */}
            <div className="mb-8">
              <nav className="flex space-x-8 border-b border-gray-700">
                {(['profile', 'stats', 'tracks', 'activity'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab
                        ? 'border-purple-500 text-purple-400'
                        : 'border-transparent text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-64">
              {activeTab === 'profile' && (
                <ProfileTabContent profile={profile} stats={stats} />
              )}

              {activeTab === 'stats' && (
                <ProfileStats stats={stats} />
              )}

              {activeTab === 'tracks' && (
                <TracksTabContent tracks={tracks} />
              )}

              {activeTab === 'activity' && (
                <ActivityTabContent userAddress={address} />
              )}
            </div>

            {/* Followers/Following Modal */}
            {showFollowersModal && (
              <FollowersModal
                creatorAddress={address!}
                type={showFollowersModal}
                onClose={() => setShowFollowersModal(null)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Create Profile Section
const CreateProfileSection: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  return (
    <div className="bg-gray-800 rounded-xl p-8 mb-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Create Your Creator Profile</h2>
        <p className="text-gray-400">
          Set up your profile to start showcasing your music and connecting with fans
        </p>
      </div>
      <CreateProfileForm onSuccess={onSuccess} />
    </div>
  );
};

// Update Profile Section
const UpdateProfileSection: React.FC<{
  profile: any;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ profile, onSuccess, onCancel }) => {
  return (
    <div className="bg-gray-800 rounded-xl p-8 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
      <UpdateProfileForm profile={profile} onSuccess={onSuccess} onCancel={onCancel} />
    </div>
  );
};

// Profile Tab Content
const ProfileTabContent: React.FC<{ profile: any; stats: any }> = ({ profile, stats }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Profile Info */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Profile Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Username</label>
            <p className="text-white">@{profile.username}</p>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Display Name</label>
            <p className="text-white">{profile.displayName || 'Not set'}</p>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Bio</label>
            <p className="text-white">{profile.bio || 'No bio added yet'}</p>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Member Since</label>
            <p className="text-white">
              {new Date(Number(profile.joinedAt) * 1000).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Social Links</h3>
        <div className="space-y-3">
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-purple-400 hover:text-purple-300 transition-colors"
            >
              🌐 Website
            </a>
          )}
          {profile.twitter && (
            <a
              href={`https://twitter.com/${profile.twitter}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-purple-400 hover:text-purple-300 transition-colors"
            >
              🐦 Twitter: @{profile.twitter}
            </a>
          )}
          {profile.instagram && (
            <a
              href={`https://instagram.com/${profile.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-purple-400 hover:text-purple-300 transition-colors"
            >
              📷 Instagram: @{profile.instagram}
            </a>
          )}
          {profile.spotify && (
            <a
              href={profile.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-purple-400 hover:text-purple-300 transition-colors"
            >
              🎵 Spotify
            </a>
          )}

          {!profile.website && !profile.twitter && !profile.instagram && !profile.spotify && (
            <p className="text-gray-500">No social links added yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Tracks Tab Content
const TracksTabContent: React.FC<{ tracks?: any[] }> = ({ tracks }) => {
  if (!tracks || tracks.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-8 text-center">
        <p className="text-gray-400 mb-4">No tracks found</p>
        <p className="text-gray-500 text-sm">Create your first track to see it here</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tracks.map((track) => (
        <div key={track.tokenId.toString()} className="bg-gray-800 rounded-xl p-4">
          <div className="aspect-square bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
            <span className="text-4xl">🎵</span>
          </div>
          <h3 className="font-medium text-white mb-2">{track.title}</h3>
          <p className="text-gray-400 text-sm mb-2">{track.genre}</p>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">
              {Math.floor(Number(track.duration) / 60)}:{(Number(track.duration) % 60).toString().padStart(2, '0')}
            </span>
            <div className="flex gap-2">
              {track.isListed && (
                <span className="text-green-400 text-xs">Listed</span>
              )}
              {track.isInAuction && (
                <span className="text-blue-400 text-xs">Auction</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Activity Tab Content
const ActivityTabContent: React.FC<{ userAddress?: string }> = ({ userAddress }) => {
  return (
    <div className="bg-gray-800 rounded-xl p-8">
      <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
      <div className="text-center py-8">
        <p className="text-gray-400 mb-4">Activity tracking coming soon</p>
        <p className="text-gray-500 text-sm">
          This will show your recent marketplace activities, sales, and interactions
        </p>
      </div>
    </div>
  );
};

export default Portfolio;