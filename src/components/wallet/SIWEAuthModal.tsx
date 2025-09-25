import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useSIWE } from '@/hooks/useSIWE';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, CheckCircle, AlertCircle, X, Key } from 'lucide-react';

export const SIWEAuthModal = () => {
  const { address, isConnected } = useAccount();
  const { siweState, isPending, isInitialized, signInWithEthereum } = useSIWE();
  const [showModal, setShowModal] = useState(false);

  // Show modal if connected but not authenticated
  useEffect(() => {
    if (isConnected && address && isInitialized) {
      const shouldShow = !siweState.isAuthenticated;
      console.log('🔍 SIWE auth check:', {
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
      <Card className="w-full max-w-lg bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-white shadow-2xl">
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
            <div className="relative">
              <Shield className="w-16 h-16 text-primary" />
              <Key className="w-6 h-6 text-yellow-400 absolute -bottom-1 -right-1" />
            </div>
          </div>
          
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Sign-In With Ethereum 🔐
          </CardTitle>
          
          <CardDescription className="text-slate-300">
            Industry standard authentication using EIP-4361
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Wallet Info */}
          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-600">
            <div>
              <p className="text-sm text-slate-400">Connected Wallet</p>
              <p className="font-mono text-sm text-white">
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            </div>
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
              <CheckCircle className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          </div>

          {/* SIWE Info */}
          <div className="text-center space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Ethereum Standard Authentication</h3>
              <p className="text-sm text-slate-400 mb-4">
                Sign a standardized message to prove wallet ownership and create a secure session.
              </p>
              
              <div className="space-y-3 text-xs text-slate-300 mb-4">
                <div className="flex items-center justify-center space-x-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>Using EIP-4361 standard (SIWE) - same as OpenSea, Uniswap, ENS</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-800/50 rounded border border-slate-600">
                    <p className="text-green-400 font-medium">✓ No Gas Fees</p>
                  </div>
                  <div className="p-2 bg-slate-800/50 rounded border border-slate-600">
                    <p className="text-green-400 font-medium">✓ 24h Session</p>
                  </div>
                  <div className="p-2 bg-slate-800/50 rounded border border-slate-600">
                    <p className="text-green-400 font-medium">✓ Secure Nonce</p>
                  </div>
                  <div className="p-2 bg-slate-800/50 rounded border border-slate-600">
                    <p className="text-green-400 font-medium">✓ Domain Bound</p>
                  </div>
                </div>
              </div>
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
                  Please Sign Message in Wallet...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Sign-In With Ethereum
                </>
              )}
            </Button>

            <p className="text-xs text-slate-500">
              You can close this dialog and sign later if needed
            </p>
          </div>

          {/* SIWE Message Preview */}
          <div className="p-3 bg-slate-800/50 border border-slate-600 rounded-lg">
            <div className="text-xs text-slate-300">
              <p className="font-medium mb-2 text-blue-400 flex items-center">
                <Key className="w-3 h-3 mr-1" />
                SIWE Message Format:
              </p>
              <div className="font-mono text-xs bg-slate-900/50 p-2 rounded border border-slate-700 text-slate-400">
                {`hibeats.xyz wants you to sign in with your Ethereum account:
${address}

Sign in to HiBeats - Decentralized Music Platform 🎵

URI: ${window.location.origin}
Version: 1
Chain ID: 1
Nonce: [random]
Issued At: [timestamp]
Expiration Time: [24h from now]`}
              </div>
            </div>
          </div>

          {/* Security Features */}
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-start space-x-2">
              <Shield className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-green-300">
                <p className="font-medium mb-1">🔒 Enhanced Security Features:</p>
                <ul className="space-y-1">
                  <li>• Domain verification prevents phishing</li>
                  <li>• Nonce prevents replay attacks</li>
                  <li>• Automatic session expiration</li>
                  <li>• Industry standard EIP-4361 format</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};