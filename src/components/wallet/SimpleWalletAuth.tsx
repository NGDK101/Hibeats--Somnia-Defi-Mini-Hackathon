import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useWalletAuthentication } from '@/hooks/useWalletAuthentication';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, CheckCircle, AlertCircle, X } from 'lucide-react';

export const SimpleWalletAuth = () => {
  const { address, isConnected } = useAccount();
  const { authState, authenticateWallet, isPending, isInitialized } = useWalletAuthentication();
  const [showModal, setShowModal] = useState(false);

  // Simple logic: Show modal if connected but not authenticated
  useEffect(() => {
    if (isConnected && address && isInitialized) {
      const shouldShow = !authState.isAuthenticated;
      console.log('🔍 Simple auth check:', {
        isConnected,
        address: address.slice(0, 6) + '...',
        isInitialized,
        isAuthenticated: authState.isAuthenticated,
        shouldShow
      });
      
      setShowModal(shouldShow);
    } else {
      setShowModal(false);
    }
  }, [isConnected, address, isInitialized, authState.isAuthenticated]);

  const handleAuthenticate = async () => {
    const success = await authenticateWallet();
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
            Wallet Authentication 🔐
          </CardTitle>
          
          <CardDescription className="text-slate-300">
            Please sign a message to verify your wallet ownership
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

          {/* Authentication Message */}
          <div className="text-center space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Secure Authentication Required</h3>
              <p className="text-sm text-slate-400 mb-4">
                Sign a message to prove you own this wallet. This is completely free and secure - no gas fees required.
              </p>
              
              <div className="flex items-center justify-center space-x-2 text-xs text-slate-500 mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <AlertCircle className="w-4 h-4 text-blue-400" />
                <span>This signature only proves wallet ownership and doesn't access your funds</span>
              </div>
            </div>

            <Button
              onClick={handleAuthenticate}
              disabled={isPending}
              className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
              size="lg"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Please Sign in Wallet...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Sign Message to Continue
                </>
              )}
            </Button>

            <p className="text-xs text-slate-500">
              You can close this dialog and sign later if needed
            </p>
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-slate-800/50 border border-slate-600 rounded-lg">
            <div className="flex items-start space-x-2">
              <Shield className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-slate-300">
                <p className="font-medium mb-1 text-green-400">Why do we need this?</p>
                <p>• Verify you own this wallet address</p>
                <p>• Create a secure session</p>
                <p>• No blockchain transaction required</p>
                <p>• Completely free (no gas fees)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};