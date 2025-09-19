import React, { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useNFTManager } from '@/hooks/useNFTManager';
import { useGeneratedMusicContext } from '@/hooks/useGeneratedMusicContext';
import { useFactoryMint } from '@/hooks/useFactoryMint';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Music, Upload, Coins, Tag, Clock, Hash, Zap, Image as ImageIcon, Link, X, Camera, CheckCircle, ArrowRight, ArrowLeft, List, Home, FileText, Loader2, Calendar } from 'lucide-react';
import { GeneratedMusic } from '@/types/music';
import { toast } from 'sonner';
import { NFTMetadataGenerator } from '@/utils/NFTMetadataGenerator';
import { ipfsService } from '@/services/ipfsService';
import { CONTRACT_ADDRESSES } from '@/contracts';

interface NFTMintRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSong: GeneratedMusic | null;
  onMintSuccess?: (tokenId: string) => void;
}

type MintStep = 'metadata' | 'minting' | 'complete' | 'nft-display';

export const NFTMintRoadmapModal: React.FC<NFTMintRoadmapModalProps> = ({
  isOpen,
  onClose,
  selectedSong,
  onMintSuccess
}) => {
  const { address } = useAccount();
  const nftManager = useNFTManager();
  const factoryMint = useFactoryMint();
  const [currentStep, setCurrentStep] = useState<MintStep>('metadata');
  const [progress, setProgress] = useState(0);
  const [mintedTokenId, setMintedTokenId] = useState<string | null>(null);
  const [mintedNFT, setMintedNFT] = useState<any>(null);

  // Metadata upload state
  const [isUploadingMetadata, setIsUploadingMetadata] = useState(false);
  const [uploadedMetadataCID, setUploadedMetadataCID] = useState<string | null>(null);
  const [metadataURI, setMetadataURI] = useState<string>('');

  // Form state for metadata creation (matching GenerateMetadataPage)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    audioUrl: '',
    duration: 0,
    genre: '',
    creator: '',
    modelUsed: 'suno',
    prompt: '',
    tags: '',
    royaltyRate: 5,
    isRemixable: true
  });

  // Minting form state
  const [mintingFormData, setMintingFormData] = useState({
    genre: '',
    modelUsed: 'suno',
    isRemixable: true,
    royaltyRate: 5,
    prompt: '',
    tags: ''
  });

  // Transaction data state
  const [transactionData, setTransactionData] = useState<{
    hash?: string;
    blockNumber?: number;
    gasUsed?: string;
    timestamp?: number;
  } | null>(null);

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

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('metadata');
      setProgress(25);
      setMintedTokenId(null);
      setMintedNFT(null);
      setUploadedMetadataCID(null);
      setMetadataURI('');
      setIsUploadingMetadata(false);
    }
  }, [isOpen]);

  // Auto-populate form data and check for existing IPFS metadata
  useEffect(() => {
    if (selectedSong && isOpen) {
      // Check if song already has IPFS metadata
      if (selectedSong.ipfsHash && selectedSong.metadata) {
        // Use existing IPFS metadata
        const metadataUri = `ipfs://${selectedSong.ipfsHash}`;
        setMetadataURI(metadataUri);
        setUploadedMetadataCID(selectedSong.ipfsHash);

        // Populate form with existing metadata
        setFormData({
          name: selectedSong.metadata.name || selectedSong.title || '',
          description: selectedSong.metadata.description || `AI-generated music: ${selectedSong.title || 'Untitled'}`,
          image: selectedSong.metadata.image || selectedSong.imageUrl || '',
          audioUrl: selectedSong.metadata.audio_url || selectedSong.audioUrl || '',
          duration: selectedSong.metadata.duration || selectedSong.duration || 30,
          genre: Array.isArray(selectedSong.metadata.genre) ? selectedSong.metadata.genre[0] : selectedSong.metadata.genre?.[0] || Array.isArray(selectedSong.genre) ? selectedSong.genre[0] : selectedSong.genre || 'Electronic',
          creator: selectedSong.metadata.created_by || selectedSong.artist || selectedSong.displayName || 'AI Generated',
          modelUsed: selectedSong.metadata.model_used || 'suno',
          prompt: selectedSong.metadata.prompt || `Generate ${Array.isArray(selectedSong.genre) ? selectedSong.genre[0] : selectedSong.genre || 'Electronic'} music`,
          tags: Array.isArray(selectedSong.metadata.genre) ? selectedSong.metadata.genre.join(', ') : selectedSong.metadata.genre?.[0] || Array.isArray(selectedSong.genre) ? selectedSong.genre.join(', ') : selectedSong.genre || 'Electronic',
          royaltyRate: 5,
          isRemixable: true
        });

        // Skip to minting step since metadata already exists
        setCurrentStep('minting');
        setProgress(75);

        toast.success('Found existing IPFS metadata. Ready to mint!');
      } else {
        // No existing metadata, auto-populate form for new metadata creation
        setFormData({
          name: selectedSong.title || '',
          description: `AI-generated music: ${selectedSong.title || 'Untitled'}`,
          image: selectedSong.imageUrl || '',
          audioUrl: selectedSong.audioUrl || '',
          duration: selectedSong.duration || 30,
          genre: Array.isArray(selectedSong.genre) ? selectedSong.genre[0] : selectedSong.genre || 'Electronic',
          creator: selectedSong.artist || selectedSong.displayName || 'AI Generated',
          modelUsed: 'suno',
          prompt: `Generate ${Array.isArray(selectedSong.genre) ? selectedSong.genre[0] : selectedSong.genre || 'Electronic'} music`,
          tags: Array.isArray(selectedSong.genre) ? selectedSong.genre.join(', ') : selectedSong.genre || 'Electronic',
          royaltyRate: 5,
          isRemixable: true
        });

        // Start from metadata step
        setCurrentStep('metadata');
        setProgress(25);
      }

      // Always populate minting form
      setMintingFormData({
        genre: Array.isArray(selectedSong.genre) ? selectedSong.genre[0] : selectedSong.genre || 'Electronic',
        modelUsed: selectedSong.metadata?.model_used || 'suno',
        isRemixable: true,
        royaltyRate: 5,
        prompt: selectedSong.metadata?.prompt || `Generate ${Array.isArray(selectedSong.genre) ? selectedSong.genre[0] : selectedSong.genre || 'Electronic'} music`,
        tags: Array.isArray(selectedSong.genre) ? selectedSong.genre.join(', ') : selectedSong.genre || 'Electronic'
      });
    }
  }, [selectedSong, isOpen]);

  // Update minted NFT data when transaction data becomes available
  useEffect(() => {
    const transactionHash = nftManager.factoryMint.hash;
    if (mintedNFT && transactionHash) {
      setMintedNFT(prev => ({
        ...prev,
        transactionHash: transactionHash || prev.transactionHash,
        blockNumber: 0, // Will be updated when available
        gasUsed: '0' // Will be updated when available
      }));
    }
  }, [nftManager.factoryMint.hash, mintedNFT]);

  // Handle transaction confirmation and move to complete step
  useEffect(() => {
    const transactionHash = nftManager.factoryMint.hash;
    const isLoading = nftManager.factoryMint.isLoading;
    const isSuccess = nftManager.factoryMint.isSuccess;

    if (currentStep === 'minting' && transactionHash && !isLoading && isSuccess) {
      // Transaction has been confirmed
      toast.dismiss('mint-wait');
      toast.success('🎉 NFT minted successfully!');

      // Get the next token ID (estimated)
      const nextTokenId = BigInt(Date.now()); // Use timestamp as rough token ID for display

      // Create metadata object for display
      const metadata = {
        name: formData.name,
        description: formData.description,
        image: formData.image,
        animation_url: formData.audioUrl,
        attributes: [
          {
            trait_type: "Genre",
            value: mintingFormData.genre
          },
          {
            trait_type: "Model",
            value: mintingFormData.modelUsed
          },
          {
            trait_type: "Royalty Percentage",
            value: mintingFormData.royaltyRate
          },
          {
            trait_type: "Remixable",
            value: mintingFormData.isRemixable ? "Yes" : "No"
          }
        ]
      };

      // Set real transaction data
      const realTransactionData = {
        hash: transactionHash,
        blockNumber: 0, // Will be updated when blockchain data is available
        gasUsed: '0', // Will be updated when blockchain data is available
        timestamp: Date.now()
      };

      setMintedTokenId(nextTokenId.toString());
      setTransactionData(realTransactionData);
      setMintedNFT({
        tokenId: nextTokenId.toString(),
        metadata,
        song: selectedSong,
        mintedAt: new Date().toISOString(),
        transactionHash: realTransactionData.hash,
        contractAddress: CONTRACT_ADDRESSES.HIBEATS_NFT,
        blockNumber: realTransactionData.blockNumber,
        gasUsed: realTransactionData.gasUsed
      });

      setCurrentStep('complete');

      // Auto-advance to NFT display after a short delay
      setTimeout(() => {
        setCurrentStep('nft-display');
      }, 2000);

      if (onMintSuccess) {
        onMintSuccess(nextTokenId.toString());
      }
    }
  }, [currentStep, nftManager.factoryMint.hash, nftManager.factoryMint.isLoading, nftManager.factoryMint.isSuccess, formData, mintingFormData, selectedSong, onMintSuccess]);

  // Initialize form data when song is selected with detailed information
  useEffect(() => {
    if (selectedSong) {
      // Create a more detailed description based on song metadata
      const detailedDescription = selectedSong.metadata?.description ||
        `${selectedSong.title} - An AI-generated music track in ${selectedSong.genre?.[0] || 'various'} genre. Created using advanced AI music generation technology with ${selectedSong.metadata?.model_used || 'Hibeats v4'} model. Duration: ${Math.floor((selectedSong.duration || 0) / 60)}:${((selectedSong.duration || 0) % 60).toString().padStart(2, '0')}. Perfect for ${selectedSong.genre?.[0] || 'music'} enthusiasts and collectors.`;

      // Create a comprehensive prompt description
      const promptDescription = selectedSong.metadata?.description ||
        `AI-generated ${selectedSong.genre?.[0] || 'music'} track titled "${selectedSong.title}" with ${Math.floor((selectedSong.duration || 0) / 60)}:${((selectedSong.duration || 0) % 60).toString().padStart(2, '0')} duration, created using ${selectedSong.metadata?.model_used || 'advanced AI'} technology. Features ${selectedSong.genre?.join(' and ') || 'various musical elements'} for an immersive listening experience.`;

      setFormData({
        name: selectedSong.title || '',
        description: detailedDescription,
        image: selectedSong.imageUrl || selectedSong.metadata?.image_url || '',
        audioUrl: selectedSong.audioUrl || '',
        duration: selectedSong.duration || 0,
        genre: selectedSong.genre?.[0] || '',
        creator: address || '', // Use connected wallet address
        modelUsed: selectedSong.metadata?.model_used || 'V4',
        prompt: promptDescription,
        tags: selectedSong.genre?.join(', ') || selectedSong.metadata?.tags ||
          `${selectedSong.genre?.[0] || 'music'}, ai-generated, ${selectedSong.metadata?.model_used || 'V4'}, ${Math.floor((selectedSong.duration || 0) / 60)}min, nft, digital-art, music-nft`,
        royaltyRate: 5,
        isRemixable: true
      });

      // Initialize minting form data
      setMintingFormData({
        genre: selectedSong.genre?.[0] || '',
        modelUsed: selectedSong.metadata?.model_used || 'V4',
        isRemixable: true,
        royaltyRate: 5,
        prompt: promptDescription,
        tags: selectedSong.genre?.join(', ') || selectedSong.metadata?.tags ||
          `${selectedSong.genre?.[0] || 'music'}, ai-generated, ${selectedSong.metadata?.model_used || 'V4'}, ${Math.floor((selectedSong.duration || 0) / 60)}min, nft, digital-art, music-nft`
      });

      // Reset upload state when new song is selected
      setUploadedMetadataCID(null);
      setMetadataURI('');
    }
  }, [selectedSong, address]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.creator.trim()) {
      newErrors.creator = 'Creator address is required';
    }
    if (!formData.image.trim()) {
      newErrors.image = 'Image URL is required';
    }
    if (!formData.audioUrl.trim()) {
      newErrors.audioUrl = 'Audio URL is required';
    }
    if (!formData.genre.trim()) {
      newErrors.genre = 'Genre is required';
    }
    if (!formData.prompt.trim()) {
      newErrors.prompt = 'Prompt is required';
    }
    if (formData.duration <= 0) {
      newErrors.duration = 'Duration must be greater than 0';
    }
    if (!selectedSong) {
      newErrors.music = 'Please select a music track to mint';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = async () => {
    if (currentStep === 'metadata') {
      if (!validateForm()) {
        toast.error('Please fill in all required fields');
        return;
      }

      // If metadata is already uploaded, just proceed to minting
      if (uploadedMetadataCID && metadataURI) {
        setCurrentStep('minting');
        return;
      }

      try {
        setIsUploadingMetadata(true);

        // Generate metadata using the same structure as GenerateMetadataPage
        const metadata = NFTMetadataGenerator.generateMusicMetadata({
          name: formData.name,
          description: formData.description,
          image: formData.image,
          audioUrl: formData.audioUrl,
          duration: formData.duration,
          genre: formData.genre,
          creator: formData.creator,
          modelUsed: formData.modelUsed,
          prompt: formData.prompt,
          tags: formData.tags,
          royaltyRate: formData.royaltyRate,
          isRemixable: formData.isRemixable,
          creationDate: new Date().toISOString()
        });

        // Validate metadata
        const validation = NFTMetadataGenerator.validateMetadata(metadata);
        if (!validation.isValid) {
          throw new Error(`Metadata validation failed: ${validation.errors.join(', ')}`);
        }

        // Upload metadata to IPFS/Pinata
        const metadataResult = await ipfsService.uploadMetadata(metadata);

        // Store the results
        const cid = metadataResult.IpfsHash || metadataResult.cid;
        const metadataUri = `ipfs://${cid}`;

        setUploadedMetadataCID(cid);
        setMetadataURI(metadataUri);

        toast.success('Metadata uploaded to Pinata successfully!');

        // Move to minting step
        setCurrentStep('minting');

      } catch (error) {
        toast.error(`Failed to upload metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsUploadingMetadata(false);
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'minting') {
      setCurrentStep('metadata');
    } else if (currentStep === 'complete') {
      setCurrentStep('minting');
    }
  };

  const handleMintNFT = async () => {
    if (!selectedSong || !metadataURI) {
      toast.error('Metadata URI is required. Please complete the metadata step first.');
      return;
    }

    try {
      // Mint NFT using the pre-uploaded metadata URI
      const mintParams = {
        to: address || '',
        sunoId: selectedSong.id || selectedSong.metadata?.suno_id || '',
        taskId: selectedSong.version ? `${selectedSong.taskId}_${selectedSong.version}` : selectedSong.taskId || selectedSong.id || '',
        metadataURI: metadataURI,
        genre: mintingFormData.genre,
        duration: selectedSong.duration || 0,
        modelUsed: mintingFormData.modelUsed,
        isRemixable: mintingFormData.isRemixable,
        royaltyPercentage: mintingFormData.royaltyRate,
        prompt: mintingFormData.prompt,
        tags: mintingFormData.tags,
        sunoCreatedAt: Math.floor(Date.now() / 1000),
        customCoverImage: formData.image
      };

      // Start the minting process via Factory (no authorization required)
      await nftManager.handleAction('mint', {
        aiTrackId: selectedSong.id,
        songData: {
          title: selectedSong.title || selectedSong.display_name || `Song ${selectedSong.id}`,
          artist: selectedSong.artist || 'AI Generated',
          imageUrl: formData.image,
          audioUrl: selectedSong.audioUrl,
          genre: mintingFormData.genre,
          duration: selectedSong.duration || 0,
          prompt: mintingFormData.prompt,
          modelUsed: mintingFormData.modelUsed,
          taskId: selectedSong.taskId || '',
          createdAt: selectedSong.createdAt || new Date().toISOString(),
        }
      });

      // Wait for transaction to be confirmed
      toast.loading('Waiting for transaction confirmation...', { id: 'mint-wait' });

      // The transaction confirmation will be handled by the useEffect in the hook
      // We'll move to complete step when transaction is successful

    } catch (error) {
      toast.error(`Failed to mint NFT: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleListNFT = () => {
    // TODO: Implement NFT listing functionality
    toast.info('NFT listing feature coming soon!');
  };

  const handleBackToLibrary = () => {
    onClose();
    // Reset state
    setCurrentStep('metadata');
    setProgress(0);
    setMintedTokenId(null);
    setMintedNFT(null);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {[
          { step: 'metadata', label: uploadedMetadataCID ? 'Metadata Uploaded' : 'Create Metadata', icon: Upload },
          { step: 'minting', label: 'Mint NFT', icon: Coins },
          { step: 'complete', label: 'Complete', icon: CheckCircle },
          { step: 'nft-display', label: 'NFT Ready', icon: Music }
        ].map((item, index) => {
          const Icon = item.icon;
          const isActive = currentStep === item.step;
          const isCompleted = (item.step === 'metadata' && uploadedMetadataCID) ||
                             (['minting', 'complete', 'nft-display'].includes(item.step) && currentStep !== 'metadata');

          return (
            <div key={item.step} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                isCompleted
                  ? 'bg-green-500 border-green-500 text-white'
                  : isActive
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-gray-700 border-gray-600 text-gray-400'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`ml-2 text-sm font-medium ${
                isActive ? 'text-blue-400' : isCompleted ? 'text-green-400' : 'text-gray-400'
              }`}>
                {item.label}
              </span>
              {index < 3 && (
                <ArrowRight className={`w-4 h-4 ml-4 ${
                  isCompleted ? 'text-green-400' : 'text-gray-600'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderMetadataStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">Create NFT Metadata</h3>
        <p className="text-gray-400">Fill in the details for your music NFT (same as Generate page)</p>
      </div>

      {/* Song Info Display */}
      {selectedSong && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Music className="w-5 h-5 mr-2" />
              Selected Song
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <img
                src={selectedSong.imageUrl}
                alt={selectedSong.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <h4 className="text-white font-medium">{selectedSong.title}</h4>
                <p className="text-gray-400 text-sm">{selectedSong.artist || 'Unknown Artist'}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {selectedSong.genre?.[0] || 'Unknown'}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    {Math.floor((selectedSong.duration || 0) / 60)}:{((selectedSong.duration || 0) % 60).toString().padStart(2, '0')}
                  </span>
                  {selectedSong.metadata?.model_used && (
                    <Badge variant="outline" className="text-xs text-purple-300 border-purple-300">
                      {selectedSong.metadata.model_used}
                    </Badge>
                  )}
                </div>
                {selectedSong.metadata?.description && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                    {selectedSong.metadata.description}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

                {/* Upload Results */}
          {uploadedMetadataCID && metadataURI && (
            <Card className="bg-green-900/20 border-green-500/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                  Metadata Uploaded Successfully
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label className="text-white text-sm">IPFS CID</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={uploadedMetadataCID}
                        readOnly
                        className="bg-gray-700 border-gray-600 text-white text-sm font-mono"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(uploadedMetadataCID);
                          toast.success('CID copied to clipboard!');
                        }}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-white text-sm">Metadata URI</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={metadataURI}
                        readOnly
                        className="bg-gray-700 border-gray-600 text-white text-sm font-mono"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(metadataURI);
                          toast.success('Metadata URI copied to clipboard!');
                        }}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-white text-sm">Gateway URL</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={`https://gateway.pinata.cloud/ipfs/${uploadedMetadataCID}`}
                        readOnly
                        className="bg-gray-700 border-gray-600 text-white text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          window.open(`https://gateway.pinata.cloud/ipfs/${uploadedMetadataCID}`, '_blank');
                        }}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata Form */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            NFT Metadata Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name and Creator */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-white">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Song title (auto-filled from selected song)"
                className="bg-gray-700 border-gray-600 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">Song title from your music library</p>
              {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="creator" className="text-white">Creator Address *</Label>
              <Input
                id="creator"
                value={formData.creator}
                onChange={(e) => setFormData(prev => ({ ...prev, creator: e.target.value }))}
                placeholder="0x..."
                className="bg-gray-700 border-gray-600 text-white"
              />
              {errors.creator && <p className="text-red-400 text-sm mt-1">{errors.creator}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-white">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed description of your song (auto-generated from song details)"
              rows={3}
              className="bg-gray-700 border-gray-600 text-white"
            />
            <p className="text-xs text-gray-400 mt-1">Auto-generated description including genre, model, duration, and musical characteristics</p>
            {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Image and Audio URLs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="image" className="text-white">Image URL *</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                placeholder="IPFS or HTTP URL for NFT artwork (auto-filled from song data)"
                className="bg-gray-700 border-gray-600 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">Artwork image for your NFT (will be uploaded to IPFS)</p>
              {errors.image && <p className="text-red-400 text-sm mt-1">{errors.image}</p>}
            </div>
            <div>
              <Label htmlFor="audioUrl" className="text-white">Audio URL *</Label>
              <Input
                id="audioUrl"
                value={formData.audioUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, audioUrl: e.target.value }))}
                placeholder="IPFS or HTTP URL for song audio (auto-filled from song data)"
                className="bg-gray-700 border-gray-600 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">Audio file for your music NFT (will be uploaded to IPFS)</p>
              {errors.audioUrl && <p className="text-red-400 text-sm mt-1">{errors.audioUrl}</p>}
            </div>
          </div>

          {/* Genre, Duration, Model */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="genre" className="text-white">Genre *</Label>
              <Input
                id="genre"
                value={formData.genre}
                onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                placeholder="Music genre (auto-filled from song data)"
                className="bg-gray-700 border-gray-600 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">Musical genre of your song</p>
              {errors.genre && <p className="text-red-400 text-sm mt-1">{errors.genre}</p>}
            </div>
            <div>
              <Label htmlFor="duration" className="text-white">Duration (seconds) *</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                placeholder="Song duration in seconds (auto-filled from song data)"
                className="bg-gray-700 border-gray-600 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">Length of your music track</p>
              {errors.duration && <p className="text-red-400 text-sm mt-1">{errors.duration}</p>}
            </div>
            <div>
              <Label htmlFor="modelUsed" className="text-white">Model Used</Label>
              <Select value={formData.modelUsed} onValueChange={(value) => setFormData(prev => ({ ...prev, modelUsed: value }))}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="AI model used (auto-selected from song data)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="V3_5">Hibeats v3.5</SelectItem>
                  <SelectItem value="V4">Hibeats v4</SelectItem>
                  <SelectItem value="V4_5">Hibeats v4.5</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400 mt-1">AI model that generated this music</p>
            </div>
          </div>

          {/* Prompt */}
          <div>
            <Label htmlFor="prompt" className="text-white">Prompt *</Label>
            <Textarea
              id="prompt"
              value={formData.prompt}
              onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
              placeholder="AI generation prompt used to create this song (auto-filled from song data)"
              rows={2}
              className="bg-gray-700 border-gray-600 text-white"
            />
            <p className="text-xs text-gray-400 mt-1">Original AI prompt that generated this music piece</p>
            {errors.prompt && <p className="text-red-400 text-sm mt-1">{errors.prompt}</p>}
          </div>

          {/* Tags and Royalty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tags" className="text-white">Tags</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="Genre, model, duration, mood tags (auto-generated from song data)"
                className="bg-gray-700 border-gray-600 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">Auto-generated tags including genre, AI model, duration, and musical style</p>
            </div>
            <div>
              <Label htmlFor="royaltyRate" className="text-white">Royalty Rate (%)</Label>
              <Input
                id="royaltyRate"
                type="number"
                value={formData.royaltyRate}
                onChange={(e) => setFormData(prev => ({ ...prev, royaltyRate: parseFloat(e.target.value) || 0 }))}
                min="0"
                max="10"
                step="0.1"
                className="bg-gray-700 border-gray-600 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">Percentage of secondary sales you receive (0-10%)</p>
            </div>
          </div>

          {/* Remixable Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isRemixable"
              checked={formData.isRemixable}
              onChange={(e) => setFormData(prev => ({ ...prev, isRemixable: e.target.checked }))}
              className="rounded border-gray-600"
            />
            <Label htmlFor="isRemixable" className="text-white">Allow remixing</Label>
            <p className="text-xs text-gray-400">Allow other creators to remix your music (recommended for collaboration)</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleNextStep}
          disabled={isUploadingMetadata}
          className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
        >
          {isUploadingMetadata ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Uploading to Pinata...
            </>
          ) : uploadedMetadataCID ? (
            <>
              Proceed to Mint
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          ) : (
            <>
              Create Metadata
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderMintingStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">Configure NFT Minting</h3>
        <p className="text-gray-400">Review your NFT details and adjust parameters before minting</p>
      </div>

      {/* NFT Preview Card - Like OpenSea */}
      <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/30">
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <h4 className="text-lg font-semibold text-white">NFT Preview</h4>
            <p className="text-gray-400 text-sm">How your NFT will appear on marketplaces</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* NFT Image Preview */}
            <div className="flex-1">
              <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden border border-gray-700">
                {formData.image ? (
                  <img
                    src={formData.image}
                    alt={formData.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Music className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-400">No image available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Audio Preview */}
              {formData.audioUrl && (
                <div className="mt-3">
                  <Label className="text-white text-sm mb-2 block">Audio Preview</Label>
                  <audio
                    controls
                    className="w-full h-8 bg-gray-700 rounded"
                    preload="none"
                  >
                    <source src={formData.audioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>

            {/* NFT Details Preview */}
            <div className="flex-1 space-y-4">
              <div>
                <h5 className="text-2xl font-bold text-white mb-2">{formData.name || 'NFT Title'}</h5>
                <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                  {formData.description || 'NFT description will appear here...'}
                </p>
              </div>

              {/* Creator Info */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {formData.creator ? formData.creator.slice(0, 2).toUpperCase() : 'C'}
                  </span>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Created by</p>
                  <p className="text-white text-sm font-medium">
                    {formData.creator ? `${formData.creator.slice(0, 6)}...${formData.creator.slice(-4)}` : 'Creator Address'}
                  </p>
                </div>
              </div>

              {/* Properties/Traits like OpenSea */}
              <div>
                <h6 className="text-white text-sm font-medium mb-2">Properties</h6>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                    <p className="text-gray-400 text-xs">Genre</p>
                    <p className="text-white text-sm font-medium">{mintingFormData.genre || 'Not set'}</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                    <p className="text-gray-400 text-xs">AI Model</p>
                    <p className="text-white text-sm font-medium">{mintingFormData.modelUsed || 'Not set'}</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                    <p className="text-gray-400 text-xs">Royalty</p>
                    <p className="text-white text-sm font-medium">{mintingFormData.royaltyRate}%</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                    <p className="text-gray-400 text-xs">Remixable</p>
                    <p className="text-white text-sm font-medium">{mintingFormData.isRemixable ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>

              {/* Chain & Collection Info */}
              <div className="border-t border-gray-700 pt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Blockchain</span>
                  <span className="text-white flex items-center">
                    <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                    Somnia Testnet
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-400">Collection</span>
                  <span className="text-white">HiBeats Music NFTs</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Minting Parameters Form */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Coins className="w-5 h-5 mr-2" />
            Minting Parameters
          </CardTitle>
          <CardDescription className="text-gray-400">
            These parameters will be stored on-chain with your NFT
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Genre and Model */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mint-genre" className="text-white">Genre *</Label>
              <Input
                id="mint-genre"
                value={mintingFormData.genre}
                onChange={(e) => setMintingFormData(prev => ({ ...prev, genre: e.target.value }))}
                placeholder="Music genre"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="mint-model" className="text-white">AI Model Used *</Label>
              <Select
                value={mintingFormData.modelUsed}
                onValueChange={(value) => setMintingFormData(prev => ({ ...prev, modelUsed: value }))}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="V4" className="text-white">V4</SelectItem>
                  <SelectItem value="V3" className="text-white">V3</SelectItem>
                  <SelectItem value="suno" className="text-white">Suno</SelectItem>
                  <SelectItem value="udio" className="text-white">Udio</SelectItem>
                  <SelectItem value="other" className="text-white">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Royalty Rate */}
          <div>
            <Label htmlFor="mint-royalty" className="text-white">Royalty Rate (%)</Label>
            <Input
              id="mint-royalty"
              type="number"
              value={mintingFormData.royaltyRate}
              onChange={(e) => setMintingFormData(prev => ({ ...prev, royaltyRate: parseFloat(e.target.value) || 0 }))}
              min="0"
              max="10"
              step="0.1"
              className="bg-gray-700 border-gray-600 text-white"
            />
            <p className="text-xs text-gray-400 mt-1">Percentage of secondary sales you receive (0-10%)</p>
          </div>

          {/* Remixable Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="mint-remixable"
              checked={mintingFormData.isRemixable}
              onChange={(e) => setMintingFormData(prev => ({ ...prev, isRemixable: e.target.checked }))}
              className="rounded border-gray-600"
            />
            <Label htmlFor="mint-remixable" className="text-white">Allow remixing</Label>
            <p className="text-xs text-gray-400">Allow other creators to remix your music</p>
          </div>

          {/* Prompt */}
          <div>
            <Label htmlFor="mint-prompt" className="text-white">AI Generation Prompt</Label>
            <Textarea
              id="mint-prompt"
              value={mintingFormData.prompt}
              onChange={(e) => setMintingFormData(prev => ({ ...prev, prompt: e.target.value }))}
              placeholder="The prompt used to generate this music"
              rows={3}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="mint-tags" className="text-white">Tags</Label>
            <Input
              id="mint-tags"
              value={mintingFormData.tags}
              onChange={(e) => setMintingFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="Comma-separated tags (e.g., electronic, ambient, AI-generated)"
              className="bg-gray-700 border-gray-600 text-white"
            />
            <p className="text-xs text-gray-400 mt-1">Tags help others discover your NFT</p>
          </div>
        </CardContent>
      </Card>

      {/* Gas Fee & Summary */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Minting Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Minting Fee</span>
                <span className="text-white">{nftManager.factoryMint.directMintFee ? (Number(nftManager.factoryMint.directMintFee) / 1e18).toFixed(4) : '0.001'} STT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Gas Fee (estimated)</span>
                <span className="text-white">~0.005 STT</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-gray-300">Total Cost</span>
                <span className="text-white">~{(nftManager.factoryMint.directMintFee ? Number(nftManager.factoryMint.directMintFee) / 1e18 : 0.001) + 0.005} STT</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Network</span>
                <span className="text-white">Somnia Testnet</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Token Standard</span>
                <span className="text-white">ERC-721</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Royalty Rate</span>
                <span className="text-white">{mintingFormData.royaltyRate}%</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">ℹ</span>
              </div>
              <div>
                <p className="text-blue-300 text-sm font-medium">Important Notes</p>
                <ul className="text-gray-300 text-xs mt-1 space-y-1">
                  <li>• This NFT will be minted on the Somnia testnet</li>
                  <li>• You will receive {mintingFormData.royaltyRate}% royalty on secondary sales</li>
                  <li>• The NFT will be immediately transferable after minting</li>
                  <li>• Gas fees may vary based on network congestion</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePreviousStep}
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleMintNFT}
          disabled={nftManager.isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {nftManager.isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Minting NFT...
            </>
          ) : (
            <>
              Mint NFT
              <Coins className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-green-400 mb-2">🎉 Minting Complete!</h3>
        <p className="text-gray-400">Your music NFT has been successfully minted</p>
      </div>

      <Card className="bg-green-900/20 border-green-500/50">
        <CardContent className="p-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <p className="text-white font-medium">NFT Minted Successfully!</p>
              <p className="text-gray-400 text-sm">Token ID: {mintedTokenId}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-gray-400">
        <p>Redirecting to your NFT...</p>
      </div>
    </div>
  );

  const renderNFTDisplayStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">🎵 Your Music NFT is Ready!</h3>
        <p className="text-gray-400">View your newly minted music NFT details below</p>
      </div>

      {mintedNFT && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* NFT Image Section - Made larger and more prominent */}
          <div className="xl:col-span-2">
            <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/30 overflow-hidden">
              <CardContent className="p-0">
                <div className="relative">
                  {/* Main NFT Image */}
                  <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center overflow-hidden">
                    {formData.image ? (
                      <img
                        src={formData.image}
                        alt={formData.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <Music className="w-32 h-32 text-purple-300" />
                        <p className="text-purple-300 text-lg">Music NFT</p>
                      </div>
                    )}
                  </div>

                  {/* Audio Preview Overlay */}
                  {formData.audioUrl && (
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3">
                        <audio
                          controls
                          className="w-full h-8"
                          preload="none"
                        >
                          <source src={formData.audioUrl} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-green-500 text-white border-green-400">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Minted
                    </Badge>
                  </div>
                </div>

                {/* NFT Title and Description */}
                <div className="p-6">
                  <h4 className="text-3xl font-bold text-white mb-3">{formData.name}</h4>
                  <p className="text-gray-300 text-base leading-relaxed mb-4">{formData.description}</p>

                  {/* Token Info */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <Badge variant="outline" className="text-purple-300 border-purple-300 text-sm px-3 py-1">
                      <Hash className="w-3 h-3 mr-1" />
                      Token ID: {mintedNFT.tokenId}
                    </Badge>
                    <Badge variant="outline" className="text-blue-300 border-blue-300 text-sm px-3 py-1">
                      ERC-721
                    </Badge>
                    <Badge variant="outline" className="text-green-300 border-green-300 text-sm px-3 py-1">
                      Somnia Testnet
                    </Badge>
                  </div>

                  {/* Creator Info */}
                  <div className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Created by</p>
                      <p className="text-white font-medium text-sm">
                        {formData.creator ? `${formData.creator.slice(0, 6)}...${formData.creator.slice(-4)}` : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* NFT Details Section */}
          <div className="space-y-6">
            {/* Properties/Attributes - Enhanced */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-xl flex items-center">
                  <Tag className="w-5 h-5 mr-2" />
                  Properties
                </CardTitle>
                <CardDescription className="text-gray-400">
                  NFT attributes and traits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Music className="w-4 h-4 text-purple-400" />
                      <span className="text-gray-400 text-sm">Genre</span>
                    </div>
                    <span className="text-white font-medium">{formData.genre}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-400 text-sm">Duration</span>
                    </div>
                    <span className="text-white font-medium">
                      {Math.floor(formData.duration / 60)}:{(formData.duration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <span className="text-gray-400 text-sm">AI Model</span>
                    </div>
                    <span className="text-white font-medium">{formData.modelUsed}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Coins className="w-4 h-4 text-green-400" />
                      <span className="text-gray-400 text-sm">Royalty Rate</span>
                    </div>
                    <span className="text-white font-medium">{formData.royaltyRate}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-orange-400" />
                      <span className="text-gray-400 text-sm">Remixable</span>
                    </div>
                    <span className="text-white font-medium">{formData.isRemixable ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-indigo-400" />
                      <span className="text-gray-400 text-sm">Minted</span>
                    </div>
                    <span className="text-white font-medium text-sm">
                      {new Date(mintedNFT.mintedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contract Details */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-xl flex items-center">
                  <Hash className="w-5 h-5 mr-2" />
                  Contract Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Contract Address</span>
                    <span className="text-white font-mono text-xs bg-gray-700 px-2 py-1 rounded">
                      {CONTRACT_ADDRESSES.HIBEATS_NFT ? 
                        `${CONTRACT_ADDRESSES.HIBEATS_NFT.slice(0, 8)}...${CONTRACT_ADDRESSES.HIBEATS_NFT.slice(-6)}` : 
                        'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Token ID</span>
                    <span className="text-white font-mono text-sm">{mintedNFT.tokenId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Token Standard</span>
                    <span className="text-white font-medium">ERC-721</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Blockchain</span>
                    <span className="text-white font-medium">Somnia Testnet</span>
                  </div>
                  {mintedNFT.transactionHash && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Transaction Hash</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-blue-400 hover:text-blue-300 p-0 h-auto font-mono text-xs"
                        onClick={() => {
                          navigator.clipboard.writeText(mintedNFT.transactionHash);
                          toast.success('Transaction hash copied!');
                        }}
                      >
                        {`${mintedNFT.transactionHash.slice(0, 10)}...`}
                      </Button>
                    </div>
                  )}
                  {mintedNFT.blockNumber && mintedNFT.blockNumber > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Block Number</span>
                      <span className="text-white font-mono text-sm">{mintedNFT.blockNumber}</span>
                    </div>
                  )}
                  {mintedNFT.gasUsed && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Gas Used</span>
                      <span className="text-white font-mono text-sm">{mintedNFT.gasUsed}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Metadata URI</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-blue-400 hover:text-blue-300 p-0 h-auto font-mono text-xs"
                      onClick={() => {
                        navigator.clipboard.writeText(metadataURI);
                        toast.success('Metadata URI copied!');
                      }}
                    >
                      Copy URI
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            {formData.tags && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.split(',').map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-blue-300 bg-blue-900/50 hover:bg-blue-800/50 transition-colors">
                        #{tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons - Enhanced */}
            <div className="space-y-3">
              <Button
                onClick={handleListNFT}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white w-full py-3 text-base font-medium"
              >
                <List className="w-5 h-5 mr-2" />
                List for Sale
              </Button>

              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 py-3"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/nft/${mintedNFT.tokenId}`);
                    toast.success('NFT link copied to clipboard!');
                  }}
                >
                  <Link className="w-4 h-4 mr-2" />
                  Share NFT Link
                </Button>

                {mintedNFT.transactionHash ? (
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 py-3"
                    onClick={() => {
                      window.open(`https://testnet.somnia.network/tx/${mintedNFT.transactionHash}`, '_blank');
                    }}
                  >
                    <Hash className="w-4 h-4 mr-2" />
                    View Transaction on Explorer
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 py-3"
                    onClick={() => {
                      window.open(`https://testnet.somnia.network/token/${mintedNFT.tokenId}`, '_blank');
                    }}
                  >
                    <Hash className="w-4 h-4 mr-2" />
                    View Token on Explorer
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 py-3"
                  onClick={() => {
                    window.open(`https://gateway.pinata.cloud/ipfs/${uploadedMetadataCID}`, '_blank');
                  }}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  View Metadata on IPFS
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={handleBackToLibrary}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 w-full py-3"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Music Library
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white text-center">Mint Music NFT</DialogTitle>
          <DialogDescription className="text-gray-400 text-center">
            Follow the steps to create and mint your music NFT
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <p className="text-center text-sm text-gray-400 mt-2">{progress}% Complete</p>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step Content */}
        <div className="min-h-[400px]">
          {currentStep === 'metadata' && renderMetadataStep()}
          {currentStep === 'minting' && renderMintingStep()}
          {currentStep === 'complete' && renderCompleteStep()}
          {currentStep === 'nft-display' && renderNFTDisplayStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
};