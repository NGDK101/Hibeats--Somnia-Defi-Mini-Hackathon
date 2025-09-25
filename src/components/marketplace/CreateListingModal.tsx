import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Music4, X, Calendar, Clock, Coins, Tag, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GeneratedMusic } from '@/types/music';
import { useMarketplace } from '@/hooks/useMarketplace';
import { parseEther } from 'viem';
import { toast } from 'sonner';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSong: GeneratedMusic | null;
  tokenId: bigint;
  onListingSuccess?: () => void;
}

type ListingType = 'fixed' | 'auction' | 'offers';
type ActiveTab = 'set_price' | 'auction' | 'offers';

export const CreateListingModal: React.FC<CreateListingModalProps> = ({
  isOpen,
  onClose,
  selectedSong,
  tokenId,
  onListingSuccess
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("set_price");
  const [listingType, setListingType] = useState<ListingType>("fixed");

  // Form states
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('STT');
  const [duration, setDuration] = useState('30');
  const [customDuration, setCustomDuration] = useState('');
  const [category, setCategory] = useState('Music');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // Auction specific states
  const [startingPrice, setStartingPrice] = useState('');
  const [reservePrice, setReservePrice] = useState('');
  const [auctionDuration, setAuctionDuration] = useState('7');

  const { listNFT, createAuction, isLoading } = useMarketplace();

  // Handle modal open/close animations
  useEffect(() => {
    if (isOpen) {
      setIsModalVisible(true);
      // Small delay to trigger animation
      setTimeout(() => {
        // Animation handled by CSS classes
      }, 10);
    } else {
      setTimeout(() => {
        setIsModalVisible(false);
      }, 300);
    }
  }, [isOpen]);

  // Initialize form with song data
  useEffect(() => {
    if (selectedSong && isOpen) {
      // Auto-populate tags from song genre
      if (selectedSong.genre && selectedSong.genre.length > 0) {
        setTags(selectedSong.genre.slice(0, 3)); // Limit to first 3 genres
      }

      // Set default price based on song duration (longer = more expensive)
      const basePrice = selectedSong.duration ? Math.max(0.01, selectedSong.duration / 100) : 0.1;
      setPrice(basePrice.toFixed(3));
      setStartingPrice((basePrice * 0.8).toFixed(3));
    }
  }, [selectedSong, isOpen]);

  const closeModal = () => {
    onClose();
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 10) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleFixedPriceListing = async () => {
    if (!price || !selectedSong) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      const listingDuration = duration === 'custom' ? parseInt(customDuration) : parseInt(duration);

      await listNFT({
        tokenId,
        price: parseEther(price),
        isBeatsToken: currency === 'BEATS',
        duration: BigInt(listingDuration * 24 * 60 * 60), // Convert days to seconds
        category,
        tags,
      });

      toast.success('NFT listed successfully!');
      onListingSuccess?.();
      closeModal();
    } catch (error) {
      console.error('Failed to list NFT:', error);
      toast.error('Failed to list NFT');
    }
  };

  const handleAuctionListing = async () => {
    if (!startingPrice || !selectedSong) {
      toast.error('Please enter a valid starting price');
      return;
    }

    try {
      const auctionDurationSeconds = parseInt(auctionDuration) * 24 * 60 * 60;

      await createAuction({
        tokenId,
        startPrice: parseEther(startingPrice),
        reservePrice: reservePrice ? parseEther(reservePrice) : BigInt(0),
        duration: BigInt(auctionDurationSeconds),
        isBeatsToken: currency === 'BEATS',
      });

      toast.success('Auction created successfully!');
      onListingSuccess?.();
      closeModal();
    } catch (error) {
      console.error('Failed to create auction:', error);
      toast.error('Failed to create auction');
    }
  };

  const handleSubmit = () => {
    if (listingType === 'fixed') {
      handleFixedPriceListing();
    } else if (listingType === 'auction') {
      handleAuctionListing();
    } else {
      // Offers only - just enable offers without setting a price
      handleFixedPriceListing(); // For now, treat as fixed price with no immediate sale
    }
  };

  if (!isModalVisible) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          style={{
            zIndex: 9999,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh'
          }}
        >
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.1 }}
            className="absolute inset-0 w-full h-full"
            onClick={closeModal}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 300,
              duration: 0.5 
            }}
            className="fixed bottom-0 bg-card rounded-t-2xl border-t border-glass-border shadow-2xl flex flex-col backdrop-blur-xl"
            style={{
              left: '10%',
              right: '10%',
              width: '80%',
              maxWidth: 'none',
              margin: 0,
              height: '60vh',
              maxHeight: '600px',
              minHeight: '450px'
            }}
          >
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="flex items-center justify-between px-6 py-3 border-b border-glass-border flex-shrink-0"
            >
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-semibold text-white">Create listing</h2>
            {selectedSong && (
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <Music4 className="w-3 h-3 text-white" />
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-muted rounded-lg p-1">
              <button
                onClick={() => {
                  setActiveTab("set_price");
                  setListingType("fixed");
                }}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-full transition-all duration-200",
                  activeTab === "set_price"
                    ? "text-black bg-gradient-button shadow-sm"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                Fixed Price
              </button>
              <button
                onClick={() => {
                  setActiveTab("auction");
                  setListingType("auction");
                }}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-full transition-all duration-200",
                  activeTab === "auction"
                    ? "text-black bg-gradient-button shadow-sm"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                Auction
              </button>
              <button
                onClick={() => {
                  setActiveTab("offers");
                  setListingType("offers");
                }}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-full transition-all duration-200",
                  activeTab === "offers"
                    ? "text-black bg-gradient-button shadow-sm"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                Offers Only
              </button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeModal}
              className="w-8 h-8 p-0 rounded-full hover:bg-white/10"
            >
              <X className="w-4 h-4 text-white" />
            </Button>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex-1 overflow-y-auto px-6 py-4"
        >
          {/* Song Preview */}
          {selectedSong && (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-secondary flex-shrink-0">
                <img
                  src={selectedSong.imageUrl || "https://via.placeholder.com/400x400/1e1e1e/ffffff?text=Music"}
                  alt={selectedSong.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white truncate">{selectedSong.title}</h3>
                <p className="text-sm text-gray-400 truncate">{selectedSong.artist || 'AI Generated'}</p>
                <div className="flex items-center gap-2 mt-1">
                  {selectedSong.genre?.slice(0, 2).map((genre) => (
                    <Badge key={genre} variant="secondary" className="text-xs">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Fixed Price Form */}
          {activeTab === "set_price" && (
            <div className="space-y-6">
              <div>
                <Label className="text-white mb-2 block">Price *</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="Enter price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="flex-1 bg-white/5 border-white/20 text-white rounded-lg"
                  />
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="w-24 bg-white/5 border-white/20 text-white rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STT">STT</SelectItem>
                      <SelectItem value="BEATS">BEATS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-white mb-2 block">Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">1 week</SelectItem>
                    <SelectItem value="30">1 month</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {duration === 'custom' && (
                  <Input
                    type="number"
                    placeholder="Enter days"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                    className="mt-2 bg-white/5 border-white/20 text-white rounded-lg"
                  />
                )}
              </div>
            </div>
          )}

          {/* Auction Form */}
          {activeTab === "auction" && (
            <div className="space-y-6">
              <div>
                <Label className="text-white mb-2 block">Starting Price *</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="Enter starting price"
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(e.target.value)}
                    className="flex-1 bg-white/5 border-white/20 text-white rounded-lg"
                  />
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="w-24 bg-white/5 border-white/20 text-white rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STT">STT</SelectItem>
                      <SelectItem value="BEATS">BEATS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-white mb-2 block">Reserve Price (Optional)</Label>
                <Input
                  type="number"
                  step="0.001"
                  placeholder="Enter reserve price"
                  value={reservePrice}
                  onChange={(e) => setReservePrice(e.target.value)}
                  className="bg-white/5 border-white/20 text-white rounded-lg"
                />
                <p className="text-xs text-gray-400 mt-1">Minimum price you'll accept</p>
              </div>

              <div>
                <Label className="text-white mb-2 block">Auction Duration</Label>
                <Select value={auctionDuration} onValueChange={setAuctionDuration}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">1 week</SelectItem>
                    <SelectItem value="14">2 weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Offers Only */}
          {activeTab === "offers" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                <Tag className="w-8 h-8 text-white/70" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Accept Offers Only</h3>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                Your NFT will be available for others to make offers. You can accept or decline offers as they come in.
              </p>
            </div>
          )}

          {/* Tags */}
          <div className="mt-6">
            <Label className="text-white mb-2 block">Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-white/5 border-white/20 text-white rounded-lg"
              />
              <Button
                onClick={addTag}
                variant="outline"
                size="sm"
                disabled={!newTag.trim() || tags.length >= 10}
                className="border-white/20 text-white hover:bg-white/10 rounded-full"
              >
                Add
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="px-6 py-4 border-t border-glass-border flex-shrink-0"
        >
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {activeTab === "set_price" && price && (
                <span>List for {price} {currency}</span>
              )}
              {activeTab === "auction" && startingPrice && (
                <span>Start auction at {startingPrice} {currency}</span>
              )}
              {activeTab === "offers" && (
                <span>Accept offers only</span>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={closeModal}
                className="border-white/20 text-white hover:bg-white/10 rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || (activeTab === "set_price" && !price) || (activeTab === "auction" && !startingPrice)}
                className="bg-gradient-button hover:opacity-90 rounded-full"
              >
                {isLoading ? 'Creating...' : 'Complete listing'}
              </Button>
            </div>
          </div>
        </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default CreateListingModal;