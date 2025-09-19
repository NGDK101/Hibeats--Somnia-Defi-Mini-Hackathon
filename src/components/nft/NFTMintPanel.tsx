import React, { useState, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useNFTManager } from '@/hooks/useNFTManager';
import { useGeneratedMusicContext } from '@/hooks/useGeneratedMusicContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, Upload, Coins, Tag, Clock, Hash, Zap, Image as ImageIcon, Link, X, Camera } from 'lucide-react';
import { GeneratedMusic } from '@/types/music';
import { toast } from 'sonner';
import { NFTMetadataGenerator } from '@/utils/NFTMetadataGenerator';
import { ipfsService } from '@/services/ipfsService';

interface NFTMintPanelProps {
  selectedSong?: GeneratedMusic;
  onMintSuccess?: (tokenId: string) => void;
}

export const NFTMintPanel: React.FC<NFTMintPanelProps> = ({
  selectedSong,
  onMintSuccess
}) => {
  const { address } = useAccount();
  const { generatedMusic, userCompletedTaskIds, userTaskIds, checkDuplicateName, getExistingSongByName } = useGeneratedMusicContext();
  const nftManager = useNFTManager();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<GeneratedMusic | null>(selectedSong || null);

  // Form state
  const [formData, setFormData] = useState({
    metadataURI: '',
    genre: '',
    modelUsed: 'V4',
    isRemixable: true,
    royaltyPercentage: 5,
    prompt: '',
    tags: '',
    sunoCreatedAt: Math.floor(Date.now() / 1000)
  });

  // Custom cover image state
  const [customCoverImage, setCustomCoverImage] = useState<{
    file?: File;
    url?: string;
    ipfsHash?: string;
    preview?: string;
  } | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverImageTab, setCoverImageTab] = useState<'default' | 'upload' | 'ipfs'>('default');
  const [ipfsUrl, setIpfsUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Available music for selection (only songs saved in smart contract using userTaskIds only)
  const availableMusic = generatedMusic.filter(song => {
    const hasRequiredFields = song.audioUrl && song.title && song.taskId;
    const isInContract = userTaskIds && userTaskIds.includes(song.taskId);
    
    return hasRequiredFields && isInContract;
  });

  const handleMusicSelect = (music: GeneratedMusic) => {
    setSelectedMusic(music);
    setFormData(prev => ({
      ...prev,
      prompt: music.title || '',
      genre: music.genre?.[0] || '',
      tags: music.genre?.join(', ') || ''
    }));
  };

  // Custom cover image handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image file size must be less than 10MB');
      return;
    }

    const preview = URL.createObjectURL(file);
    setCustomCoverImage({
      file,
      preview,
      url: preview
    });
    setCoverImageTab('upload');
    toast.success('Image selected successfully!');
  };

  const handleIpfsUrlImport = async () => {
    if (!ipfsUrl.trim()) {
      toast.error('Please enter an IPFS URL or hash');
      return;
    }

    try {
      setIsUploadingCover(true);
      let fullUrl = ipfsUrl.trim();

      // Convert IPFS hash to full URL if needed
      if (!fullUrl.startsWith('http') && !fullUrl.startsWith('ipfs://')) {
        fullUrl = `https://gateway.pinata.cloud/ipfs/${fullUrl}`;
      } else if (fullUrl.startsWith('ipfs://')) {
        fullUrl = fullUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
      }

      // Validate URL by trying to load the image
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error('Invalid IPFS URL or image not found');
      }

      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) {
        throw new Error('URL does not point to a valid image');
      }

      // Upload to IPFS for our own copy
      const filename = `custom_cover_${Date.now()}.jpg`;
      const uploadResponse = await ipfsService.uploadFile(blob, filename);

      setCustomCoverImage({
        url: fullUrl,
        ipfsHash: uploadResponse.IpfsHash,
        preview: fullUrl
      });
      setCoverImageTab('ipfs');
      toast.success('IPFS image imported successfully!');
    } catch (error) {
      console.error('IPFS import error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import from IPFS');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleUploadCustomImage = async () => {
    if (!customCoverImage?.file) return;

    try {
      setIsUploadingCover(true);
      const filename = `custom_cover_${Date.now()}.jpg`;
      const uploadResponse = await ipfsService.uploadFile(customCoverImage.file, filename);

      setCustomCoverImage(prev => prev ? {
        ...prev,
        ipfsHash: uploadResponse.IpfsHash
      } : null);

      toast.success('Custom cover image uploaded to IPFS!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image to IPFS');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const removeCustomCover = () => {
    if (customCoverImage?.preview) {
      URL.revokeObjectURL(customCoverImage.preview);
    }
    setCustomCoverImage(null);
    setCoverImageTab('default');
    setIpfsUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getCoverImageUrl = () => {
    if (customCoverImage?.ipfsHash) {
      return ipfsService.getGatewayUrl(customCoverImage.ipfsHash);
    }
    if (customCoverImage?.url) {
      return customCoverImage.url;
    }
    return selectedMusic?.imageUrl || '';
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedMusic) {
      newErrors.music = 'Please select a music track to mint';
    }

    // Metadata URI is only required if no custom cover image is provided
    if (!formData.metadataURI.trim() && !customCoverImage) {
      newErrors.metadataURI = 'Metadata URI is required (or provide a custom cover image)';
    }

    if (!formData.genre.trim()) {
      newErrors.genre = 'Genre is required';
    }

    if (!formData.prompt.trim()) {
      newErrors.prompt = 'Prompt is required';
    }

    if (formData.royaltyPercentage < 0 || formData.royaltyPercentage > 100) {
      newErrors.royaltyPercentage = 'Royalty percentage must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleMint = async () => {
    if (!validateForm() || !selectedMusic || !address) {
      return;
    }

    // Check for duplicate names before minting
    const isDuplicate = checkDuplicateName(selectedMusic.title);
    if (isDuplicate) {
      const existingSong = getExistingSongByName(selectedMusic.title);
      toast.error(`A song with the name "${selectedMusic.title}" already exists. Please choose a different song or rename it.`);
      return;
    }

    try {
      // Upload custom cover image if provided
      let finalCoverImageUrl = selectedMusic.imageUrl;
      if (customCoverImage && !customCoverImage.ipfsHash && customCoverImage.file) {
        await handleUploadCustomImage();
      }

      // Use custom cover image if available
      if (customCoverImage?.ipfsHash) {
        finalCoverImageUrl = ipfsService.getGatewayUrl(customCoverImage.ipfsHash);
      }

      // Create metadata with custom cover image using utility
      let metadataURI = formData.metadataURI;
      if (customCoverImage) {
        try {
          const metadata = NFTMetadataGenerator.generateMusicMetadata({
            name: selectedMusic.title,
            description: formData.prompt || selectedMusic.title,
            image: finalCoverImageUrl,
            audioUrl: selectedMusic.audioUrl,
            duration: selectedMusic.duration || 0,
            genre: formData.genre,
            creator: address,
            modelUsed: formData.modelUsed,
            prompt: formData.prompt,
            tags: formData.tags,
            sunoId: selectedMusic.id,
            taskId: selectedMusic.taskId,
            royaltyRate: formData.royaltyPercentage,
            isRemixable: formData.isRemixable,
            creationDate: new Date().toISOString(),
            customCover: true
          });

          // Validate metadata
          const validation = NFTMetadataGenerator.validateMetadata(metadata);
          if (!validation.isValid) {
            toast.error(`Metadata validation failed: ${validation.errors.join(', ')}`);
            return;
          }

          // Show upload progress
          toast.loading('Uploading metadata to IPFS...', { id: 'ipfs-upload' });

          const uploadResult = await ipfsService.uploadNFTMetadata(metadata, {
            onProgress: (stage, progress) => {
              console.log(`📤 IPFS Upload Progress: ${stage} (${progress}%)`);
            },
            retryAttempts: 3,
            useFallback: true
          });

          // Use the appropriate URI based on whether it's IPFS or fallback
          if (uploadResult.fallbackUri) {
            metadataURI = uploadResult.fallbackUri;
            toast.success('Metadata prepared successfully using fallback method!', { id: 'ipfs-upload' });
          } else {
            metadataURI = `ipfs://${uploadResult.ipfsHash}`;
            toast.success('Metadata uploaded to IPFS successfully!', { id: 'ipfs-upload' });
          }

          console.log('✅ Metadata uploaded to IPFS:', {
            ipfsHash: uploadResult.ipfsHash,
            gatewayUrl: uploadResult.gatewayUrl,
            metadataURI
          });
        } catch (metadataError) {
          console.warn('Failed to create custom metadata, using provided URI:', metadataError);
          toast.error('Failed to upload metadata to IPFS. Please check your connection and try again.');
          toast.dismiss('ipfs-upload');
          // Fall back to provided metadataURI
        }
      }

      // Use Factory minting (no authorization required)
      const mintParams = {
        aiTrackId: selectedMusic.id,
        songData: {
          title: selectedMusic.title || selectedMusic.display_name || `Song ${selectedMusic.id}`,
          artist: selectedMusic.artist || 'AI Generated',
          imageUrl: finalCoverImageUrl,
          audioUrl: selectedMusic.audioUrl,
          genre: formData.genre,
          duration: selectedMusic.duration || 0,
          prompt: formData.prompt,
          modelUsed: formData.modelUsed,
          taskId: selectedMusic.taskId,
          createdAt: selectedMusic.created_at || new Date().toISOString(),
        }
      };

      console.log('🚀 Minting NFT via Factory (no authorization required):', mintParams);
      await nftManager.handleAction('mint', mintParams);

      toast.success('NFT minting transaction initiated!');
      setIsDialogOpen(false);

      if (onMintSuccess) {
        // Note: In a real implementation, you'd get the tokenId from the transaction receipt
        onMintSuccess('pending');
      }

    } catch (error) {
      console.error('Minting failed:', error);
      toast.error('Failed to mint NFT');
    }
  };

  const resetForm = () => {
    setSelectedMusic(null);
    setFormData({
      metadataURI: '',
      genre: '',
      modelUsed: 'V4',
      isRemixable: true,
      royaltyPercentage: 5,
      prompt: '',
      tags: '',
      sunoCreatedAt: Math.floor(Date.now() / 1000)
    });
    setErrors({});
    
    // Reset custom cover image
    removeCustomCover();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Mint Music NFT
          </CardTitle>
          <CardDescription>
            Transform your generated music into unique NFTs on the blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="w-full"
                size="lg"
                disabled={!address}
                onClick={() => setIsDialogOpen(true)}
              >
                <Zap className="w-4 h-4 mr-2" />
                Mint NFT
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Mint Music NFT</DialogTitle>
                <DialogDescription>
                  Create a unique NFT from your generated music track
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Music Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Select Music Track</Label>
                  {availableMusic.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No music tracks available for minting</p>
                      <p className="text-sm">Generate some music first!</p>
                    </div>
                  ) : (
                    <div className="grid gap-2 max-h-40 overflow-y-auto">
                      {availableMusic.map((music) => (
                        <div
                          key={music.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedMusic?.id === music.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => handleMusicSelect(music)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{music.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {music.artist} • {music.genre?.join(', ')}
                              </p>
                            </div>
                            <Badge variant="secondary">
                              <Clock className="w-3 h-3 mr-1" />
                              {Math.floor((music.duration || 0) / 60)}:{((music.duration || 0) % 60).toString().padStart(2, '0')}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.music && (
                    <p className="text-sm text-destructive">{errors.music}</p>
                  )}
                </div>

                {/* Selected Music Preview */}
                {selectedMusic && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 bg-primary/10 rounded-lg overflow-hidden">
                          <img
                            src={getCoverImageUrl()}
                            alt="Cover"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://via.placeholder.com/400x400/1e1e1e/ffffff?text=" + encodeURIComponent(selectedMusic.title || "Music");
                            }}
                          />
                          {customCoverImage && (
                            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{selectedMusic.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedMusic.artist} • Task ID: {selectedMusic.taskId}
                          </p>
                          {customCoverImage && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ Custom cover image selected
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Custom Cover Image Section */}
                {selectedMusic && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      <Label className="text-base font-medium">Custom Cover Image (Optional)</Label>
                    </div>

                    <Tabs value={coverImageTab} onValueChange={(value) => setCoverImageTab(value as any)}>
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="default">Default</TabsTrigger>
                        <TabsTrigger value="upload">Upload</TabsTrigger>
                        <TabsTrigger value="ipfs">IPFS</TabsTrigger>
                      </TabsList>

                      <TabsContent value="default" className="space-y-4">
                        <div className="text-center py-6">
                          <div className="w-24 h-24 mx-auto bg-muted rounded-lg flex items-center justify-center mb-3">
                            <img
                              src={selectedMusic.imageUrl}
                              alt="Default cover"
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "https://via.placeholder.com/400x400/1e1e1e/ffffff?text=" + encodeURIComponent(selectedMusic.title || "Music");
                              }}
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">Using default cover image from Hibeats</p>
                        </div>
                      </TabsContent>

                      <TabsContent value="upload" className="space-y-4">
                        <div className="text-center py-6">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          
                          {customCoverImage?.preview && coverImageTab === 'upload' ? (
                            <div className="space-y-3">
                              <div className="relative w-24 h-24 mx-auto">
                                <img
                                  src={customCoverImage.preview}
                                  alt="Custom cover"
                                  className="w-full h-full object-cover rounded-lg"
                                />
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                                  onClick={removeCustomCover}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                              <div className="space-y-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  <Camera className="w-4 h-4 mr-2" />
                                  Change Image
                                </Button>
                                {!customCoverImage.ipfsHash && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={handleUploadCustomImage}
                                    disabled={isUploadingCover}
                                  >
                                    {isUploadingCover ? (
                                      <>
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                                        Uploading...
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload to IPFS
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="w-24 h-24 mx-auto bg-muted rounded-lg flex items-center justify-center">
                                <Upload className="w-8 h-8 text-muted-foreground" />
                              </div>
                              <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                Choose Image
                              </Button>
                              <p className="text-xs text-muted-foreground">
                                Supports JPG, PNG, GIF (max 10MB)
                              </p>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="ipfs" className="space-y-4">
                        <div className="text-center py-6">
                          {customCoverImage?.preview && coverImageTab === 'ipfs' ? (
                            <div className="space-y-3">
                              <div className="relative w-24 h-24 mx-auto">
                                <img
                                  src={customCoverImage.preview}
                                  alt="IPFS cover"
                                  className="w-full h-full object-cover rounded-lg"
                                />
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                                  onClick={removeCustomCover}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                              <p className="text-sm text-muted-foreground">IPFS image imported successfully!</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="w-24 h-24 mx-auto bg-muted rounded-lg flex items-center justify-center">
                                <Link className="w-8 h-8 text-muted-foreground" />
                              </div>
                              <div className="space-y-2">
                                <Input
                                  placeholder="Enter IPFS hash or URL (e.g., Qm... or ipfs://...)"
                                  value={ipfsUrl}
                                  onChange={(e) => setIpfsUrl(e.target.value)}
                                />
                                <Button
                                  variant="default"
                                  onClick={handleIpfsUrlImport}
                                  disabled={isUploadingCover || !ipfsUrl.trim()}
                                >
                                  {isUploadingCover ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                      Importing...
                                    </>
                                  ) : (
                                    <>
                                      <Link className="w-4 h-4 mr-2" />
                                      Import from IPFS
                                    </>
                                  )}
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Enter IPFS hash, ipfs:// URL, or gateway URL
                              </p>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="metadataURI">
                      Metadata URI {customCoverImage ? '(Optional - will be auto-generated)' : '(*)'}
                    </Label>
                    <Input
                      id="metadataURI"
                      placeholder={customCoverImage ? "Auto-generated from custom cover" : "ipfs://... or https://..."}
                      value={formData.metadataURI}
                      onChange={(e) => setFormData(prev => ({ ...prev, metadataURI: e.target.value }))}
                      disabled={!!customCoverImage}
                    />
                    {customCoverImage && (
                      <p className="text-xs text-green-600">
                        ✓ Metadata will be auto-generated with your custom cover image
                      </p>
                    )}
                    {errors.metadataURI && (
                      <p className="text-sm text-destructive">{errors.metadataURI}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="genre">Genre *</Label>
                    <Select
                      value={formData.genre}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, genre: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select genre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pop">Pop</SelectItem>
                        <SelectItem value="rock">Rock</SelectItem>
                        <SelectItem value="hip-hop">Hip Hop</SelectItem>
                        <SelectItem value="electronic">Electronic</SelectItem>
                        <SelectItem value="jazz">Jazz</SelectItem>
                        <SelectItem value="classical">Classical</SelectItem>
                        <SelectItem value="country">Country</SelectItem>
                        <SelectItem value="rnb">R&B</SelectItem>
                        <SelectItem value="reggae">Reggae</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.genre && (
                      <p className="text-sm text-destructive">{errors.genre}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="modelUsed">AI Model</Label>
                    <Select
                      value={formData.modelUsed}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, modelUsed: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="V3_5">Hibeats v3.5</SelectItem>
                        <SelectItem value="V4">Hibeats v4</SelectItem>
                        <SelectItem value="V4_5">Hibeats v4.5</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="royaltyPercentage">Royalty Percentage *</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="royaltyPercentage"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.royaltyPercentage}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          royaltyPercentage: parseInt(e.target.value) || 0
                        }))}
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                    {errors.royaltyPercentage && (
                      <p className="text-sm text-destructive">{errors.royaltyPercentage}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prompt">Prompt/Description *</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe your music track..."
                    value={formData.prompt}
                    onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                    rows={3}
                  />
                  {errors.prompt && (
                    <p className="text-sm text-destructive">{errors.prompt}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    placeholder="electronic, dance, upbeat (comma separated)"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isRemixable"
                    checked={formData.isRemixable}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRemixable: checked }))}
                  />
                  <Label htmlFor="isRemixable">Allow remixing</Label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    className="flex-1"
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={handleMint}
                    disabled={nftManager.isLoading || !selectedMusic}
                    className="flex-1"
                  >
                    {nftManager.isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Minting...
                      </>
                    ) : (
                      <>
                        <Coins className="w-4 h-4 mr-2" />
                        Mint NFT
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {!address && (
            <p className="text-sm text-muted-foreground text-center mt-2">
              Please connect your wallet to mint NFTs
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
