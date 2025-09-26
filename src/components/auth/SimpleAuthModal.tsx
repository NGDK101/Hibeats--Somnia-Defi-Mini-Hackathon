import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useWalletAuthentication } from '@/hooks/useWalletAuthentication';
import { useWalletPersistenceContext } from '@/contexts/WalletPersistenceContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import logoImage from '@/images/assets/logo.png';
import { Loader2 } from 'lucide-react';

export const SimpleAuthModal = () => {
  const { address, isConnected } = useAccount();
  const { authState, authenticateWallet, isPending, isInitialized } = useWalletAuthentication();
  const { isInitializing, isReconnecting } = useWalletPersistenceContext();
  const [showModal, setShowModal] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // OpenSea pattern: Simple, immediate auth check (no delays)
  useEffect(() => {
    if (isConnected && address && isInitialized) {
      const shouldShow = !authState.isAuthenticated;

      // Only log in development mode
      if (process.env.NODE_ENV === 'development' && shouldShow) {
        console.log('🔍 Auth needed for:', address.slice(0, 6) + '...');
      }

      if (shouldShow && !showModal) {
        setShowModal(true);
        setTimeout(() => setIsVisible(true), 10);
      } else if (!shouldShow && showModal) {
        setIsVisible(false);
        setTimeout(() => setShowModal(false), 300);
      }
    } else if (showModal) {
      // Hide modal if wallet disconnected
      setIsVisible(false);
      setTimeout(() => setShowModal(false), 300);
    }
  }, [isConnected, address, isInitialized, authState.isAuthenticated, showModal]);

  const handleSignIn = async () => {
    const success = await authenticateWallet();
    if (success) {
      setIsVisible(false);
      setTimeout(() => setShowModal(false), 300);
    }
  };

  if (!showModal || !isConnected || !address) {
    return null;
  }

  return (
    <div 
      className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <Card 
        className={`w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-white shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 ${
          isVisible 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-4'
        }`}
      >
        <CardHeader className="text-center rounded-t-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src={logoImage} 
              alt="HiBeats Logo" 
              className="w-32 h-32 object-contain"
            />
          </div>
          
          <CardTitle className="text-2xl font-bold text-white mb-2">
            Authenticate to continue
          </CardTitle>
          
          <CardDescription className="text-slate-300 text-base">
            Please sign in with your connected wallet to continue.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 rounded-b-2xl">
          {/* Sign In Button */}
          <Button
            onClick={handleSignIn}
            disabled={isPending}
            className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-medium py-3 text-lg rounded-xl"
            size="lg"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Signing...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};