import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, User, AtSign, FileText, Link as LinkIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/hooks/useProfile';
import { toast } from '@/hooks/use-toast';

interface ProfileSetupProps {
  onComplete?: () => void;
}

export default function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const navigate = useNavigate();
  const { createProfile } = useProfile();
  
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    bio: '',
    avatar: '',
    website: '',
    socialLinks: ['']
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Check username availability
    if (field === 'username' && value.length >= 3) {
      checkUsernameAvailability(value);
    }
  };

  // Check username availability (mock implementation)
  const checkUsernameAvailability = async (username: string) => {
    setCheckingUsername(true);
    try {
      // TODO: Replace with actual contract call
      await new Promise(resolve => setTimeout(resolve, 500)); // Mock delay
      
      // Mock check - in real implementation, check against contract
      const unavailableUsernames = ['admin', 'hibeats', 'test', 'user'];
      const isAvailable = !unavailableUsernames.includes(username.toLowerCase()) && 
                         username.length >= 3 && 
                         /^[a-zA-Z0-9_]+$/.test(username);
      
      setUsernameAvailable(isAvailable);
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  // Handle social links
  const addSocialLink = () => {
    if (formData.socialLinks.length < 5) {
      setFormData(prev => ({
        ...prev,
        socialLinks: [...prev.socialLinks, '']
      }));
    }
  };

  const updateSocialLink = (index: number, value: string) => {
    const newLinks = [...formData.socialLinks];
    newLinks[index] = value;
    setFormData(prev => ({
      ...prev,
      socialLinks: newLinks
    }));
  };

  const removeSocialLink = (index: number) => {
    const newLinks = formData.socialLinks.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      socialLinks: newLinks.length > 0 ? newLinks : ['']
    }));
  };

  // Handle avatar upload (mock)
  const handleAvatarUpload = async (file: File) => {
    try {
      // TODO: Upload to IPFS or cloud storage
      // For now, use a placeholder URL
      const avatarUrl = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face`;
      setFormData(prev => ({
        ...prev,
        avatar: avatarUrl
      }));
      
      toast({
        title: "Avatar uploaded",
        description: "Your profile picture has been uploaded successfully!",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.displayName) {
      toast({
        title: "Required fields",
        description: "Please fill in username and display name.",
        variant: "destructive",
      });
      return;
    }

    if (usernameAvailable === false) {
      toast({
        title: "Username unavailable",
        description: "Please choose a different username.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const profileData = {
        username: formData.username,
        displayName: formData.displayName,
        bio: formData.bio,
        avatar: formData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.displayName)}&background=6366f1&color=fff`
      };

      await createProfile(profileData);
      
      toast({
        title: "Profile created!",
        description: "Welcome to HiBeats! Your profile has been created successfully.",
      });

      if (onComplete) {
        onComplete();
      } else {
        navigate('/profile');
      }
    } catch (error) {
      console.error('Error creating profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.username && 
                     formData.displayName && 
                     usernameAvailable === true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-card/80 border-glass-border backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Your Profile</CardTitle>
          <CardDescription>
            Set up your creator profile to start sharing your music with the world
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={formData.avatar} alt="Profile" />
                  <AvatarFallback className="text-2xl">
                    {formData.displayName ? formData.displayName.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                  onClick={() => {
                    // Mock avatar upload
                    const file = new File([''], 'avatar.jpg');
                    handleAvatarUpload(file);
                  }}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Click the camera icon to upload your profile picture</p>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  placeholder="Your display name"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  className="bg-input/50 border-glass-border"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    placeholder="your_username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value.toLowerCase())}
                    className="pl-10 bg-input/50 border-glass-border"
                  />
                  {checkingUsername && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>
                {formData.username.length >= 3 && (
                  <div className="flex items-center gap-2 text-sm">
                    {usernameAvailable === true && (
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                        ✓ Available
                      </Badge>
                    )}
                    {usernameAvailable === false && (
                      <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30">
                        ✗ Unavailable
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself and your music..."
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                className="min-h-[100px] bg-input/50 border-glass-border resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.bio.length}/500 characters
              </p>
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="website"
                  type="url"
                  placeholder="https://your-website.com"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="pl-10 bg-input/50 border-glass-border"
                />
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Social Links</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSocialLink}
                  disabled={formData.socialLinks.length >= 5}
                >
                  Add Link
                </Button>
              </div>
              <div className="space-y-2">
                {formData.socialLinks.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="url"
                        placeholder="https://twitter.com/yourhandle"
                        value={link}
                        onChange={(e) => updateSocialLink(index, e.target.value)}
                        className="pl-10 bg-input/50 border-glass-border"
                      />
                    </div>
                    {formData.socialLinks.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeSocialLink(index)}
                        className="px-3"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1"
              >
                Skip for now
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Profile...
                  </>
                ) : (
                  'Create Profile'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
