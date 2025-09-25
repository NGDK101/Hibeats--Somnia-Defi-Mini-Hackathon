import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Play,
  Share2,
  UserPlus,
  UserMinus,
  MoreHorizontal,
  Calendar,
  Eye,
  Heart,
  Clock,
  Music,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { useCreators } from '@/hooks/useCreators';
import { useNFTOperations } from '@/hooks/useNFTOperations';
import { useActiveListings } from '@/hooks/useActiveListings';
import { useSocial } from '@/hooks/useSocial';
import { useMusicPlayerContext } from '@/hooks/useMusicPlayerContext';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESSES, HIBEATS_PROFILE_ABI, HIBEATS_NFT_ABI } from '@/contracts';
// HiBeatsMarketplaceAdvancedABI removed - using unified HIBEATS_PROFILE_ABI
import { toast } from 'sonner';
import defaultAvatar from '@/images/assets/defaultprofile.gif';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { TrackCard } from '@/components/music/TrackCard';
import { ipfsToGatewayUrl } from '@/utils/ipfsGatewayHelper';


const CreatorDetailPage: React.FC = () => {
  const { creatorAddress } = useParams<{ creatorAddress: string }>();
  const navigate = useNavigate();
  const { address } = useAccount();

  // Hooks for data
  const { featuredCreators, isLoading } = useCreators();
  const { allTracks } = useNFTOperations();
  const { allActiveListings, refetch: refetchActiveListings } = useActiveListings();
  const { followUser, unfollowUser, getFollowingStatus } = useSocial();
  const { playSong } = useMusicPlayerContext();
  const { writeContract } = useWriteContract();

  // Get Creator Profile from HiBeatsProfile (Unified)
  const { data: marketplaceCreatorData, isLoading: isLoadingProfile, refetch: refetchCreatorProfile } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_PROFILE,
    abi: HIBEATS_PROFILE_ABI,
    functionName: 'getCreatorProfile',
    args: creatorAddress ? [creatorAddress] : undefined,
    query: {
      enabled: !!creatorAddress,
    },
  });

  // Extract profile and stats from marketplace
  const creatorProfile = marketplaceCreatorData?.[0]; // CreatorProfile
  const creatorStats = marketplaceCreatorData?.[1];   // CreatorStats
  const profileExists = creatorProfile && creatorProfile.isActive;

  // Read creator's NFT library
  const { data: creatorNFTs, isLoading: isLoadingNFTs } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_NFT,
    abi: HIBEATS_NFT_ABI,
    functionName: 'getUserLibraryWithMetadata',
    args: creatorAddress ? [creatorAddress] : undefined,
    query: {
      enabled: !!creatorAddress,
    },
  });

  // Read individual token URIs for each NFT
  const [individualTokenData, setIndividualTokenData] = useState<Map<string, any>>(new Map());

  // Read creator's NFT count
  const { data: creatorNFTCount } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_NFT,
    abi: HIBEATS_NFT_ABI,
    functionName: 'getUserLibraryCount',
    args: creatorAddress ? [creatorAddress] : undefined,
    query: {
      enabled: !!creatorAddress,
    },
  });

  // Backup: Read using balanceOf
  const { data: creatorBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_NFT,
    abi: HIBEATS_NFT_ABI,
    functionName: 'balanceOf',
    args: creatorAddress ? [creatorAddress] : undefined,
    query: {
      enabled: !!creatorAddress,
    },
  });

  // Check if user is following this creator from smart contract
  const { data: isFollowingFromContract, refetch: refetchFollowStatus } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_PROFILE,
    abi: HIBEATS_PROFILE_ABI,
    functionName: 'isFollowing',
    args: address && creatorAddress ? [address, creatorAddress] : undefined,
    query: {
      enabled: !!address && !!creatorAddress && address.toLowerCase() !== creatorAddress.toLowerCase(),
    },
  });

  // Local state
  const [selectedTab, setSelectedTab] = useState<'latest' | 'oldest' | 'popular'>('latest');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);
  const [tracksMetadata, setTracksMetadata] = useState<Map<string, any>>(new Map());

  // Calculate actual track count from multiple sources
  const nftCountFromContract = Number(creatorNFTCount || 0);
  const balanceFromContract = Number(creatorBalance || 0);
  const nftArrayLength = creatorNFTs?.length || 0;
  const tracksFromAllTracksCount = allTracks?.filter(track => track.creator?.toLowerCase() === creatorAddress?.toLowerCase())?.length || 0;
  const listingsFromCreatorCount = allActiveListings?.filter(listing => listing.seller?.toLowerCase() === creatorAddress?.toLowerCase())?.length || 0;

  const actualTrackCount = Math.max(
    nftCountFromContract,
    balanceFromContract,
    nftArrayLength,
    tracksFromAllTracksCount,
    listingsFromCreatorCount
  );

  // Helper to process IPFS URL
  const processIPFSUrl = (url: string) => {
    if (!url || url.trim() === '') return '';
    // If already a gateway URL, return as is
    if (url.startsWith('http')) return url;
    // Convert ipfs:// to gateway URL
    return ipfsToGatewayUrl(url, 0);
  };

  // Build creator object from Marketplace Advanced data
  const creator = creatorProfile ? {
    address: creatorAddress,
    username: creatorProfile.username || '',
    displayName: creatorProfile.displayName || '',
    bio: creatorProfile.bio || '',
    avatar: processIPFSUrl(creatorProfile.profileImageUrl || ''),
    coverImage: processIPFSUrl(creatorProfile.bannerImageUrl || ''),
    website: creatorProfile.website || '',
    twitter: creatorProfile.twitter || '',
    instagram: creatorProfile.instagram || '',
    spotify: creatorProfile.spotify || '',
    isVerified: creatorProfile.isVerified || false,
    isActive: creatorProfile.isActive || false,
    followerCount: Number(creatorProfile.followerCount || 0),
    followingCount: Number(creatorProfile.followingCount || 0),
    trackCount: Number(creatorStats?.totalTracks || actualTrackCount),
    totalPlays: Number(creatorStats?.totalPlays || 0),
    totalEarnings: Number(creatorStats?.totalEarnings || 0),
    totalSales: Number(creatorStats?.totalSales || 0),
    totalListings: Number(creatorStats?.totalListings || 0),
    averagePrice: Number(creatorStats?.averagePrice || 0),
    highestSale: Number(creatorStats?.highestSale || 0),
    topGenres: creatorStats?.topGenres || [],
    genreCounts: creatorStats?.genreCounts || [],
    joinedAt: Number(creatorProfile.joinedAt || 0),
  } : featuredCreators.find(c => c.address === creatorAddress);

  // Get creator's tracks from multiple sources
  let nftsFromContract = [];

  // Process getUserLibraryWithMetadata result properly
  if (creatorNFTs && Array.isArray(creatorNFTs) && creatorNFTs.length === 2) {
    const [tokenIds, trackInfos] = creatorNFTs;

    if (Array.isArray(tokenIds) && Array.isArray(trackInfos)) {
      nftsFromContract = tokenIds.map((tokenId, index) => {
        const trackInfo = trackInfos[index];
        return {
          tokenId: Number(tokenId),
          id: Number(tokenId),
          // Include the TrackInfo data directly
          aiTrackId: trackInfo?.aiTrackId || '',
          taskId: trackInfo?.taskId || '',
          genre: trackInfo?.genre || '',
          duration: trackInfo?.duration ? Number(trackInfo.duration) : 0,
          creator: trackInfo?.creator || creatorAddress,
          createdAt: trackInfo?.createdAt ? Number(trackInfo.createdAt) : 0,
          modelUsed: trackInfo?.modelUsed || '',
          isRemixable: trackInfo?.isRemixable || false,
          royaltyRate: trackInfo?.royaltyRate ? Number(trackInfo.royaltyRate) : 0,
          prompt: trackInfo?.prompt || '',
          tags: trackInfo?.tags || '',
          aiCreatedAt: trackInfo?.aiCreatedAt ? Number(trackInfo.aiCreatedAt) : 0,
          // Provide meaningful track name from TrackInfo
          title: trackInfo?.aiTrackId || `${trackInfo?.genre || 'Unknown'} Track #${tokenId}`,
          name: trackInfo?.aiTrackId || `${trackInfo?.genre || 'Unknown'} Track #${tokenId}`,
        };
      });
    }
  }

  const listingsFromContract = allActiveListings.filter(listing => listing.seller?.toLowerCase() === creatorAddress?.toLowerCase());
  const tracksFromAllTracks = Array.isArray(allTracks) ? allTracks.filter(track => track.creator?.toLowerCase() === creatorAddress?.toLowerCase()) : [];


  const creatorTracks = [
    // Creator's own NFTs from smart contract (with proper TrackInfo data)
    ...nftsFromContract,
    // Creator's active listings
    ...listingsFromContract,
    // Fallback: filter from all tracks
    ...tracksFromAllTracks
  ].filter((track, index, array) => {
    // Remove duplicates based on tokenId or id
    const trackId = track.tokenId || track.id;
    const isDuplicate = array.findIndex(t => (t.tokenId || t.id) === trackId) !== index;
    if (isDuplicate) {
    }
    return !isDuplicate;
  });


  // Update follow status from smart contract
  useEffect(() => {
    if (isFollowingFromContract !== undefined) {
      setIsFollowing(!!isFollowingFromContract);
    }
  }, [isFollowingFromContract]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!creatorAddress) return;

      // Refetch active listings to ensure we have latest data
      if (refetchActiveListings) {
        await refetchActiveListings();
      }
    };

    loadData();
  }, [creatorAddress, refetchActiveListings]);

  // Handle follow/unfollow using Marketplace Advanced
  const handleFollow = useCallback(async () => {

    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!creatorAddress) {
      toast.error('Invalid creator address');
      return;
    }

    if (address.toLowerCase() === creatorAddress.toLowerCase()) {
      toast.error('Cannot follow yourself');
      return;
    }

    setIsLoadingFollow(true);
    try {
      if (isFollowing) {
        await writeContract({
          address: CONTRACT_ADDRESSES.HIBEATS_PROFILE,
          abi: HIBEATS_PROFILE_ABI,
          functionName: 'unfollowCreator',
          args: [creatorAddress],
        });
        setIsFollowing(false);
        toast.success('Unfollowed successfully');
        refetchCreatorProfile();
        refetchFollowStatus();
      } else {
        await writeContract({
          address: CONTRACT_ADDRESSES.HIBEATS_PROFILE,
          abi: HIBEATS_PROFILE_ABI,
          functionName: 'followCreator',
          args: [creatorAddress],
        });
        setIsFollowing(true);
        toast.success('Following successfully');
        refetchCreatorProfile();
        refetchFollowStatus();
      }
    } catch (error) {
      console.error('❌ Follow action failed:', error);
      toast.error(`Failed to ${isFollowing ? 'unfollow' : 'follow'}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingFollow(false);
    }
  }, [address, creatorAddress, isFollowing, writeContract, refetchCreatorProfile]);

  // Handle track play
  const handleTrackPlay = useCallback((track: any) => {
    try {
      playSong(track, creatorTracks);
      toast.success(`Playing ${track.title || track.name || 'track'}`);
    } catch (error) {
      console.error('Error playing track:', error);
      toast.error('Failed to play track');
    }
  }, [playSong, creatorTracks]);

  // Function to validate if URI is a valid IPFS hash
  const isValidIPFSHash = (uri: string): boolean => {
    if (!uri) return false;

    // Check for ipfs:// protocol
    if (uri.startsWith('ipfs://')) {
      const hash = uri.replace('ipfs://', '');
      return hash.length >= 46; // IPFS hash should be at least 46 characters
    }

    // Check for direct hash (should start with Qm or baf)
    if (uri.match(/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[0-9a-z]+)$/)) {
      return true;
    }

    // Check for HTTP IPFS gateway URLs
    if (uri.includes('ipfs.io/ipfs/') || uri.includes('gateway.pinata.cloud/ipfs/') || uri.includes('ipfs://')) {
      return true;
    }

    return false;
  };

  // Multi-gateway IPFS fetch
  const fetchFromIPFSWithFallback = async (ipfsUrl: string): Promise<any> => {
    const IPFS_GATEWAYS = [
      'https://gateway.pinata.cloud/ipfs/',
      'https://ipfs.io/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
      'https://dweb.link/ipfs/',
      'https://nftstorage.link/ipfs/'
    ];

    let ipfsHash = ipfsUrl.replace(/^ipfs:\/\//, '');
    const hashMatch = ipfsHash.match(/Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[A-Za-z2-7]{58,}/);
    const cleanHash = hashMatch ? hashMatch[0] : ipfsHash;

    for (let i = 0; i < IPFS_GATEWAYS.length; i++) {
      try {
        const gatewayUrl = `${IPFS_GATEWAYS[i]}${cleanHash}`;

        const response = await fetch(gatewayUrl, {
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          return data;
        }
      } catch (err) {
        console.warn(`❌ Gateway ${i + 1} failed:`, err);
        continue;
      }
    }

    throw new Error('All IPFS gateways failed');
  };

  // Function to fetch metadata from IPFS
  const fetchMetadata = useCallback(async (metadataURI: string, trackId: string) => {
    if (!metadataURI || tracksMetadata.has(trackId)) return;

    // Check if URI is valid IPFS hash
    if (!isValidIPFSHash(metadataURI)) {
      console.warn(`⚠️ Invalid IPFS URI for track ${trackId}:`, metadataURI);

      // Create fallback metadata based on track ID
      const fallbackMetadata = {
        name: `Track #${trackId}`,
        description: `Music NFT #${trackId}`,
        image: '/api/placeholder/300/200',
        external_url: '',
        attributes: [
          { trait_type: "Type", value: "Music NFT" },
          { trait_type: "ID", value: trackId }
        ]
      };

      setTracksMetadata(prev => new Map(prev).set(trackId, fallbackMetadata));
      return;
    }

    try {

      // Use multi-gateway fallback
      const metadata = await fetchFromIPFSWithFallback(metadataURI);

      // Handle image URLs in metadata
      if (metadata.image && metadata.image.startsWith('ipfs://')) {
        metadata.image = metadata.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
      }

      setTracksMetadata(prev => new Map(prev).set(trackId, metadata));
    } catch (error) {
      console.error(`❌ Error fetching metadata for track ${trackId}, using fallback:`, error);

      // Create fallback metadata for errors
      const fallbackMetadata = {
        name: `Track #${trackId}`,
        description: `Music NFT #${trackId}`,
        image: '/api/placeholder/300/200',
        external_url: '',
        attributes: [
          { trait_type: "Type", value: "Music NFT" },
          { trait_type: "ID", value: trackId }
        ]
      };

      setTracksMetadata(prev => new Map(prev).set(trackId, fallbackMetadata));
    }
  }, [tracksMetadata]);

  // Function to enhance creator tracks with proper metadata from smart contract
  const enhanceTracksWithMetadata = useCallback(() => {
    if (!creatorNFTs || !Array.isArray(creatorNFTs) || creatorNFTs.length < 2) return;

    const [tokenIds, trackInfos] = creatorNFTs;


    if (Array.isArray(tokenIds) && Array.isArray(trackInfos)) {
      tokenIds.forEach((tokenId, index) => {
        const trackInfo = trackInfos[index];
        if (trackInfo && tokenId) {

          // Create enhanced metadata from TrackInfo
          const enhancedMetadata = {
            name: trackInfo.aiTrackId || `AI Track ${tokenId}`,
            description: `${trackInfo.genre} track created with ${trackInfo.modelUsed}`,
            image: '/api/placeholder/300/200', // We'll need to get this from tokenURI
            duration: trackInfo.duration ? `${Math.floor(Number(trackInfo.duration) / 60)}:${String(Number(trackInfo.duration) % 60).padStart(2, '0')}` : '0:00',
            genre: trackInfo.genre,
            creator: trackInfo.creator,
            createdAt: trackInfo.createdAt,
            modelUsed: trackInfo.modelUsed,
            isRemixable: trackInfo.isRemixable,
            royaltyRate: trackInfo.royaltyRate,
            prompt: trackInfo.prompt,
            tags: trackInfo.tags,
            aiCreatedAt: trackInfo.aiCreatedAt,
            external_url: '',
            attributes: [
              { trait_type: "Genre", value: trackInfo.genre },
              { trait_type: "Model", value: trackInfo.modelUsed },
              { trait_type: "Duration", value: `${trackInfo.duration}s` },
              { trait_type: "Remixable", value: trackInfo.isRemixable ? "Yes" : "No" }
            ]
          };

          setTracksMetadata(prev => new Map(prev).set(tokenId.toString(), enhancedMetadata));
        }
      });
    }

  }, [creatorNFTs]);

  // Load metadata from smart contract track info
  useEffect(() => {
    enhanceTracksWithMetadata();
  }, [enhanceTracksWithMetadata]);

  // Load metadata for all tracks
  useEffect(() => {

    creatorTracks.forEach((track, index) => {
      const trackId = track.id || track.tokenId || track.listingId;
      const metadataURI = track.metadataURI || track.tokenURI;

      if (trackId && metadataURI && !tracksMetadata.has(trackId)) {
        fetchMetadata(metadataURI, trackId);
      }
    });

  }, [creatorTracks, fetchMetadata, tracksMetadata]);

  // Debug logging
  useEffect(() => {
    if (allTracks && Array.isArray(allTracks)) {
    }
  }, [creatorAddress, creatorProfile, creatorNFTCount, creatorBalance, creatorNFTs, actualTrackCount, creatorTracks, allTracks, allActiveListings, featuredCreators, creator, nftCountFromContract, balanceFromContract, nftArrayLength, tracksFromAllTracksCount, listingsFromCreatorCount, tracksMetadata]);

  // Loading state
  if (isLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-white text-lg">Loading creator profile...</div>
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // Profile not created yet
  if (profileExists === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md px-6">
          <div className="w-20 h-20 mx-auto bg-yellow-500/20 rounded-full flex items-center justify-center">
            <UserPlus className="w-10 h-10 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold text-white">Profile Not Created</h2>
          <p className="text-muted-foreground">
            This user has {actualTrackCount} track{actualTrackCount !== 1 ? 's' : ''} but hasn't created their profile yet.
          </p>
          {address && address.toLowerCase() === creatorAddress?.toLowerCase() && (
            <>
              <p className="text-sm text-white/70">
                Create your profile to showcase your music and connect with fans!
              </p>
              <Button
                onClick={() => navigate('/portfolio')}
                className="rounded-full bg-primary hover:bg-primary/90"
              >
                Create Your Profile Now
              </Button>
            </>
          )}
          <Button
            onClick={() => navigate('/explore')}
            variant="outline"
            className="rounded-full border-white/20 text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Explore
          </Button>
        </div>
      </div>
    );
  }

  // Creator not found
  if (!creator) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">Creator Not Found</h2>
          <p className="text-muted-foreground">The creator you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/explore')} className="rounded-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Explore
          </Button>
        </div>
      </div>
    );
  }


  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getFilteredTracks = () => {
    const tracks = creatorTracks;

    if (tracks.length > 0) {
      // Tracks available for filtering
    }

    let filteredTracks;
    switch (selectedTab) {
      case 'oldest':
        filteredTracks = [...tracks].sort((a, b) => {
          const timeA = a.createdAt || a.timestamp || 0;
          const timeB = b.createdAt || b.timestamp || 0;
          return Number(timeA) - Number(timeB);
        });
        break;
      case 'popular':
        filteredTracks = [...tracks].sort((a, b) => {
          const playsA = a.plays || a.playCount || 0;
          const playsB = b.plays || b.playCount || 0;
          return Number(playsB) - Number(playsA);
        });
        break;
      default:
        filteredTracks = [...tracks].sort((a, b) => {
          const timeA = a.createdAt || a.timestamp || 0;
          const timeB = b.createdAt || b.timestamp || 0;
          return Number(timeB) - Number(timeA);
        });
    }


    return filteredTracks;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Banner */}
      <div className="relative h-[400px] overflow-hidden">
        {/* Banner Background */}
        {creator?.coverImage && creator.coverImage.trim() !== '' ? (
          <>
            <ImageWithFallback
              src={creator.coverImage}
              alt={`${creator.displayName} banner`}
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => console.error('❌ Banner failed to load')}
            />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600" />
          </>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/80" />

        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 z-10 bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {/* Creator Info */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="flex items-end space-x-6">
            {/* Avatar */}
            <div className="relative">
              {creator?.avatar && creator.avatar.trim() !== '' ? (
                <>
                  <ImageWithFallback
                    src={creator.avatar}
                    alt={creator.displayName}
                    className="w-32 h-32 rounded-full border-4 border-white/20 bg-white/10 object-cover"
                    fallbackSrc={defaultAvatar}
                    onError={() => console.error('❌ Avatar failed to load, using fallback')}
                  />
                </>
              ) : (
                <>
                  <img
                    src={defaultAvatar}
                    alt={creator?.displayName || 'Creator'}
                    className="w-32 h-32 rounded-full border-4 border-white/20 bg-white/10 object-cover"
                  />
                </>
              )}
              {creator.isVerified && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-white">
                  <span className="text-black text-sm font-bold">✓</span>
                </div>
              )}
            </div>

            {/* Creator Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">{creator.displayName}</h1>
                  <div className="flex items-center space-x-4 text-white/80">
                    <span>{formatNumber(creator.followerCount)} followers</span>
                    <span>•</span>
                    <span>{formatNumber(creator.trackCount)} tracks</span>
                    <span>•</span>
                    <span>{formatNumber(creator.totalPlays)} total plays</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Only show follow button if not own profile */}
                  {address && address.toLowerCase() !== creatorAddress?.toLowerCase() && (
                    <Button
                      variant={isFollowing ? "outline" : "default"}
                      onClick={handleFollow}
                      disabled={isLoadingFollow}
                      className={`rounded-full px-6 ${
                        isFollowing
                          ? "border-white/30 bg-white/10 text-white hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50"
                          : "bg-white text-black hover:bg-white/90"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isLoadingFollow ? (
                        <>
                          <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Loading...
                        </>
                      ) : isFollowing ? (
                        <>
                          <UserMinus className="w-4 h-4 mr-2" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}

                  <Button variant="ghost" size="sm" className="rounded-full text-white hover:bg-white/10">
                    <Share2 className="w-4 h-4" />
                  </Button>

                  <Button variant="ghost" size="sm" className="rounded-full text-white hover:bg-white/10">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Bio */}
              {creator.bio && (
                <p className="text-white/90 max-w-2xl leading-relaxed">
                  {creator.bio}
                </p>
              )}

              {/* Social Links */}
              {(creator.website || creator.twitter || creator.instagram || creator.spotify) && (
                <div className="flex flex-wrap gap-3 mt-4">
                  {creator.website && (
                    <a
                      href={creator.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all border border-white/10"
                    >
                      <span>🌐</span>
                      <span className="text-white text-sm">Website</span>
                    </a>
                  )}
                  {creator.twitter && (
                    <a
                      href={`https://twitter.com/${creator.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all border border-white/10"
                    >
                      <span>𝕏</span>
                      <span className="text-white text-sm">Twitter</span>
                    </a>
                  )}
                  {creator.instagram && (
                    <a
                      href={`https://instagram.com/${creator.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all border border-white/10"
                    >
                      <span>📷</span>
                      <span className="text-white text-sm">Instagram</span>
                    </a>
                  )}
                  {creator.spotify && (
                    <a
                      href={creator.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all border border-white/10"
                    >
                      <span>🎵</span>
                      <span className="text-white text-sm">Spotify</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section - Marketplace Advanced Data */}
      <div className="px-8 py-6 border-t border-white/10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="flex items-center space-x-2 mb-2">
              <Music className="w-4 h-4 text-primary" />
              <p className="text-white/60 text-sm">Total Sales</p>
            </div>
            <p className="text-2xl font-bold text-white">{creator.totalSales || 0}</p>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <p className="text-white/60 text-sm">Active Listings</p>
            </div>
            <p className="text-2xl font-bold text-white">{creator.totalListings || 0}</p>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="w-4 h-4 text-yellow-500" />
              <p className="text-white/60 text-sm">Avg Price</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {((creator.averagePrice || 0) / 1e18).toFixed(2)} STT
            </p>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="w-4 h-4 text-orange-500" />
              <p className="text-white/60 text-sm">Highest Sale</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {((creator.highestSale || 0) / 1e18).toFixed(2)} STT
            </p>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <p className="text-white/60 text-sm">Total Earnings</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {((creator.totalEarnings || 0) / 1e18).toFixed(2)} STT
            </p>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <p className="text-white/60 text-sm">Member Since</p>
            </div>
            <p className="text-sm font-bold text-white">
              {creator.joinedAt ? new Date(creator.joinedAt * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
            </p>
          </div>
        </div>

        {/* Top Genres */}
        {creator.topGenres && creator.topGenres.length > 0 && (
          <div className="mt-6">
            <p className="text-white/60 text-sm mb-3">Top Genres</p>
            <div className="flex flex-wrap gap-2">
              {creator.topGenres.map((genre: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-white/10 rounded-full text-sm text-white border border-white/20"
                >
                  {genre} ({Number(creator.genreCounts[index] || 0)})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex items-center space-x-6 mb-8">
          {(['latest', 'oldest', 'popular'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedTab === tab
                  ? 'bg-white text-black'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tracks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {getFilteredTracks().length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-white/60 text-lg mb-2">No tracks found</div>
              <div className="text-white/40 text-sm">This creator hasn't uploaded any tracks yet.</div>
            </div>
          ) : (
            getFilteredTracks().map((track, index) => {
              const trackId = track.tokenId || track.id || track.listingId || index;

              return (
                <TrackCard
                  key={trackId}
                  track={track}
                  onPlay={handleTrackPlay}
                />
              );
            })
          )}
        </div>

        {/* Load More Button */}
        {getFilteredTracks().length > 0 && (
          <div className="text-center mt-12">
            <Button variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10">
              Load More Tracks
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorDetailPage;