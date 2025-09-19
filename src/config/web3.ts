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
      url: 'https://testnet.somnia.network',
    },
  },
  testnet: true,
};

export const config = getDefaultConfig({
  appName: 'HiBeats',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '3edb0ee565402a16259f5dabb5c427ff',
  chains: [somniaTestnet],
  ssr: false,
});

// Contract Addresses
export const CONTRACT_ADDRESSES = {
  HIBEATS_TOKEN: import.meta.env.VITE_HIBEATS_TOKEN_ADDRESS as `0x${string}`,
  HIBEATS_NFT: import.meta.env.VITE_HIBEATS_NFT_ADDRESS as `0x${string}`,
  HIBEATS_PROFILE: import.meta.env.VITE_HIBEATS_PROFILE_ADDRESS as `0x${string}`,
  HIBEATS_ROYALTIES: import.meta.env.VITE_HIBEATS_ROYALTIES_ADDRESS as `0x${string}`,
  HIBEATS_MARKETPLACE: import.meta.env.VITE_HIBEATS_MARKETPLACE_ADDRESS as `0x${string}`,
  HIBEATS_PLAYLIST: import.meta.env.VITE_HIBEATS_PLAYLIST_ADDRESS as `0x${string}`,
  HIBEATS_FACTORY: import.meta.env.VITE_HIBEATS_FACTORY_ADDRESS as `0x${string}`,
  HIBEATS_DISCOVERY: import.meta.env.VITE_HIBEATS_DISCOVERY_ADDRESS as `0x${string}`,
  HIBEATS_STAKING: import.meta.env.VITE_HIBEATS_STAKING_ADDRESS as `0x${string}`,
  HIBEATS_ANALYTICS: import.meta.env.VITE_HIBEATS_ANALYTICS_ADDRESS as `0x${string}`,
  HIBEATS_INTERACTION: import.meta.env.VITE_HIBEATS_INTERACTION_ADDRESS as `0x${string}`,
  HIBEATS_GOVERNANCE: import.meta.env.VITE_HIBEATS_GOVERNANCE_ADDRESS as `0x${string}`,
} as const;

// Network Configuration
export const NETWORK_CONFIG = {
  CHAIN_ID: Number(import.meta.env.VITE_CHAIN_ID) || 50312,
  RPC_URL: import.meta.env.VITE_RPC_URL || 'https://testnet.somnia.network/',
  EXPLORER_URL: import.meta.env.VITE_EXPLORER_URL || 'https://testnet.somnia.network/',
} as const;

export const SUNO_API_KEY = import.meta.env.VITE_SUNO_API_KEY || '5ae6d1e7e613cd169884e7704395b3b4';