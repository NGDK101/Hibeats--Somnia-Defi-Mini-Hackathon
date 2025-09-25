import { ExternalLink, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TransactionLinkProps {
  hash: string;
  explorerUrl?: string;
  showCopy?: boolean;
  showExternal?: boolean;
  className?: string;
}

export const TransactionLink = ({
  hash,
  explorerUrl = `https://shannon-explorer.somnia.network/tx/${hash}`,
  showCopy = true,
  showExternal = true,
  className = ""
}: TransactionLinkProps) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(hash);
    toast.success('Transaction hash copied to clipboard');
  };

  const openInExplorer = () => {
    window.open(explorerUrl, '_blank', 'noopener,noreferrer');
  };

  const shortenHash = (hash: string) => {
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-white/80 font-mono text-sm">
        {shortenHash(hash)}
      </span>

      {showCopy && (
        <Button
          variant="ghost"
          size="sm"
          className="w-6 h-6 p-0 text-white/70 hover:text-white"
          onClick={copyToClipboard}
          title="Copy transaction hash"
        >
          <Copy className="w-3 h-3" />
        </Button>
      )}

      {showExternal && (
        <Button
          variant="ghost"
          size="sm"
          className="w-6 h-6 p-0 text-white/70 hover:text-white"
          onClick={openInExplorer}
          title="View on Shannon Explorer"
        >
          <ExternalLink className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
};

interface AddressLinkProps {
  address: string;
  explorerUrl?: string;
  showCopy?: boolean;
  showExternal?: boolean;
  className?: string;
  label?: string;
}

export const AddressLink = ({
  address,
  explorerUrl = `https://shannon-explorer.somnia.network/address/${address}`,
  showCopy = true,
  showExternal = true,
  className = "",
  label
}: AddressLinkProps) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard');
  };

  const openInExplorer = () => {
    window.open(explorerUrl, '_blank', 'noopener,noreferrer');
  };

  const shortenAddress = (addr: string) => {
    if (addr === '0x0000000000000000000000000000000000000000') {
      return 'Genesis';
    }
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-white/80 font-mono text-sm">
        {label || shortenAddress(address)}
      </span>

      {showCopy && (
        <Button
          variant="ghost"
          size="sm"
          className="w-6 h-6 p-0 text-white/70 hover:text-white"
          onClick={copyToClipboard}
          title="Copy address"
        >
          <Copy className="w-3 h-3" />
        </Button>
      )}

      {showExternal && (
        <Button
          variant="ghost"
          size="sm"
          className="w-6 h-6 p-0 text-white/70 hover:text-white"
          onClick={openInExplorer}
          title="View on Shannon Explorer"
        >
          <ExternalLink className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
};