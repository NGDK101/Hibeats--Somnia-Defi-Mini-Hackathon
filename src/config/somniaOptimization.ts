// Somnia Network Optimization Configuration
export const SOMNIA_NETWORK_CONFIG = {
  // Network Info
  chainId: 50312,
  name: 'Somnia Testnet',
  rpcUrl: 'https://dream-rpc.somnia.network',
  explorerUrl: 'https://shannon-explorer.somnia.network',
  
  // Performance Optimization
  pollingInterval: 12000, // 12 seconds - optimal for Somnia
  blockConfirmations: 1, // Fast finality on Somnia
  retryAttempts: 3,
  retryDelay: 1000, // 1 second between retries
  
  // Gas Optimization
  gasSettings: {
    // Conservative gas limits for common operations
    transfer: BigInt(65_000),
    approve: BigInt(55_000),
    mint: BigInt(250_000),
    createProfile: BigInt(250_000),
    updateProfile: BigInt(1_500_000), // Increased significantly for complex profile updates
    stake: BigInt(200_000),
    unstake: BigInt(150_000),
    marketplace: BigInt(300_000),
    default: BigInt(500_000),
  },
  
  // EIP-1559 Gas Pricing (Somnia supports this)
  gasPricing: {
    baseFeePerGas: BigInt(1000000), // 0.001 Gwei
    maxPriorityFeePerGas: BigInt(1000000), // 0.001 Gwei priority
    gasMultiplier: 1.2, // 20% buffer
  },
  
  // Connection Settings
  connection: {
    timeout: 10000, // 10 seconds connection timeout
    maxRetries: 5,
    backoffMultiplier: 1.5,
    walletConnectProjectId: '3edb0ee565402a16259f5dabb5c427ff',
  },
  
  // Cache Settings
  cache: {
    staleTime: 15000, // 15 seconds
    gcTime: 300000, // 5 minutes
    refetchInterval: 30000, // 30 seconds
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
  
  // Transaction Settings
  transaction: {
    confirmationBlocks: 1,
    timeout: 60000, // 1 minute timeout
    pollInterval: 2000, // Check every 2 seconds
    maxWait: 300000, // 5 minutes max wait
  }
} as const;

// Helper functions for network optimization
export const getOptimalGasLimit = (functionName: string): bigint => {
  const gasLimits = SOMNIA_NETWORK_CONFIG.gasSettings;
  return gasLimits[functionName as keyof typeof gasLimits] || gasLimits.default;
};

export const getOptimalGasPrice = () => {
  const pricing = SOMNIA_NETWORK_CONFIG.gasPricing;
  return {
    maxFeePerGas: pricing.baseFeePerGas + pricing.maxPriorityFeePerGas,
    maxPriorityFeePerGas: pricing.maxPriorityFeePerGas,
  };
};

export const isOptimizedForSomnia = (chainId: number): boolean => {
  return chainId === SOMNIA_NETWORK_CONFIG.chainId;
};

// Transaction optimization presets
export const TRANSACTION_PRESETS = {
  FAST: {
    gasMultiplier: 1.5,
    priorityMultiplier: 2.0,
    confirmations: 1,
  },
  STANDARD: {
    gasMultiplier: 1.2,
    priorityMultiplier: 1.0,
    confirmations: 1,
  },
  ECONOMICAL: {
    gasMultiplier: 1.0,
    priorityMultiplier: 0.5,
    confirmations: 2,
  },
} as const;

export type TransactionSpeed = keyof typeof TRANSACTION_PRESETS;