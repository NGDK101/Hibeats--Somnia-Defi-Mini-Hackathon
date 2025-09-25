import React, { useState, useEffect } from 'react';
import { useEnhancedMarketplace } from '../../hooks/useEnhancedMarketplace';
import { ImageUpload } from './ImageUpload';
import { toast } from 'sonner';
import type { CreatorProfileUpdateParams, CreatorProfile } from '../../contracts';

interface UpdateProfileFormProps {
  profile: CreatorProfile;
  onSuccess: () => void;
  onCancel: () => void;
}

export const UpdateProfileForm: React.FC<UpdateProfileFormProps> = ({
  profile,
  onSuccess,
  onCancel,
}) => {
  const { updateCreatorProfile, isLoading } = useEnhancedMarketplace();

  const [formData, setFormData] = useState<CreatorProfileUpdateParams>({
    username: '',
    displayName: '',
    bio: '',
    bannerImageUrl: '',
    profileImageUrl: '',
    website: '',
    twitter: '',
    instagram: '',
    spotify: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form with current profile data
  useEffect(() => {
    if (profile) {
      const initialData = {
        username: profile.username || '',
        displayName: profile.displayName || '',
        bio: profile.bio || '',
        bannerImageUrl: profile.bannerImageUrl || '',
        profileImageUrl: profile.profileImageUrl || '',
        website: profile.website || '',
        twitter: profile.twitter || '',
        instagram: profile.instagram || '',
        spotify: profile.spotify || '',
      };
      setFormData(initialData);
    }
  }, [profile]);

  // Check if form has changes
  useEffect(() => {
    if (profile) {
      const hasAnyChanges =
        formData.username !== (profile.username || '') ||
        formData.displayName !== (profile.displayName || '') ||
        formData.bio !== (profile.bio || '') ||
        formData.bannerImageUrl !== (profile.bannerImageUrl || '') ||
        formData.profileImageUrl !== (profile.profileImageUrl || '') ||
        formData.website !== (profile.website || '') ||
        formData.twitter !== (profile.twitter || '') ||
        formData.instagram !== (profile.instagram || '') ||
        formData.spotify !== (profile.spotify || '');

      setHasChanges(hasAnyChanges);
    }
  }, [formData, profile]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    if (!formData.bio.trim()) {
      newErrors.bio = 'Bio is required';
    } else if (formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    if (formData.website && !isValidURL(formData.website)) {
      newErrors.website = 'Please enter a valid website URL';
    }

    if (formData.twitter && !/^[a-zA-Z0-9_]+$/.test(formData.twitter)) {
      newErrors.twitter = 'Invalid Twitter username format';
    }

    if (formData.instagram && !/^[a-zA-Z0-9_.]+$/.test(formData.instagram)) {
      newErrors.instagram = 'Invalid Instagram username format';
    }

    if (formData.spotify && !isValidURL(formData.spotify)) {
      newErrors.spotify = 'Please enter a valid Spotify URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidURL = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleInputChange = (field: keyof CreatorProfileUpdateParams, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!hasChanges) {
      toast.info('No changes detected');
      return;
    }

    try {
      await updateCreatorProfile(formData);
      toast.success('Profile updated successfully!');
      onSuccess();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error?.shortMessage || 'Failed to update profile');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-400 text-sm mb-2">
            Username *
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            className={`w-full bg-gray-700 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              errors.username ? 'border-red-500' : 'border-gray-600'
            }`}
          />
          {errors.username && (
            <p className="text-red-400 text-sm mt-1">{errors.username}</p>
          )}
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-2">
            Display Name *
          </label>
          <input
            type="text"
            value={formData.displayName}
            onChange={(e) => handleInputChange('displayName', e.target.value)}
            className={`w-full bg-gray-700 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              errors.displayName ? 'border-red-500' : 'border-gray-600'
            }`}
          />
          {errors.displayName && (
            <p className="text-red-400 text-sm mt-1">{errors.displayName}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-gray-400 text-sm mb-2">
          Bio *
        </label>
        <textarea
          value={formData.bio}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          rows={4}
          className={`w-full bg-gray-700 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${
            errors.bio ? 'border-red-500' : 'border-gray-600'
          }`}
        />
        {errors.bio && (
          <p className="text-red-400 text-sm mt-1">{errors.bio}</p>
        )}
        <p className="text-gray-500 text-xs mt-1">
          {formData.bio.length}/500 characters
        </p>
      </div>

      {/* Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-400 text-sm mb-2">
            Profile Picture
          </label>
          <ImageUpload
            currentImage={formData.profileImageUrl}
            onImageChange={(url) => handleInputChange('profileImageUrl', url)}
            aspectRatio="square"
            placeholder="Update profile picture"
          />
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-2">
            Banner Image
          </label>
          <ImageUpload
            currentImage={formData.bannerImageUrl}
            onImageChange={(url) => handleInputChange('bannerImageUrl', url)}
            aspectRatio="banner"
            placeholder="Update banner image"
          />
        </div>
      </div>

      {/* Social Links */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-white">Social Links</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              🌐 Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://yourwebsite.com"
              className={`w-full bg-gray-700 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.website ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {errors.website && (
              <p className="text-red-400 text-sm mt-1">{errors.website}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">
              🐦 Twitter Username
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400">@</span>
              <input
                type="text"
                value={formData.twitter}
                onChange={(e) => handleInputChange('twitter', e.target.value)}
                placeholder="username"
                className={`w-full bg-gray-700 border rounded-lg pl-8 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.twitter ? 'border-red-500' : 'border-gray-600'
                }`}
              />
            </div>
            {errors.twitter && (
              <p className="text-red-400 text-sm mt-1">{errors.twitter}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">
              📷 Instagram Username
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400">@</span>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => handleInputChange('instagram', e.target.value)}
                placeholder="username"
                className={`w-full bg-gray-700 border rounded-lg pl-8 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.instagram ? 'border-red-500' : 'border-gray-600'
                }`}
              />
            </div>
            {errors.instagram && (
              <p className="text-red-400 text-sm mt-1">{errors.instagram}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">
              🎵 Spotify Profile URL
            </label>
            <input
              type="url"
              value={formData.spotify}
              onChange={(e) => handleInputChange('spotify', e.target.value)}
              placeholder="https://open.spotify.com/artist/..."
              className={`w-full bg-gray-700 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.spotify ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {errors.spotify && (
              <p className="text-red-400 text-sm mt-1">{errors.spotify}</p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || !hasChanges}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Updating...' : hasChanges ? 'Save Changes' : 'No Changes'}
        </button>
      </div>

      {hasChanges && (
        <div className="bg-yellow-900 bg-opacity-30 border border-yellow-500 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-yellow-500 mr-2">⚠️</span>
            <p className="text-yellow-200 text-sm">
              You have unsaved changes. Click "Save Changes" to update your profile.
            </p>
          </div>
        </div>
      )}
    </form>
  );
};

export default UpdateProfileForm;