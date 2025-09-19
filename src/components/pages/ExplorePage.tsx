import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { GlassCard } from '@/components/ui/glass-card';
import { Search, Filter, Grid, List, Volume2, Play, Heart, Share2, Music, Eye, X, Clock, Calendar, Download, MoreHorizontal, Pause, Copy, Zap } from 'lucide-react';
import banner from '@/images/banner.png';
import { useGeneratedMusicContext } from '@/hooks/useGeneratedMusicContext';
import { useMusicPlayerContext } from '@/hooks/useMusicPlayerContext';

// Custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05);
  }
`;

const ExplorePage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [isDetailsPanelVisible, setIsDetailsPanelVisible] = useState(false);
  
  // Access generated music from context
  const { generatedMusic, userCompletedTaskIds, userTaskIds } = useGeneratedMusicContext();
  const { playSong, currentSong } = useMusicPlayerContext();

  // Filter to only show songs saved in smart contract (using userTaskIds only) and sort by newest first
  const contractSongs = generatedMusic.filter(song => 
    userTaskIds && userTaskIds.includes(song.taskId)
  ).sort((a, b) => {
    // Sort by creation date (newest first)
    const aDate = new Date(a.createdAt).getTime();
    const bDate = new Date(b.createdAt).getTime();

    // Handle invalid dates
    if (isNaN(aDate) && isNaN(bDate)) return 0;
    if (isNaN(aDate)) return 1;
    if (isNaN(bDate)) return -1;

    // Newest first: higher timestamp comes first
    return bDate - aDate;
  });

  const categories = ['All', 'Pop', 'Rock', 'Hip Hop', 'Electronic', 'Jazz', 'Classical', 'R&B', 'Country', 'Reggae', 'Folk'];

  // Handle song detail panel
  const handleSongClick = (song: any) => {
    setSelectedSong(song);
    setIsDetailsPanelVisible(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsPanelVisible(false);
    setSelectedSong(null);
  };

  const hotSongs = [
    { 
      id: 1, 
      title: 'Альт/Поп Попсока', 
      artist: 'Anton Ishutin',
      views: '1.4M',
      timeAgo: '1 year ago',
      image: '/placeholder.svg',
      color: 'from-red-500 to-pink-500'
    },
    { 
      id: 2, 
      title: 'Sentimental Williamson', 
      artist: 'Unknown Artist',
      views: '1M',
      timeAgo: '10 days ago',
      image: '/placeholder.svg',
      color: 'from-purple-500 to-blue-500'
    },
    { 
      id: 3, 
      title: 'Рис\nПо Корейски',
      artist: 'Cheon Parker Rd.',
      views: '1M',
      timeAgo: '2 years ago',
      image: '/placeholder.svg',
      color: 'from-orange-500 to-red-500'
    },
    { 
      id: 4, 
      title: 'Eleanor Pena',
      artist: 'Марат Пономарёва',
      views: '1M',
      timeAgo: '2 days ago',
      image: '/placeholder.svg',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      id: 5, 
      title: 'Sunny Wilson',
      artist: 'Jordan Copro',
      views: '1M',
      timeAgo: '1 month ago',
      image: '/placeholder.svg',
      color: 'from-teal-500 to-green-500'
    },
    { 
      id: 6, 
      title: 'Brooklyn Simmons',
      artist: 'Корвин',
      views: '1M',
      timeAgo: '4 days ago',
      image: '/placeholder.svg',
      color: 'from-purple-500 to-pink-500'
    },
    { 
      id: 7, 
      title: 'Aneta',
      artist: 'Sasha Dith',
      views: '2.1M',
      timeAgo: '3 months ago',
      image: '/placeholder.svg',
      color: 'from-pink-500 to-red-500'
    },
    { 
      id: 8, 
      title: 'Midnight Vibes',
      artist: 'DJ Synth',
      views: '3.2M',
      timeAgo: '1 week ago',
      image: '/placeholder.svg',
      color: 'from-indigo-500 to-purple-500'
    },
    { 
      id: 9, 
      title: 'Digital Dreams',
      artist: 'Neo Beats',
      views: '1.8M',
      timeAgo: '5 days ago',
      image: '/placeholder.svg',
      color: 'from-cyan-500 to-blue-500'
    },
    { 
      id: 10, 
      title: 'Cosmic Flow',
      artist: 'Space Walker',
      views: '2.5M',
      timeAgo: '2 weeks ago',
      image: '/placeholder.svg',
      color: 'from-violet-500 to-purple-500'
    },
    { 
      id: 11, 
      title: 'Neon Nights',
      artist: 'Electric Soul',
      views: '1.6M',
      timeAgo: '3 days ago',
      image: '/placeholder.svg',
      color: 'from-emerald-500 to-teal-500'
    },
    { 
      id: 12, 
      title: 'Future Bass Drop',
      artist: 'Bass Hunter',
      views: '4.1M',
      timeAgo: '1 day ago',
      image: '/placeholder.svg',
      color: 'from-yellow-500 to-orange-500'
    },
    { 
      id: 13, 
      title: 'Ambient Waves',
      artist: 'Ocean Sound',
      views: '987K',
      timeAgo: '6 days ago',
      image: '/placeholder.svg',
      color: 'from-blue-400 to-cyan-400'
    },
    { 
      id: 14, 
      title: 'Techno Revolution',
      artist: 'Beat Machine',
      views: '2.3M',
      timeAgo: '4 days ago',
      image: '/placeholder.svg',
      color: 'from-red-600 to-pink-600'
    },
    { 
      id: 15, 
      title: 'Chill Hop Sessions',
      artist: 'Lo-Fi Master',
      views: '1.2M',
      timeAgo: '1 week ago',
      image: '/placeholder.svg',
      color: 'from-green-500 to-emerald-500'
    },
    { 
      id: 16, 
      title: 'Synthwave Sunset',
      artist: 'Retro Synth',
      views: '3.7M',
      timeAgo: '2 days ago',
      image: '/placeholder.svg',
      color: 'from-purple-600 to-pink-600'
    },
    { 
      id: 17, 
      title: 'Deep House Groove',
      artist: 'House Nation',
      views: '1.9M',
      timeAgo: '5 days ago',
      image: '/placeholder.svg',
      color: 'from-indigo-600 to-blue-600'
    },
    { 
      id: 18, 
      title: 'Trap Kingdom',
      artist: 'Trap Lord',
      views: '2.8M',
      timeAgo: '3 days ago',
      image: '/placeholder.svg',
      color: 'from-gray-600 to-gray-800'
    },
    { 
      id: 19, 
      title: 'Jazz Fusion Modern',
      artist: 'Jazz Evolution',
      views: '1.5M',
      timeAgo: '1 week ago',
      image: '/placeholder.svg',
      color: 'from-amber-500 to-yellow-500'
    },
    { 
      id: 20, 
      title: 'Rock Anthem 2024',
      artist: 'Metal Core',
      views: '3.4M',
      timeAgo: '4 hours ago',
      image: '/placeholder.svg',
      color: 'from-slate-600 to-gray-700'
    },
    { 
      id: 21, 
      title: 'Pop Sensation',
      artist: 'Melody Queen',
      views: '5.2M',
      timeAgo: '6 hours ago',
      image: '/placeholder.svg',
      color: 'from-rose-500 to-pink-500'
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      {/* Hero Featured Collection */}
      <div className="relative h-[600px] overflow-hidden">
        <img 
          src={banner} 
          alt="Featured Collection" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent">
          {/* Collection Info */}
          <div className="absolute bottom-8 left-8 max-w-md">
            <div className="flex items-center gap-2 mb-4">
              <h1 className="text-4xl font-bold text-white">Hibeats Rock</h1>
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            </div>
            <p className="text-gray-300 mb-4">By HiBeats AI</p>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4 bg-black/50 backdrop-blur-sm rounded-lg p-4">
              <div>
                <div className="text-gray-400 text-xs uppercase tracking-wide">FLOOR PRICE</div>
                <div className="text-white font-bold">1 STT</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs uppercase tracking-wide">ITEMS</div>
                <div className="text-white font-bold">{contractSongs.length || 0}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs uppercase tracking-wide">TOTAL VOLUME</div>
                <div className="text-white font-bold">{contractSongs.length * 1} STT</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs uppercase tracking-wide">LISTED</div>
                <div className="text-white font-bold">100%</div>
              </div>
            </div>
          </div>
          
          {/* Thumbnail Grid - Show Generated Music Images */}
          <div className="absolute bottom-8 right-8 flex gap-4">
            {contractSongs.slice(0, 2).map((song, index) => (
              <div key={song.id} className="relative group cursor-pointer">
                <div className="relative w-24 h-24 rounded-xl shadow-lg overflow-hidden">
                  {/* Animated Border Progress */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 p-0.5 animate-pulse">
                    <div className="w-full h-full bg-black rounded-xl overflow-hidden">
                      {song.imageUrl ? (
                        <img 
                          src={song.imageUrl} 
                          alt={song.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                          <Music className="w-8 h-8 text-white/80" />
                        </div>
                      )}
                      <div className="hidden w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                        <Music className="w-8 h-8 text-white/80" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Indicator */}
                  <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                </div>
                
                {/* NFT Card Info Overlay */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm rounded-lg px-2 py-1 min-w-max opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-white text-xs font-medium truncate max-w-20">
                    {song.title}
                  </div>
                  <div className="text-green-400 text-xs">
                    1 STT
                  </div>
                </div>
              </div>
            ))}
            
            {/* Fallback thumbnails if less than 2 generated songs */}
            {Array.from({ length: Math.max(0, 2 - contractSongs.length) }).map((_, index) => (
              <div key={`fallback-${index}`} className="relative group cursor-pointer">
                <div className="relative w-24 h-24 rounded-xl shadow-lg overflow-hidden">
                  {/* Animated Border Progress */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-gray-500 via-gray-400 to-gray-600 p-0.5 animate-pulse">
                    <div className="w-full h-full bg-black rounded-xl overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                        <Music className="w-8 h-8 text-white/80" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Indicator */}
                  <div className="absolute top-1 right-1 w-3 h-3 bg-gray-400 rounded-full border-2 border-white shadow-sm"></div>
                </div>
                
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm rounded-lg px-2 py-1 min-w-max opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-white text-xs font-medium">
                    Coming Soon
                  </div>
                  <div className="text-green-400 text-xs">
                    1 STT
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Category Filters */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-wrap gap-3">
            {['All','Electronic', 'Hip Hop', 'Pop', 'Rock', 'Jazz', 'Classical'].map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-4 py-2 transition-all duration-300 ease-in-out ${
                  selectedCategory === category
                    ? 'bg-white text-black shadow-lg scale-105'
                    : 'text-gray-400 hover:text-white hover:bg-white/20 hover:shadow-md hover:scale-105 border border-transparent hover:border-white/30'
                }`}
              >
                {category}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Featured Collections */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Featured Collections</h2>
              <p className="text-gray-400">This week's curated collections</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-4 relative overflow-hidden h-48 shadow-lg">
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-bold mb-1">Electronic Beats</h3>
                <p className="text-white/80 text-sm">Floor price: 0.6595 ETH 6%</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-4 relative overflow-hidden h-48 shadow-lg">
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-bold mb-1">Hip Hop Chronicles</h3>
                <p className="text-white/80 text-sm">Floor price: 0.15 ETH 6%</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-4 relative overflow-hidden h-48 shadow-lg">
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-bold mb-1">Pop Sensations</h3>
                <p className="text-white/80 text-sm">Floor price: 0.0328 ETH -4.1%</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-600 to-gray-800 rounded-2xl p-4 relative overflow-hidden h-48 shadow-lg">
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-bold mb-1">Rock Legends</h3>
                <p className="text-white/80 text-sm">Floor price: 0.002 ETH -4.5%</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-4 relative overflow-hidden h-48 shadow-lg">
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-bold mb-1">Jazz Masters</h3>
                <p className="text-white/80 text-sm">Floor price: 0.0214 ETH -8.3%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hot Song Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-3xl font-bold text-white">Hot song</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {/* Generated Music First */}
            {contractSongs.slice(0, 2).map((song) => (
              <div key={song.id} className="group cursor-pointer" onClick={() => handleSongClick(song)}>
                <div className="relative aspect-square mb-3">
                  <div className="w-full h-full rounded-2xl relative overflow-hidden shadow-lg">
                    {/* Song image */}
                    {song.imageUrl ? (
                      <img 
                        src={song.imageUrl} 
                        alt={song.title}
                        className="w-full h-full object-cover rounded-2xl"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center rounded-2xl">
                        <Music className="w-16 h-16 text-white/80" />
                      </div>
                    )}
                    
                    {/* Fallback gradient background */}
                    <div className="hidden w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center rounded-2xl">
                      <Music className="w-16 h-16 text-white/80" />
                    </div>
                    
                    {/* Play button overlay */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                      <Button 
                        size="sm" 
                        className="rounded-full w-12 h-12 bg-white/20 hover:bg-white/30 border-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          playSong(song, contractSongs);
                          setCurrentPlaying(song.id);
                        }}
                      >
                        {currentSong?.id === song.id ? (
                          <Volume2 className="w-4 h-4 text-white" />
                        ) : (
                          <Play className="w-4 h-4 text-white" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-white font-medium text-sm leading-tight overflow-hidden" 
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                      {song.title}
                    </h3>
                    <p className="text-gray-400 text-xs">{song.artist}</p>
                    
                    {/* Price and Buy Button */}
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <div className="flex flex-col">
                        <span className="text-green-400 font-medium text-sm">1  STT</span>
                        <span className="text-gray-500 text-xs">~$2.50</span>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 h-6 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle buy logic here
                        }}
                      >
                        Buy Now
                      </Button>
                    </div>
                    
                    {/* Stats */}
                    <div className="flex items-center gap-3 text-gray-500 text-xs mt-1">
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        <span>{Math.floor(Math.random() * 50) + 10}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{Math.floor(Math.random() * 1000) + 100}</span>
                      </div>
                      <span>{new Date(song.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Regular Hot Songs */}
            {hotSongs.slice(0, 5).map((song) => (
              <div key={song.id} className="group cursor-pointer" onClick={() => handleSongClick(song)}>
                <div className="relative aspect-square mb-3">
                  <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${song.color} p-4 flex items-center justify-center relative overflow-hidden shadow-lg`}>
                    {/* Waveform/Audio visualization placeholder */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 border-2 border-white/30 rounded-xl flex items-center justify-center">
                        <div className="w-8 h-8 bg-white/20 rounded-lg"></div>
                      </div>
                    </div>
                    
                    {/* Play button overlay */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                      <Button 
                        size="sm" 
                        className="rounded-full w-12 h-12 bg-white/20 hover:bg-white/30 border-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle play for hot songs
                        }}
                      >
                        <Play className="w-4 h-4 text-white" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-white font-medium text-sm leading-tight overflow-hidden" 
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                      {song.title}
                    </h3>
                    <p className="text-gray-400 text-xs">{song.artist}</p>
                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                      <span>{song.views} viewers</span>
                      <span>•</span>
                      <span>{song.timeAgo}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Music NFT Learn Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-3xl font-bold text-white">Music NFT 101</h2>
          </div>
          <p className="text-gray-400 mb-6">Learn about Music NFTs, Web3, and more.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 relative overflow-hidden h-48 shadow-lg group cursor-pointer hover:scale-105 transition-transform">
              <div className="absolute top-4 left-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">🎵</span>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-bold text-lg mb-2">What is a Music NFT?</h3>
                <p className="text-white/80 text-sm">Learn the basics of music NFTs and how they work</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-6 relative overflow-hidden h-48 shadow-lg group cursor-pointer hover:scale-105 transition-transform">
              <div className="absolute top-4 left-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-bold text-lg mb-2">How to buy a Music NFT</h3>
                <p className="text-white/80 text-sm">Step-by-step guide to purchasing music NFTs</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl p-6 relative overflow-hidden h-48 shadow-lg group cursor-pointer hover:scale-105 transition-transform">
              <div className="absolute top-4 left-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">🎤</span>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-bold text-lg mb-2">What is minting?</h3>
                <p className="text-white/80 text-sm">Learn how to create and mint your own music NFTs</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 relative overflow-hidden h-48 shadow-lg group cursor-pointer hover:scale-105 transition-transform">
              <div className="absolute top-4 left-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">🛡️</span>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-bold text-lg mb-2">How to stay protected in web3</h3>
                <p className="text-white/80 text-sm">Security tips for music NFT collectors</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-6 relative overflow-hidden h-48 shadow-lg group cursor-pointer hover:scale-105 transition-transform">
              <div className="absolute top-4 left-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">🎨</span>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-bold text-lg mb-2">How to create a Music NFT</h3>
                <p className="text-white/80 text-sm">Complete guide to creating music NFTs on HiBeats</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative mt-20">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-900/30 to-green-900/50"></div>
        
        {/* Back to Top Button */}
        <div className="relative z-10 flex justify-center pt-16 pb-8">
          <Button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full flex items-center gap-2"
          >
            back to top ↑
          </Button>
        </div>
        
        {/* HiBeats Logo */}
        <div className="relative z-10 text-center pb-20">
          <h1 className="text-[10rem] md:text-[14rem] lg:text-[18rem] font-bold text-green-300/30 leading-none">
            hibeats
          </h1>
        </div>
      </footer>

      {/* Song Detail Panel */}
      {isDetailsPanelVisible && selectedSong && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-16 p-4 overflow-auto custom-scrollbar">
          <div className="w-full max-w-4xl max-h-[85vh] overflow-hidden">
            <GlassCard className="h-full flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-semibold text-white">{selectedSong.title}</h2>
                  {selectedSong.metadata?.genre && (
                    <Badge className="text-xs border border-green-400 text-green-400 bg-green-400/10">
                      {selectedSong.metadata.genre}
                    </Badge>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCloseDetails}
                  className="text-white/70 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden flex min-h-0">
                {/* Left Panel - Song Display */}
                <div className="w-1/2 p-3 flex flex-col">
                  {/* Song Image */}
                  <div className="relative aspect-square rounded-lg overflow-hidden mb-2 group max-w-xs mx-auto">
                    <div className={`w-full h-full bg-gradient-to-br ${selectedSong.color || 'from-purple-600 to-pink-600'} flex items-center justify-center relative`}>
                      {selectedSong.imageUrl ? (
                        <img 
                          src={selectedSong.imageUrl} 
                          alt={selectedSong.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-black/20 flex items-center justify-center">
                          <Volume2 className="w-16 h-16 text-white/60" />
                        </div>
                      )}
                      
                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="lg"
                          onClick={() => {
                            if (selectedSong.audioUrl || selectedSong.id) {
                              playSong(selectedSong, contractSongs);
                              setCurrentPlaying(selectedSong.id);
                            }
                          }}
                          className="w-16 h-16 p-0 rounded-full bg-green-600/80 hover:bg-green-600 text-white"
                        >
                          {currentSong?.id === selectedSong.id ? (
                            <Pause className="w-8 h-8" />
                          ) : (
                            <Play className="w-8 h-8 ml-1" />
                          )}
                        </Button>
                      </div>

                      {/* Collection Badge */}
                      <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium bg-black/50 text-white border border-white/20">
                        HiBeats Music
                      </div>

                      {/* ID */}
                      <div className="absolute bottom-2 left-2 text-white/80 text-xs font-mono">
                        #{selectedSong.id}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 mt-4">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium text-xs py-1.5">
                      Buy for 1 STT
                    </Button>
                    <Button variant="ghost" className="text-white/70 hover:text-white border border-white/20 p-1.5">
                      <Heart className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" className="text-white/70 hover:text-white border border-white/20 p-1.5">
                      <Share2 className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" className="text-white/70 hover:text-white border border-white/20 p-1.5">
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Comment Area */}
                  <div className="mt-4 bg-white/5 rounded-lg p-3">
                    <h4 className="text-white font-medium text-xs mb-2">Comments</h4>
                    
                    {/* Comment Input */}
                    <div className="flex items-start space-x-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-medium">U</span>
                      </div>
                      <div className="flex-1">
                        <textarea
                          placeholder="Add a comment..."
                          className="w-full bg-white/5 border border-white/10 rounded text-white text-xs p-2 placeholder-white/50 resize-none h-16 focus:outline-none focus:border-green-400/50"
                        />
                        <div className="flex justify-end mt-1">
                          <Button size="sm" className="bg-green-600/80 hover:bg-green-600 text-white text-xs px-3 py-1">
                            Post
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Sample Comments */}
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-medium">M</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-1 mb-1">
                            <span className="text-white text-xs font-medium">MusicLover.som</span>
                            <span className="text-white/50 text-xs">2h ago</span>
                          </div>
                          <p className="text-white/80 text-xs">Amazing track! The AI composition is incredible. 🎵</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-medium">C</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-1 mb-1">
                            <span className="text-white text-xs font-medium">Collector.som</span>
                            <span className="text-white/50 text-xs">5h ago</span>
                          </div>
                          <p className="text-white/80 text-xs">Just bought this NFT. Great addition to my collection!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel - Song Info */}
                <div className="w-1/2 border-l border-white/10 overflow-y-auto custom-scrollbar">
                  {/* Artist Info */}
                  <div className="p-3 border-b border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                          <Music className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-medium text-xs">{selectedSong.artist || 'AI Artist'}</p>
                          <p className="text-white/60 text-xs">Creator</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-green-400 border border-green-400/20 hover:bg-green-400/10 text-xs px-2 py-1">
                        Follow
                      </Button>
                    </div>
                  </div>

                  {/* Song Details */}
                  <div className="p-3 space-y-3">
                    {/* Description */}
                    <div>
                      <h3 className="text-white font-medium mb-1 text-xs">Description</h3>
                      <p className="text-white/70 text-xs leading-relaxed">
                        {selectedSong.metadata?.description || selectedSong.description || 'No description available for this music NFT.'}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="flex items-center space-x-1 text-white/60 mb-1">
                          <Eye className="w-3 h-3" />
                          <span className="text-xs">Views</span>
                        </div>
                        <p className="text-white font-medium text-xs">
                          {selectedSong.views || `${Math.floor(Math.random() * 1000) + 100}`}
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="flex items-center space-x-1 text-white/60 mb-1">
                          <Calendar className="w-3 h-3" />
                          <span className="text-xs">Created</span>
                        </div>
                        <p className="text-white font-medium text-xs">
                          {selectedSong.createdAt 
                            ? new Date(selectedSong.createdAt).toLocaleDateString() 
                            : selectedSong.timeAgo || 'Recently'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Tags */}
                    {selectedSong.metadata?.tags && selectedSong.metadata.tags.length > 0 && (
                      <div>
                        <h3 className="text-white font-medium mb-1 text-xs">Tags</h3>
                        <div className="flex flex-wrap gap-1">
                          {selectedSong.metadata.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="outline" className="border-gray-600 text-gray-300 bg-white/5 text-xs px-1.5 py-0.5">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Price History */}
                    <div>
                      <h3 className="text-white font-medium mb-1 text-xs">Price History</h3>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center py-1.5 px-2 bg-white/5 rounded-lg">
                          <span className="text-white/70 text-xs">Current Price</span>
                          <span className="text-green-400 font-medium text-xs">1 STT (~$2.50)</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 px-2 bg-white/5 rounded-lg">
                          <span className="text-white/70 text-xs">Last Sale</span>
                          <span className="text-white/70 text-xs">0.8 STT</span>
                        </div>
                      </div>
                    </div>

                    {/* NFT Details */}
                    <div>
                      <h3 className="text-white font-medium mb-2 text-xs">Details</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-xs">Contract Address</span>
                          <div className="flex items-center space-x-1">
                            <span className="text-white text-xs font-mono">0x1a2...b5c8</span>
                            <Button variant="ghost" size="sm" className="w-3 h-3 p-0 text-white/70 hover:text-white">
                              <Copy className="w-2.5 h-2.5" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-xs">Token Standard</span>
                          <span className="text-white text-xs">ERC721</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-xs">Owner</span>
                          <div className="flex items-center space-x-1">
                            <span className="text-white text-xs font-mono">0x9f3...a4d2</span>
                            <Button variant="ghost" size="sm" className="w-3 h-3 p-0 text-white/70 hover:text-white">
                              <Copy className="w-2.5 h-2.5" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-xs">Chain</span>
                          <div className="flex items-center space-x-1">
                            <span className="text-white text-xs">Somnia</span>
                            <Badge className="text-xs border border-green-400 text-green-400 bg-green-400/10">
                              Testnet
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-xs">Royalty</span>
                          <span className="text-white text-xs">10%</span>
                        </div>
                      </div>
                    </div>

                    {/* Activity */}
                    <div>
                      <h3 className="text-white font-medium mb-2 text-xs">Activity</h3>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between py-1.5 px-2 bg-white/5 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                              <Zap className="w-2.5 h-2.5 text-green-400" />
                            </div>
                            <div>
                              <div className="text-white text-xs font-medium">Minted</div>
                              <div className="text-white/60 text-xs">2 hours ago</div>
                            </div>
                          </div>
                          <div className="text-white text-xs">1 STT</div>
                        </div>
                        
                        <div className="flex items-center justify-between py-1.5 px-2 bg-white/5 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center">
                              <Eye className="w-2.5 h-2.5 text-blue-400" />
                            </div>
                            <div>
                              <div className="text-white text-xs font-medium">Listed</div>
                              <div className="text-white/60 text-xs">1 hour ago</div>
                            </div>
                          </div>
                          <div className="text-white text-xs">1 STT</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
};

export { ExplorePage };
