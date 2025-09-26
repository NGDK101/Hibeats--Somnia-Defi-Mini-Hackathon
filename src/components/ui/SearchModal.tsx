import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, X, TrendingUp, Clock, Music, User, Filter, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useActiveListings } from '@/hooks/useActiveListings';
import { useProfile } from '@/hooks/useProfile';
import { MetadataStrategy } from '@/utils/MetadataStrategy';
import { useAccount } from 'wagmi';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import defaultAvatar from '@/images/assets/defaultprofile.gif';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

interface SearchResult {
  id: string;
  type: 'track' | 'creator';
  title: string;
  subtitle: string;
  imageUrl?: string;
  genre?: string;
  price?: string;
  creator?: string;
  verified?: boolean;
  path: string;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('hibeats_search_history') || '[]');
    } catch {
      return [];
    }
  });

  const navigate = useNavigate();
  const { address } = useAccount();
  const { allActiveListings } = useActiveListings();
  const { followUser } = useProfile();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Initialize MetadataStrategy
  const metadataStrategyRef = useRef<MetadataStrategy>();
  if (!metadataStrategyRef.current) {
    metadataStrategyRef.current = new MetadataStrategy();
  }

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (isOpen) {
      setQuery(initialQuery);
    }
  }, [isOpen, initialQuery]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [debouncedQuery]);

  // Search results
  const searchResults = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      return [];
    }

    const results: SearchResult[] = [];
    const lowerQuery = debouncedQuery.toLowerCase();

    // Search in tracks
    const relevantTracks = allActiveListings
      .filter(track => {
        const searchText = [
          track.title || '',
          track.genre || '',
          track.seller || '',
          track.id || ''
        ].join(' ').toLowerCase();
        return searchText.includes(lowerQuery);
      })
      .slice(0, 6);

    relevantTracks.forEach(track => {
      results.push({
        id: track.id,
        type: 'track',
        title: track.title || `Track #${track.tokenId}`,
        subtitle: `${track.genre || 'Music'} • ${track.priceInETH || '1'} STT`,
        imageUrl: track.imageUrl,
        genre: track.genre,
        price: track.priceInETH,
        creator: track.seller,
        path: `/explore?search=${encodeURIComponent(track.title || track.id)}`
      });
    });

    // Search in popular creators
    const relevantCreators = popularCreators
      .filter(creator =>
        creator.name.toLowerCase().includes(lowerQuery) ||
        creator.address.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 3);

    relevantCreators.forEach(creator => {
      results.push({
        id: creator.address,
        type: 'creator',
        title: creator.name,
        subtitle: `${creator.address.slice(0, 6)}...${creator.address.slice(-4)}`,
        verified: creator.verified,
        path: `/creator/${creator.address}`
      });
    });

    return results.slice(0, 8); // Limit total results
  }, [debouncedQuery, allActiveListings]);

  // Handle search submission
  const handleSearch = useCallback((searchQuery: string, resultPath?: string) => {
    if (!searchQuery.trim()) return;

    // Add to search history
    const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem('hibeats_search_history', JSON.stringify(newHistory));

    // Navigate to result or explore page
    if (resultPath) {
      navigate(resultPath);
    } else {
      navigate(`/explore?search=${encodeURIComponent(searchQuery)}`);
    }

    onClose();
  }, [navigate, onClose, searchHistory]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < searchResults.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && searchResults[selectedIndex]) {
            const result = searchResults[selectedIndex];
            handleSearch(result.title, result.path);
          } else {
            handleSearch(query);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, selectedIndex, searchResults, handleSearch, query]);

  // Mock trending searches and popular creators
  const trendingSearches = [
    'electronic music',
    'hip hop beats',
    'ai generated',
    'remix tracks',
    'chill vibes'
  ];

  const popularCreators = [
    { address: '0xFc8Cb8fc33e6120e48A1d6cD15DAb5B0c3d9101a', name: 'edisonalpha', verified: true },
    { address: '0x1234567890123456789012345678901234567890', name: 'BeatMaster', verified: false },
    { address: '0x9876543210987654321098765432109876543210', name: 'SoundWave', verified: true },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-16 p-4">
      <div className="w-full max-w-2xl bg-gray-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center p-4 border-b border-white/10">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tracks, creators, genres..."
            className="flex-1 bg-transparent border-none text-white placeholder-gray-400 focus:ring-0 text-lg"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSearch(query);
              }
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white ml-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search Content */}
        <div className="max-h-96 overflow-y-auto" ref={resultsRef}>
          {/* Search Results */}
          {debouncedQuery && searchResults.length > 0 && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                  Results ({searchResults.length})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSearch(query)}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  View all <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>

              <div className="space-y-2">
                {searchResults.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => handleSearch(result.title, result.path)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                      selectedIndex === index
                        ? 'bg-white/10 border border-white/20'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    {/* Result Icon/Image */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                      {result.type === 'track' && result.imageUrl ? (
                        <ImageWithFallback
                          src={result.imageUrl}
                          alt={result.title}
                          className="w-full h-full object-cover"
                          fallbackSrc="/default-music-cover.jpg"
                        />
                      ) : result.type === 'creator' ? (
                        <img
                          src={defaultAvatar}
                          alt={result.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                          {result.type === 'track' ? (
                            <Music className="w-5 h-5 text-white" />
                          ) : (
                            <User className="w-5 h-5 text-white" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Result Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-white truncate">
                          {result.title}
                        </h4>
                        {result.verified && (
                          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                        {result.type === 'track' && result.genre && (
                          <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
                            {result.genre}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 truncate">
                        {result.subtitle}
                      </p>
                    </div>

                    {/* Result Type Icon */}
                    <div className="text-gray-500">
                      {result.type === 'track' ? (
                        <Music className="w-4 h-4" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {debouncedQuery && searchResults.length === 0 && (
            <div className="p-8 text-center">
              <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <h3 className="text-white font-medium mb-1">No results found</h3>
              <p className="text-gray-400 text-sm mb-4">
                Try searching for different keywords or check your spelling.
              </p>
              <Button
                onClick={() => handleSearch(query)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Search on Explore page
              </Button>
            </div>
          )}

          {/* Default State - Trending & History */}
          {!debouncedQuery && (
            <div className="p-4 space-y-6">
              {/* Search History */}
              {searchHistory.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                      Recent Searches
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {searchHistory.map((term, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearch(term)}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 text-left"
                      >
                        <span className="text-white">{term}</span>
                        <ArrowRight className="w-4 h-4 text-gray-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Searches */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                    Trending Searches
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trendingSearches.map((term, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(term)}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm text-white transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Popular Creators */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                    Popular Creators
                  </h3>
                </div>
                <div className="space-y-2">
                  {popularCreators.map((creator) => (
                    <button
                      key={creator.address}
                      onClick={() => navigate(`/creator/${creator.address}`)}
                      className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 text-left"
                    >
                      <img
                        src={defaultAvatar}
                        alt={creator.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-1">
                          <span className="text-white font-medium">{creator.name}</span>
                          {creator.verified && (
                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          {creator.address.slice(0, 6)}...{creator.address.slice(-4)}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-500" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-3 bg-white/5">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <kbd className="px-2 py-1 bg-white/10 rounded text-xs">↑↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="px-2 py-1 bg-white/10 rounded text-xs">⏎</kbd>
                <span>Select</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="px-2 py-1 bg-white/10 rounded text-xs">Esc</kbd>
                <span>Close</span>
              </div>
            </div>
            <div className="text-blue-400">
              Powered by HiBeats
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

