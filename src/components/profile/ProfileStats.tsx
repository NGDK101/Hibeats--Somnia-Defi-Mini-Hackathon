import React from 'react';
import { formatEther } from 'viem';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import type { CreatorStats } from '../../contracts';

interface ProfileStatsProps {
  stats?: CreatorStats;
}

const COLORS = ['#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

export const ProfileStats: React.FC<ProfileStatsProps> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="bg-gray-800 rounded-xl p-8 text-center">
        <p className="text-gray-400 mb-4">No statistics available</p>
        <p className="text-gray-500 text-sm">
          Statistics will appear here as you create tracks and make sales
        </p>
      </div>
    );
  }

  // Prepare genre data for pie chart
  const genreData = stats.topGenres.slice(0, 6).map((genre, index) => ({
    name: genre,
    value: Number(stats.genreCounts[index] || 0),
    color: COLORS[index % COLORS.length],
  }));

  // Mock data for charts (in real app, this would come from contract events)
  const monthlyData = [
    { month: 'Jan', sales: 5, earnings: 0.5 },
    { month: 'Feb', sales: 8, earnings: 0.8 },
    { month: 'Mar', sales: 12, earnings: 1.2 },
    { month: 'Apr', sales: 15, earnings: 1.8 },
    { month: 'May', sales: 20, earnings: 2.5 },
    { month: 'Jun', sales: 18, earnings: 2.2 },
  ];

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Tracks"
          value={stats.totalTracks.toString()}
          icon="🎵"
          trend="+12%"
          trendUp={true}
        />
        <StatsCard
          title="Total Sales"
          value={stats.totalSales.toString()}
          icon="💰"
          trend="+8%"
          trendUp={true}
        />
        <StatsCard
          title="Total Plays"
          value={stats.totalPlays.toString()}
          icon="▶️"
          trend="+15%"
          trendUp={true}
        />
        <StatsCard
          title="Total Earnings"
          value={`${parseFloat(formatEther(stats.totalEarnings)).toFixed(3)} STT`}
          icon="💎"
          trend="+5%"
          trendUp={true}
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pricing Stats */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Pricing Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Average Price</span>
              <span className="text-white font-medium">
                {parseFloat(formatEther(stats.averagePrice)).toFixed(3)} STT
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Highest Sale</span>
              <span className="text-green-400 font-medium">
                {parseFloat(formatEther(stats.highestSale)).toFixed(3)} STT
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Active Listings</span>
              <span className="text-blue-400 font-medium">{stats.totalListings.toString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Active Auctions</span>
              <span className="text-purple-400 font-medium">{stats.totalAuctions.toString()}</span>
            </div>
          </div>
        </div>

        {/* Social Stats */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Social Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Followers</span>
              <span className="text-white font-medium">{stats.followerCount.toString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Following</span>
              <span className="text-white font-medium">{stats.followingCount.toString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Engagement Rate</span>
              <span className="text-green-400 font-medium">
                {stats.followerCount > 0n
                  ? ((Number(stats.totalPlays) / Number(stats.followerCount)) * 100).toFixed(1)
                  : '0.0'}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Conversion Rate</span>
              <span className="text-purple-400 font-medium">
                {stats.totalTracks > 0n
                  ? ((Number(stats.totalSales) / Number(stats.totalTracks)) * 100).toFixed(1)
                  : '0.0'}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Performance Chart */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Monthly Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#8B5CF6"
                strokeWidth={2}
                name="Sales"
              />
              <Line
                type="monotone"
                dataKey="earnings"
                stroke="#EC4899"
                strokeWidth={2}
                name="Earnings (STT)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Genre Distribution */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Genre Distribution</h3>
          {genreData.length > 0 ? (
            <div className="flex items-center justify-between">
              <ResponsiveContainer width="60%" height={250}>
                <PieChart>
                  <Pie
                    data={genreData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    labelLine={false}
                  >
                    {genreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {genreData.map((genre, index) => (
                  <div key={genre.name} className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: genre.color }}
                    ></div>
                    <span className="text-gray-300 text-sm">
                      {genre.name} ({genre.value})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No genre data available yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AchievementBadge
            title="First Track"
            description="Created your first track"
            icon="🎵"
            unlocked={stats.totalTracks > 0n}
          />
          <AchievementBadge
            title="First Sale"
            description="Made your first sale"
            icon="💰"
            unlocked={stats.totalSales > 0n}
          />
          <AchievementBadge
            title="Popular Creator"
            description="Reached 100 followers"
            icon="⭐"
            unlocked={stats.followerCount >= 100n}
          />
          <AchievementBadge
            title="High Roller"
            description="Sold a track for 1+ STT"
            icon="💎"
            unlocked={stats.highestSale >= BigInt(1e18)}
          />
          <AchievementBadge
            title="Prolific Artist"
            description="Created 10+ tracks"
            icon="🎨"
            unlocked={stats.totalTracks >= 10n}
          />
          <AchievementBadge
            title="Market Master"
            description="Made 50+ sales"
            icon="🏆"
            unlocked={stats.totalSales >= 50n}
          />
        </div>
      </div>
    </div>
  );
};

// Stats Card Component
const StatsCard: React.FC<{
  title: string;
  value: string;
  icon: string;
  trend: string;
  trendUp: boolean;
}> = ({ title, value, icon, trend, trendUp }) => {
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl">{icon}</span>
        <span className={`text-sm ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
          {trend}
        </span>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-gray-400 text-sm">{title}</div>
    </div>
  );
};

// Achievement Badge Component
const AchievementBadge: React.FC<{
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}> = ({ title, description, icon, unlocked }) => {
  return (
    <div
      className={`p-4 rounded-lg border ${
        unlocked
          ? 'bg-purple-900 bg-opacity-30 border-purple-500'
          : 'bg-gray-700 border-gray-600'
      }`}
    >
      <div className="flex items-center mb-2">
        <span className={`text-2xl mr-3 ${unlocked ? '' : 'grayscale opacity-50'}`}>
          {icon}
        </span>
        <div>
          <h4 className={`font-medium ${unlocked ? 'text-purple-300' : 'text-gray-400'}`}>
            {title}
          </h4>
          {unlocked && <span className="text-xs text-green-400">✓ Unlocked</span>}
        </div>
      </div>
      <p className={`text-sm ${unlocked ? 'text-gray-300' : 'text-gray-500'}`}>
        {description}
      </p>
    </div>
  );
};

export default ProfileStats;