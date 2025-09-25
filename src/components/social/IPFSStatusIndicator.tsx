import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IPFSStatusIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

export const IPFSStatusIndicator: React.FC<IPFSStatusIndicatorProps> = ({
  className,
  showLabel = true
}) => {
  const handleViewIPFS = () => {
    // Open IPFS documentation or explorer
    window.open('https://ipfs.tech/', '_blank');
  };

  if (showLabel) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge
          variant="outline"
          className="text-xs border-blue-500/30 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-colors cursor-pointer"
          onClick={handleViewIPFS}
        >
          <Database className="w-3 h-3 mr-1" />
          <ExternalLink className="w-3 h-3 ml-1" />
        </Badge>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleViewIPFS}
      className={cn("w-6 h-6 p-0 text-blue-400 hover:text-blue-300", className)}
      title="Data stored on IPFS (decentralized storage)"
    >
      <Database className="w-4 h-4" />
    </Button>
  );
};