import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useSimpleSIWE } from '@/hooks/useSimpleSIWE';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, CheckCircle, X, Info } from 'lucide-react';

export const SimpleSIWEModal = () => {
  const { address, isConnected } = useAccount();
  const { siweState, signInWithEthereum, isPending, isInitialized } = useSimpleSIWE();
  const [showModal, setShowModal] = useState(false);

  // Simple logic: Show modal if connected but not authenticated
  useEffect(() => {
    if (isConnected && address && isInitialized) {
      const shouldShow = !siweState.isAuthenticated;
      console.log('🔍 Simple SIWE check:', {
        isConnected,
        address: address.slice(0, 6) + '...',
        isInitialized,
        isAuthenticated: siweState.isAuthenticated,
        shouldShow
      });
      
      setShowModal(shouldShow);
    } else {
      setShowModal(false);
    }
  }, [isConnected, address, isInitialized, siweState.isAuthenticated]);

  const handleSignIn = async () => {
    const success = await signInWithEthereum();
    if (success) {
      setShowModal(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
  };

  if (!showModal || !isConnected || !address) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-white shadow-2xl">
        <CardHeader className="text-center relative">
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 h-8 w-8 p-0 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
          
          <div className="flex justify-center mb-4">
            <Shield className="w-16 h-16 text-primary" />
          </div>
          
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Sign-In With Ethereum (SIWE) 🔐
          </CardTitle>
          
          <CardDescription className="text-slate-300">
            Industry standard authentication for Web3 applications
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Wallet Info */}
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-600">
            <div>
              <p className="text-sm text-slate-400">Connected Wallet</p>
              <p className="font-mono text-sm text-white">
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            </div>
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
              Connected
            </Badge>
          </div>

          {/* SIWE Info */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-300">
                <p className="font-medium mb-1 text-blue-400">What is SIWE?</p>
                <p>• Industry standard (EIP-4361)</p>
                <p>• Secure wallet authentication</p>
                <p>• Used by OpenSea, ENS, Uniswap</p>
                <p>• No gas fees required</p>
              </div>
            </div>
          </div>

          {/* Authentication Message */}
          <div className="text-center space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Authenticate Your Wallet</h3>
              <p className="text-sm text-slate-400 mb-4">
                Sign a standardized SIWE message to prove wallet ownership and create a secure session.
              </p>
            </div>

            <Button
              onClick={handleSignIn}
              disabled={isPending}
              className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
              size="lg"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Please Sign SIWE Message...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Sign-In With Ethereum
                </>
              )}
            </Button>

            <p className="text-xs text-slate-500">
              This follows the EIP-4361 standard used by major DApps
            </p>
          </div>

          {/* Security Features */}
          <div className="p-3 bg-slate-800/50 border border-slate-600 rounded-lg">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-slate-300">
                <p className="font-medium mb-1 text-green-400">SIWE Security Features:</p>
                <p>• Domain binding and replay protection</p>
                <p>• Timestamp validation and nonce system</p>
                <p>• Chain ID verification</p>
                <p>• Session expiration (24 hours)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};