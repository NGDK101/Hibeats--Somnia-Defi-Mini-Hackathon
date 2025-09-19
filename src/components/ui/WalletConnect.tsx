import { useEffect, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { getPrimarySomName } from '@/services/somniaService';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export const WalletConnect = () => {
  const { address, isConnected } = useAccount();
  const [somniaName, setSomniaName] = useState<string | null>(null);
  const [isLoadingName, setIsLoadingName] = useState(false);

  useEffect(() => {
    const fetchSomniaName = async () => {
      if (address && isConnected) {
        setIsLoadingName(true);
        try {
          const name = await getPrimarySomName(address);
          setSomniaName(name);
        } catch (error) {
          console.error('Failed to fetch Somnia name:', error);
          setSomniaName(null);
        } finally {
          setIsLoadingName(false);
        }
      } else {
        setSomniaName(null);
      }
    };

    fetchSomniaName();
  }, [address, isConnected]);

  if (!isConnected) {
    return <ConnectButton />;
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Wallet Info Display - Clean Circular Design */}
      <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20 hover:bg-white/15 transition-all duration-200 cursor-pointer">
        <div className="flex flex-col items-start min-w-0">
          {somniaName ? (
            <div className="flex items-center space-x-2">
              <span className="text-white text-sm font-medium truncate max-w-[120px]">{somniaName}</span>
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-primary/20 text-primary border-primary/30 rounded-full">
                .som
              </Badge>
            </div>
          ) : isLoadingName ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-3 h-3 animate-spin text-white/70" />
              <span className="text-white/70 text-xs">Loading...</span>
            </div>
          ) : (
            <span className="text-white text-sm font-medium">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          )}
        </div>
      </div>

      {/* Clean Circular Avatar with Gradient */}
      <ConnectButton.Custom>
        {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
          if (!mounted || !account || !chain) return null;

          return (
            <div
              onClick={openAccountModal}
              className="w-10 h-10 rounded-full cursor-pointer border-2 border-white/30 hover:border-white/50 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
              style={{
                background: 'linear-gradient(135deg, #FF007A 0%, #7C5DFA 100%)'
              }}
            >
              <span className="text-white font-bold text-lg">
              </span>
            </div>
          );
        }}
      </ConnectButton.Custom>
    </div>
  );
};
