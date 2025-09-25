import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/ui/glass-card';
import {
  User,
  Camera,
  Music,
  Star,
  Sparkles,
  UserPlus,
  Upload,
  Check,
  AlertCircle
} from 'lucide-react';
import { useIPFS } from '@/hooks/useIPFS';
import { toast } from 'sonner';

interface ProfileCreationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileCreate: (profileData: any) => Promise<void>;
  isCreating?: boolean;
}

export const ProfileCreationOverlay: React.FC<ProfileCreationOverlayProps> = ({
  isOpen,
  onClose,
  onProfileCreate,
  isCreating = false
}) => {
  // Debug logging
  
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    bio: '',
    avatarURI: ''
  });
  
  const [previewAvatar, setPreviewAvatar] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadToIPFS, isUploading } = useIPFS();

  // Debug logging for overlay state
  React.useEffect(() => {
      isOpen,
      isCreating,
      isSubmitting,
      isUploading
    });
  }, [isOpen, isCreating, isSubmitting, isUploading]);

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar file size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    try {
      toast.loading('Uploading avatar...', { id: 'avatar-upload' });
      
      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewAvatar(objectUrl);
      
      // Upload to IPFS
      const uploadResult = await uploadToIPFS(file);
      const avatarURI = uploadResult.url;
      
      setFormData(prev => ({ ...prev, avatarURI }));
      toast.success('Avatar uploaded successfully!', { id: 'avatar-upload' });
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Failed to upload avatar', { id: 'avatar-upload' });
      setPreviewAvatar('');
    }
  };

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }
    
    if (!formData.displayName.trim()) {
      errors.displayName = 'Display name is required';
    } else if (formData.displayName.length < 2) {
      errors.displayName = 'Display name must be at least 2 characters';
    }
    
    if (formData.bio && formData.bio.length > 500) {
      errors.bio = 'Bio must be less than 500 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const profileData = {
        username: formData.username.trim(),
        displayName: formData.displayName.trim(),
        bio: formData.bio.trim() || '',
        avatarURI: formData.avatarURI || ''
      };
      
      
      await onProfileCreate(profileData);
      
      // Don't close immediately, let parent component handle success
      toast.success('Profile creation initiated! Please wait for blockchain confirmation.');
      
    } catch (error) {
      console.error('Profile creation error:', error);
      toast.error('Failed to create profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-900/95 backdrop-blur-xl border-gray-700/50 text-white overflow-y-auto max-h-[90vh]">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-primary/20 to-purple-600/20 rounded-full flex items-center justify-center">
                <UserPlus className="w-8 h-8 text-primary" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </div>
          
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Welcome to HiBeats!
          </DialogTitle>
          
          <div className="text-center space-y-2">
            <p className="text-white/80">
              Create your profile to start your journey in the AI music universe
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-white/60">
              <Music className="w-4 h-4" />
              <span>Discover • Create • Collect</span>
              <Star className="w-4 h-4" />
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-white/90">Profile Picture</Label>
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20 border-2 border-primary/30">
                <AvatarImage src={previewAvatar || formData.avatarURI} />
                <AvatarFallback className="bg-gray-800 text-2xl">
                  {formData.displayName.charAt(0).toUpperCase() || 
                   formData.username.charAt(0).toUpperCase() || 
                   <User className="w-8 h-8" />}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full bg-gray-800/50 border-gray-600 hover:bg-gray-700/50"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Upload Photo'}
                </Button>
                <p className="text-xs text-white/50 mt-1">
                  PNG, JPG up to 5MB
                </p>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Username Field */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium text-white/90">
              Username *
            </Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="your_username"
              className="bg-gray-800/50 border-gray-600 focus:border-primary text-white placeholder:text-white/40"
              disabled={isSubmitting}
            />
            {formErrors.username && (
              <div className="flex items-center gap-1 text-red-400 text-xs">
                <AlertCircle className="w-3 h-3" />
                {formErrors.username}
              </div>
            )}
            <p className="text-xs text-white/50">
              Your unique identifier (cannot be changed later)
            </p>
          </div>

          {/* Display Name Field */}
          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-sm font-medium text-white/90">
              Display Name *
            </Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              placeholder="Your Display Name"
              className="bg-gray-800/50 border-gray-600 focus:border-primary text-white placeholder:text-white/40"
              disabled={isSubmitting}
            />
            {formErrors.displayName && (
              <div className="flex items-center gap-1 text-red-400 text-xs">
                <AlertCircle className="w-3 h-3" />
                {formErrors.displayName}
              </div>
            )}
          </div>

          {/* Bio Field */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sm font-medium text-white/90">
              Bio (optional)
            </Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell the world about your music taste..."
              className="bg-gray-800/50 border-gray-600 focus:border-primary text-white placeholder:text-white/40 min-h-[80px]"
              disabled={isSubmitting}
              maxLength={500}
            />
            {formErrors.bio && (
              <div className="flex items-center gap-1 text-red-400 text-xs">
                <AlertCircle className="w-3 h-3" />
                {formErrors.bio}
              </div>
            )}
            <div className="flex justify-between text-xs text-white/50">
              <span>Share your passion for AI-generated music</span>
              <span>{formData.bio.length}/500</span>
            </div>
          </div>

          {/* Features Preview */}
          <GlassCard className="p-4 bg-gradient-to-r from-primary/10 to-purple-600/10 border-primary/20">
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              What you'll unlock:
            </h4>
            <div className="space-y-2 text-xs text-white/70">
              <div className="flex items-center gap-2">
                <Check className="w-3 h-3 text-green-400" />
                <span>Generate and mint AI music NFTs</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3 h-3 text-green-400" />
                <span>Build your music collection</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3 h-3 text-green-400" />
                <span>Follow other creators</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3 h-3 text-green-400" />
                <span>Trade on the marketplace</span>
              </div>
            </div>
          </GlassCard>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || isCreating || isUploading}
            className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/80 hover:to-purple-600/80 text-black font-semibold py-3 transition-all duration-200"
          >
            {isSubmitting || isCreating ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                Creating Profile...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Create My Profile
              </div>
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-gray-700/50">
          <p className="text-xs text-white/50">
            By creating a profile, you agree to store your data on the blockchain
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};