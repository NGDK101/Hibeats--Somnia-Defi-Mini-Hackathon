import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useSIWEPinataAuth } from '@/hooks/useSIWEPinataAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import logoImage from '@/images/assets/logo.png';
import { Loader2 } from 'lucide-react';

export const SIWEAuthModal = () => {
  const { address, isConnected } = useAccount();
  const { authState, signInWithEthereumPinata, isPending, isInitialized } = useSIWEPinataAuth();
  const [showModal, setShowModal] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Show modal if connected but not authenticated
  useEffect(() => {
    if (isConnected && address && isInitialized) {
      const shouldShow = !authState.isAuthenticated;
      
      if (shouldShow && !showModal) {
        setShowModal(true);
        setTimeout(() => setIsVisible(true), 10);
      } else if (!shouldShow && showModal) {
        setIsVisible(false);
        setTimeout(() => setShowModal(false), 300);
      }
    } else {
      if (showModal) {
        setIsVisible(false);
        setTimeout(() => setShowModal(false), 300);
      }
    }
  }, [isConnected, address, isInitialized, authState.isAuthenticated, showModal]);

  const handleSignIn = async () => {
    const success = await signInWithEthereumPinata();
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
          
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-blue-300">
              🔐 Using SIWE (EIP-4361) standard with decentralized IPFS storage
            </p>
          </div>
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
                Signing with SIWE...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
          
          <div className="text-center">
            <p className="text-xs text-slate-500">
              Session will be stored securely on IPFS for 3 days
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};