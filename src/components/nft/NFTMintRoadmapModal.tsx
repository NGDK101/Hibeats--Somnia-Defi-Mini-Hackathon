import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAccount } from 'wagmi';
import { useNFTManager } from '@/hooks/useNFTManager';
import { useGeneratedMusicContext } from '@/hooks/useGeneratedMusicContext';
import { useFactoryMint } from '@/hooks/useFactoryMint';
import { useHiBeatsFactory } from '@/hooks/useHiBeatsFactory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Music, Upload, Coins, Tag, Clock, Hash, Zap, Image as ImageIcon, Link, X, Camera, CheckCircle, ArrowRight, ArrowLeft, List, Home, FileText, Loader2, Calendar, DollarSign, Eye, Copy, ExternalLink } from 'lucide-react';
import { GeneratedMusic } from '@/types/music';
import { toast } from 'sonner';
import { NFTMetadataGenerator } from '@/utils/NFTMetadataGenerator';
import { ipfsService } from '@/services/ipfsService';
import { CONTRACT_ADDRESSES } from '@/contracts';
import { motion, AnimatePresence } from 'framer-motion';

// Import roadmap step images
import createMetadataImg from '@/images/assets/create-metadata.png';
import mintNftImg from '@/images/assets/mint-nft.png';
import completeImg from '@/images/assets/complete.png';

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
  const hiBeatsFactory = useHiBeatsFactory();
  const [currentStep, setCurrentStep] = useState<MintStep>('metadata');
  const [progress, setProgress] = useState(0);
  const [mintedTokenId, setMintedTokenId] = useState<string | null>(null);
  const [mintedNFT, setMintedNFT] = useState<any>(null);
  const [isInMintingProcess, setIsInMintingProcess] = useState(false);

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

  // List NFT Modal state
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [listingPrice, setListingPrice] = useState('');
  const [listingDuration, setListingDuration] = useState('7'); // days
  const [listingCurrency, setListingCurrency] = useState('STT');
  const [isListing, setIsListing] = useState(false);

  // Reset states when modal opens and auto-populate form data
  useEffect(() => {
    if (isOpen && selectedSong) {
      // Only reset if we're starting completely fresh
      // Don't reset if we're in the middle of a minting process
      const shouldReset = !isInMintingProcess && (!uploadedMetadataCID || currentStep === 'metadata');
      
      if (shouldReset) {
        // Reset core states first
        setMintedTokenId(null);
        setMintedNFT(null);
        setIsUploadingMetadata(false);
        setIsInMintingProcess(false);

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
            creator: selectedSong.metadata.created_by || selectedSong.artist || 'AI Generated',
            modelUsed: selectedSong.metadata.model_used || 'suno',
            prompt: selectedSong.metadata.prompt || `Generate ${Array.isArray(selectedSong.genre) ? selectedSong.genre[0] : selectedSong.genre || 'Electronic'} music`,
            tags: Array.isArray(selectedSong.metadata.genre) ? selectedSong.metadata.genre.join(', ') : selectedSong.metadata.genre?.[0] || Array.isArray(selectedSong.genre) ? selectedSong.genre.join(', ') : selectedSong.genre || 'Electronic',
            royaltyRate: 5,
            isRemixable: true
          });

          // Skip to minting step since metadata already exists
          setCurrentStep('minting');
          setProgress(75);
          setIsInMintingProcess(true);

          toast.success('Found existing IPFS metadata. Ready to mint!');
        } else {
          // No existing metadata, reset and prepare for metadata creation
          setUploadedMetadataCID(null);
          setMetadataURI('');
          
          // Auto-populate form for new metadata creation
          setFormData({
            name: selectedSong.title || '',
            description: `AI-generated music: ${selectedSong.title || 'Untitled'}`,
            image: selectedSong.imageUrl || '',
            audioUrl: selectedSong.audioUrl || '',
            duration: selectedSong.duration || 30,
            genre: Array.isArray(selectedSong.genre) ? selectedSong.genre[0] : selectedSong.genre || 'Electronic',
            creator: selectedSong.artist || 'AI Generated',
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
      }

      // Always populate minting form (this is safe to do)
      setMintingFormData({
        genre: Array.isArray(selectedSong.genre) ? selectedSong.genre[0] : selectedSong.genre || 'Electronic',
        modelUsed: selectedSong.metadata?.model_used || 'suno',
        isRemixable: true,
        royaltyRate: 5,
        prompt: selectedSong.metadata?.prompt || `Generate ${Array.isArray(selectedSong.genre) ? selectedSong.genre[0] : selectedSong.genre || 'Electronic'} music`,
        tags: Array.isArray(selectedSong.genre) ? selectedSong.genre.join(', ') : selectedSong.genre || 'Electronic'
      });
    }
  }, [selectedSong, isOpen, uploadedMetadataCID, currentStep, isInMintingProcess]);

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
    const error = nftManager.factoryMint.error;


    // Handle transaction success - immediate success when transaction hash is available
    if (currentStep === 'minting' && transactionHash && !mintedNFT && isInMintingProcess) {

      // Dismiss ALL loading toasts first
      toast.dismiss('mint-wait');
      toast.dismiss('mint-wait-confirm');
      toast.dismiss('mint-wait-slow');

      // Show success toast with explorer link
      toast.success(
        <div className="flex flex-col space-y-2">
          <span>🎉 NFT minted successfully!</span>
          <button
            onClick={() => window.open(`https://shannon-explorer.somnia.network/tx/${transactionHash}`, '_blank')}
            className="text-xs text-blue-400 hover:text-blue-300 underline text-left"
          >
            View transaction on Somnia Explorer ↗
          </button>
        </div>,
        {
          duration: 6000,
          id: 'mint-success'
        }
      );

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

      const nftData = {
        tokenId: nextTokenId.toString(),
        metadata,
        song: selectedSong,
        mintedAt: new Date().toISOString(),
        transactionHash: realTransactionData.hash,
        contractAddress: CONTRACT_ADDRESSES.HIBEATS_NFT,
        blockNumber: realTransactionData.blockNumber,
        gasUsed: realTransactionData.gasUsed
      };

      setMintedNFT(nftData);

      setCurrentStep('complete');
      setProgress(100);
      setIsInMintingProcess(false); // Reset flag when minting completes

      // Auto-advance to NFT display after a short delay
      setTimeout(() => {
        setCurrentStep('nft-display');
      }, 3000); // Increased delay to ensure success toast is visible

      if (onMintSuccess) {
        onMintSuccess(nextTokenId.toString());
      }
    }

    // Handle transaction error
    if (currentStep === 'minting' && error && !isLoading) {
      console.error('❌ Transaction failed:', error);
      
      // Dismiss ALL loading toasts and show error
      toast.dismiss('mint-wait');
      toast.dismiss('mint-wait-confirm');
      toast.error(`Failed to mint NFT: ${error.message || 'Transaction failed'}`, {
        duration: 5000,
        id: 'mint-error'
      });
      
      setIsInMintingProcess(false);
    }

    // No longer needed - we show success immediately when transaction hash is available

    // No longer needed - we show success immediately when transaction hash is available
  }, [currentStep, nftManager.factoryMint.hash, nftManager.factoryMint.isLoading, nftManager.factoryMint.isSuccess, nftManager.factoryMint.error, formData, mintingFormData, selectedSong, onMintSuccess]);

  // No longer needed - we show success immediately when transaction hash is available

  // Track previous song to detect actual song changes
  const [previousSongId, setPreviousSongId] = useState<string | null>(null);

  // Initialize form data when song is selected with detailed information
  useEffect(() => {
    if (selectedSong) {
      const currentSongId = selectedSong.id;
      const songChanged = previousSongId !== currentSongId;

      // Create a more detailed description based on song metadata
      const detailedDescription = selectedSong.metadata?.description ||
        `${selectedSong.title} - An AI-generated music track in ${selectedSong.genre?.[0] || 'various'} genre. Created using advanced AI music generation technology with ${selectedSong.metadata?.model_used || 'Hibeats v4'} model. Duration: ${Math.floor((selectedSong.duration || 0) / 60)}:${((selectedSong.duration || 0) % 60).toString().padStart(2, '0')}. Perfect for ${selectedSong.genre?.[0] || 'music'} enthusiasts and collectors.`;

      // Create a comprehensive prompt description
      const promptDescription = selectedSong.metadata?.description ||
        `AI-generated ${selectedSong.genre?.[0] || 'music'} track titled "${selectedSong.title}" with ${Math.floor((selectedSong.duration || 0) / 60)}:${((selectedSong.duration || 0) % 60).toString().padStart(2, '0')} duration, created using ${selectedSong.metadata?.model_used || 'advanced AI'} technology. Features ${selectedSong.genre?.join(' and ') || 'various musical elements'} for an immersive listening experience.`;

      setFormData({
        name: selectedSong.title || '',
        description: detailedDescription,
        image: selectedSong.imageUrl || '',
        audioUrl: selectedSong.audioUrl || '',
        duration: selectedSong.duration || 0,
        genre: selectedSong.genre?.[0] || '',
        creator: address || '', // Use connected wallet address
        modelUsed: selectedSong.metadata?.model_used || 'V4',
        prompt: promptDescription,
        tags: selectedSong.genre?.join(', ') ||
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
        tags: selectedSong.genre?.join(', ') ||
          `${selectedSong.genre?.[0] || 'music'}, ai-generated, ${selectedSong.metadata?.model_used || 'V4'}, ${Math.floor((selectedSong.duration || 0) / 60)}min, nft, digital-art, music-nft`
      });

      // Only reset upload state when the song actually changes (not on address change or re-render)
      if (songChanged) {
        setUploadedMetadataCID(null);
        setMetadataURI('');
        setPreviousSongId(currentSongId);
      }
    }
  }, [selectedSong, address]);

  // Cleanup toasts when modal closes or component unmounts
  useEffect(() => {
    if (!isOpen) {
      // Dismiss all minting-related toasts when modal closes
      toast.dismiss('mint-wait');
      toast.dismiss('mint-wait-confirm');
      toast.dismiss('mint-wait-slow');
      toast.dismiss('mint-success');
      toast.dismiss('mint-error');
    }
    
    // Cleanup on unmount
    return () => {
      toast.dismiss('mint-wait');
      toast.dismiss('mint-wait-confirm');
      toast.dismiss('mint-wait-slow');
      toast.dismiss('mint-success');
      toast.dismiss('mint-error');
    };
  }, [isOpen]);

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
        setProgress(75);
        return;
      }

      try {
        setIsUploadingMetadata(true);
        setProgress(50); // Show intermediate progress

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
          console.error('❌ Metadata validation failed:', validation.errors);
          throw new Error(`Metadata validation failed: ${validation.errors.join(', ')}`);
        }

        // Upload metadata to IPFS/Pinata
        toast.loading('Uploading metadata to IPFS...', { id: 'metadata-upload' });
        
        let metadataResult;
        let metadataUri = '';
        let cid = '';

        try {
          metadataResult = await ipfsService.uploadMetadata(metadata);
          cid = metadataResult.IpfsHash || metadataResult.cid;
          metadataUri = `ipfs://${cid}`;
        } catch (uploadError) {
          console.error('❌ Pinata upload failed:', uploadError);
          
          // Fallback: Create a mock metadata URI for development/testing
          const mockCid = 'QmTestMetadata' + Date.now();
          const mockMetadataUri = `ipfs://${mockCid}`;
          
          cid = mockCid;
          metadataUri = mockMetadataUri;
          
          toast.dismiss('metadata-upload');
          toast.warning('Using development mode - metadata not uploaded to IPFS', { duration: 4000 });
          
          // Store metadata locally for development
          localStorage.setItem(`metadata_${mockCid}`, JSON.stringify(metadata));
        }

        // Store the results
        setUploadedMetadataCID(cid);
        setMetadataURI(metadataUri);

        toast.dismiss('metadata-upload');
        toast.success('Metadata created successfully!');

        // Always proceed directly to minting step - no completeMusicGeneration needed
        setProgress(75);
        setCurrentStep('minting');
        setIsInMintingProcess(true);

        // Show appropriate message based on song type
        if (selectedSong?.taskId) {
          setTimeout(() => {
            toast.info('🎵 AI-generated music ready for NFT minting!', { duration: 3000 });
          }, 500);
        } else {
          setTimeout(() => {
            toast.info('🎵 Your music is ready for NFT minting!', { duration: 3000 });
          }, 500);
        }

      } catch (error) {
        console.error('❌ Metadata creation failed:', error);
        toast.dismiss('metadata-upload');
        toast.error(`Failed to create metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setProgress(25); // Reset progress on error
      } finally {
        setIsUploadingMetadata(false);
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'minting') {
      setCurrentStep('metadata');
      setProgress(25);
    } else if (currentStep === 'complete') {
      setCurrentStep('minting');
      setProgress(75);
    } else if (currentStep === 'nft-display') {
      setCurrentStep('complete');
      setProgress(100);
    }
  };

  const handleMintNFT = async () => {
      // Removed invalid object literal block after console.log deletion

    if (!selectedSong) {
      console.error('❌ No song selected');
      toast.error('No song selected. Please select a song to mint.');
      return;
    }

    if (!metadataURI) {
      console.error('❌ Metadata URI missing - current state:', {
        metadataURI,
        uploadedMetadataCID,
        currentStep,
        selectedSongId: selectedSong?.id
      });
      toast.error('Metadata URI is required. Please complete the metadata step first.');
      setCurrentStep('metadata');
      setProgress(25);
      return;
    }


    if (!uploadedMetadataCID) {
      console.error('❌ Metadata CID missing - redirecting to metadata step');
      toast.error('Metadata CID is missing. Please recreate metadata.');
      setCurrentStep('metadata');
      setProgress(25);
      return;
    }

    try {
      // Clear any existing toasts
      toast.dismiss();

      // Show initial loading toast
      toast.loading('Sending mint transaction...', { id: 'mint-wait' });

      // Mint NFT using the pre-uploaded metadata URI
      const mintParams = {
        to: address || '',
        sunoId: selectedSong.id || '',
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


      // Enhanced logging for debugging

      // Prepare final minting parameters with enhanced logging
      const mintingPayload = {
        aiTrackId: selectedSong.id,
        metadataURI: metadataURI, // Pass the uploaded metadata URI
        songData: {
          title: selectedSong.title || `Song ${selectedSong.id}`,
          artist: selectedSong.artist || 'AI Generated',
          imageUrl: formData.image,
          audioUrl: selectedSong.audioUrl,
          genre: mintingFormData.genre,
          duration: selectedSong.duration || 0,
          prompt: mintingFormData.prompt,
          modelUsed: mintingFormData.modelUsed,
          taskId: selectedSong.taskId || '',
          createdAt: selectedSong.createdAt || new Date().toISOString(),
          metadataURI: metadataURI, // Also include in songData for compatibility
          royaltyPercentage: mintingFormData.royaltyRate,
          isRemixable: mintingFormData.isRemixable,
          tags: mintingFormData.tags,
        }
      };

      // Start the minting process via Factory (no authorization required)
      await nftManager.handleAction('mint', mintingPayload);

      
      // The transaction state changes will be handled by the useEffect above
      // No need to set another loading toast here as the useEffect will handle it

    } catch (error) {
      console.error('❌ Minting failed:', error);
      
      // Dismiss any loading toasts
      toast.dismiss('mint-wait');
      toast.dismiss('mint-wait-confirm');
      toast.dismiss('mint-wait-slow');
      
      // Show error message
      toast.error(`Failed to mint NFT: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        duration: 5000
      });
      
      setIsInMintingProcess(false);
    }
  };

  const handleListNFT = () => {
    setIsListModalOpen(true);
  };

  const handleConfirmListing = async () => {
    if (!listingPrice || parseFloat(listingPrice) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setIsListing(true);
    try {
      // TODO: Implement actual NFT listing functionality
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      toast.success('NFT listed successfully!');
      setIsListModalOpen(false);
      setListingPrice('');
      setListingDuration('7');
    } catch (error) {
      toast.error('Failed to list NFT. Please try again.');
    } finally {
      setIsListing(false);
    }
  };

  const handleBackToLibrary = () => {
    // Reset all process flags when actually closing/leaving
    setIsInMintingProcess(false);
    setCurrentStep('metadata');
    setProgress(25);
    onClose();
  };

  const renderStepIndicator = () => {
    const steps = [
      { 
        step: 'metadata', 
        label: uploadedMetadataCID ? '✓ Metadata Ready' : 'Create Metadata', 
        icon: Upload,
        image: createMetadataImg,
        description: 'Prepare your music data'
      },
      { 
        step: 'minting', 
        label: 'Mint NFT', 
        icon: Coins,
        image: mintNftImg,
        description: 'Convert to blockchain NFT'
      },
      { 
        step: 'complete', 
        label: 'Complete', 
        icon: CheckCircle,
        image: completeImg,
        description: 'NFT successfully created'
      }
    ];

    return (
      <div className="mb-8">
        {/* Minimalist progress bar like macOS */}
        <div className="w-full max-w-lg mx-auto mb-8">
          <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Clean step indicators */}
        <div className="flex items-center justify-center space-x-12">
          {steps.map((item, index) => {
            const isActive = currentStep === item.step;
            const isCompleted = (item.step === 'metadata' && uploadedMetadataCID) ||
                               (item.step === 'minting' && currentStep === 'complete') ||
                               (item.step === 'complete' && currentStep === 'complete');

            return (
              <div key={item.step} className="flex flex-col items-center relative">
                {/* Connection line - subtle like macOS */}
                {index < steps.length - 1 && (
                  <div className={`absolute top-5 left-full w-12 h-px ${
                    isCompleted ? 'bg-primary' : 'bg-gray-700'
                  } transition-colors duration-500`} />
                )}

                {/* Step image with macOS style */}
                <div className={`w-10 h-10 mb-2 transition-all duration-300 ${
                  isActive ? 'scale-110' : 'scale-100'
                } ${isCompleted || isActive ? 'opacity-100' : 'opacity-40'}`}>
                  <img 
                    src={item.image} 
                    alt={item.label}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Step label - clean typography like macOS */}
                <div className="text-center">
                  <h3 className={`text-sm font-semibold ${
                    isActive ? 'text-primary' : isCompleted ? 'text-primary' : 'text-muted-foreground'
                  } transition-colors duration-300`}>
                    {item.label}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMetadataStep = () => (
    <div className="space-y-8">
      <div className="text-center">
      </div>

      {/* Song Info Display - macOS style card */}
      {selectedSong && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center space-x-4">
            <img
              src={selectedSong.imageUrl}
              alt={selectedSong.title}
              className="w-20 h-20 rounded-xl object-cover shadow-lg"
            />
            <div className="flex-1">
              <h4 className="text-white font-semibold text-xl">{selectedSong.title}</h4>
              <p className="text-muted-foreground text-sm mt-1">{selectedSong.artist || 'Unknown Artist'}</p>
              <div className="flex items-center space-x-3 mt-3">
                <span className="px-3 py-1.5 bg-blue-500/10 text-blue-400 text-xs rounded-lg border border-blue-500/20  tracking-wide">
                  {selectedSong.genre?.[0] || 'Unknown'}
                </span>
                <span className="text-muted-foreground text-xs">
                  {Math.floor((selectedSong.duration || 0) / 60)}:{((selectedSong.duration || 0) % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        </div>
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
                <Label className="text-white text-sm font-semibold">IPFS CID</Label>
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
                <Label className="text-white text-sm font-semibold">Metadata URI</Label>
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
                <Label className="text-white text-sm font-semibold">Gateway URL</Label>
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

      {/* Metadata Form - macOS style */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-white/10">
          <div className="w-3 h-3 bg-primary rounded-full opacity-80"></div>
          <h4 className="text-white font-semibold text-lg">NFT Details</h4>
        </div>
        
        {/* Name and Creator */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white text-sm font-semibold">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Song title"
              className="bg-gray-800/50 border-gray-700/50 text-white placeholder-muted-foreground rounded-lg h-11 px-4  focus:bg-gray-800/70 focus:border-blue-500/50 transition-all duration-200"
            />
            <p className="text-xs text-muted-foreground ">Song title from your music library</p>
            {errors.name && <p className="text-red-400 text-sm mt-1 ">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="creator" className="text-white text-sm font-semibold">Creator Address *</Label>
            <Input
              id="creator"
              value={formData.creator}
              onChange={(e) => setFormData(prev => ({ ...prev, creator: e.target.value }))}
              placeholder="0x..."
              className="bg-gray-800/50 border-gray-700/50 text-white placeholder-muted-foreground rounded-lg h-11 px-4 font-mono text-sm focus:bg-gray-800/70 focus:border-blue-500/50 transition-all duration-200"
            />
            {errors.creator && <p className="text-red-400 text-sm mt-1 ">{errors.creator}</p>}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-white text-sm font-semibold">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Detailed description of your song"
            rows={4}
            className="bg-gray-800/50 border-gray-700/50 text-white placeholder-muted-foreground rounded-lg p-4  resize-none focus:bg-gray-800/70 focus:border-blue-500/50 transition-all duration-200"
          />
          <p className="text-xs text-muted-foreground ">Auto-generated description including genre, model, duration, and musical characteristics</p>
          {errors.description && <p className="text-red-400 text-sm mt-1 ">{errors.description}</p>}
        </div>

        {/* Image and Audio URLs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="image" className="text-white text-sm font-semibold">Image URL *</Label>
            <Input
              id="image"
              value={formData.image}
              onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
              placeholder="IPFS or HTTP URL for NFT artwork"
              className="bg-gray-800/50 border-gray-700/50 text-white placeholder-muted-foreground rounded-lg h-11 px-4  focus:bg-gray-800/70 focus:border-blue-500/50 transition-all duration-200"
            />
            <p className="text-xs text-muted-foreground ">Artwork image for your NFT</p>
            {errors.image && <p className="text-red-400 text-sm mt-1 ">{errors.image}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="audioUrl" className="text-white text-sm font-semibold">Audio URL *</Label>
            <Input
              id="audioUrl"
              value={formData.audioUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, audioUrl: e.target.value }))}
              placeholder="IPFS or HTTP URL for song audio"
              className="bg-gray-800/50 border-gray-700/50 text-white placeholder-muted-foreground rounded-lg h-11 px-4  focus:bg-gray-800/70 focus:border-blue-500/50 transition-all duration-200"
            />
            <p className="text-xs text-muted-foreground ">Audio file for your music NFT</p>
            {errors.audioUrl && <p className="text-red-400 text-sm mt-1 ">{errors.audioUrl}</p>}
          </div>
        </div>

        {/* Genre, Duration, Model */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="genre" className="text-white text-sm font-semibold">Genre *</Label>
            <Input
              id="genre"
              value={formData.genre}
              onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
              placeholder="Music genre"
              className="bg-gray-800/50 border-gray-700/50 text-white placeholder-muted-foreground rounded-lg h-11 px-4  focus:bg-gray-800/70 focus:border-blue-500/50 transition-all duration-200"
            />
            <p className="text-xs text-muted-foreground ">Musical genre of your song</p>
            {errors.genre && <p className="text-red-400 text-sm mt-1 ">{errors.genre}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration" className="text-white text-sm font-semibold">Duration (seconds) *</Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
              placeholder="Song duration in seconds"
              className="bg-gray-800/50 border-gray-700/50 text-white placeholder-muted-foreground rounded-lg h-11 px-4  focus:bg-gray-800/70 focus:border-blue-500/50 transition-all duration-200"
            />
            <p className="text-xs text-muted-foreground ">Length of your music track</p>
            {errors.duration && <p className="text-red-400 text-sm mt-1 ">{errors.duration}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="modelUsed" className="text-white text-sm font-semibold">Model Used</Label>
            <Select value={formData.modelUsed} onValueChange={(value) => setFormData(prev => ({ ...prev, modelUsed: value }))}>
              <SelectTrigger className="bg-gray-800/50 border-gray-700/50 text-white h-11 rounded-lg focus:bg-gray-800/70 focus:border-blue-500/50 transition-all duration-200">
                <SelectValue placeholder="AI model used" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 rounded-lg">
                <SelectItem value="V3_5" className="text-white hover:bg-gray-700">Hibeats v3.5</SelectItem>
                <SelectItem value="V4" className="text-white hover:bg-gray-700">Hibeats v4</SelectItem>
                <SelectItem value="V4_5" className="text-white hover:bg-gray-700">Hibeats v4.5</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground ">AI model that generated this music</p>
          </div>
        </div>

        {/* Prompt */}
        <div className="space-y-2">
          <Label htmlFor="prompt" className="text-white text-sm font-semibold">Prompt *</Label>
          <Textarea
            id="prompt"
            value={formData.prompt}
            onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
            placeholder="AI generation prompt used to create this song"
            rows={3}
            className="bg-gray-800/50 border-gray-700/50 text-white placeholder-muted-foreground rounded-lg p-4  resize-none focus:bg-gray-800/70 focus:border-blue-500/50 transition-all duration-200"
          />
          <p className="text-xs text-muted-foreground ">Original AI prompt that generated this music piece</p>
          {errors.prompt && <p className="text-red-400 text-sm mt-1 ">{errors.prompt}</p>}
        </div>

        {/* Tags and Royalty */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tags" className="text-white text-sm font-semibold">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="Genre, model, duration, mood tags"
              className="bg-gray-800/50 border-gray-700/50 text-white placeholder-muted-foreground rounded-lg h-11 px-4  focus:bg-gray-800/70 focus:border-blue-500/50 transition-all duration-200"
            />
            <p className="text-xs text-muted-foreground ">Auto-generated tags including genre, AI model, duration, and musical style</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="royaltyRate" className="text-white text-sm font-semibold">Royalty Rate (%)</Label>
            <Input
              id="royaltyRate"
              type="number"
              value={formData.royaltyRate}
              onChange={(e) => setFormData(prev => ({ ...prev, royaltyRate: parseFloat(e.target.value) || 0 }))}
              min="0"
              max="10"
              step="0.1"
              className="bg-gray-800/50 border-gray-700/50 text-white placeholder-muted-foreground rounded-lg h-11 px-4  focus:bg-gray-800/70 focus:border-blue-500/50 transition-all duration-200"
            />
            <p className="text-xs text-muted-foreground ">Percentage of secondary sales you receive (0-10%)</p>
          </div>
        </div>

        {/* Remixable Toggle */}
        <div className="flex items-center space-x-4 p-4 bg-gray-800/30 rounded-xl border border-gray-700/30">
          <input
            type="checkbox"
            id="isRemixable"
            checked={formData.isRemixable}
            onChange={(e) => setFormData(prev => ({ ...prev, isRemixable: e.target.checked }))}
            className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500/50 focus:ring-2"
          />
          <div className="flex-1">
            <Label htmlFor="isRemixable" className="text-white text-sm font-semibold cursor-pointer">Allow remixing</Label>
            <p className="text-xs text-muted-foreground  mt-1">Allow other creators to remix your music (recommended for collaboration)</p>
          </div>
        </div>
      </div>

      {/* Metadata Status Indicator */}
      {uploadedMetadataCID && (
        <Card className="bg-green-900/20 border-green-500/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-green-400 font-medium">Metadata Successfully Created!</p>
                <p className="text-muted-foreground text-sm">IPFS Hash: {uploadedMetadataCID}</p>
                <p className="text-gray-300 text-sm">✨ Your music is now ready to be minted as an NFT</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end pt-8">
        <button
          onClick={handleNextStep}
          disabled={isUploadingMetadata}
          className="px-8 py-3 bg-gradient-button hover:opacity-90 disabled:bg-gray-600 disabled:cursor-not-allowed text-black rounded-full text-sm font-semibold tracking-wide transition-all duration-300 focus:outline-none shadow-lg"
        >
          {isUploadingMetadata ? (
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Creating Metadata...</span>
            </div>
          ) : uploadedMetadataCID ? (
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-4 h-4" />
              <span>Continue to Mint</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <span>Create Metadata</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          )}
        </button>
      </div>
    </div>
  );

  const renderMintingStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        {/* Step header with image */}
      </div>

      {/* NFT Preview Card - Like OpenSea */}
      <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/30">
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <h4 className="text-lg font-semibold text-white">NFT Preview</h4>
            <p className="text-muted-foreground text-sm">How your NFT will appear on marketplaces</p>
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
                      <Music className="w-16 h-16 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No image available</p>
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
                  <p className="text-muted-foreground text-xs">Created by</p>
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
                    <p className="text-muted-foreground text-xs">Genre</p>
                    <p className="text-white text-sm font-medium">{mintingFormData.genre || 'Not set'}</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                    <p className="text-muted-foreground text-xs">AI Model</p>
                    <p className="text-white text-sm font-medium">{mintingFormData.modelUsed || 'Not set'}</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                    <p className="text-muted-foreground text-xs">Royalty</p>
                    <p className="text-white text-sm font-medium">{mintingFormData.royaltyRate}%</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                    <p className="text-muted-foreground text-xs">Remixable</p>
                    <p className="text-white text-sm font-medium">{mintingFormData.isRemixable ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>

              {/* Chain & Collection Info */}
              <div className="border-t border-gray-700 pt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Blockchain</span>
                  <span className="text-white flex items-center">
                    <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                    Somnia Testnet
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Collection</span>
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
          <CardDescription className="text-muted-foreground">
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
            <p className="text-xs text-muted-foreground mt-1">Percentage of secondary sales you receive (0-10%)</p>
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
            <p className="text-xs text-muted-foreground">Allow other creators to remix your music</p>
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
            <p className="text-xs text-muted-foreground mt-1">Tags help others discover your NFT</p>
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
                <span className="text-muted-foreground">Minting Fee</span>
                <span className="text-white">0.001 STT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gas Fee (estimated)</span>
                <span className="text-white">~0.005 STT</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-gray-300">Total Cost</span>
                <span className="text-white">~0.006 STT</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Network</span>
                <span className="text-white">Somnia Testnet</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Token Standard</span>
                <span className="text-white">ERC-721</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Royalty Rate</span>
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
        
        <div className="flex space-x-3">
          {/* Show transaction checker button if transaction is stuck */}
          {nftManager.factoryMint.hash && nftManager.factoryMint.isLoading && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  const hash = nftManager.factoryMint.hash;
                  if (hash) {
                    window.open(`https://shannon-explorer.somnia.network/tx/${hash}`, '_blank');
                    toast.info('Check transaction status in the opened explorer tab', {
                      duration: 3000
                    });
                  }
                }}
                className="border-yellow-600 text-yellow-300 hover:bg-yellow-700/20"
              >
                <Hash className="w-4 h-4 mr-2" />
                Check Transaction
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  // Force complete if user confirms transaction was successful
                  if (confirm('Did you verify that the transaction was successful in the explorer? This will mark the minting as complete.')) {
                    
                    // Dismiss all loading toasts
                    toast.dismiss('mint-wait');
                    toast.dismiss('mint-wait-confirm');
                    toast.dismiss('mint-wait-slow');
                    
                    // Manually trigger success flow
                    const hash = nftManager.factoryMint.hash;
                    const nextTokenId = BigInt(Date.now());
                    
                    toast.success('🎉 NFT minted successfully!', { 
                      duration: 4000,
                      id: 'mint-success'
                    });
                    
                    const metadata = {
                      name: formData.name,
                      description: formData.description,
                      image: formData.image,
                      animation_url: formData.audioUrl,
                      attributes: [
                        { trait_type: "Genre", value: mintingFormData.genre },
                        { trait_type: "Model", value: mintingFormData.modelUsed },
                        { trait_type: "Royalty Percentage", value: mintingFormData.royaltyRate },
                        { trait_type: "Remixable", value: mintingFormData.isRemixable ? "Yes" : "No" }
                      ]
                    };
                    
                    setMintedTokenId(nextTokenId.toString());
                    setMintedNFT({
                      tokenId: nextTokenId.toString(),
                      metadata,
                      song: selectedSong,
                      mintedAt: new Date().toISOString(),
                      transactionHash: hash,
                      contractAddress: CONTRACT_ADDRESSES.HIBEATS_NFT,
                      blockNumber: 0,
                      gasUsed: '0'
                    });
                    
                    setCurrentStep('complete');
                    setIsInMintingProcess(false);
                    
                    setTimeout(() => {
                      setCurrentStep('nft-display');
                    }, 2000);
                    
                    if (onMintSuccess) {
                      onMintSuccess(nextTokenId.toString());
                    }
                  }
                }}
                className="border-green-600 text-green-300 hover:bg-green-700/20"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Force Complete
              </Button>
            </>
          )}
          
          <Button
            onClick={handleMintNFT}
            disabled={nftManager.isLoading || nftManager.factoryMint.isLoading}
            className="bg-gradient-button hover:opacity-90 disabled:bg-gray-600 disabled:cursor-not-allowed text-black rounded-full"
          >
            {nftManager.isLoading || nftManager.factoryMint.isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {nftManager.factoryMint.hash ? 'Confirming Transaction...' : 'Minting NFT...'}
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
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        {/* Step header with image */}
        <div className="flex items-center justify-center mb-4">
          <img 
            src={completeImg} 
            alt="Complete"
            className="w-20 h-20 object-cover"
          />
        </div>
        <h3 className="text-xl  text-green-400 mb-2">🎉 Minting Complete!</h3>
        <p className="text-sm text-muted-foreground ">Your music NFT has been successfully minted</p>
      </div>

      <Card className="bg-green-900/20 border-green-500/50">
        <CardContent className="p-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <p className="text-white font-medium">NFT Minted Successfully!</p>
              <p className="text-muted-foreground text-sm">Token ID: {mintedTokenId}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center space-y-4">
        <p className="text-muted-foreground">Redirecting to your NFT...</p>

        {/* Manual button as fallback */}
        <Button
          onClick={() => {
            setCurrentStep('nft-display');
          }}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          View NFT Details
        </Button>
      </div>
    </div>
  );

  const renderNFTDisplayStep = () => {
    return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-3xl font-bold text-white mb-2">🎉 NFT Minted Successfully!</h3>
        <p className="text-lg text-green-400 font-medium mb-2">Your Music NFT is Ready!</p>
        <p className="text-muted-foreground">View your newly minted music NFT details below</p>

        {/* Quick Stats */}
        {mintedNFT && (
          <div className="flex justify-center items-center space-x-6 mt-4 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
            <div className="text-center">
              <p className="text-green-400 font-medium">Token ID</p>
              <p className="text-white font-mono text-sm">#{mintedNFT.tokenId}</p>
            </div>
            <div className="text-center">
              <p className="text-green-400 font-medium">Network</p>
              <p className="text-white text-sm">Somnia Testnet</p>
            </div>
            <div className="text-center">
              <p className="text-green-400 font-medium">Status</p>
              <div className="flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-green-400 mr-1" />
                <p className="text-green-400 text-sm">Confirmed</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {mintedNFT && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* NFT Image Section - Made larger and more prominent */}
          <div>
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
                      <p className="text-muted-foreground text-sm">Created by</p>
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
                <CardDescription className="text-muted-foreground">
                  NFT attributes and traits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Music className="w-4 h-4 text-purple-400" />
                      <span className="text-muted-foreground text-sm">Genre</span>
                    </div>
                    <span className="text-white font-medium">{formData.genre}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-muted-foreground text-sm">Duration</span>
                    </div>
                    <span className="text-white font-medium">
                      {Math.floor(formData.duration / 60)}:{(formData.duration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <span className="text-muted-foreground text-sm">AI Model</span>
                    </div>
                    <span className="text-white font-medium">{formData.modelUsed}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Coins className="w-4 h-4 text-green-400" />
                      <span className="text-muted-foreground text-sm">Royalty Rate</span>
                    </div>
                    <span className="text-white font-medium">{formData.royaltyRate}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-orange-400" />
                      <span className="text-muted-foreground text-sm">Remixable</span>
                    </div>
                    <span className="text-white font-medium">{formData.isRemixable ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-indigo-400" />
                      <span className="text-muted-foreground text-sm">Minted</span>
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
                    <span className="text-muted-foreground text-sm">Contract Address</span>
                    <span className="text-white font-mono text-xs bg-gray-700 px-2 py-1 rounded">
                      {CONTRACT_ADDRESSES.HIBEATS_NFT ? 
                        `${CONTRACT_ADDRESSES.HIBEATS_NFT.slice(0, 8)}...${CONTRACT_ADDRESSES.HIBEATS_NFT.slice(-6)}` : 
                        'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Token ID</span>
                    <span className="text-white font-mono text-sm">{mintedNFT.tokenId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Token Standard</span>
                    <span className="text-white font-medium">ERC-721</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Blockchain</span>
                    <span className="text-white font-medium">Somnia Testnet</span>
                  </div>
                  {mintedNFT.transactionHash && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Transaction Hash</span>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-400 hover:text-blue-300 p-0 h-auto font-mono text-xs"
                            onClick={() => {
                              navigator.clipboard.writeText(mintedNFT.transactionHash);
                              toast.success('Transaction hash copied!');
                            }}
                          >
                            {`${mintedNFT.transactionHash.slice(0, 10)}...${mintedNFT.transactionHash.slice(-8)}`}
                          </Button>
                        </div>
                      </div>

                      {/* Transaction Hash Actions */}
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                          onClick={() => {
                            navigator.clipboard.writeText(mintedNFT.transactionHash);
                            toast.success('Transaction hash copied to clipboard!');
                          }}
                        >
                          <Copy className="w-3 h-3 mr-2" />
                          Copy Hash
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-green-500/50 text-green-400 hover:bg-green-500/10"
                          onClick={() => {
                            window.open(`https://shannon-explorer.somnia.network/tx/${mintedNFT.transactionHash}`, '_blank');
                          }}
                        >
                          <ExternalLink className="w-3 h-3 mr-2" />
                          View on Explorer
                        </Button>
                      </div>
                    </div>
                  )}
                  {mintedNFT.blockNumber && mintedNFT.blockNumber > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Block Number</span>
                      <span className="text-white font-mono text-sm">{mintedNFT.blockNumber}</span>
                    </div>
                  )}
                  {mintedNFT.gasUsed && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Gas Used</span>
                      <span className="text-white font-mono text-sm">{mintedNFT.gasUsed}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Metadata URI</span>
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
                      window.open(`https://shannon-explorer.somnia.network/tx/${mintedNFT.transactionHash}`, '_blank');
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
                      window.open(`https://shannon-explorer.somnia.network/token/${mintedNFT.tokenId}`, '_blank');
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

              {/* Primary Actions */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 py-3"
                    onClick={() => {
                      // TODO: Add share functionality
                      toast.info('Share functionality coming soon!');
                    }}
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Share NFT
                  </Button>
                  <Button
                    variant="outline"
                    className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 py-3"
                    onClick={() => {
                      setIsListModalOpen(true);
                    }}
                  >
                    <List className="w-4 h-4 mr-2" />
                    List for Sale
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
        </div>
      )}
    </div>
    );
  };

  const renderListNFTModal = () => (
    <AnimatePresence mode="wait">
      {isListModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setIsListModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 30,
              mass: 1,
              duration: 0.3 
            }}
            className="bg-card backdrop-blur-xl border border-glass-border rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="flex items-center justify-between mb-6"
            >
              <div className="flex items-center space-x-3">
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                  className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center"
                >
                  <List className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-semibold text-white">List NFT for Sale</h3>
                  <p className="text-sm text-muted-foreground">Set your price and listing duration</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsListModalOpen(false)}
                className="text-muted-foreground hover:text-white hover:bg-gray-800/50 rounded-full w-8 h-8 p-0 transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </Button>
            </motion.div>

            {/* NFT Preview */}
            {mintedNFT && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-800/50 rounded-2xl p-4 mb-6"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex-shrink-0">
                    {formData.image ? (
                      <img 
                        src={formData.image} 
                        alt={formData.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-8 h-8 text-purple-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium text-lg truncate">{formData.name}</h4>
                    <p className="text-muted-foreground text-sm">Token ID: {mintedNFT.tokenId}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {formData.genre}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        ERC-721
                      </Badge>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Listing Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4, ease: "easeOut" }}
              className="space-y-6"
            >
              {/* Price */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="space-y-2"
              >
                <Label className="text-white font-medium">Listing Price *</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    value={listingPrice}
                    onChange={(e) => setListingPrice(e.target.value)}
                    placeholder="Enter price"
                    className="bg-gray-800/50 border-gray-700/50 text-white placeholder-muted-foreground rounded-xl h-12 pl-4 pr-20 font-medium focus:bg-gray-800/70 focus:border-green-500/50 transition-all duration-200"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                    <Select value={listingCurrency} onValueChange={setListingCurrency}>
                      <SelectTrigger className="bg-transparent border-none text-muted-foreground font-medium w-auto p-0 focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="STT">STT</SelectItem>
                        <SelectItem value="ETH">ETH</SelectItem>
                        <SelectItem value="USDC">USDC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Minimum price: 0.001 {listingCurrency}</p>
              </motion.div>

              {/* Duration */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35, duration: 0.3 }}
                className="space-y-2"
              >
                <Label className="text-white font-medium">Listing Duration</Label>
                <Select value={listingDuration} onValueChange={setListingDuration}>
                  <SelectTrigger className="bg-gray-800/50 border-gray-700/50 text-white rounded-xl h-12 focus:bg-gray-800/70 focus:border-green-500/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="1">1 Day</SelectItem>
                    <SelectItem value="3">3 Days</SelectItem>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="14">14 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>

              {/* Fees Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4"
              >
                <div className="flex items-start space-x-3">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 400 }}
                    className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  >
                    <DollarSign className="w-3 h-3 text-white" />
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-blue-300 text-sm font-medium">Marketplace Fees</p>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.3 }}
                      className="text-gray-300 text-xs mt-1 space-y-1"
                    >
                      <div className="flex justify-between">
                        <span>Platform Fee:</span>
                        <span>2.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Creator Royalty:</span>
                        <span>{formData.royaltyRate}%</span>
                      </div>
                      <div className="flex justify-between font-medium border-t border-blue-500/20 pt-1 mt-2">
                        <span>You'll receive:</span>
                        <span>
                          {listingPrice ? 
                            (parseFloat(listingPrice) * (1 - 0.025 - formData.royaltyRate / 100)).toFixed(4) : 
                            '0.000'
                          } {listingCurrency}
                        </span>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="flex space-x-3 mt-8"
            >
              <Button
                variant="outline"
                onClick={() => setIsListModalOpen(false)}
                disabled={isListing}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 rounded-xl h-12 transition-all duration-200"
              >
                Cancel
              </Button>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1"
              >
                <Button
                  onClick={handleConfirmListing}
                  disabled={isListing || !listingPrice || parseFloat(listingPrice) <= 0}
                  className="w-full bg-gradient-button hover:opacity-90 text-black rounded-full h-12 font-semibold transition-all duration-200"
                >
                  {isListing ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center space-x-2"
                    >
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>Listing...</span>
                    </motion.div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <List className="w-4 h-4" />
                      <span>List NFT</span>
                    </div>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {isOpen && createPortal(
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed bottom-0 bg-card rounded-t-2xl border-t border-glass-border shadow-2xl flex flex-col backdrop-blur-xl"
        style={{
          width: '80%',
          left: '10%',
          right: '10%',
          height: 'calc(100vh - 80px)',
          maxHeight: '95vh'
        }}
      >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-glass-border flex-shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-white">Mint Music NFT</h2>
                <p className="text-sm text-muted-foreground">Create your music NFT through our guided process</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="w-8 h-8 p-0 rounded-full hover:bg-white/10"
              >
                <X className="w-4 h-4 text-white" />
              </Button>
            </div>

            {/* Content Area with scroll */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {/* Step Indicator */}
              {renderStepIndicator()}

              {/* Step Content */}
              <div className="min-h-[350px]">
                {currentStep === 'metadata' && renderMetadataStep()}
                {currentStep === 'minting' && renderMintingStep()}
                {currentStep === 'complete' && renderCompleteStep()}
                {currentStep === 'nft-display' && renderNFTDisplayStep()}
              </div>
            </div>
      </motion.div>
    </div>,
    document.body
  )}

      {/* List NFT Modal */}
      {renderListNFTModal()}
    </>
  );
};

