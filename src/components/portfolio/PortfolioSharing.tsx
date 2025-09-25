import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Share2, 
  Copy, 
  Twitter, 
  Facebook, 
  Instagram, 
  Link as LinkIcon,
  Download,
  QrCode,
  Mail,
  MessageCircle
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { usePortfolio } from '@/hooks/usePortfolio';

interface PortfolioSharingProps {
  className?: string;
}

export const PortfolioSharing = ({ className }: PortfolioSharingProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { address } = useAccount();
  const { portfolioStats } = usePortfolio();

  // Generate portfolio URL
  const portfolioUrl = `${window.location.origin}/portfolio/${address}`;
  
  // Generate share text
  const shareText = `Check out my HiBeats music NFT portfolio! 🎵\n\n` +
    `📊 ${portfolioStats.totalItems} unique NFTs\n` +
    `💎 Total Value: ${portfolioStats.totalValue}\n` +
    `👀 ${portfolioStats.totalViews.toLocaleString()} total views\n\n` +
    `Join the future of music ownership at HiBeats!`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const shareToSocial = (platform: string) => {
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(portfolioUrl);
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&summary=${encodedText}`;
        break;
      case 'reddit':
        shareUrl = `https://reddit.com/submit?url=${encodedUrl}&title=${encodeURIComponent('My HiBeats Music NFT Portfolio')}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const downloadPortfolioData = () => {
    // Create a downloadable portfolio report
    const portfolioData = {
      address,
      stats: portfolioStats,
      generatedAt: new Date().toISOString(),
      portfolio: {
        totalItems: portfolioStats.totalItems,
        totalValue: portfolioStats.totalValue,
        floorPrice: portfolioStats.floorPrice,
        topBid: portfolioStats.topBid,
        listed: portfolioStats.listed,
        totalViews: portfolioStats.totalViews,
        totalLikes: portfolioStats.totalLikes
      }
    };

    const dataStr = JSON.stringify(portfolioData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `hibeats-portfolio-${address?.slice(0, 8)}-${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Portfolio data downloaded!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`text-white/70 hover:text-white ${className}`}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share Portfolio
        </Button>
      </DialogTrigger>
      
      <DialogContent className="bg-card border-glass-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <Share2 className="w-5 h-5 mr-2" />
            Share Your Portfolio
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Portfolio URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Portfolio URL</label>
            <div className="flex space-x-2">
              <Input
                value={portfolioUrl}
                readOnly
                className="bg-input/20 border-glass-border/30 text-white text-sm"
              />
              <Button
                size="sm"
                onClick={() => copyToClipboard(portfolioUrl)}
                className={`${copied ? 'bg-green-600' : 'bg-primary'} hover:opacity-90 text-black`}
              >
                {copied ? 'Copied!' : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Social Sharing */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white/70">Share on Social Media</label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareToSocial('twitter')}
                className="flex flex-col items-center p-3 h-auto border-glass-border/30 text-white/70 hover:text-white hover:border-blue-400"
              >
                <Twitter className="w-5 h-5 mb-1" />
                <span className="text-xs">Twitter</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareToSocial('facebook')}
                className="flex flex-col items-center p-3 h-auto border-glass-border/30 text-white/70 hover:text-white hover:border-blue-600"
              >
                <Facebook className="w-5 h-5 mb-1" />
                <span className="text-xs">Facebook</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareToSocial('linkedin')}
                className="flex flex-col items-center p-3 h-auto border-glass-border/30 text-white/70 hover:text-white hover:border-blue-700"
              >
                <LinkIcon className="w-5 h-5 mb-1" />
                <span className="text-xs">LinkedIn</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareToSocial('telegram')}
                className="flex flex-col items-center p-3 h-auto border-glass-border/30 text-white/70 hover:text-white hover:border-blue-500"
              >
                <MessageCircle className="w-5 h-5 mb-1" />
                <span className="text-xs">Telegram</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareToSocial('whatsapp')}
                className="flex flex-col items-center p-3 h-auto border-glass-border/30 text-white/70 hover:text-white hover:border-green-500"
              >
                <MessageCircle className="w-5 h-5 mb-1" />
                <span className="text-xs">WhatsApp</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareToSocial('reddit')}
                className="flex flex-col items-center p-3 h-auto border-glass-border/30 text-white/70 hover:text-white hover:border-orange-500"
              >
                <MessageCircle className="w-5 h-5 mb-1" />
                <span className="text-xs">Reddit</span>
              </Button>
            </div>
          </div>

          {/* Share Text Preview */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Share Message</label>
            <div className="bg-input/20 border border-glass-border/30 rounded-md p-3">
              <p className="text-sm text-white/80 whitespace-pre-line">{shareText}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(shareText)}
              className="w-full border-glass-border/30 text-white/70 hover:text-white"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Message
            </Button>
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white/70">Export Portfolio</label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadPortfolioData}
                className="border-glass-border/30 text-white/70 hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Data
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info('QR Code feature coming soon!')}
                className="border-glass-border/30 text-white/70 hover:text-white"
              >
                <QrCode className="w-4 h-4 mr-2" />
                QR Code
              </Button>
            </div>
          </div>

          {/* Portfolio Stats Summary */}
          <div className="bg-white/5 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-medium text-white">Portfolio Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-white/60">Items: <span className="text-white">{portfolioStats.totalItems}</span></div>
              <div className="text-white/60">Value: <span className="text-white">{portfolioStats.totalValue}</span></div>
              <div className="text-white/60">Views: <span className="text-white">{portfolioStats.totalViews.toLocaleString()}</span></div>
              <div className="text-white/60">Likes: <span className="text-white">{portfolioStats.totalLikes}</span></div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};