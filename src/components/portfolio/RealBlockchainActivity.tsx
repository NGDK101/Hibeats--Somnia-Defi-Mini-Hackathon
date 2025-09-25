import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ExternalLink,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  Clock,
  Hash,
  User,
  Zap,
  Copy,
  RefreshCw
} from "lucide-react";
import { useShannonExplorer, type NFTActivity } from "@/hooks/useShannonExplorer";
import { formatSomniaValue } from "@/services/shannonExplorerService";
import { toast } from "sonner";

interface RealBlockchainActivityProps {
  userAddress?: string;
}

export const RealBlockchainActivity = ({ userAddress }: RealBlockchainActivityProps) => {
  const {
    userTransactions,
    nftTransfers,
    addressInfo,
    isLoading,
    getNFTActivities,
    getTransactionUrl,
    getAddressUrl
  } = useShannonExplorer();

  const [nftActivities, setNftActivities] = useState<NFTActivity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'nft' | 'transfers'>('all');

  // Fetch NFT activities
  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoadingActivities(true);
      try {
        const activities = await getNFTActivities(userAddress);
        setNftActivities(activities);
      } catch (error) {
        console.error('Failed to fetch NFT activities:', error);
      } finally {
        setIsLoadingActivities(false);
      }
    };

    fetchActivities();
  }, [getNFTActivities, userAddress]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;

    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'mint': return <Zap className="w-4 h-4 text-green-400" />;
      case 'transfer': return <ArrowUpRight className="w-4 h-4 text-blue-400" />;
      case 'sale': return <Coins className="w-4 h-4 text-yellow-400" />;
      default: return <Hash className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'mint': return 'border-green-500/30 bg-green-500/10';
      case 'transfer': return 'border-blue-500/30 bg-blue-500/10';
      case 'sale': return 'border-yellow-500/30 bg-yellow-500/10';
      default: return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  const renderTransactionItem = (tx: any, index: number) => (
    <div key={`${tx.hash}-${index}`} className="border border-glass-border/20 rounded-lg p-4 hover:border-glass-border/40 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            {tx.value !== '0' ? <Coins className="w-5 h-5 text-primary" /> : <Hash className="w-5 h-5 text-gray-400" />}
          </div>
          <div>
            <h4 className="text-white font-medium">
              {tx.functionName || (tx.value !== '0' ? 'Transfer' : 'Contract Interaction')}
            </h4>
            <p className="text-white/60 text-sm">{formatTimeAgo(tx.timestamp)}</p>
          </div>
        </div>
        <Badge variant="secondary" className={tx.status === 'success' ? 'text-green-400' : 'text-red-400'}>
          {tx.status}
        </Badge>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-white/60">Hash:</span>
          <div className="flex items-center space-x-2">
            <span className="text-white font-mono text-xs">{tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}</span>
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0"
              onClick={() => copyToClipboard(tx.hash)}
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0"
              onClick={() => window.open(getTransactionUrl(tx.hash), '_blank')}
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white/60">From:</span>
          <span className="text-white font-mono text-xs">{tx.from.slice(0, 6)}...{tx.from.slice(-4)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white/60">To:</span>
          <span className="text-white font-mono text-xs">{tx.to.slice(0, 6)}...{tx.to.slice(-4)}</span>
        </div>

        {tx.value !== '0' && (
          <div className="flex items-center justify-between">
            <span className="text-white/60">Value:</span>
            <span className="text-white font-medium">{formatSomniaValue(tx.value)}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-white/60">Block:</span>
          <span className="text-white">{tx.blockNumber.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );

  const renderNFTActivity = (activity: NFTActivity, index: number) => (
    <div key={`${activity.hash}-${index}`} className={`border rounded-lg p-4 ${getActivityColor(activity.type)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center">
            {getActivityIcon(activity.type)}
          </div>
          <div>
            <h4 className="text-white font-medium capitalize">{activity.type}</h4>
            <p className="text-white/60 text-sm">NFT #{activity.tokenId}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white/60 text-sm">{formatTimeAgo(activity.timestamp)}</p>
          {activity.price && (
            <p className="text-white font-medium">{activity.price}</p>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-white/60">From:</span>
          <span className="text-white font-mono text-xs">
            {activity.from === '0x0000000000000000000000000000000000000000'
              ? 'Genesis'
              : `${activity.from.slice(0, 6)}...${activity.from.slice(-4)}`}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white/60">To:</span>
          <span className="text-white font-mono text-xs">{activity.to.slice(0, 6)}...{activity.to.slice(-4)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white/60">Transaction:</span>
          <div className="flex items-center space-x-2">
            <span className="text-white font-mono text-xs">{activity.hash.slice(0, 10)}...{activity.hash.slice(-8)}</span>
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0"
              onClick={() => window.open(getTransactionUrl(activity.hash), '_blank')}
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTokenTransfer = (transfer: any, index: number) => (
    <div key={`${transfer.hash}-${index}`} className="border border-glass-border/20 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h4 className="text-white font-medium">Token Transfer</h4>
            <p className="text-white/60 text-sm">{transfer.tokenSymbol || 'Unknown Token'}</p>
          </div>
        </div>
        <p className="text-white/60 text-sm">{formatTimeAgo(transfer.timestamp)}</p>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-white/60">From:</span>
          <span className="text-white font-mono text-xs">{transfer.from.slice(0, 6)}...{transfer.from.slice(-4)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white/60">To:</span>
          <span className="text-white font-mono text-xs">{transfer.to.slice(0, 6)}...{transfer.to.slice(-4)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white/60">Value:</span>
          <span className="text-white font-medium">
            {transfer.tokenId ? `NFT #${transfer.tokenId}` : formatSomniaValue(transfer.value, transfer.tokenDecimals)}
          </span>
        </div>
      </div>
    </div>
  );

  if (isLoading || isLoadingActivities) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2 text-white/70">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading blockchain data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Summary */}
      {addressInfo && (
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Account Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-white/60 text-sm">Balance</p>
              <p className="text-white font-semibold">{formatSomniaValue(addressInfo.balance)}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Transactions</p>
              <p className="text-white font-semibold">{addressInfo.transactionCount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Account Type</p>
              <p className="text-white font-semibold">{addressInfo.isContract ? 'Contract' : 'Wallet'}</p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Activity Tabs */}
      <div className="flex space-x-1 bg-glass-card/30 rounded-lg p-1">
        <Button
          variant={activeTab === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('all')}
          className={activeTab === 'all' ? 'bg-primary text-black' : 'text-white/70'}
        >
          All Activity ({userTransactions.length})
        </Button>
        <Button
          variant={activeTab === 'nft' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('nft')}
          className={activeTab === 'nft' ? 'bg-primary text-black' : 'text-white/70'}
        >
          NFT Activity ({nftActivities.length})
        </Button>
        <Button
          variant={activeTab === 'transfers' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('transfers')}
          className={activeTab === 'transfers' ? 'bg-primary text-black' : 'text-white/70'}
        >
          Token Transfers ({nftTransfers.length})
        </Button>
      </div>

      {/* Activity Content */}
      <div className="space-y-4">
        {activeTab === 'all' && (
          <>
            {userTransactions.length === 0 ? (
              <div className="text-center py-8 text-white/70">
                <Hash className="w-12 h-12 mx-auto mb-3 text-white/30" />
                <p>No transactions found</p>
              </div>
            ) : (
              userTransactions.slice(0, 10).map(renderTransactionItem)
            )}
          </>
        )}

        {activeTab === 'nft' && (
          <>
            {nftActivities.length === 0 ? (
              <div className="text-center py-8 text-white/70">
                <Zap className="w-12 h-12 mx-auto mb-3 text-white/30" />
                <p>No NFT activities found</p>
              </div>
            ) : (
              nftActivities.slice(0, 10).map(renderNFTActivity)
            )}
          </>
        )}

        {activeTab === 'transfers' && (
          <>
            {nftTransfers.length === 0 ? (
              <div className="text-center py-8 text-white/70">
                <ArrowUpRight className="w-12 h-12 mx-auto mb-3 text-white/30" />
                <p>No token transfers found</p>
              </div>
            ) : (
              nftTransfers.slice(0, 10).map(renderTokenTransfer)
            )}
          </>
        )}
      </div>
    </div>
  );
};