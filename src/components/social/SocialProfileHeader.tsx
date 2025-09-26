import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Camera,
  Edit3,
  Settings,
  Share2,
  MoreHorizontal,
  MapPin,
  Calendar,
  Link as LinkIcon,
  Instagram,
  Twitter,
  Youtube,
  Globe,
  Users,
  UserPlus,
  UserMinus,
  Star,
  Award,
  Verified,
  Upload,
  X,
  Check,
  User
} from 'lucide-react';
import { useOptimisticProfile } from '@/hooks/useOptimisticProfile';
import { useProfile } from '@/hooks/useProfile';
import { useIPFS } from '@/hooks/useIPFS';
import { useAccount, useWriteContract } from 'wagmi';
import { useWalletPersistenceContext } from '@/contexts/WalletPersistenceContext';
import { toast } from 'sonner';
import { HiBeatsMarketplaceAdvancedABI } from '@/contracts/HiBeatsMarketplaceAdvancedABI';
import { HIBEATS_PROFILE_ABI } from '@/contracts/HiBeatsProfileABI';
import { CONTRACT_ADDRESSES } from '@/config/web3';
import defaultAvatar from '@/images/assets/defaultprofile.gif';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';

// World Countries List
const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
  "Croatia", "Cuba", "Cyprus", "Czech Republic", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador",
  "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau",
  "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland",
  "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar",
  "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia",
  "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal",
  "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan",
  "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar",
  "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia",
  "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa",
  "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan",
  "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan",
  "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City",
  "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

interface SocialLink {
  platform: string;
  url: string;
  icon: React.ReactNode;
}

interface ProfileData {
  displayName: string;
  username: string;
  bio: string;
  avatar: string;
  coverImage: string;
  website: string;
  twitter?: string;
  instagram?: string;
  spotify?: string;
  youtube?: string;
  location: string;
  joinedDate: string;
  verified: boolean;
  followerCount: number;
  followingCount: number;
  trackCount: number;
  totalPlays: number;
  creatorLevel: 'NEWCOMER' | 'RISING' | 'ESTABLISHED' | 'LEGEND';
  socialLinks: SocialLink[];
}

interface SocialProfileHeaderProps {
  profile: ProfileData;
  isOwnProfile: boolean;
  hasProfile?: boolean;
  profileExistsLoading?: boolean;
  isFollowing?: boolean;
  onFollow?: () => void;
  onUnfollow?: () => void;
  onProfileUpdate?: (updatedProfile: Partial<ProfileData>) => void;
  onProfileCreate?: (profileData: any) => Promise<void>;
}

