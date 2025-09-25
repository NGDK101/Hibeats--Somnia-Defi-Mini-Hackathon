import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useEnhancedMarketplace } from '../../hooks/useEnhancedMarketplace';
import { ImageUpload } from './ImageUpload';
import { toast } from 'sonner';
import type { CreatorProfileUpdateParams } from '../../contracts';

interface CreateProfileFormProps {
  onSuccess: () => void;
}

export const CreateProfileForm: React.FC<CreateProfileFormProps> = ({ onSuccess }) => {
  const { address } = useAccount();
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
  const [step, setStep] = useState(1);

  const validateStep1 = () => {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

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

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!validateStep1() || !validateStep2()) {
      return;
    }

    try {
      await updateCreatorProfile(formData);
      toast.success('Profile created successfully!');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating profile:', error);
      toast.error(error?.shortMessage || 'Failed to create profile');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Step {step} of 3</span>
          <span className="text-sm text-gray-400">{Math.round((step / 3) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Step 1: Basic Information */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white mb-2">Basic Information</h3>
            <p className="text-gray-400">Let's start with your basic profile details</p>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Username *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="yourmusic_username"
              className={`w-full bg-gray-700 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.username ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {errors.username && (
              <p className="text-red-400 text-sm mt-1">{errors.username}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              This will be your unique identifier on the platform
            </p>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Display Name *
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              placeholder="Your Artist Name"
              className={`w-full bg-gray-700 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.displayName ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {errors.displayName && (
              <p className="text-red-400 text-sm mt-1">{errors.displayName}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Bio *
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell your fans about yourself and your music..."
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
        </div>
      )}

      {/* Step 2: Social Links */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white mb-2">Social Links</h3>
            <p className="text-gray-400">Connect your social media accounts (optional)</p>
          </div>

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
      )}

      {/* Step 3: Images */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white mb-2">Profile Images</h3>
            <p className="text-gray-400">Upload your profile picture and banner (optional)</p>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Profile Picture
            </label>
            <ImageUpload
              currentImage={formData.profileImageUrl}
              onImageChange={(url) => handleInputChange('profileImageUrl', url)}
              aspectRatio="square"
              placeholder="Upload profile picture"
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
              placeholder="Upload banner image"
            />
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        {step > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Back
          </button>
        ) : (
          <div></div>
        )}

        {step < 3 ? (
          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Profile...' : 'Create Profile'}
          </button>
        )}
      </div>
    </form>
  );
};

export default CreateProfileForm;