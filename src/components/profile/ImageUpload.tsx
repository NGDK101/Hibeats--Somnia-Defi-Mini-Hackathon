import React, { useState, useRef } from 'react';
import { toast } from 'sonner';

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (url: string) => void;
  aspectRatio: 'square' | 'banner';
  placeholder: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImage,
  onImageChange,
  aspectRatio,
  placeholder,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Create preview URL
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Upload to IPFS via Pinata
      const imageUrl = await uploadToIPFS(file);

      if (imageUrl) {
        onImageChange(imageUrl);
        toast.success('Image uploaded successfully!');
      } else {
        throw new Error('Failed to get image URL');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      setPreviewUrl(currentImage || null);
    } finally {
      setIsUploading(false);
    }
  };

  const uploadToIPFS = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const pinataApiKey = import.meta.env.VITE_PINATA_API_KEY;
      const pinataSecretKey = import.meta.env.VITE_PINATA_API_SECRET;

      if (!pinataApiKey || !pinataSecretKey) {
        // Fallback: create a local object URL for development
        console.warn('Pinata credentials not found, using local preview');
        return URL.createObjectURL(file);
      }

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key': pinataApiKey,
          'pinata_secret_api_key': pinataSecretKey,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload to IPFS');
      }

      const result = await response.json();
      return `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
    } catch (error) {
      console.error('IPFS upload error:', error);
      // Fallback to local object URL
      return URL.createObjectURL(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const aspectClasses = {
    square: 'aspect-square',
    banner: 'aspect-[3/1]',
  };

  return (
    <div className="space-y-4">
      {/* Current/Preview Image */}
      <div className={`w-full ${aspectClasses[aspectRatio]} bg-gray-700 rounded-lg overflow-hidden relative`}>
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {/* Remove Button */}
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 text-sm transition-colors"
              disabled={isUploading}
            >
              ✕
            </button>
            {/* Upload Overlay */}
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-sm">Uploading...</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl text-gray-500 mb-2">📷</div>
              <p className="text-gray-400 text-sm">{placeholder}</p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Button */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition-colors"
        >
          {isUploading ? 'Uploading...' : previewUrl ? 'Change Image' : 'Upload Image'}
        </button>

        {previewUrl && (
          <button
            type="button"
            onClick={handleRemoveImage}
            disabled={isUploading}
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Remove
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />

      {/* Guidelines */}
      <div className="text-xs text-gray-500">
        <p>• Supported formats: JPG, PNG, GIF</p>
        <p>• Maximum size: 5MB</p>
        <p>• Recommended: {aspectRatio === 'square' ? '500x500px' : '1200x400px'}</p>
      </div>
    </div>
  );
};

export default ImageUpload;