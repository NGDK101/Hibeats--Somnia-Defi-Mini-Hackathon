import React from 'react';
import { formatEther } from 'viem';
import type { CreatorProfile, CreatorStats } from '../../contracts';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';

interface ProfileDisplayProps {
  profile: CreatorProfile;
  stats?: CreatorStats;
  onEdit: () => void;
  onShowFollowers: (type: 'followers' | 'following') => void;
}

export const ProfileDisplay: React.FC<ProfileDisplayProps> = ({
  profile,
  stats,
  onEdit,
  onShowFollowers,
}) => {
  return (
    <div className="bg-glass-background border border-glass-border rounded-xl backdrop-blur-xl mb-8">
      {/* Banner */}
      <div className="relative h-48">
        {profile.bannerImageUrl ? (
          <ImageWithFallback
            src={profile.bannerImageUrl}
            alt="Banner"
            className="w-full h-full object-cover rounded-t-xl"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-purple-600/80 to-pink-600/80 rounded-t-xl"></div>
        )}

        {/* Edit Button */}
        <button
          onClick={onEdit}
          className="absolute top-4 right-4 bg-glass-background/80 backdrop-blur-md border border-glass-border hover:bg-glass-background text-white px-4 py-2 rounded-lg font-medium transition-all duration-300"
        >
          Edit Profile
        </button>
      </div>

      {/* Profile Info */}
      <div className="px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-primary/30 bg-glass-background">
              {profile.profileImageUrl ? (
                <ImageWithFallback
                  src={profile.profileImageUrl}
                  alt={profile.displayName}
                  className="w-full h-full object-cover"
                  fallbackSrc=""
                  onError={() => {}}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    {profile.displayName?.charAt(0) || profile.username?.charAt(0) || '?'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Profile Details */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">
                {profile.displayName || profile.username}
              </h1>
              {profile.isVerified && (
                <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs rounded-full flex items-center">
                  ✓ Verified
                </span>
              )}
            </div>

            <p className="text-gray-400 mb-3">@{profile.username}</p>

            {profile.bio && (
              <p className="text-gray-300 mb-4 max-w-2xl leading-relaxed">{profile.bio}</p>
            )}

            {/* Social Links */}
            {(profile.website || profile.twitter || profile.instagram || profile.spotify) && (
              <div className="flex flex-wrap gap-3 mb-6">
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors text-sm"
                  >
                    🌐 Website
                  </a>
                )}
                {profile.twitter && (
                  <a
                    href={`https://twitter.com/${profile.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors text-sm"
                  >
                    🐦 Twitter
                  </a>
                )}
                {profile.instagram && (
                  <a
                    href={`https://instagram.com/${profile.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors text-sm"
                  >
                    📷 Instagram
                  </a>
                )}
                {profile.spotify && (
                  <a
                    href={profile.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors text-sm"
                  >
                    🎵 Spotify
                  </a>
                )}
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <StatItem
                label="Tracks"
                value={profile.totalTracks.toString()}
                onClick={() => {}}
              />
              <StatItem
                label="Followers"
                value={profile.followerCount.toString()}
                onClick={() => onShowFollowers('followers')}
                clickable
              />
              <StatItem
                label="Following"
                value={profile.followingCount.toString()}
                onClick={() => onShowFollowers('following')}
                clickable
              />
              <StatItem
                label="Earned"
                value={`${parseFloat(formatEther(profile.totalEarnings)).toFixed(3)} STT`}
                onClick={() => {}}
              />
            </div>

            {/* Additional Stats if available */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pt-4 border-t border-glass-border/50">
                <StatItem
                  label="Total Sales"
                  value={stats.totalSales.toString()}
                  onClick={() => {}}
                />
                <StatItem
                  label="Avg Price"
                  value={`${parseFloat(formatEther(stats.averagePrice)).toFixed(3)} STT`}
                  onClick={() => {}}
                />
                <StatItem
                  label="Highest Sale"
                  value={`${parseFloat(formatEther(stats.highestSale)).toFixed(3)} STT`}
                  onClick={() => {}}
                />
                <StatItem
                  label="Active Listings"
                  value={stats.totalListings.toString()}
                  onClick={() => {}}
                />
              </div>
            )}

            {/* Member Since */}
            <div className="pt-4 border-t border-glass-border/50">
              <p className="text-gray-400 text-sm">
                Member since{' '}
                <span className="text-white">
                  {new Date(Number(profile.joinedAt) * 1000).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stat Item Component
const StatItem: React.FC<{
  label: string;
  value: string;
  onClick: () => void;
  clickable?: boolean;
}> = ({ label, value, onClick, clickable = false }) => {
  return (
    <div
      className={`text-center p-2 rounded-lg transition-all duration-300 ${
        clickable
          ? 'cursor-pointer hover:bg-glass-background/50 hover:border-primary/20 border border-transparent'
          : ''
      }`}
      onClick={clickable ? onClick : undefined}
    >
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-gray-400 text-sm">{label}</div>
    </div>
  );
};

export default ProfileDisplay;