export const SocialProfileHeader: React.FC<SocialProfileHeaderProps> = ({
  profile,
  isOwnProfile,
  hasProfile = true,
  profileExistsLoading = false,
  isFollowing = false,
  onFollow,
  onUnfollow,
  onProfileUpdate,
  onProfileCreate
}) => {
  // Get wallet persistence states
  const { isInitializing, isReconnecting } = useWalletPersistenceContext();
  
  // Safety check for profile data
  if (!profile) {
    console.warn('SocialProfileHeader: profile prop is null or undefined');
    return (
      <div className="text-center py-8 text-white">
        <p>Loading profile...</p>
      </div>
    );
  }

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localHasProfile, setLocalHasProfile] = useState(hasProfile);
  const [isProfileSystemsReady, setIsProfileSystemsReady] = useState(false);
  
  // Create stable initial form data using useMemo to prevent re-renders
  const initialEditForm = useMemo(() => ({
    username: profile.username || `user_${Date.now().toString().slice(-6)}`,
    displayName: profile.displayName || '',
    bio: profile.bio || '',
    website: profile.website || '',
    location: profile.location || 'none',
    avatar: profile.avatar || '',
    coverImage: profile.coverImage || '',
    twitter: profile.twitter || '',
    instagram: profile.instagram || '',
    spotify: profile.spotify || '',
    youtube: profile.youtube || ''
  }), [profile.username, profile.displayName, profile.bio, profile.website, profile.location, profile.avatar, profile.coverImage, profile.twitter, profile.instagram, profile.spotify, profile.youtube]);
  
  const [editForm, setEditForm] = useState(initialEditForm);
  const [editStep, setEditStep] = useState(1);
  
  // Hooks initialization
  const { uploadToIPFS, uploadProgress, isUploading: ipfsUploading } = useIPFS();
  const { createProfile } = useProfile();
  const { address, isConnected } = useAccount();
  
  // Local uploading state for manual control
  const [isLocalUploading, setIsLocalUploading] = useState(false);
  
  // Merge optimistic profile with prop profile as fallback
  const displayProfile = profile;


  // Combined loading state dari berbagai sumber
  const isUploading = ipfsUploading || isLocalUploading;
  const displayUploadProgress = uploadProgress;
  
  // Create stable initial create form data using useMemo - Unified HiBeatsProfile Structure
  const initialCreateForm = useMemo(() => ({
    username: "",
    displayName: "",
    bio: "",
    profileImageUrl: "",  // Unified structure: profileImageUrl
  }), []);
  
  // State untuk create profile form
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [bannerPreview, setBannerPreview] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const { writeContractAsync } = useWriteContract();
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const createAvatarInputRef = useRef<HTMLInputElement>(null);

  // Profile systems stabilization to prevent overlay flicker
  useEffect(() => {
    if (isInitializing || isReconnecting) {
      setIsProfileSystemsReady(false);
      return;
    }

    // Minimal delay - reduce from 300ms to 100ms for better UX
    const timer = setTimeout(() => {
      setIsProfileSystemsReady(true);
    }, 100); // Reduced from 300ms to 100ms

    return () => clearTimeout(timer);
  }, [isInitializing, isReconnecting, hasProfile]);

  // Sync local hasProfile state with prop only when systems are ready
  useEffect(() => {
    if (isProfileSystemsReady) {
      // Only update if there's a real change to prevent unnecessary re-renders
      setLocalHasProfile(prev => prev !== hasProfile ? hasProfile : prev);
    }
  }, [hasProfile, isProfileSystemsReady]);

  // Cleanup preview URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const getCreatorLevelInfo = (level: string) => {
    switch (level) {
      case 'NEWCOMER':
        return { color: 'bg-gray-500', label: 'Newcomer', icon: '🌱' };
      case 'RISING':
        return { color: 'bg-blue-500', label: 'Rising Star', icon: '⭐' };
      case 'ESTABLISHED':
        return { color: 'bg-purple-500', label: 'Established', icon: '👑' };
      case 'LEGEND':
        return { color: 'bg-yellow-500', label: 'Legend', icon: '🏆' };
      default:
        return { color: 'bg-gray-500', label: 'Newcomer', icon: '🌱' };
    }
  };

  const creatorInfo = getCreatorLevelInfo(displayProfile.creatorLevel || 'NEWCOMER');

  // 🚀 NEW: Enhanced image upload with hybrid approach
  const handleImageUpload = async (file: File, type: 'avatar' | 'cover') => {
    if (!file) return;

    // Check wallet connection first
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setIsLocalUploading(true);

    try {
      
      // Show uploading toast
      toast.loading(`Uploading ${type}...`, {
        id: `upload-${type}`,
        description: 'Please wait while we upload your image to IPFS.'
      });
      
      // Upload to IPFS (useIPFS will handle progress internally)
      const result = await uploadToIPFS(file);
      
      if (result?.url) {
        const ipfsUrl = result.url;
        
        // Dismiss upload toast
        toast.dismiss(`upload-${type}`);
        
        // Update the form with new image URL
        setEditForm(prev => ({
          ...prev,
          [type === 'avatar' ? 'avatar' : 'coverImage']: ipfsUrl
        }));
        
        // Auto-save the image change with complete profile data
        if (onProfileUpdate) {
          try {
            // Show transaction toast
            toast.loading('Updating profile on blockchain...', {
              id: `save-${type}`,
              description: 'Please confirm the transaction in your MetaMask wallet.'
            });
            
            // Prepare complete profile data for the update
            const completeProfileData = {
              displayName: profile.displayName || editForm.displayName || `User ${profile.username || 'Unknown'}`,
              bio: profile.bio || editForm.bio || '',
              avatar: type === 'avatar' ? ipfsUrl : (editForm.avatar || profile.avatar || ''),
              coverImage: type === 'cover' ? ipfsUrl : (editForm.coverImage || profile.coverImage || ''),
              website: profile.website || editForm.website || ''
            };
            
            // Small delay to ensure wallet is ready
            await new Promise(resolve => setTimeout(resolve, 500));
            
            await onProfileUpdate(completeProfileData);
            
            toast.dismiss(`save-${type}`);
            toast.success(`${type === 'avatar' ? 'Avatar' : 'Cover image'} updated!`, {
              description: 'Transaction submitted successfully. Please wait for confirmation.',
            });
          } catch (error) {
            console.error('Failed to save image update:', error);
            toast.dismiss(`save-${type}`);
            
            let errorMessage = 'Please try editing your profile manually or check your wallet connection.';
            if (error instanceof Error) {
              if (error.message.includes('rejected')) {
                errorMessage = 'Transaction was rejected. Your image was uploaded but not saved to the blockchain.';
              } else if (error.message.includes('insufficient')) {
                errorMessage = 'Insufficient funds for transaction.';
              }
            }
            
            toast.error(`Upload successful, but failed to save to blockchain.`, {
              description: errorMessage
            });
          }
        } else {
          toast.success(`${type === 'avatar' ? 'Avatar' : 'Cover image'} uploaded successfully!`);
        }
      } else {
        throw new Error('Failed to get IPFS URL');
      }
    } catch (error) {
      console.error(`Failed to upload ${type}:`, error);
      toast.dismiss(`upload-${type}`);
      toast.error(`Failed to upload ${type === 'avatar' ? 'avatar' : 'cover image'}. Please try again.`);
    } finally {
      setIsLocalUploading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, 'avatar');
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, 'cover');
    }
  };

  const handleSaveProfile = async () => {
    if (!editForm.displayName.trim()) {
      toast.error('Please enter a display name');
      return; // Basic validation
    }

    // Check wallet connection
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    setIsSaving(true);
    try {
      if (onProfileUpdate) {
        // Prepare complete profile data with all required fields
        const completeProfileData = {
          displayName: editForm.displayName || profile.displayName || `User ${profile.username || 'Unknown'}`,
          bio: editForm.bio || '',
          avatar: editForm.avatar || profile.avatar || '',
          coverImage: editForm.coverImage || profile.coverImage || '',
          website: editForm.website || '',
          location: editForm.location === "none" ? "" : (editForm.location || ''),
          twitter: editForm.twitter || '',
          instagram: editForm.instagram || '',
          spotify: editForm.spotify || '',
          youtube: editForm.youtube || ''
        };
        
        
        toast.loading('💾 Saving profile changes...', {
          description: 'Please confirm the transaction in your MetaMask wallet.',
          id: 'save-profile',
        });
        
        // Small delay to ensure wallet is ready
        await new Promise(resolve => setTimeout(resolve, 300));
        
        await onProfileUpdate(completeProfileData);
        
        toast.dismiss('save-profile');
        toast.info('📝 Profile update submitted!', {
          description: 'Transaction sent successfully. Please wait for confirmation.',
          duration: 4000,
        });
      }
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.dismiss('save-profile');
      
      let errorMessage = 'Please try again or check your wallet connection.';
      if (error instanceof Error) {
        if (error.message.includes('rejected')) {
          errorMessage = 'Transaction was rejected by user.';
        } else if (error.message.includes('insufficient')) {
          errorMessage = 'Insufficient funds for transaction.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection.';
        }
      }
      
      toast.error('❌ Failed to save profile', {
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Fungsi untuk handle create profile form
  const handleCreateInputChange = (field: string, value: string) => {
    setCreateForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {

      
      // Upload to IPFS
      const result = await uploadToIPFS(file);

      
      // Create local preview URL for immediate display
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      
      // Set the IPFS URL in the form
      setCreateForm(prev => ({
        ...prev,
        profileImageUrl: result.url // Using profileImageUrl (unified structure)
      }));
      
      toast.success('Avatar uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload avatar to IPFS');
    }
  };

  const validateCreateForm = () => {
    if (!createForm.username.trim()) {
      toast.error('Username is required');
      return false;
    }
    
    if (createForm.username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return false;
    }
    
    if (createForm.username.includes(' ')) {
      toast.error('Username cannot contain spaces');
      return false;
    }
    
    if (!createForm.displayName.trim()) {
      toast.error('Display name is required');
      return false;
    }
    
    return true;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCreateForm()) return;

    // Prevent duplicate submissions
    if (isCreating) {
      console.warn('Profile creation already in progress, skipping...');
      return;
    }

    // Check wallet connection
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsCreating(true);
    
    // Show loading toast
    const loadingToastId = toast.loading('Creating your profile...', {
      description: 'Please confirm the transaction in your wallet.'
    });

    try {
      // Call parent callback instead of direct contract interaction
      if (onProfileCreate) {
        await onProfileCreate({
          username: createForm.username,
          displayName: createForm.displayName || createForm.username,
          bio: createForm.bio || '',
          avatarURI: createForm.profileImageUrl || '' // Changed to avatarURI to match ProfileData interface
        });
      } else {
        throw new Error('Profile creation callback not provided');
      }

      // Dismiss loading toast
      toast.dismiss(loadingToastId);
      
      // Show success message
      toast.success('🎉 Profile creation initiated!', {
        description: 'Your profile is being created...'
      });

      // Close form immediately
      setShowCreateForm(false);

      // Immediately update local state to hide overlay
      setLocalHasProfile(true);

      // Wait a bit for blockchain confirmation, then refresh
      setTimeout(async () => {
        try {
          // Trigger profile refresh if onProfileUpdate callback is available
          if (onProfileUpdate) {
            console.log('🔄 Triggering profile refresh via callback...');
            
            // This will trigger a refresh in the parent component
            await onProfileUpdate({
              displayName: createForm.displayName || createForm.username,
              bio: createForm.bio || '',
              avatar: createForm.profileImageUrl || '',
              username: createForm.username
            });
          }

          // NOTE: Removed duplicate onProfileCreate call to prevent multiple transactions

        } catch (error) {
          console.error('Error refreshing profile via callbacks:', error);
          // Don't show error toast as profile was created successfully
          // Just log for debugging
          
          // Show a gentler message to user
          toast.info('Profile created successfully! Changes will appear shortly.', {
            description: 'If you don\'t see changes, try refreshing the page.',
            action: {
              label: 'Refresh',
              onClick: () => window.location.reload()
            }
          });
        }
      }, 2000); // Reduced from 3000ms to 2000ms for faster refresh

      // Reset form
      setCreateForm({
        username: "",
        displayName: "",
        bio: "",
        profileImageUrl: "",
      });
      setAvatarPreview("");
      setBannerPreview("");
    } catch (error) {
      console.error('Error creating profile:', error);
      
      // Dismiss loading toast
      toast.dismiss(loadingToastId);
      
      // More specific error messages
      if (error instanceof Error) {
        if (error.message.includes('username')) {
          toast.error('Username already exists or is invalid');
        } else if (error.message.includes('rejected') || error.message.includes('User rejected')) {
          toast.error('Transaction cancelled by user');
        } else if (error.message.includes('insufficient funds')) {
          toast.error('Insufficient funds for transaction');
        } else if (error.message.includes('IPFS')) {
          toast.error('Failed to upload profile image. Please try again.');
        } else if (error.message.includes('network')) {
          toast.error('Network error. Please check your connection.');
        } else {
          toast.error(`Failed to create profile: ${error.message}`);
        }
      } else {
        toast.error('Failed to create profile. Please try again.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="relative">
      {/* Create Profile Overlay - Only show when systems are ready, no profile, wallet connected, and not loading */}
      {isProfileSystemsReady && 
       !localHasProfile && 
       !profileExistsLoading &&
       isConnected && 
       address && 
       !isInitializing && 
       !isReconnecting && (
        <div className="absolute top-0 left-0 right-0 bottom-0 backdrop-blur-lg bg-gradient-to-br from-black/85 via-accent/10 to-black/85 z-30 flex items-center justify-center h-full">
          <div className="text-center space-y-6 p-8 bg-gradient-to-br from-background/95 via-accent/5 to-background/95 rounded-2xl border border-accent/30 backdrop-blur-sm shadow-2xl shadow-accent/10 max-w-md mx-4">
            {/* Animated Icon */}
            <div className="relative">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center border-2 border-primary/30 animate-pulse">
                <User className="w-10 h-10 text-primary" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                <span className="text-xs">✨</span>
              </div>
            </div>
            
            {/* Content */}
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-white bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Create Your Profile
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Set up your profile to showcase your musical journey and connect with other creators
              </p>
            </div>
            
            {/* Button */}
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary text-black font-semibold px-8 py-3 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 transform hover:scale-105"
            >
              <span className="mr-2">🎵</span>
              Create Profile
            </Button>
          </div>
        </div>
      )}

      {/* Cover Image Section */}
      <div className="relative h-64 md:h-80 overflow-hidden group rounded-b-3xl">
        {displayProfile.coverImage && displayProfile.coverImage.trim() !== '' ? (
          <ImageWithFallback
            key={displayProfile.coverImage}
            src={displayProfile.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : null}
        <div className="w-full h-full bg-gradient-to-r from-purple-900 via-blue-900 to-green-900" />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30" />
        
        {/* Upload Cover Button - Only for own profile */}
        {isOwnProfile && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white hover:bg-black/70"
              onClick={() => coverInputRef.current?.click()}
              disabled={isUploading}
            >
              <Camera className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Edit Cover'}
            </Button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverChange}
            />
          </>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="absolute bottom-4 left-4 right-4">
            <Progress value={displayUploadProgress} className="h-2" />
            <p className="text-white text-sm mt-2">
              Uploading to IPFS... {Math.round(displayUploadProgress)}%
            </p>
          </div>
        )}
      </div>

      {/* Profile Info Section */}
      <div className="relative -mt-20 px-6 pb-6">
        <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6">
          
          {/* Avatar */}
          <div className="relative group">
            <Avatar className="w-32 h-32 border-4 border-glass-border bg-gradient-to-br from-primary to-purple-600 ring-4 ring-black/20">
              {displayProfile.avatar && displayProfile.avatar.trim() !== '' ? (
                <ImageWithFallback
                  src={displayProfile.avatar}
                  alt={displayProfile.displayName || 'User'}
                  className="w-full h-full object-cover rounded-full"
                  fallbackSrc={defaultAvatar}
                />
              ) : (
                <AvatarImage src={defaultAvatar} alt={displayProfile.displayName || 'User'} />
              )}
              <AvatarFallback className="text-4xl font-bold text-white bg-gradient-to-br from-primary to-purple-600">
                {(displayProfile.displayName || 'U').charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            {/* Upload Avatar Button - Only for own profile */}
            {isOwnProfile && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute bottom-0 right-0 w-10 h-10 p-0 rounded-full bg-primary hover:bg-primary/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Camera className="w-4 h-4" />
                </Button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </>
            )}
          </div>

          {/* Profile Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              
              {/* Name and Username */}
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-white truncate">{displayProfile.displayName || 'Unknown User'}</h1>
                  {profile.verified && (
                    <div className="flex items-center justify-center w-6 h-6 bg-primary rounded-full">
                      <Verified className="w-4 h-4 text-black" />
                    </div>
                  )}
                  {/* Creator Level Badge */}
                  <Badge className={`${creatorInfo.color} text-white border-0`}>
                    <span className="mr-1">{creatorInfo.icon}</span>
                    {creatorInfo.label}
                  </Badge>
                </div>
                <p className="text-white/60 mb-2">@{displayProfile.username || 'user'}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                {isOwnProfile ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditDialogOpen(true)}
                      className="border-glass-border bg-glass-background/50 text-white hover:bg-glass-background/70"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button variant="ghost" size="sm" className="w-10 h-10 p-0 text-white/70 hover:text-white">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant={isFollowing ? "outline" : "default"}
                      size="sm"
                      onClick={isFollowing ? onUnfollow : onFollow}
                      className={isFollowing ? 
                        "border-glass-border bg-glass-background/50 text-white hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50" :
                        "bg-primary hover:bg-primary/80 text-black"
                      }
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus className="w-4 h-4 mr-2" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" className="w-10 h-10 p-0 text-white/70 hover:text-white">
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="w-10 h-10 p-0 text-white/70 hover:text-white">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Bio */}
            <p className="text-white/80 mb-4 max-w-2xl leading-relaxed">{displayProfile.bio || 'No bio available.'}</p>
            
            {/* Profile Info Row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/60 mb-4">
              {displayProfile.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{displayProfile.location}</span>
                </div>
              )}
              {displayProfile.website && (
                <div className="flex items-center space-x-1">
                  <LinkIcon className="w-4 h-4" />
                  <a 
                    href={displayProfile.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {profile.website.replace('https://', '').replace('http://', '')}
                  </a>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {profile.joinedDate || 'Recently'}</span>
              </div>
            </div>

            {/* Social Links */}
            {(displayProfile.website || displayProfile.twitter || displayProfile.instagram || displayProfile.spotify || displayProfile.youtube) && (
              <div className="flex items-center space-x-3 mb-4">
                {displayProfile.website && (
                  <a
                    href={displayProfile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-primary transition-colors p-2 rounded-lg hover:bg-white/10"
                    title="Website"
                  >
                    <Globe className="w-5 h-5" />
                  </a>
                )}
                {displayProfile.twitter && (
                  <a
                    href={`https://twitter.com/${displayProfile.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-blue-400 transition-colors p-2 rounded-lg hover:bg-white/10"
                    title={`@${displayProfile.twitter} on Twitter`}
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
                {displayProfile.instagram && (
                  <a
                    href={`https://instagram.com/${displayProfile.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-pink-400 transition-colors p-2 rounded-lg hover:bg-white/10"
                    title={`@${displayProfile.instagram} on Instagram`}
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {displayProfile.spotify && (
                  <a
                    href={displayProfile.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-green-400 transition-colors p-2 rounded-lg hover:bg-white/10"
                    title="Spotify Profile"
                  >
                    <span className="text-xl">🎵</span>
                  </a>
                )}
                {displayProfile.youtube && (
                  <a
                    href={displayProfile.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-white/10"
                    title="YouTube Channel"
                  >
                    <Youtube className="w-5 h-5" />
                  </a>
                )}
              </div>
            )}

            {/* Social Stats */}
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="cursor-pointer hover:text-white transition-colors">
                <span className="font-semibold text-white">{formatNumber(profile.followerCount)}</span>
                <span className="text-white/60 ml-1">followers</span>
              </div>
              <div className="cursor-pointer hover:text-white transition-colors">
                <span className="font-semibold text-white">{formatNumber(profile.followingCount)}</span>
                <span className="text-white/60 ml-1">following</span>
              </div>
              <div>
                <span className="font-semibold text-white">{formatNumber(profile.trackCount)}</span>
                <span className="text-white/60 ml-1">tracks</span>
              </div>
              <div>
                <span className="font-semibold text-white">{formatNumber(profile.totalPlays)}</span>
                <span className="text-white/60 ml-1">total plays</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog - 3 Step Process */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) setEditStep(1); // Reset to step 1 when closing
      }}>
        <DialogContent className="bg-black/90 backdrop-blur-xl border border-white/10 text-white max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-2xl font-bold text-white flex items-center">
              <Edit3 className="w-6 h-6 mr-2 text-primary" />
              Edit Profile
            </DialogTitle>
          </DialogHeader>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Step {editStep} of 3</span>
              <span className="text-sm text-gray-400">{Math.round((editStep / 3) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(editStep / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step 1: Basic Information */}
          {editStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-white mb-2">Basic Information</h3>
                <p className="text-gray-400">Update your basic profile details</p>
              </div>

              {/* Username Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80 flex items-center">
                  <span>Username</span>
                  {localHasProfile && (
                    <Badge variant="secondary" className="ml-2 text-xs bg-amber-500/20 text-amber-300 border-amber-500/30">
                      Read Only
                    </Badge>
                  )}
                </label>
                <Input
                  value={editForm.username}
                  onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                  className={`bg-white/5 border transition-all duration-200 text-white placeholder:text-white/40 ${
                    localHasProfile
                      ? 'border-amber-500/30 cursor-not-allowed bg-amber-500/5'
                      : 'border-white/10 focus:border-primary/50'
                  }`}
                  placeholder="Your username"
                  disabled={localHasProfile}
                  readOnly={localHasProfile}
                />
                {localHasProfile && (
                  <p className="text-xs text-amber-400/80">
                    Username cannot be changed after profile creation
                  </p>
                )}
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Display Name *</label>
                <Input
                  value={editForm.displayName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                  className="bg-gray-700 border border-gray-600 text-white focus:border-primary/50"
                  placeholder="Your Artist Name"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Bio *</label>
                <Textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="bg-gray-700 border border-gray-600 text-white min-h-[100px] resize-none"
                  placeholder="Tell your fans about yourself..."
                  maxLength={500}
                />
                <p className="text-xs text-gray-500">
                  {(editForm.bio || '').length}/500 characters
                </p>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  Location
                </label>
                <Select
                  value={editForm.location}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, location: value }))}
                >
                  <SelectTrigger className="bg-gray-700 border border-gray-600 text-white">
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/95 border border-white/10 text-white max-h-[200px]">
                    <SelectItem value="none" className="text-white/70">
                      <em>No location selected</em>
                    </SelectItem>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country} className="text-white">
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Social Links */}
          {editStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-white mb-2">Social Links</h3>
                <p className="text-gray-400">Connect your social media accounts (optional)</p>
              </div>

              {/* Website */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80 flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  Website
                </label>
                <Input
                  value={editForm.website}
                  onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                  className="bg-gray-700 border border-gray-600 text-white"
                  placeholder="https://yourwebsite.com"
                  type="url"
                />
              </div>

              {/* Twitter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80 flex items-center">
                  <Twitter className="w-4 h-4 mr-2" />
                  Twitter Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">@</span>
                  <Input
                    value={editForm.twitter || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, twitter: e.target.value.replace('@', '') }))}
                    className="bg-gray-700 border border-gray-600 text-white pl-8"
                    placeholder="username"
                  />
                </div>
              </div>

              {/* Instagram */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80 flex items-center">
                  <Instagram className="w-4 h-4 mr-2" />
                  Instagram Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">@</span>
                  <Input
                    value={editForm.instagram || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, instagram: e.target.value.replace('@', '') }))}
                    className="bg-gray-700 border border-gray-600 text-white pl-8"
                    placeholder="username"
                  />
                </div>
              </div>

              {/* Spotify */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80 flex items-center">
                  <span className="text-green-500 mr-2">🎵</span>
                  Spotify Profile URL
                </label>
                <Input
                  value={editForm.spotify || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, spotify: e.target.value }))}
                  className="bg-gray-700 border border-gray-600 text-white"
                  placeholder="https://open.spotify.com/artist/..."
                  type="url"
                />
              </div>

              {/* YouTube */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80 flex items-center">
                  <Youtube className="w-4 h-4 mr-2" />
                  YouTube Channel
                </label>
                <Input
                  value={editForm.youtube || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, youtube: e.target.value }))}
                  className="bg-gray-700 border border-gray-600 text-white"
                  placeholder="https://youtube.com/@yourchannel"
                  type="url"
                />
              </div>
            </div>
          )}

          {/* Step 3: Profile Images */}
          {editStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-white mb-2">Profile Images</h3>
                <p className="text-gray-400">Upload your profile picture and banner (optional)</p>
              </div>

              {/* Profile Picture */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Profile Picture</label>
                <div className="flex items-center gap-4">
                  <Avatar className="w-24 h-24 border-4 border-primary/30">
                    {editForm.avatar ? (
                      <AvatarImage src={editForm.avatar} alt={editForm.displayName} />
                    ) : (
                      <AvatarImage src={defaultAvatar} />
                    )}
                  </Avatar>
                  <div>
                    <input
                      type="file"
                      ref={avatarInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'avatar')}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={ipfsUploading}
                      className="border-primary/50 text-primary hover:bg-primary/10"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {ipfsUploading ? 'Uploading...' : 'Change Avatar'}
                    </Button>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <p className="text-xs text-primary mt-2">Uploading: {uploadProgress}%</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Banner Image */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Banner Image</label>
                <div className="space-y-4">
                  <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-800 relative">
                    {editForm.coverImage ? (
                      <img src={editForm.coverImage} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        No banner image
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      ref={coverInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'cover')}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={ipfsUploading}
                      className="border-primary/50 text-primary hover:bg-primary/10"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {ipfsUploading ? 'Uploading...' : 'Change Banner'}
                    </Button>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <p className="text-xs text-primary mt-2">Uploading: {uploadProgress}%</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
            {editStep > 1 ? (
              <Button
                type="button"
                onClick={() => setEditStep(editStep - 1)}
                variant="ghost"
                className="text-white/70 hover:text-white"
              >
                Back
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={() => setIsEditDialogOpen(false)}
                className="text-white/70 hover:text-white"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}

            {editStep < 3 ? (
              <Button
                type="button"
                onClick={() => setEditStep(editStep + 1)}
                className="bg-primary hover:bg-primary/80 text-black"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving || !editForm.displayName.trim()}
                className="bg-primary hover:bg-primary/80 text-black disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-black/20 border-t-black"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Profile Form Modal */}
      {showCreateForm && (
        <Dialog open={showCreateForm} onOpenChange={() => setShowCreateForm(false)}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background/95 via-accent/5 to-background/95 backdrop-blur-xl border border-accent/30 shadow-2xl shadow-accent/10">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-2xl font-bold text-white flex items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mr-3 border border-primary/30">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Create Your Profile
                </span>
              </DialogTitle>
              <p className="text-muted-foreground">
                Join the HiBeats community and showcase your musical journey
              </p>
            </DialogHeader>

            <form onSubmit={handleCreateSubmit} className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative group">
                  <Avatar className="w-24 h-24 border-2 border-primary/30 shadow-lg shadow-primary/10">
                    <AvatarImage
                      src={avatarPreview || createForm.profileImageUrl || defaultAvatar}
                      onError={(e) => {
                        e.currentTarget.src = defaultAvatar;
                      }}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary text-xl border border-primary/20">
                      {createForm.displayName?.[0] || <User className="w-8 h-8" />}
                    </AvatarFallback>
                  </Avatar>
                  
                  <label 
                    htmlFor="create-avatar-upload" 
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-glow hover:from-primary-glow hover:to-primary flex items-center justify-center cursor-pointer transition-all duration-200 shadow-lg shadow-primary/25 border border-primary/30"
                  >
                    {isUploading ? (
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 text-primary-foreground" />
                    )}
                  </label>
                  
                  <input
                    ref={createAvatarInputRef}
                    id="create-avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleCreateAvatarUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Click the camera icon to upload your avatar</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Supports JPG, PNG up to 5MB</p>
                </div>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <label htmlFor="username" className="text-white font-medium flex items-center">
                  Username *
                  <span className="text-xs text-muted-foreground ml-2">(This cannot be changed later)</span>
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your unique username"
                  value={createForm.username}
                  onChange={(e) => handleCreateInputChange('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="bg-background/50 border-accent/30 text-white placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground">
                  Only lowercase letters, numbers, and underscores allowed
                </p>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <label htmlFor="displayName" className="text-white font-medium">
                  Display Name *
                </label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your display name"
                  value={createForm.displayName}
                  onChange={(e) => handleCreateInputChange('displayName', e.target.value)}
                  className="bg-background/50 border-accent/30 text-white placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                  maxLength={50}
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <label htmlFor="bio" className="text-white font-medium">
                  Bio
                </label>
                <Textarea
                  id="bio"
                  placeholder="Tell the world about your musical journey..."
                  value={createForm.bio}
                  onChange={(e) => handleCreateInputChange('bio', e.target.value)}
                  className="bg-background/50 border-accent/30 text-white placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all min-h-[100px] resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground flex justify-between">
                  <span>Share your passion for music and connect with others</span>
                  <span>{createForm.bio.length}/500</span>
                </p>
              </div>

              <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="text-sm text-white/80">
                  💡 <strong>Note:</strong> You can add social links and other details later by updating your profile.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 border-accent/30 text-white hover:bg-accent/20 hover:border-accent/50 transition-all"
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 !text-black border-0 shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  disabled={isCreating || isUploading}
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                      Creating Profile...
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4 mr-2" />
                      Create Profile
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};