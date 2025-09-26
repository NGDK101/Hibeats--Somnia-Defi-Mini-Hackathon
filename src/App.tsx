import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { config } from "./config/web3";
import { hibeatsTheme } from "./theme/rainbowkit-theme";
import { GeneratedMusicProvider } from "./hooks/useGeneratedMusicContext";
import { MusicPlayerProvider } from "./hooks/useMusicPlayerContext";
import { SWRProvider } from "./providers/SWRProvider";
import { RewardNotificationProvider } from "./components/notifications/RewardNotificationProvider";
import { WalletPersistenceProvider } from "./components/providers/WalletPersistenceProvider";
import { SimpleAuthModal } from "./components/auth/SimpleAuthModal";
import '@rainbow-me/rainbowkit/styles.css';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Optimized QueryClient for better performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes (increased from 5)
      gcTime: 30 * 60 * 1000, // 30 minutes (increased from 10)
      refetchOnWindowFocus: false,
      retry: 2,
      // Add network optimization
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst',
      retry: 1,
    },
  },
});

const App = () => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider
        modalSize="compact"
        theme={hibeatsTheme}
        coolMode={true}
        showRecentTransactions={true}
        initialChain={config.chains[0]}
        appInfo={{
          appName: 'HiBeats',
          disclaimer: ({ Text, Link }) => (
            <Text>
              By connecting your wallet, you agree to the{' '}
              <Link href="https://hibeats.io/terms">Terms of Service</Link> and
              acknowledge you have read and understand the protocol{' '}
              <Link href="https://hibeats.io/disclaimer">Disclaimer</Link>
            </Text>
          ),
        }}
      >
        <SWRProvider>
          <WalletPersistenceProvider>
            <RewardNotificationProvider>
              <GeneratedMusicProvider>
                <MusicPlayerProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    {/* Simple Authentication Modal */}
                    <SimpleAuthModal />
                    <BrowserRouter>
                    <Routes>
                      <Route path="/" element={<Navigate to="/create" replace />} />
                      <Route path="/explore" element={<Index />} />
                      <Route path="/create" element={<Index />} />
                      <Route path="/portfolio" element={<Index />} />
                      <Route path="/profile/:username" element={<Index />} />
                      <Route path="/profile" element={<Index />} />
                      <Route path="/creator/:creatorAddress" element={<Index />} />
                      <Route path="/discover" element={<Index />} />
                      <Route path="/playlist" element={<Index />} />
                      <Route path="/setup-profile" element={<Index />} />
                      <Route path="/debug" element={<Index />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </TooltipProvider>
              </MusicPlayerProvider>
            </GeneratedMusicProvider>
          </RewardNotificationProvider>
        </WalletPersistenceProvider>
        </SWRProvider>
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
