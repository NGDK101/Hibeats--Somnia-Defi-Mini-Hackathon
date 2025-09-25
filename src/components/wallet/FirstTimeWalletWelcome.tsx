import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useWalletAuthentication } from '@/hooks/useWalletAuthentication';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, CheckCircle, AlertCircle, User, Music } from 'lucide-react';
import { toast } from 'sonner';

export const FirstTimeWalletWelcome = () => {
  const { address, isConnected } = useAccount();
  const { authState, authenticateWallet, isPending, checkAuthStatus, isInitialized } = useWalletAuthentication();
  const { userProfile, hasProfile } = useProfile();
  const [showWelcome, setShowWelcome] = useState(false);
  const [step, setStep] = useState<'auth' | 'profile' | 'complete'>('auth');

  // Check authentication status when wallet connects and auth is initialized
  useEffect(() => {
    if (isConnected && address && isInitialized) {
      console.log('🔍 Checking authentication status for:', address.slice(0, 6) + '...');
      
      // Use the current authState since it's already loaded by the hook
      const isAuthenticated = authState.isAuthenticated;
      
      console.log('📋 Auth check result:', {
        isAuthenticated,
        hasProfile,
        isInitialized,
        authState: authState,
      });
      
      // Show welcome modal if not authenticated (regardless of profile status)
      if (!isAuthenticated) {
        console.log('� User not authenticated - showing auth step');
        setShowWelcome(true);
        setStep('auth');
      } else if (isAuthenticated && !hasProfile) {
        console.log('✅ Authenticated but no profile - showing profile step');
        setShowWelcome(true);
        setStep('profile');
      } else if (isAuthenticated && hasProfile) {
        console.log('✅ User is fully authenticated and has profile - no welcome needed');
        setShowWelcome(false);
      }
    }
  }, [isConnected, address, isInitialized, authState.isAuthenticated, hasProfile]);

  // Update step based on auth state changes
  useEffect(() => {
    if (showWelcome && authState.isAuthenticated) {
      if (!hasProfile) {
        setStep('profile');
      } else {
        setStep('complete');
        // Auto-hide after showing success
        setTimeout(() => {
          setShowWelcome(false);
        }, 2000);
      }
    }
  }, [authState.isAuthenticated, hasProfile, showWelcome]);

  const handleAuthenticate = async () => {
    console.log('🔐 Starting authentication process...');
    const success = await authenticateWallet();
    
    if (success) {
      console.log('✅ Authentication successful');
      // Step will be updated by the useEffect above
    } else {
      console.log('❌ Authentication failed');
    }
  };

  const handleSkipProfile = () => {
    console.log('⏭️ User skipped profile creation');
    setStep('complete');
    setTimeout(() => {
      setShowWelcome(false);
      toast.success('Welcome to HiBeats! You can create your profile anytime.');
    }, 1500);
  };

  const handleCreateProfile = () => {
    console.log('👤 Redirecting to profile creation');
    setShowWelcome(false);
    // Use React Router navigation instead of hash
    window.history.pushState({}, '', '/setup-profile');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleClose = () => {
    console.log('❌ User closed welcome modal');
    setShowWelcome(false);
  };

  // Don't show if not connected, not initialized, or conditions not met
  if (!showWelcome || !isConnected || !address || !isInitialized) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-white shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Music className="w-12 h-12 text-primary" />
              <div className="absolute -top-1 -right-1">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Welcome to HiBeats! 🎵
          </CardTitle>
          <CardDescription className="text-slate-300">
            Your AI-powered music creation platform
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

          {/* Step Indicators */}
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center space-x-2 ${step === 'auth' ? 'text-primary' : authState.isAuthenticated ? 'text-green-400' : 'text-slate-500'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                authState.isAuthenticated ? 'bg-green-500 border-green-500' : 
                step === 'auth' ? 'border-primary' : 'border-slate-600'
              }`}>
                {authState.isAuthenticated ? (
                  <CheckCircle className="w-4 h-4 text-white" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
              </div>
              <span className="text-sm font-medium">Authenticate</span>
            </div>

            <div className="flex-1 h-px bg-slate-600"></div>

            <div className={`flex items-center space-x-2 ${step === 'profile' ? 'text-primary' : hasProfile ? 'text-green-400' : 'text-slate-500'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                hasProfile ? 'bg-green-500 border-green-500' : 
                step === 'profile' ? 'border-primary' : 'border-slate-600'
              }`}>
                {hasProfile ? (
                  <CheckCircle className="w-4 h-4 text-white" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <span className="text-sm font-medium">Profile</span>
            </div>
          </div>

          {/* Step Content */}
          {step === 'auth' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Shield className="w-16 h-16 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Secure Authentication</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Please sign a message to verify wallet ownership. This is free and secure - no gas fees required.
                </p>
                <div className="flex items-center justify-center space-x-2 text-xs text-slate-500 mb-4">
                  <AlertCircle className="w-4 h-4" />
                  <span>This signature proves you own this wallet</span>
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
                    Requesting Signature...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Sign Message
                  </>
                )}
              </Button>
            </div>
          )}

          {step === 'profile' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <User className="w-16 h-16 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Create Your Profile</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Set up your creator profile to start sharing your music and connect with other artists.
                </p>
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={handleCreateProfile}
                  className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                >
                  <User className="w-4 h-4 mr-2" />
                  Create Profile
                </Button>
                <Button
                  onClick={handleSkipProfile}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Skip for Now
                </Button>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <Music className="w-16 h-16 text-green-400" />
                  <div className="absolute -top-2 -right-2">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-green-400">Welcome to HiBeats!</h3>
                <p className="text-sm text-slate-400">
                  You're all set! Start creating amazing music with AI.
                </p>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-start space-x-2">
              <Shield className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-300">
                <p className="font-medium mb-1">Security Notice</p>
                <p>Your wallet signature is used only for authentication. We never access your funds or make transactions without your explicit consent.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};