import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { Chain } from 'viem';

// Somnia Testnet Configuration
const somniaTestnet: Chain = {
  id: 50312,
  name: 'Somnia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'STT',
    symbol: 'STT',
  },
  rpcUrls: {
    default: {
      http: ['https://dream-rpc.somnia.network'],
    },
    public: {
      http: ['https://dream-rpc.somnia.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Somnia Explorer',
      url: 'https://explorer.somnia.network',
    },
  },
  testnet: true,
};

export const config = getDefaultConfig({
  appName: 'HiBeats',
  projectId: 'hibeats-music-dapp',
  chains: [somniaTestnet],
  ssr: false,
});

export const SUNO_API_KEY = '5ae6d1e7e613cd169884e7704395b3b4';